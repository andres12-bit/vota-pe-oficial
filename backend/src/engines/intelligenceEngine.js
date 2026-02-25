/**
 * VOTA.PE — Intelligence Engine
 *
 * Calculates intelligence_score for each candidate (0-100).
 * 
 * Factors:
 *   - Integrity component (30%) — base integrity score
 *   - Events impact component (40%) — ratio of positive vs negative events
 *   - Consistency component (15%) — positive impact vs total impact
 *   - Risk inverse component (15%) — lower risk = higher intelligence
 *
 * Event impact:
 *   - positive → +X to intelligence
 *   - negative → -X to intelligence
 *   - corruption → -Y to intelligence (heavier penalty)
 *   - achievement → +Y to intelligence (heavier bonus)
 *
 * Caching: intelligence:{candidate_id} → Redis/memory TTL 300s
 * Default: intelligence_score initialized at 50 for all candidates
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 300;

// Event type weights — how much each event type affects intelligence
const EVENT_WEIGHTS = {
    positive: { factor: 1.0, direction: 1 },
    negative: { factor: 1.0, direction: -1 },
    corruption: { factor: 2.0, direction: -1 },    // heavier penalty
    achievement: { factor: 1.5, direction: 1 },     // heavier bonus
};

class IntelligenceEngine {
    /**
     * Get cached intelligence or recalculate
     */
    static async getIntelligence(candidateId) {
        const cacheKey = `intelligence:${candidateId}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return cached;

        return this.calculateIntelligenceScore(candidateId);
    }

    /**
     * Calculate intelligence score for a candidate.
     * Scale: 0 to 100, initialized at 50.
     */
    static async calculateIntelligenceScore(candidateId) {
        const client = await pool.connect();
        try {
            // 1. Get positive events impact
            const positiveEvents = await client.query(
                `SELECT COALESCE(SUM(ABS(impact_score)), 0) as total, COUNT(*) as cnt
                 FROM candidate_events 
                 WHERE candidate_id = $1 AND event_type IN ('positive', 'achievement') AND is_validated = true`,
                [candidateId]
            );

            // 2. Get negative events impact
            const negativeEvents = await client.query(
                `SELECT COALESCE(SUM(ABS(impact_score)), 0) as total, COUNT(*) as cnt
                 FROM candidate_events 
                 WHERE candidate_id = $1 AND event_type IN ('negative', 'corruption') AND is_validated = true`,
                [candidateId]
            );

            // 3. Get candidate current scores
            const candidate = await client.query(
                'SELECT integrity_score, risk_score FROM candidates WHERE id = $1',
                [candidateId]
            );

            if (candidate.rows.length === 0) return null;

            const positiveImpact = parseFloat(positiveEvents.rows[0].total) || 0;
            const negativeImpact = parseFloat(negativeEvents.rows[0].total) || 0;
            const positiveCount = parseInt(positiveEvents.rows[0].cnt) || 0;
            const negativeCount = parseInt(negativeEvents.rows[0].cnt) || 0;
            const integrity = parseFloat(candidate.rows[0].integrity_score) || 50;
            const risk = parseFloat(candidate.rows[0].risk_score) || 25;

            // Component 1: Integrity base (30%)
            const integrityComponent = integrity * 0.30;

            // Component 2: Events impact (40%)
            const totalEvents = positiveCount + negativeCount;
            let eventRatio = 0.5; // neutral by default (50 if no events)
            if (totalEvents > 0) {
                eventRatio = positiveCount / totalEvents;
            }
            const eventImpactComponent = (eventRatio * 100) * 0.40;

            // Component 3: Consistency (15%) — positive impact vs total
            const totalImpact = positiveImpact + negativeImpact;
            let consistencyComponent = 50 * 0.15; // default 50%
            if (totalImpact > 0) {
                consistencyComponent = ((positiveImpact / totalImpact) * 100) * 0.15;
            }

            // Component 4: Risk inverse (15%) — lower risk = higher intelligence
            const riskComponent = (100 - Math.min(100, risk)) * 0.15;

            // Final intelligence score
            const intelligenceScore = Math.min(100, Math.max(0,
                integrityComponent + eventImpactComponent + consistencyComponent + riskComponent
            ));
            const finalScore = parseFloat(intelligenceScore.toFixed(2));

            // Update candidate DB
            await client.query(
                'UPDATE candidates SET intelligence_score = $1, updated_at = NOW() WHERE id = $2',
                [finalScore, candidateId]
            );

            const intelligenceData = {
                candidate_id: candidateId,
                intelligence_score: finalScore,
                breakdown: {
                    integrity_component: parseFloat(integrityComponent.toFixed(2)),
                    event_impact_component: parseFloat(eventImpactComponent.toFixed(2)),
                    consistency_component: parseFloat(consistencyComponent.toFixed(2)),
                    risk_component: parseFloat(riskComponent.toFixed(2)),
                },
                events: {
                    positive_count: positiveCount,
                    negative_count: negativeCount,
                    positive_impact: positiveImpact,
                    negative_impact: negativeImpact,
                    total_events: totalEvents,
                },
                raw: { integrity, risk },
                cached_at: Date.now(),
            };

            // Cache with TTL
            await cache.setJSON(`intelligence:${candidateId}`, intelligenceData, CACHE_TTL);

            return intelligenceData;
        } finally {
            client.release();
        }
    }

    /**
     * Invalidate intelligence cache (called when new event is added)
     */
    static async invalidate(candidateId) {
        await cache.del(`intelligence:${candidateId}`);
    }

    /**
     * Apply event impact to candidate intelligence
     * Called when a new event is created/validated
     */
    static async applyEventImpact(candidateId, eventType, impactScore) {
        const weight = EVENT_WEIGHTS[eventType] || EVENT_WEIGHTS.positive;
        const effectiveImpact = Math.abs(impactScore) * weight.factor * weight.direction;

        // Get current integrity score
        const result = await pool.query(
            'SELECT integrity_score, risk_score FROM candidates WHERE id = $1',
            [candidateId]
        );
        if (result.rows.length === 0) return null;

        let newIntegrity = parseFloat(result.rows[0].integrity_score) || 50;
        let newRisk = parseFloat(result.rows[0].risk_score) || 25;

        // Corruption events also increase risk
        if (eventType === 'corruption') {
            newRisk = Math.min(100, newRisk + Math.abs(impactScore) * 0.5);
            newIntegrity = Math.max(0, newIntegrity - Math.abs(impactScore) * 0.3);
        } else if (eventType === 'negative') {
            newRisk = Math.min(100, newRisk + Math.abs(impactScore) * 0.2);
        } else if (eventType === 'achievement') {
            newIntegrity = Math.min(100, newIntegrity + Math.abs(impactScore) * 0.2);
            newRisk = Math.max(0, newRisk - Math.abs(impactScore) * 0.1);
        } else if (eventType === 'positive') {
            newRisk = Math.max(0, newRisk - Math.abs(impactScore) * 0.05);
        }

        // Update candidate
        await pool.query(
            'UPDATE candidates SET integrity_score = $1, risk_score = $2, updated_at = NOW() WHERE id = $3',
            [newIntegrity.toFixed(2), newRisk.toFixed(2), candidateId]
        );

        // Invalidate cache and recalculate
        await this.invalidate(candidateId);
        return this.calculateIntelligenceScore(candidateId);
    }

    /**
     * Get the full intelligence report for a candidate
     */
    static async getIntelligenceReport(candidateId) {
        const score = await this.getIntelligence(candidateId);
        if (!score) return null;

        const candidate = await pool.query(`
            SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
            FROM candidates c JOIN parties p ON c.party_id = p.id
            WHERE c.id = $1
        `, [candidateId]);

        const events = await pool.query(
            `SELECT * FROM candidate_events WHERE candidate_id = $1 AND is_validated = true
             ORDER BY created_at DESC LIMIT 20`,
            [candidateId]
        );

        const proposals = await pool.query(
            'SELECT * FROM candidate_proposals WHERE candidate_id = $1',
            [candidateId]
        );

        return {
            candidate: candidate.rows[0],
            intelligence: score,
            events: events.rows,
            proposals: proposals.rows,
        };
    }

    /**
     * Initialize ALL candidates to intelligence_score = 50 (if not already set)
     */
    static async initializeAll() {
        await pool.query(
            'UPDATE candidates SET intelligence_score = 50, integrity_score = 100 WHERE intelligence_score IS NULL OR intelligence_score = 0'
        );
        return this.recalculateAll();
    }

    /**
     * Recalculate intelligence for ALL candidates
     */
    static async recalculateAll() {
        const candidates = await pool.query('SELECT id FROM candidates WHERE is_active = true');
        const results = [];
        for (const c of candidates.rows) {
            const score = await this.calculateIntelligenceScore(c.id);
            results.push({ id: c.id, score: score?.intelligence_score });
        }
        return results;
    }
}

module.exports = IntelligenceEngine;
