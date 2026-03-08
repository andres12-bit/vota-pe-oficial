/**
 * PulsoElectoral.pe — Candidate Scoring Engine (Ranking Engine)
 *
 * Formula:
 *   final_candidate_score = (hoja_score × 0.30) + (plan_score × 0.30) + (intencion × 0.25) + (integridad × 0.15)
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
 * Formula:
 *   final_score = (hoja_score × 0.30) + (plan_score × 0.30) + (experience_score × 0.25) + (integridad × 0.15)
 *
 * Where experience_score = work experience quality (0-100)
 * Note: vote_count (Intención Ciudadana) is an indicator only, not part of the formula.
 */
    static calculateFinalScore(candidate) {
        const hojaScore = parseFloat(candidate.hoja_score) || 0;
        const planScore = parseFloat(candidate.plan_score) || 0;
        const experienceScore = parseFloat(candidate.experience_score) || 0;
        const integrityScore = parseFloat(candidate.integrity_score) || 100;

        const finalScore =
            (hojaScore * 0.30) +
            (planScore * 0.30) +
            (experienceScore * 0.25) +
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
        const hojaScore = parseFloat(candidate.hoja_score) || 0;
        const planScore = parseFloat(candidate.plan_score) || 0;
        const experienceScore = parseFloat(candidate.experience_score) || 0;
        const integrityScore = parseFloat(candidate.integrity_score) || 100;
        const scoreData = {
            candidate_id: candidateId,
            final_score: finalScore,
            breakdown: {
                hoja_score: hojaScore,
                hoja_contribution: parseFloat((hojaScore * 0.30).toFixed(2)),
                plan_score: planScore,
                plan_contribution: parseFloat((planScore * 0.30).toFixed(2)),
                experience_score: experienceScore,
                experience_contribution: parseFloat((experienceScore * 0.25).toFixed(2)),
                integrity_score: integrityScore,
                integrity_contribution: parseFloat((integrityScore * 0.15).toFixed(2)),
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
 * Recalculate party score using PLANCHA-SPECIFIC formula:
 *   plancha_score = (Antecedentes × 0.30) + (Plan × 0.25) + (HV × 0.25) + (Score Prom. × 0.20)
 *
 * Components:
 *   - Antecedentes (30%): % of candidates with clean judicial records (integrity_score >= 80)
 *   - Plan de Gobierno (25%): Average plan_score across all candidates
 *   - Hoja de Vida (25%): Average hoja_score across all candidates
 *   - Score Promedio (20%): Average final_score across all candidates
 */
    static async recalculatePartyScore(partyId) {
        // Get all scoring data for this party's candidates
        const result = await pool.query(
            `SELECT 
            AVG(final_score) as avg_score, 
            AVG(hoja_score) as avg_hoja,
            AVG(plan_score) as avg_plan,
            AVG(integrity_score) as avg_integrity,
            AVG(experience_score) as avg_experience,
            COUNT(*) as total_candidates,
            SUM(final_score) as total_score,
            SUM(vote_count) as total_votes
         FROM candidates 
         WHERE party_id = $1 AND is_active = true`,
            [partyId]
        );

        // Count candidates with clean judicial records (no sentences in hoja_de_vida)
        const cleanResult = await pool.query(
            `SELECT COUNT(*) as clean_count
         FROM candidates
         WHERE party_id = $1 AND is_active = true AND integrity_score >= 80`,
            [partyId]
        );

        const stats = result.rows[0];
        const totalCandidates = parseInt(stats.total_candidates) || 0;
        const cleanCount = parseInt(cleanResult.rows[0]?.clean_count) || 0;

        // Calculate each component (0-100 scale)
        const antecedentesScore = totalCandidates > 0 ? (cleanCount / totalCandidates) * 100 : 0;
        const avgPlan = parseFloat(stats.avg_plan) || 0;
        const avgHV = parseFloat(stats.avg_hoja) || 0;
        const avgScore = parseFloat(stats.avg_score) || 0;

        // Apply plancha formula
        const partyFullScore = Math.min(100, Math.max(0, parseFloat((
            (antecedentesScore * 0.30) +
            (avgPlan * 0.25) +
            (avgHV * 0.25) +
            (avgScore * 0.20)
        ).toFixed(2))));

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
            total_candidates: totalCandidates,
            total_score: parseFloat(stats.total_score) || 0,
            total_votes: parseInt(stats.total_votes) || 0,
            // Plancha breakdown
            antecedentes_score: parseFloat(antecedentesScore.toFixed(2)),
            antecedentes_clean: cleanCount,
            antecedentes_total: totalCandidates,
            avg_plan: parseFloat(avgPlan.toFixed(2)),
            avg_hoja: parseFloat(avgHV.toFixed(2)),
            avg_score: parseFloat(avgScore.toFixed(2)),
            avg_integrity: parseFloat(parseFloat(stats.avg_integrity || 0).toFixed(2)),
            avg_experience: parseFloat(parseFloat(stats.avg_experience || 0).toFixed(2)),
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
