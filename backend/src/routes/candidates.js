const express = require('express');
const pool = require('../db/pool');
const RankingEngine = require('../engines/rankingEngine');

const router = express.Router();

// GET /api/candidates - list all candidates
router.get('/', async (req, res) => {
    try {
        const { position, party_id, region, limit = 50 } = req.query;
        let query = `
      SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true
    `;
        const params = [];

        if (position) {
            params.push(position);
            query += ` AND c.position = $${params.length}`;
        }
        if (party_id) {
            params.push(party_id);
            query += ` AND c.party_id = $${params.length}`;
        }
        if (region) {
            params.push(region);
            query += ` AND c.region = $${params.length}`;
        }

        params.push(parseInt(limit));
        query += ` ORDER BY c.final_score DESC LIMIT $${params.length}`;

        const result = await pool.query(query, params);
        res.json({ candidates: result.rows, total: result.rows.length });
    } catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/candidates/:id - single candidate profile
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const candidateResult = await pool.query(`
      SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color, p.logo as party_logo
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.id = $1
    `, [id]);

        if (candidateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidate = candidateResult.rows[0];

        // Each secondary query wrapped in try/catch so missing tables don't crash the endpoint
        const safeQuery = async (sql, params) => {
            try { return (await pool.query(sql, params)).rows; } catch { return []; }
        };

        candidate.proposals = await safeQuery(
            'SELECT * FROM candidate_proposals WHERE candidate_id = $1 ORDER BY created_at DESC', [id]
        );
        candidate.events = await safeQuery(
            'SELECT * FROM candidate_events WHERE candidate_id = $1 AND is_validated = true ORDER BY created_at DESC', [id]
        );
        candidate.vice_presidents = await safeQuery(
            'SELECT * FROM candidate_vice_presidents WHERE candidate_id = $1 ORDER BY sort_order ASC', [id]
        );
        candidate.plan_gobierno = await safeQuery(
            'SELECT * FROM candidate_plan_gobierno WHERE candidate_id = $1 ORDER BY sort_order ASC', [id]
        );

        res.json(candidate);
    } catch (err) {
        console.error('Error fetching candidate:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/candidates/:id/proposals
router.get('/:id/proposals', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM candidate_proposals WHERE candidate_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json({ proposals: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/candidates/regions/list — list all unique regions
router.get('/regions/list', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT region FROM candidates WHERE is_active = true AND region IS NOT NULL ORDER BY region'
        );
        res.json({ regions: result.rows.map(r => r.region) });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
