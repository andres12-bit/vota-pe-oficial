const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/parties - all parties
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT p.*, 
             ps.party_full_score, ps.ranking_position,
             (SELECT COUNT(*) FROM candidates c WHERE c.party_id = p.id AND c.is_active = true) as candidate_count
      FROM parties p
      LEFT JOIN party_scores ps ON ps.party_id = p.id
      ORDER BY ps.party_full_score DESC NULLS LAST
    `);
        res.json({ parties: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/party/:id/full-ticket - complete party ticket
router.get('/:id/full-ticket', async (req, res) => {
    try {
        const { id } = req.params;

        // Get party info
        const partyResult = await pool.query(`
      SELECT p.*, ps.party_full_score, ps.ranking_position
      FROM parties p
      LEFT JOIN party_scores ps ON ps.party_id = p.id
      WHERE p.id = $1
    `, [id]);

        if (partyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Party not found' });
        }

        // Get all candidates grouped by position
        const candidatesResult = await pool.query(`
      SELECT * FROM candidates 
      WHERE party_id = $1 AND is_active = true
      ORDER BY 
        CASE position 
          WHEN 'president' THEN 1 
          WHEN 'senator' THEN 2 
          WHEN 'deputy' THEN 3 
          WHEN 'andean' THEN 4 
        END,
        final_score DESC
    `, [id]);

        const party = partyResult.rows[0];
        const candidates = candidatesResult.rows;

        // Group candidates by position
        const ticket = {
            president: candidates.filter(c => c.position === 'president'),
            senators: candidates.filter(c => c.position === 'senator'),
            deputies: candidates.filter(c => c.position === 'deputy'),
            andean: candidates.filter(c => c.position === 'andean'),
        };

        res.json({
            party,
            ticket,
            total_candidates: candidates.length
        });
    } catch (err) {
        console.error('Party ticket error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
