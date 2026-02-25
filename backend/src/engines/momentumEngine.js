/**
 * VOTA.PE — Momentum Engine
 *
 * Calculates momentum based on recent vote velocity and acceleration.
 * Momentum = weighted recent votes with time-decay windows.
 *
 * Caching: momentum:{candidate_id} → Redis/memory TTL 300s
 * Tendency: EN ALZA (≥70) / ESTABLE (40-69) / EN BAJA (<40)
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 300;

class MomentumEngine {
    /**
     * Get cached momentum or recalculate
     */
    static async getMomentum(candidateId) {
        const cacheKey = `momentum:${candidateId}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        return this.calculateMomentum(candidateId);
    }

    /**
     * Calculate momentum based on recent vote velocity and acceleration.
     * Called on: new vote (lazy), cache miss
     */
    static async calculateMomentum(candidateId) {
        // Votes in last hour (high weight — recent activity)
        const lastHour = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
             WHERE candidate_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
            [candidateId]
        );

        // Votes in last 6 hours (medium weight)
        const lastSixHours = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
             WHERE candidate_id = $1 AND created_at > NOW() - INTERVAL '6 hours'`,
            [candidateId]
        );

        // Votes in last 24 hours (low weight — background trend)
        const lastDay = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
             WHERE candidate_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
            [candidateId]
        );

        // Votes in previous 24h window (for acceleration comparison)
        const prevDay = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
             WHERE candidate_id = $1 
             AND created_at > NOW() - INTERVAL '48 hours' 
             AND created_at <= NOW() - INTERVAL '24 hours'`,
            [candidateId]
        );

        const h1 = parseInt(lastHour.rows[0].cnt) || 0;
        const h6 = parseInt(lastSixHours.rows[0].cnt) || 0;
        const h24 = parseInt(lastDay.rows[0].cnt) || 0;
        const prev24 = parseInt(prevDay.rows[0].cnt) || 0;

        // Velocity: weighted sum of recent votes (higher weight = more recent)
        const velocity = (h1 * 3.0) + (h6 * 1.5) + (h24 * 0.5);

        // Acceleration: rate of change vs previous period
        const acceleration = h24 > 0 && prev24 > 0
            ? ((h24 - prev24) / prev24) * 100  // percentage change
            : h24 > 0 ? 100 : 0;               // if no previous data, 100% if any votes

        // Per-hour velocity
        const hourlyRate = h1;
        const sixHourlyRate = h6 / 6;

        // Normalized momentum score (0-100)
        const rawMomentum = (velocity * 0.7) + (Math.max(-50, Math.min(50, acceleration)) * 0.3);
        const momentum = Math.min(100, Math.max(0, parseFloat(rawMomentum.toFixed(2))));

        // Tendency label
        let tendency;
        if (momentum >= 70) tendency = 'EN ALZA';
        else if (momentum >= 40) tendency = 'ESTABLE';
        else tendency = 'EN BAJA';

        // Update DB
        await pool.query(
            'UPDATE candidates SET momentum_score = $1, updated_at = NOW() WHERE id = $2',
            [momentum, candidateId]
        );

        const momentumData = {
            candidate_id: candidateId,
            momentum_score: momentum,
            tendency,
            velocity: parseFloat(velocity.toFixed(2)),
            acceleration: parseFloat(acceleration.toFixed(2)),
            votes_1h: h1,
            votes_6h: h6,
            votes_24h: h24,
            votes_prev_24h: prev24,
            hourly_rate: hourlyRate,
            six_hourly_rate: parseFloat(sixHourlyRate.toFixed(2)),
            cached_at: Date.now(),
        };

        // Cache with TTL
        await cache.setJSON(`momentum:${candidateId}`, momentumData, CACHE_TTL);

        return momentumData;
    }

    /**
     * Invalidate momentum cache (called when new vote arrives)
     */
    static async invalidate(candidateId) {
        await cache.del(`momentum:${candidateId}`);
    }

    /**
     * Get top momentum candidates
     */
    static async getTopMomentum(limit = 10) {
        const cacheKey = `momentum:top_${limit}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        const result = await pool.query(`
            SELECT c.id, c.name, c.photo, c.position, c.region, c.momentum_score, c.final_score, c.vote_count,
                   p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
            FROM candidates c
            JOIN parties p ON c.party_id = p.id
            WHERE c.is_active = true
            ORDER BY c.momentum_score DESC
            LIMIT $1
        `, [limit]);

        // Add tendency labels
        const topList = result.rows.map(c => ({
            ...c,
            tendency: parseFloat(c.momentum_score) >= 70 ? 'EN ALZA'
                : parseFloat(c.momentum_score) >= 40 ? 'ESTABLE' : 'EN BAJA'
        }));

        await cache.setJSON(cacheKey, topList, 60); // shorter TTL for top list
        return topList;
    }

    /**
     * Batch recalculate all candidates' momentum
     */
    static async recalculateAll() {
        const candidates = await pool.query('SELECT id FROM candidates WHERE is_active = true');
        const results = [];
        for (const c of candidates.rows) {
            const m = await this.calculateMomentum(c.id);
            results.push({ id: c.id, momentum: m.momentum_score, tendency: m.tendency });
        }
        // Invalidate top list
        await cache.del('momentum:top_10');
        await cache.del('momentum:top_5');
        return results;
    }
}

module.exports = MomentumEngine;
