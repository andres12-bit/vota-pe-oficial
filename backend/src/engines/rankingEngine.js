/**
 * VOTA.PE — Candidate Scoring Engine (Ranking Engine)
 *
 * Formula:
 *   final_candidate_score = (vote_score × 0.40) + (intelligence_score × 0.25) + (momentum_score × 0.20) + (integrity_score × 0.15)
 *
 * Caching:
 *   candidate_score:{candidate_id} → Redis/memory TTL 300s
 *   party_score:{party_id} → Redis/memory TTL 300s
 *
 * Lazy evaluation: scores recalculate only on new vote, new event, or cache miss.
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 300; // 5 minutes

class RankingEngine {
    // ==================== CANDIDATE SCORING ====================

    /**
     * Calculate final score for a candidate (pure computation, no DB)
     * Formula: (vote_score × 0.40) + (intelligence × 0.25) + (momentum × 0.20) + (integrity × 0.15)
     */
    static calculateFinalScore(candidate) {
        // Normalize vote count to 0-100 scale
        const voteScore = Math.min(100, (parseInt(candidate.vote_count) || 0) / 100);
        const intelligenceScore = parseFloat(candidate.intelligence_score) || 50;
        const momentumScore = parseFloat(candidate.momentum_score) || 0;
        const integrityScore = parseFloat(candidate.integrity_score) || 100;

        const finalScore =
            (voteScore * 0.40) +
            (intelligenceScore * 0.25) +
            (momentumScore * 0.20) +
            (integrityScore * 0.15);

        return Math.min(100, Math.max(0, parseFloat(finalScore.toFixed(2))));
    }

    /**
     * Get candidate score — LAZY: returns cached if available, otherwise recalculates
     */
    static async getCandidateScore(candidateId) {
        const cacheKey = `candidate_score:${candidateId}`;

        // 1. Try cache first
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        // 2. Cache miss — recalculate
        return this.recalculateCandidate(candidateId);
    }

    /**
     * Recalculate and cache a candidate's score
     * Called on: new vote, new event, cache miss
     */
    static async recalculateCandidate(candidateId) {
        const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [candidateId]);
        if (result.rows.length === 0) return null;

        const candidate = result.rows[0];
        const finalScore = this.calculateFinalScore(candidate);

        // Update DB
        await pool.query(
            'UPDATE candidates SET final_score = $1, updated_at = NOW() WHERE id = $2',
            [finalScore, candidateId]
        );

        // Build score envelope
        const voteScore = Math.min(100, (parseInt(candidate.vote_count) || 0) / 100);
        const scoreData = {
            candidate_id: candidateId,
            final_score: finalScore,
            breakdown: {
                vote_score: parseFloat(voteScore.toFixed(2)),
                vote_contribution: parseFloat((voteScore * 0.40).toFixed(2)),
                intelligence_score: parseFloat(candidate.intelligence_score) || 50,
                intelligence_contribution: parseFloat(((parseFloat(candidate.intelligence_score) || 50) * 0.25).toFixed(2)),
                momentum_score: parseFloat(candidate.momentum_score) || 0,
                momentum_contribution: parseFloat(((parseFloat(candidate.momentum_score) || 0) * 0.20).toFixed(2)),
                integrity_score: parseFloat(candidate.integrity_score) || 100,
                integrity_contribution: parseFloat(((parseFloat(candidate.integrity_score) || 100) * 0.15).toFixed(2)),
            },
            vote_count: parseInt(candidate.vote_count) || 0,
            cached_at: Date.now(),
        };

        // Cache in Redis with TTL
        await cache.setJSON(`candidate_score:${candidateId}`, scoreData, CACHE_TTL);

        return scoreData;
    }

    /**
     * Invalidate candidate cache (called when vote or event happens)
     */
    static async invalidateCandidate(candidateId) {
        await cache.del(`candidate_score:${candidateId}`);
    }

    // ==================== POSITION RANKING ====================

    /**
     * Get ranking for a specific position (president, senator, deputy, andean)
     */
    static async getRanking(position) {
        const cacheKey = `ranking:${position}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        const query = `
            SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
            FROM candidates c
            JOIN parties p ON c.party_id = p.id
            WHERE c.position = $1 AND c.is_active = true
            ORDER BY c.final_score DESC
        `;
        const result = await pool.query(query, [position]);
        const ranking = result.rows;

        await cache.setJSON(cacheKey, ranking, CACHE_TTL);
        return ranking;
    }

    /**
     * Get global ranking across all positions
     */
    static async getGlobalRanking() {
        const cacheKey = 'ranking:global';
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        const query = `
            SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
            FROM candidates c
            JOIN parties p ON c.party_id = p.id
            WHERE c.is_active = true
            ORDER BY c.final_score DESC
            LIMIT 50
        `;
        const result = await pool.query(query);
        const ranking = result.rows;

        await cache.setJSON(cacheKey, ranking, CACHE_TTL);
        return ranking;
    }

    /**
     * Invalidate all ranking caches (after recalculation)
     */
    static async invalidateRankings() {
        await cache.delPattern('ranking:*');
    }

    // ==================== PARTY SCORING ====================

    /**
     * Calculate party full score
     * party_full_score = SUM(all candidate final_score) / total_candidates
     */
    static async getPartyScore(partyId) {
        const cacheKey = `party_score:${partyId}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        return this.recalculatePartyScore(partyId);
    }

    /**
     * Recalculate party score and update ranking
     */
    static async recalculatePartyScore(partyId) {
        // Calculate averages across all party candidates
        const result = await pool.query(
            `SELECT 
                AVG(final_score) as avg_score, 
                COUNT(*) as total_candidates,
                SUM(final_score) as total_score,
                AVG(intelligence_score) as avg_intelligence,
                AVG(momentum_score) as avg_momentum,
                AVG(integrity_score) as avg_integrity,
                SUM(vote_count) as total_votes
             FROM candidates 
             WHERE party_id = $1 AND is_active = true`,
            [partyId]
        );

        const stats = result.rows[0];
        const avgScore = parseFloat(stats.avg_score) || 0;
        const partyFullScore = Math.min(100, Math.max(0, parseFloat(avgScore.toFixed(2))));

        // Upsert party_scores table
        await pool.query(
            `INSERT INTO party_scores (party_id, party_full_score, last_updated)
             VALUES ($1, $2, NOW())
             ON CONFLICT (party_id) DO UPDATE SET party_full_score = $2, last_updated = NOW()`,
            [partyId, partyFullScore]
        );

        // Update parties table too
        await pool.query(
            'UPDATE parties SET party_full_score = $1, updated_at = NOW() WHERE id = $2',
            [partyFullScore, partyId]
        );

        // Recalculate ALL party ranking positions
        await pool.query(`
            WITH ranked AS (
                SELECT party_id, ROW_NUMBER() OVER (ORDER BY party_full_score DESC) as rn
                FROM party_scores
            )
            UPDATE party_scores ps SET ranking_position = r.rn
            FROM ranked r WHERE ps.party_id = r.party_id
        `);

        const scoreData = {
            party_id: partyId,
            party_full_score: partyFullScore,
            total_candidates: parseInt(stats.total_candidates) || 0,
            total_score: parseFloat(stats.total_score) || 0,
            total_votes: parseInt(stats.total_votes) || 0,
            avg_intelligence: parseFloat(parseFloat(stats.avg_intelligence || 0).toFixed(2)),
            avg_momentum: parseFloat(parseFloat(stats.avg_momentum || 0).toFixed(2)),
            avg_integrity: parseFloat(parseFloat(stats.avg_integrity || 0).toFixed(2)),
            cached_at: Date.now(),
        };

        // Cache with TTL
        await cache.setJSON(`party_score:${partyId}`, scoreData, CACHE_TTL);

        return scoreData;
    }

    /**
     * Invalidate party cache
     */
    static async invalidateParty(partyId) {
        await cache.del(`party_score:${partyId}`);
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Recalculate ALL candidates and parties (admin forced recalculation)
     */
    static async recalculateAll() {
        const candidates = await pool.query('SELECT id, party_id FROM candidates WHERE is_active = true');
        const partyIds = new Set();

        for (const c of candidates.rows) {
            await this.recalculateCandidate(c.id);
            partyIds.add(c.party_id);
        }

        for (const pid of partyIds) {
            await this.recalculatePartyScore(pid);
        }

        // Invalidate all ranking caches
        await this.invalidateRankings();

        return {
            candidates_updated: candidates.rows.length,
            parties_updated: partyIds.size,
        };
    }

    /**
     * Get cache stats
     */
    static getCacheStats() {
        return cache.getStats();
    }
}

module.exports = RankingEngine;
