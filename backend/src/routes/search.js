const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/search?q={query} - full text search (in-memory compatible)
router.get('/', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const searchTerm = q.trim().toLowerCase();
    const maxResults = parseInt(limit);

    // Try SQL first (for PostgreSQL mode), fallback to in-memory search
    let candidateRows = [];
    let proposalRows = [];
    let eventRows = [];

    try {
      // Try PostgreSQL query
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
            `, [searchTerm, `%${searchTerm}%`, maxResults]);

      candidateRows = candidateResults.rows;

      const proposalResults = await pool.query(`
                SELECT cp.*, c.name as candidate_name, c.id as candidate_id
                FROM candidate_proposals cp
                JOIN candidates c ON cp.candidate_id = c.id
                WHERE cp.title ILIKE $1 OR cp.description ILIKE $1 OR cp.category ILIKE $1
                LIMIT $2
            `, [`%${searchTerm}%`, maxResults]);

      proposalRows = proposalResults.rows;

      const eventResults = await pool.query(`
                SELECT ce.*, c.name as candidate_name, c.id as candidate_id
                FROM candidate_events ce
                JOIN candidates c ON ce.candidate_id = c.id
                WHERE ce.title ILIKE $1 OR ce.description ILIKE $1
                LIMIT $2
            `, [`%${searchTerm}%`, maxResults]);

      eventRows = eventResults.rows;
    } catch {
      // SQL failed (in-memory mode) — do direct filtering
    }

    // If SQL returned no results, try in-memory filtering
    if (candidateRows.length === 0 && proposalRows.length === 0 && eventRows.length === 0) {
      // Access the in-memory store directly
      const store = pool._store;
      if (store) {
        // Search candidates
        candidateRows = store.candidates
          .filter(c => c.is_active !== false && (
            (c.name || '').toLowerCase().includes(searchTerm) ||
            (c.region || '').toLowerCase().includes(searchTerm) ||
            (c.party_jne_name || '').toLowerCase().includes(searchTerm)
          ))
          .sort((a, b) => {
            // Priority: exact name match first, then by score
            const aMatch = (a.name || '').toLowerCase().startsWith(searchTerm) ? 1 : 0;
            const bMatch = (b.name || '').toLowerCase().startsWith(searchTerm) ? 1 : 0;
            if (aMatch !== bMatch) return bMatch - aMatch;
            return (b.final_score || 0) - (a.final_score || 0);
          })
          .slice(0, maxResults)
          .map(c => {
            const party = store.parties.find(p => p.id === c.party_id) || {};
            return {
              ...c,
              party_name: party.name || c.party_jne_name || '',
              party_abbreviation: party.abbreviation || '',
              party_color: party.color || '#888',
            };
          });

        // Search proposals
        proposalRows = store.candidate_proposals
          .filter(cp =>
            (cp.title || '').toLowerCase().includes(searchTerm) ||
            (cp.description || '').toLowerCase().includes(searchTerm) ||
            (cp.category || '').toLowerCase().includes(searchTerm)
          )
          .slice(0, maxResults)
          .map(cp => {
            const candidate = store.candidates.find(c => c.id === cp.candidate_id) || {};
            return { ...cp, candidate_name: candidate.name || '', candidate_id: cp.candidate_id };
          });

        // Search events
        eventRows = store.candidate_events
          .filter(ce =>
            (ce.title || '').toLowerCase().includes(searchTerm) ||
            (ce.description || '').toLowerCase().includes(searchTerm)
          )
          .slice(0, maxResults)
          .map(ce => {
            const candidate = store.candidates.find(c => c.id === ce.candidate_id) || {};
            return { ...ce, candidate_name: candidate.name || '', candidate_id: ce.candidate_id };
          });
      }
    }

    res.json({
      query: searchTerm,
      candidates: candidateRows,
      proposals: proposalRows,
      events: eventRows,
      total: candidateRows.length + proposalRows.length + eventRows.length
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
