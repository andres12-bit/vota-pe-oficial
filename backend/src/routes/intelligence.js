const express = require('express');
const IntelligenceEngine = require('../engines/intelligenceEngine');

const router = express.Router();

// GET /api/intelligence/:candidateId - Get intelligence report
router.get('/:candidateId', async (req, res) => {
    try {
        const report = await IntelligenceEngine.getIntelligenceReport(req.params.candidateId);
        if (!report) return res.status(404).json({ error: 'Candidate not found' });
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/intelligence/:candidateId/recalculate - Force recalculate
router.post('/:candidateId/recalculate', async (req, res) => {
    try {
        const result = await IntelligenceEngine.calculateIntelligenceScore(req.params.candidateId);
        if (!result) return res.status(404).json({ error: 'Candidate not found' });

        if (req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({ type: 'intelligence_updated', data: { candidate_id: req.params.candidateId, ...result } });
        }

        res.json({ message: 'Intelligence score recalculated', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/intelligence/recalculate-all - Recalculate all candidates
router.post('/recalculate-all', async (req, res) => {
    try {
        const results = await IntelligenceEngine.recalculateAll();
        res.json({ message: 'All intelligence scores recalculated', count: results.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
