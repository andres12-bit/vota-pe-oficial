/**
 * PulsoElectoral.pe — Hoja de Vida Scorer
 *
 * Evaluates candidate CV quality based on JNE data.
 * Scale: 0 to 100
 *
 * Weights (user-approved):
 *   Educación:                25%
 *   Experiencia Laboral:      20%
 *   Experiencia Política:     15%
 *   Transparencia Financiera: 10%
 *   Limpieza Judicial:        25%
 */
const pool = require('../db/pool');
const cache = require('../db/redis');

const CACHE_TTL = 600; // 10 minutes

const HojaDeVidaScorer = {

    /**
     * Get HV score — cached or recalculated
     */
    async getScore(candidateId) {
        const cached = await cache.getJSON(`hv_score:${candidateId}`);
        if (cached) return cached;
        return this.calculate(candidateId);
    },

    /**
     * Calculate Hoja de Vida score for a candidate
     */
    async calculate(candidateId) {
        const result = await pool.query(
            'SELECT hoja_de_vida, education, experience FROM candidates WHERE id = $1',
            [candidateId]
        );
        if (result.rows.length === 0) return null;

        const candidate = result.rows[0];
        const hv = candidate.hoja_de_vida || {};
        const edu = hv.education || {};
        const finances = hv.finances || {};

        // ============ 1. EDUCACIÓN (25%) ============
        let educationScore = 0;

        // Basic education: baseline 10
        educationScore = 10;

        // Technical studies
        const technical = edu.technical || [];
        const completedTech = technical.filter(t => t && (t.institution || t.specialty));
        if (completedTech.length > 0) educationScore = Math.max(educationScore, 30);

        // University studies
        const university = edu.university || [];
        const completedUni = university.filter(u => u && (u.institution || u.degree));
        if (completedUni.length > 0) educationScore = Math.max(educationScore, 55);

        // Completed university degree
        const graduatedUni = university.filter(u => u && u.completed);
        if (graduatedUni.length > 0) educationScore = Math.max(educationScore, 70);

        // Postgraduate studies
        const postgraduate = edu.postgraduate || [];
        const hasPostgrad = postgraduate.filter(p => p && (p.institution || p.specialty));
        if (hasPostgrad.length > 0) educationScore = Math.max(educationScore, 85);

        // Completed postgraduate (maestría/doctorado)
        const completedPostgrad = postgraduate.filter(p => p && p.completed);
        if (completedPostgrad.length > 0) educationScore = 100;

        // Bonus for multiple degrees
        const totalDegrees = completedTech.length + completedUni.length + hasPostgrad.length;
        if (totalDegrees >= 3) educationScore = Math.min(100, educationScore + 10);


        // ============ 2. EXPERIENCIA LABORAL (20%) ============
        const workExp = hv.work_experience || [];
        const validWork = workExp.filter(w => w && (w.position || w.employer));
        // Each valid job = 15 points. Bonus +40pts for any job with 20+ continuous years.
        let workScore = validWork.length * 15;
        // Check for long-tenure bonus
        validWork.forEach(w => {
            let from = parseInt(w.start_year || w.year_from || w.from || 0);
            let to = parseInt(w.end_year || w.year_to || w.to || 0);
            // Parse period string like "1990 - 2025"
            if ((!from || !to) && w.period) {
                const years = (w.period + '').match(/(\d{4})/g);
                if (years && years.length >= 1) {
                    if (!from) from = parseInt(years[0]);
                    if (!to && years.length >= 2) to = parseInt(years[1]);
                }
            }
            if (!to) to = new Date().getFullYear();
            if (from > 0 && (to - from) >= 20) {
                workScore += 40;
            }
        });
        workScore = Math.min(100, workScore);


        // ============ 3. EXPERIENCIA POLÍTICA (15%) ============
        const polHistory = hv.political_history || [];
        const validPol = polHistory.filter(p => p && (p.organization || p.position));
        // Each political role = 20 points, max 100. No bonuses — flat and consistent.
        let politicalScore = Math.min(100, validPol.length * 20);


        // ============ 4. TRANSPARENCIA FINANCIERA (10%) ============
        let financeScore = 0;
        // If candidate declared ANY financial info, full score (we don't judge by amount)
        const hasAnyIncome = (finances.total_income || 0) > 0 || (finances.public_income || 0) > 0 || (finances.private_income || 0) > 0 || (finances.other_private || 0) > 0 || (finances.other_public || 0) > 0 || (finances.individual_private || 0) > 0 || (finances.individual_public || 0) > 0;
        const hasProperties = (finances.properties || []).length > 0;
        const hasVehicles = (finances.vehicles || []).length > 0;
        const hasDeclared = hasAnyIncome || hasProperties || hasVehicles || (finances && Object.keys(finances).length > 0);
        financeScore = hasDeclared ? 100 : 0;


        // ============ 5. LIMPIEZA JUDICIAL (25%) ============
        const sentences = hv.sentences || [];
        let judicialScore = 100; // Start clean

        if (sentences.length > 0) {
            sentences.forEach(s => {
                const type = (s.type || '').toLowerCase();
                const verdict = (s.verdict || '').toLowerCase();

                if (type.includes('penal')) {
                    if (verdict.includes('condena') || verdict.includes('culpable')) {
                        judicialScore -= 50; // Condemned
                    } else if (verdict.includes('suspendid')) {
                        judicialScore -= 30; // Suspended sentence
                    } else {
                        judicialScore -= 20; // Other penal
                    }
                } else if (type.includes('civil')) {
                    judicialScore -= 10;
                } else {
                    judicialScore -= 15; // Other types
                }
            });
        }

        judicialScore = Math.max(0, Math.min(100, judicialScore));


        // ============ FINAL HOJA DE VIDA SCORE ============
        const finalScore = parseFloat((
            (educationScore * 0.25) +
            (workScore * 0.20) +
            (politicalScore * 0.15) +
            (financeScore * 0.10) +
            (judicialScore * 0.25)
        ).toFixed(2));

        const scoreData = {
            candidate_id: candidateId,
            hoja_score: finalScore,
            breakdown: {
                education: parseFloat(educationScore.toFixed(2)),
                work_experience: parseFloat(workScore.toFixed(2)),
                political_experience: parseFloat(politicalScore.toFixed(2)),
                financial_transparency: parseFloat(financeScore.toFixed(2)),
                judicial_clean: parseFloat(judicialScore.toFixed(2)),
            },
            cached_at: Date.now(),
        };

        // Update DB — also persist workScore as experience_score for the ranking formula
        const experienceScore = parseFloat(workScore.toFixed(2));
        await pool.query(
            'UPDATE candidates SET hoja_score = $1, experience_score = $2, updated_at = NOW() WHERE id = $3',
            [finalScore, experienceScore, candidateId]
        );

        // Cache
        await cache.setJSON(`hv_score:${candidateId}`, scoreData, CACHE_TTL);

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
        console.log(`✅ Calculated Hoja de Vida scores for ${count} candidates`);
        return count;
    },
};

module.exports = HojaDeVidaScorer;
