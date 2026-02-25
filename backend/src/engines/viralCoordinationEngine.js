/**
 * Viral Coordination Engine
 * 
 * Detects emergent political coordination and dominance patterns.
 * Analyses voting patterns to identify:
 * - Coordinated voting bursts for a party
 * - Regional dominance shifts
 * - Momentum convergence across candidates of the same party
 */

const pool = require('../db/pool');

class ViralCoordinationEngine {
    /**
     * Detect coordinated voting patterns for a party
     * (multiple candidates from same party getting votes in short bursts)
     */
    static async detectCoordination(windowMinutes = 30) {
        const result = await pool.query(`
      SELECT 
        p.id as party_id, p.name as party_name, p.abbreviation,
        COUNT(*) as vote_burst,
        COUNT(DISTINCT v.candidate_id) as candidates_affected,
        COUNT(DISTINCT v.voter_ip) as unique_voters
      FROM votes v
      JOIN candidates c ON v.candidate_id = c.id
      JOIN parties p ON c.party_id = p.id
      WHERE v.created_at > NOW() - INTERVAL '${windowMinutes} minutes'
      GROUP BY p.id, p.name, p.abbreviation
      HAVING COUNT(*) > 10
      ORDER BY vote_burst DESC
    `);

        return result.rows.map(row => ({
            ...row,
            coordination_score: this.calculateCoordinationScore(
                parseInt(row.vote_burst),
                parseInt(row.candidates_affected),
                parseInt(row.unique_voters)
            ),
            is_coordinated: parseInt(row.vote_burst) > 20 && parseInt(row.unique_voters) < parseInt(row.vote_burst) * 0.5
        }));
    }

    /**
     * Calculate coordination score
     * High votes + low unique voters = high coordination
     */
    static calculateCoordinationScore(voteBurst, candidatesAffected, uniqueVoters) {
        if (uniqueVoters === 0) return 0;
        const voterConcentration = voteBurst / uniqueVoters;
        const candidateSpread = candidatesAffected;
        return Math.min(100, (voterConcentration * 10 + candidateSpread * 5));
    }

    /**
     * Detect regional dominance — which party dominates each region
     */
    static async detectRegionalDominance() {
        const result = await pool.query(`
      SELECT 
        c.region,
        p.id as party_id, p.name as party_name, p.abbreviation, p.color,
        SUM(c.vote_count) as total_votes,
        AVG(c.final_score) as avg_score,
        COUNT(*) as candidates_in_region
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true AND c.region != ''
      GROUP BY c.region, p.id, p.name, p.abbreviation, p.color
      ORDER BY c.region, total_votes DESC
    `);

        // Group by region and pick dominant party
        const regions = {};
        for (const row of result.rows) {
            if (!regions[row.region]) {
                regions[row.region] = [];
            }
            regions[row.region].push(row);
        }

        const dominance = {};
        for (const [region, parties] of Object.entries(regions)) {
            const sorted = parties.sort((a, b) => parseInt(b.total_votes) - parseInt(a.total_votes));
            dominance[region] = {
                dominant_party: sorted[0],
                all_parties: sorted,
                dominance_ratio: sorted.length > 1
                    ? parseInt(sorted[0].total_votes) / (parseInt(sorted[0].total_votes) + parseInt(sorted[1].total_votes))
                    : 1.0
            };
        }

        return dominance;
    }

    /**
     * Detect emergent trends — parties gaining momentum across multiple candidates
     */
    static async detectEmergentTrends() {
        const result = await pool.query(`
      SELECT 
        p.id as party_id, p.name as party_name, p.abbreviation,
        AVG(c.momentum_score) as avg_momentum,
        AVG(c.final_score) as avg_score,
        SUM(c.vote_count) as total_votes,
        COUNT(*) as candidate_count,
        SUM(CASE WHEN c.momentum_score > 50 THEN 1 ELSE 0 END) as high_momentum_count
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true
      GROUP BY p.id, p.name, p.abbreviation
      ORDER BY avg_momentum DESC
    `);

        return result.rows.map(row => ({
            ...row,
            trend_strength: parseFloat(row.avg_momentum) > 40 ? 'strong' : parseFloat(row.avg_momentum) > 20 ? 'moderate' : 'weak',
            is_emerging: parseInt(row.high_momentum_count) > parseInt(row.candidate_count) * 0.5
        }));
    }

    /**
     * Full coordination report
     */
    static async getCoordinationReport() {
        const [coordination, dominance, trends] = await Promise.all([
            this.detectCoordination(),
            this.detectRegionalDominance(),
            this.detectEmergentTrends()
        ]);

        return {
            coordination_alerts: coordination.filter(c => c.is_coordinated),
            voting_patterns: coordination,
            regional_dominance: dominance,
            emergent_trends: trends,
            generated_at: new Date().toISOString()
        };
    }
}

module.exports = ViralCoordinationEngine;
