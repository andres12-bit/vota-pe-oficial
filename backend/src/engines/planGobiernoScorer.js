/**
 * VOTA.PE — Plan de Gobierno Scorer
 *
 * Evaluates the quality, coherence, and specificity of a candidate's government plan.
 * Scale: 0 to 100
 *
 * Weights:
 *   Cobertura Dimensional:  25%
 *   Especificidad:          25%
 *   Metas Cuantificables:   20%
 *   Indicadores:            15%
 *   Coherencia:             15%
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 600; // 10 minutes

// The 6 standard JNE dimensions for government plans
const JNE_DIMENSIONS = [
    'social',
    'económic',       // matches económica, económico
    'ambiental',
    'institucional',
    'seguridad',       // seguridad ciudadana
    'relaciones',      // relaciones internacionales / política exterior
];

const PlanGobiernoScorer = {

    /**
     * Get Plan score — cached or recalculated
     */
    async getScore(candidateId) {
        const cached = await cache.getJSON(`plan_score:${candidateId}`);
        if (cached) return cached;
        return this.calculate(candidateId);
    },

    /**
     * Calculate Plan de Gobierno score for a candidate
     */
    async calculate(candidateId) {
        // Get plan items
        const result = await pool.query(
            'SELECT dimension, problem, objective, goals, indicator FROM candidate_plan_gobierno WHERE candidate_id = $1',
            [candidateId]
        );

        const items = result.rows;

        // No plan = 0
        if (items.length === 0) {
            const scoreData = { candidate_id: candidateId, plan_score: 0, breakdown: { coverage: 0, specificity: 0, measurability: 0, indicators: 0, coherence: 0 }, item_count: 0, cached_at: Date.now() };
            await pool.query('UPDATE candidates SET plan_score = 0, updated_at = NOW() WHERE id = $1', [candidateId]);
            await cache.setJSON(`plan_score:${candidateId}`, scoreData, CACHE_TTL);
            return scoreData;
        }

        // Check if candidate has a PDF
        const pdfResult = await pool.query('SELECT plan_pdf_url FROM candidates WHERE id = $1', [candidateId]);
        const hasPdf = !!(pdfResult.rows[0] && pdfResult.rows[0].plan_pdf_url);


        // ============ 1. COBERTURA DIMENSIONAL (25%) ============
        // How many of the 6 JNE dimensions are covered?
        const dimensions = new Set();
        let hasProposals = false;
        items.forEach(item => {
            const dim = (item.dimension || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            JNE_DIMENSIONS.forEach((jneDim, idx) => {
                const normalizedJne = jneDim.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (dim.includes(normalizedJne)) {
                    dimensions.add(idx);
                }
            });
            // "PROPUESTAS ADICIONALES" = candidate has proposals even if not in standard dims
            if (dim.includes('propuesta') || dim.includes('adicional')) {
                hasProposals = true;
            }
        });
        // If candidate only has "PROPUESTAS ADICIONALES", give partial coverage
        let coverageScore;
        if (dimensions.size > 0) {
            coverageScore = Math.min(100, (dimensions.size / JNE_DIMENSIONS.length) * 100);
        } else if (hasProposals) {
            // Has proposals but no standard dimensions — give 40% coverage credit
            coverageScore = 40;
        } else {
            coverageScore = 0;
        }


        // ============ 2. ESPECIFICIDAD (25%) ============
        // Are objectives concrete (long, detailed) or vague (short)?
        // Fallback: if objective is empty, use problem text instead
        let specificityTotal = 0;
        items.forEach(item => {
            const obj = (item.objective || '').trim();
            const fallbackText = obj.length > 0 ? obj : (item.problem || '').trim();
            if (fallbackText.length === 0) {
                specificityTotal += 0;
            } else if (fallbackText.length < 30) {
                specificityTotal += 20; // very vague
            } else if (fallbackText.length < 80) {
                specificityTotal += 50; // somewhat specific
            } else if (fallbackText.length < 150) {
                specificityTotal += 75; // reasonably specific
            } else {
                specificityTotal += 100; // very detailed
            }
        });
        const specificityScore = items.length > 0 ? specificityTotal / items.length : 0;


        // ============ 3. METAS CUANTIFICABLES (20%) ============
        // How many items have concrete goals?
        let goalsCount = 0;
        items.forEach(item => {
            const goals = (item.goals || '').trim();
            // Fallback: long problem descriptions may contain implicit goals
            if (goals.length > 10) {
                goalsCount++;
            } else if ((item.problem || '').length > 100) {
                goalsCount += 0.3; // partial credit for detailed problem with implicit action
            }
        });
        const measurabilityScore = items.length > 0 ? Math.min(100, (goalsCount / items.length) * 100) : 0;


        // ============ 4. INDICADORES (15%) ============
        // How many items define measurable indicators?
        let indicatorsCount = 0;
        items.forEach(item => {
            const indicator = (item.indicator || '').trim();
            if (indicator.length > 5) {
                indicatorsCount++;
            } else if ((item.problem || '').length > 80) {
                indicatorsCount += 0.2; // partial credit
            }
        });
        const indicatorScore = items.length > 0 ? Math.min(100, (indicatorsCount / items.length) * 100) : 0;


        // ============ 5. COHERENCIA PROBLEMA → OBJETIVO (15%) ============
        // Does the objective address the problem?
        let coherenceTotal = 0;
        items.forEach(item => {
            const problem = (item.problem || '').toLowerCase();
            const objective = (item.objective || '').toLowerCase();

            if (problem.length < 5) {
                coherenceTotal += 0;
                return;
            }

            // If only problem exists (no objective), give partial coherence
            if (objective.length < 5) {
                coherenceTotal += problem.length > 50 ? 50 : 25; // detailed problem = partial credit
                return;
            }

            // Extract key words from problem (words > 4 chars)
            const problemWords = problem.split(/\s+/).filter(w => w.length > 4);
            if (problemWords.length === 0) {
                coherenceTotal += 30; // can't evaluate, give partial
                return;
            }

            // Count how many problem keywords appear in objective
            const matches = problemWords.filter(w => objective.includes(w)).length;
            const matchRatio = matches / problemWords.length;

            if (matchRatio >= 0.3) {
                coherenceTotal += 100; // good coherence
            } else if (matchRatio >= 0.15) {
                coherenceTotal += 70; // moderate coherence
            } else if (matchRatio > 0) {
                coherenceTotal += 40; // weak coherence
            } else {
                coherenceTotal += 15; // topic may differ but still a plan
            }
        });
        const coherenceScore = items.length > 0 ? coherenceTotal / items.length : 0;


        // ============ FINAL PLAN DE GOBIERNO SCORE ============
        let finalScore = parseFloat((
            (coverageScore * 0.25) +
            (specificityScore * 0.25) +
            (measurabilityScore * 0.20) +
            (indicatorScore * 0.15) +
            (coherenceScore * 0.15)
        ).toFixed(2));

        // Bonus for having a PDF uploaded (+5, max 100)
        if (hasPdf) {
            finalScore = Math.min(100, finalScore + 5);
        }

        // Bonus for volume of items (more detailed plan)
        if (items.length >= 20) finalScore = Math.min(100, finalScore + 5);
        if (items.length >= 40) finalScore = Math.min(100, finalScore + 5);

        const scoreData = {
            candidate_id: candidateId,
            plan_score: finalScore,
            breakdown: {
                coverage: parseFloat(coverageScore.toFixed(2)),
                specificity: parseFloat(specificityScore.toFixed(2)),
                measurability: parseFloat(measurabilityScore.toFixed(2)),
                indicators: parseFloat(indicatorScore.toFixed(2)),
                coherence: parseFloat(coherenceScore.toFixed(2)),
            },
            dimensions_covered: dimensions.size,
            total_dimensions: JNE_DIMENSIONS.length,
            item_count: items.length,
            has_pdf: hasPdf,
            cached_at: Date.now(),
        };

        // Update DB
        await pool.query(
            'UPDATE candidates SET plan_score = $1, updated_at = NOW() WHERE id = $2',
            [finalScore, candidateId]
        );

        // Cache
        await cache.setJSON(`plan_score:${candidateId}`, scoreData, CACHE_TTL);

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
        console.log(`✅ Calculated Plan de Gobierno scores for ${count} candidates`);
        return count;
    },
};

module.exports = PlanGobiernoScorer;
