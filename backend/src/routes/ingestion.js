const express = require('express');
const JNEIngestionEngine = require('../engines/jneIngestionEngine');

const router = express.Router();

// POST /api/admin/ingestion/run - Run full JNE ingestion
router.post('/run', async (req, res) => {
    try {
        console.log('[Admin] Starting JNE ingestion...');
        const results = await JNEIngestionEngine.runFullIngestion();
        res.json({ message: 'Ingestion complete', results });
    } catch (err) {
        console.error('Ingestion error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/ingestion/status - Get ingestion status
router.get('/status', async (req, res) => {
    try {
        const status = await JNEIngestionEngine.getIngestionStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/ingestion/manual - Manual candidate ingestion (upload JSON)
router.post('/manual', async (req, res) => {
    try {
        const { candidates, position } = req.body;
        if (!candidates || !Array.isArray(candidates) || !position) {
            return res.status(400).json({ error: 'candidates array and position are required' });
        }

        const result = await JNEIngestionEngine.ingestCandidates(candidates, position);
        res.json({ message: 'Manual ingestion complete', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
