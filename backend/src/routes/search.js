const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/search?q={query} - full text search
router.get('/', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const searchTerm = q.trim();

        // Search candidates by name (trigram similarity)
        const candidateResults = await pool.query(`
      SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color,
             similarity(c.name, $1) as relevance
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true AND (
        c.name ILIKE $2 OR
        c.name % $1 OR
        c.region ILIKE $2
      )
      ORDER BY relevance DESC, c.final_score DESC
      LIMIT $3
    `, [searchTerm, `%${searchTerm}%`, parseInt(limit)]);

        // Search proposals
        const proposalResults = await pool.query(`
      SELECT cp.*, c.name as candidate_name, c.id as candidate_id
      FROM candidate_proposals cp
      JOIN candidates c ON cp.candidate_id = c.id
      WHERE cp.title ILIKE $1 OR cp.description ILIKE $1 OR cp.category ILIKE $1
      LIMIT $2
    `, [`%${searchTerm}%`, parseInt(limit)]);

        // Search events
        const eventResults = await pool.query(`
      SELECT ce.*, c.name as candidate_name, c.id as candidate_id
      FROM candidate_events ce
      JOIN candidates c ON ce.candidate_id = c.id
      WHERE ce.title ILIKE $1 OR ce.description ILIKE $1
      LIMIT $2
    `, [`%${searchTerm}%`, parseInt(limit)]);

        res.json({
            query: searchTerm,
            candidates: candidateResults.rows,
            proposals: proposalResults.rows,
            events: eventResults.rows,
            total: candidateResults.rows.length + proposalResults.rows.length + eventResults.rows.length
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
