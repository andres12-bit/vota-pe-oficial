const pool = require('../db/pool');
const IntelligenceEngine = require('./intelligenceEngine');
const RankingEngine = require('./rankingEngine');

class EventsEngine {
    /**
     * Create a new event for a candidate
     */
    static async createEvent({ candidate_id, event_type, title, description, impact_score }) {
        const validTypes = ['positive', 'negative', 'corruption', 'achievement'];
        if (!validTypes.includes(event_type)) {
            throw new Error(`Invalid event_type. Must be one of: ${validTypes.join(', ')}`);
        }

        // Ensure impact direction matches event type
        let adjustedImpact = Math.abs(parseFloat(impact_score) || 5);
        if (event_type === 'negative' || event_type === 'corruption') {
            adjustedImpact = -adjustedImpact;
        }

        const result = await pool.query(
            `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
            [candidate_id, event_type, title, description || '', adjustedImpact]
        );

        return result.rows[0];
    }

    /**
     * Validate/approve an event — triggers intelligence impact + score recalculation
     */
    static async validateEvent(eventId) {
        const result = await pool.query(
            'UPDATE candidate_events SET is_validated = true WHERE id = $1 RETURNING *',
            [eventId]
        );

        if (result.rows.length === 0) throw new Error('Event not found');

        const event = result.rows[0];

        // Apply event impact to integrity/risk scores, then recalculate intelligence
        await IntelligenceEngine.applyEventImpact(
            event.candidate_id,
            event.event_type,
            event.impact_score
        );

        // Recalculate candidate final score (with cache invalidation)
        await RankingEngine.invalidateCandidate(event.candidate_id);
        await RankingEngine.recalculateCandidate(event.candidate_id);

        // Recalculate party score
        const candidate = await pool.query('SELECT party_id FROM candidates WHERE id = $1', [event.candidate_id]);
        if (candidate.rows.length > 0) {
            await RankingEngine.invalidateParty(candidate.rows[0].party_id);
            await RankingEngine.recalculatePartyScore(candidate.rows[0].party_id);
        }

        // Invalidate ranking caches
        await RankingEngine.invalidateRankings();

        return event;
    }

    /**
     * Reject an event
     */
    static async rejectEvent(eventId) {
        const result = await pool.query(
            'DELETE FROM candidate_events WHERE id = $1 AND is_validated = false RETURNING *',
            [eventId]
        );
        if (result.rows.length === 0) throw new Error('Event not found or already validated');
        return result.rows[0];
    }

    /**
     * Get events for a candidate
     */
    static async getCandidateEvents(candidateId, { validated_only = false, limit = 50 } = {}) {
        let query = 'SELECT * FROM candidate_events WHERE candidate_id = $1';
        const params = [candidateId];

        if (validated_only) {
            query += ' AND is_validated = true';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get pending (unvalidated) events
     */
    static async getPendingEvents(limit = 50) {
        const result = await pool.query(`
      SELECT ce.*, c.name as candidate_name, p.name as party_name
      FROM candidate_events ce
      JOIN candidates c ON ce.candidate_id = c.id
      JOIN parties p ON c.party_id = p.id
      WHERE ce.is_validated = false
      ORDER BY ce.created_at DESC LIMIT $1
    `, [limit]);
        return result.rows;
    }

    /**
     * Update an event
     */
    static async updateEvent(eventId, updates) {
        const { title, description, event_type, impact_score } = updates;
        const result = await pool.query(
            `UPDATE candidate_events SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        event_type = COALESCE($3, event_type),
        impact_score = COALESCE($4, impact_score)
       WHERE id = $5 RETURNING *`,
            [title, description, event_type, impact_score, eventId]
        );
        if (result.rows.length === 0) throw new Error('Event not found');
        return result.rows[0];
    }

    /**
     * Delete an event — triggers cache invalidation + score recalculation
     */
    static async deleteEvent(eventId) {
        const event = await pool.query('SELECT * FROM candidate_events WHERE id = $1', [eventId]);
        if (event.rows.length === 0) throw new Error('Event not found');

        const candidateId = event.rows[0].candidate_id;
        await pool.query('DELETE FROM candidate_events WHERE id = $1', [eventId]);

        // Invalidate and recalculate
        await IntelligenceEngine.invalidate(candidateId);
        await IntelligenceEngine.calculateIntelligenceScore(candidateId);
        await RankingEngine.invalidateCandidate(candidateId);
        await RankingEngine.recalculateCandidate(candidateId);

        // Recalculate party
        const candidate = await pool.query('SELECT party_id FROM candidates WHERE id = $1', [candidateId]);
        if (candidate.rows.length > 0) {
            await RankingEngine.invalidateParty(candidate.rows[0].party_id);
            await RankingEngine.recalculatePartyScore(candidate.rows[0].party_id);
        }
        await RankingEngine.invalidateRankings();

        return event.rows[0];
    }
}

module.exports = EventsEngine;
