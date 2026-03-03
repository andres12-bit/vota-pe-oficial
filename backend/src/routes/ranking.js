const express = require('express');
const RankingEngine = require('../engines/rankingEngine');
const MomentumEngine = require('../engines/momentumEngine');
const pool = require('../db/pool');

const router = express.Router();

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
                    SELECT c.id, c.name, c.photo, c.position, c.region, c.momentum_score, c.final_score, c.vote_count,
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
            .map(c => ({
                ...c,
                tendency: parseFloat(c.momentum_score) >= 70 ? 'EN ALZA'
                    : parseFloat(c.momentum_score) >= 40 ? 'ESTABLE' : 'EN BAJA'
            }));

        const ranking = await RankingEngine.getGlobalRanking();

        res.json({
            top_momentum: momentum,
            global_ranking: ranking.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
