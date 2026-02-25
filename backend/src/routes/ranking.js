const express = require('express');
const RankingEngine = require('../engines/rankingEngine');
const MomentumEngine = require('../engines/momentumEngine');

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

// GET /api/ranking - get top momentum candidates
router.get('/', async (req, res) => {
    try {
        const momentum = await MomentumEngine.getTopMomentum(10);
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
