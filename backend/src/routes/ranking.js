const express = require('express');
const RankingEngine = require('../engines/rankingEngine');
const MomentumEngine = require('../engines/momentumEngine');
const pool = require('../db/pool');

const { getCongressInfo } = require('../data/congressMembers');

const router = express.Router();

// Compute final_score on-the-fly from component scores
function computeFinalScore(c) {
    const hoja = parseFloat(c.hoja_score) || 0;
    const plan = parseFloat(c.plan_score) || 0;
    const exp = parseFloat(c.experience_score) || 0;
    const integ = parseFloat(c.integrity_score) || 0;
    if (c.position === 'president') {
        c.final_score = parseFloat(((hoja * 0.30) + (plan * 0.30) + (exp * 0.25) + (integ * 0.15)).toFixed(2));
    } else {
        c.final_score = parseFloat(((hoja * 0.40) + (exp * 0.35) + (integ * 0.25)).toFixed(2));
    }
    return c;
}

// Enrich candidate with congress member info
function enrichCandidate(c) {
    computeFinalScore(c);
    const info = getCongressInfo(c.id);
    c.is_current_congressman = !!info;
    c.congress_bancada = info ? info.bancada : null;
    c.congress_proyectos = info ? info.proyectos : null;
    c.congress_asistencia = info ? info.asistencia : null;
    c.congress_comisiones = info ? info.comisiones : null;
    c.congress_cambio_bancada = info ? info.cambio_bancada : null;
    c.congress_bancada_original = info ? (info.bancada_original || null) : null;
    c.congress_destacado = info ? (info.destacado || null) : null;
    return c;
}

// GET /api/ranking/:position - ranked candidates by position
router.get('/:position', async (req, res) => {
    try {
        const { position } = req.params;
        const validPositions = ['president', 'senator', 'deputy', 'andean', 'global'];

        if (!validPositions.includes(position)) {
            return res.status(400).json({ error: 'Invalid position. Use: president, senator, deputy, andean, global' });
        }

        let ranking;
        if (position === 'global') {
            ranking = await RankingEngine.getGlobalRanking();
        } else {
            ranking = await RankingEngine.getRanking(position);
        }

        // Recompute final_score and re-sort
        ranking = ranking.map(enrichCandidate);
        ranking.sort((a, b) => b.final_score - a.final_score);

        // Add rank numbers
        ranking = ranking.map((c, i) => ({ ...c, rank: i + 1 }));

        res.json({ position, ranking, total: ranking.length });
    } catch (err) {
        console.error('Ranking error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/ranking - get top momentum candidates (from ALL positions)
router.get('/', async (req, res) => {
    try {
        // Fetch top candidates per position so filter tabs work
        const positions = ['president', 'senator', 'deputy', 'andean'];
        const perPosition = await Promise.all(
            positions.map(pos =>
                pool.query(`
                    SELECT c.id, c.name, c.photo, c.position, c.region, c.momentum_score, c.final_score,
                           c.hoja_score, c.plan_score, c.experience_score, c.integrity_score, c.vote_count,
                           p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
                    FROM candidates c
                    JOIN parties p ON c.party_id = p.id
                    WHERE c.is_active = true AND c.position = $1
                    ORDER BY c.momentum_score DESC
                    LIMIT 5
                `, [pos])
            )
        );
        const momentum = perPosition.flatMap(r => r.rows)
            .map(c => {
                computeFinalScore(c);
                return {
                    ...c,
                    tendency: parseFloat(c.momentum_score) >= 70 ? 'EN ALZA'
                        : parseFloat(c.momentum_score) >= 40 ? 'ESTABLE' : 'EN BAJA'
                };
            });

        let ranking = await RankingEngine.getGlobalRanking();
        ranking = ranking.map(enrichCandidate);
        ranking.sort((a, b) => b.final_score - a.final_score);

        res.json({
            top_momentum: momentum,
            global_ranking: ranking.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
