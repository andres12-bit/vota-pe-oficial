/**
 * PulsoElectoral.pe — Integrity Scorer
 *
 * Evaluates candidate integrity based on JNE data.
 * Scale: 0 to 100 (higher = more integrity / cleaner record)
 *
 * Criteria:
 *   1. Limpieza Judicial (40%):      Penal/civil sentences
 *   2. Estabilidad Partidaria (20%): Party resignations & switches
 *   3. Transparencia (20%):          Financial disclosure completeness
 *   4. Coherencia Política (20%):    Consistency in political history
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 600; // 10 minutes

const IntegrityScorer = {

    /**
     * Get Integrity score — cached or recalculated
     */
    async getScore(candidateId) {
        const cached = await cache.getJSON(`integrity_score:${candidateId}`);
        if (cached) return cached;
        return this.calculate(candidateId);
    },

    /**
     * Calculate Integrity score for a candidate
     */
    async calculate(candidateId) {
        const result = await pool.query(
            'SELECT hoja_de_vida FROM candidates WHERE id = $1',
            [candidateId]
        );
        if (result.rows.length === 0) return null;

        const hv = result.rows[0].hoja_de_vida || {};

        // ============ INTEGRIDAD = SENTENCIAS JUDICIALES (100%) ============
        // 100 = sin sentencias. -60 puntos por cada sentencia, sin importar el tipo.
        const sentences = hv.sentences || [];
        let finalScore = Math.max(0, 100 - (sentences.length * 60));
        finalScore = parseFloat(finalScore.toFixed(2));

        const scoreData = {
            candidate_id: candidateId,
            integrity_score: finalScore,
            breakdown: {
                judicial_clean: finalScore,
                sentences_count: sentences.length,
            },
            cached_at: Date.now(),
        };

        // Update DB
        await pool.query(
            'UPDATE candidates SET integrity_score = $1, updated_at = NOW() WHERE id = $2',
            [finalScore, candidateId]
        );

        // Cache
        await cache.setJSON(`integrity_score:${candidateId}`, scoreData, CACHE_TTL);

        return scoreData;
    },

    /**
     * Calculate for ALL candidates
     */
    async calculateAll() {
        const result = await pool.query('SELECT id FROM candidates WHERE is_active = true');
        let count = 0;
        for (const row of result.rows) {
            await this.calculate(row.id);
            count++;
        }
        console.log(`✅ Calculated Integrity scores for ${count} candidates`);
        return count;
    },
};

module.exports = IntegrityScorer;
