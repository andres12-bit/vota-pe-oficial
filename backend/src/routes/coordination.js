const express = require('express');
const ViralCoordinationEngine = require('../engines/viralCoordinationEngine');

const router = express.Router();

// GET /api/coordination/report - Full coordination report
router.get('/report', async (req, res) => {
    try {
        const report = await ViralCoordinationEngine.getCoordinationReport();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coordination/trends - Emergent trends
router.get('/trends', async (req, res) => {
    try {
        const trends = await ViralCoordinationEngine.detectEmergentTrends();
        res.json({ trends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coordination/dominance - Regional dominance
router.get('/dominance', async (req, res) => {
    try {
        const dominance = await ViralCoordinationEngine.detectRegionalDominance();
        res.json({ dominance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
