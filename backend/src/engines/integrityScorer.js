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

        // ============ 1. LIMPIEZA JUDICIAL (40%) ============
        // Start at 100 = clean record, deduct for each issue
        let judicialScore = 100;

        const sentences = hv.sentences || [];
        if (sentences.length > 0) {
            sentences.forEach(s => {
                const type = (s.type || '').toLowerCase();
                const crime = (s.crime || '').toLowerCase();
                const sentence = (s.sentence || '').toLowerCase();

                if (type.includes('penal')) {
                    // Serious crimes
                    if (crime.includes('corrupci') || crime.includes('peculado') ||
                        crime.includes('colusi') || crime.includes('lavado') ||
                        crime.includes('enriquecimiento') || crime.includes('soborno')) {
                        judicialScore -= 40; // Corruption-related
                    } else if (crime.includes('homicidio') || crime.includes('violaci') ||
                        crime.includes('secuestro') || crime.includes('terrorismo')) {
                        judicialScore -= 50; // Violent crimes
                    } else if (crime.includes('negociaci') || crime.includes('fraude') ||
                        crime.includes('falsificaci') || crime.includes('malversaci')) {
                        judicialScore -= 35; // Financial crimes
                    } else {
                        judicialScore -= 25; // Other penal sentences
                    }

                    // Additional penalty if convicted
                    if (sentence.includes('condena') || sentence.includes('culpable') ||
                        sentence.includes('pena privativa')) {
                        judicialScore -= 15;
                    }
                } else if (type.includes('civil') || type.includes('obligaci')) {
                    judicialScore -= 10; // Civil cases
                } else {
                    judicialScore -= 15; // Other types
                }
            });
        }

        judicialScore = Math.max(0, Math.min(100, judicialScore));


        // ============ 2. ESTABILIDAD PARTIDARIA (20%) ============
        // Start at 100, deduct for instability signals
        let stabilityScore = 100;

        const resignations = hv.resignations || [];
        // Filter actual resignations (some have empty fields)
        const realResignations = resignations.filter(r => r && (r.organization || r.year));

        if (realResignations.length === 1) {
            stabilityScore -= 10;
        } else if (realResignations.length === 2) {
            stabilityScore -= 25;
        } else if (realResignations.length >= 3) {
            stabilityScore -= 40; // Very unstable
        }

        // Check political history for party-hopping
        const polHistory = hv.political_history || [];
        const uniqueParties = new Set();
        polHistory.forEach(p => {
            if (p && p.organization) {
                uniqueParties.add(p.organization.toLowerCase().trim());
            }
        });

        // Having been in 3+ different parties = instability
        if (uniqueParties.size >= 4) {
            stabilityScore -= 30;
        } else if (uniqueParties.size === 3) {
            stabilityScore -= 15;
        } else if (uniqueParties.size === 2) {
            stabilityScore -= 5;
        }
        // 1 party or fewer = stable, no penalty

        // Bonus: long tenure in current party
        const currentParty = polHistory.find(p =>
            p && ((p.end_year || '').toLowerCase().includes('actual') || p.end_year === 'Actualidad')
        );
        if (currentParty && currentParty.start_year) {
            const yearsInParty = 2026 - parseInt(currentParty.start_year);
            if (yearsInParty >= 10) stabilityScore = Math.min(100, stabilityScore + 15);
            else if (yearsInParty >= 5) stabilityScore = Math.min(100, stabilityScore + 10);
        }

        stabilityScore = Math.max(0, Math.min(100, stabilityScore));


        // ============ 3. TRANSPARENCIA (20%) ============
        // How complete and transparent is their financial declaration
        let transparencyScore = 0;

        const finances = hv.finances || {};

        // Has declared income (any source)
        const hasIncome = (finances.total_income || 0) > 0;
        if (hasIncome) transparencyScore += 30;

        // Has declared properties
        const properties = finances.properties || [];
        if (properties.length > 0) transparencyScore += 20;

        // Has declared vehicles
        const vehicles = finances.vehicles || [];
        if (vehicles.length > 0) transparencyScore += 15;

        // Has declared income year
        if (finances.year) transparencyScore += 10;

        // Breakdown between public/private income (shows detailed reporting)
        const hasPublic = (finances.public_income || 0) > 0 || (finances.individual_public || 0) > 0;
        const hasPrivate = (finances.private_income || 0) > 0 || (finances.individual_private || 0) > 0 || (finances.other_private || 0) > 0;
        if (hasPublic || hasPrivate) transparencyScore += 15;

        // Bonus: very detailed declaration
        if (properties.length >= 3 || vehicles.length >= 3) {
            transparencyScore = Math.min(100, transparencyScore + 10);
        }

        transparencyScore = Math.max(0, Math.min(100, transparencyScore));


        // ============ 4. COHERENCIA POLÍTICA (20%) ============
        // Evaluates consistency and legitimacy in political career
        let coherenceScore = 50; // Start neutral

        const elections = hv.elections || [];

        // Has electoral experience = more transparent public figure
        if (elections.length > 0) coherenceScore += 20;
        if (elections.length >= 3) coherenceScore += 10;

        // Political leadership roles
        polHistory.forEach(p => {
            const pos = (p.position || '').toLowerCase();
            if (pos.includes('presidente') || pos.includes('secretario general')) {
                coherenceScore += 10;
            } else if (pos.includes('fundador')) {
                coherenceScore += 5;
            }
        });

        // No sentences at all = bonus for clean trajectory
        if (sentences.length === 0) coherenceScore += 15;

        coherenceScore = Math.max(0, Math.min(100, coherenceScore));


        // ============ FINAL INTEGRITY SCORE ============
        const finalScore = parseFloat((
            (judicialScore * 0.40) +
            (stabilityScore * 0.20) +
            (transparencyScore * 0.20) +
            (coherenceScore * 0.20)
        ).toFixed(2));

        const scoreData = {
            candidate_id: candidateId,
            integrity_score: finalScore,
            breakdown: {
                judicial_clean: parseFloat(judicialScore.toFixed(2)),
                party_stability: parseFloat(stabilityScore.toFixed(2)),
                transparency: parseFloat(transparencyScore.toFixed(2)),
                political_coherence: parseFloat(coherenceScore.toFixed(2)),
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
