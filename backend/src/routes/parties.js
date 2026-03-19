const express = require('express');
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
        const candidates = candidatesResult.rows.map(enrichCandidate);

        // Group candidates by position
        const presidents = candidates.filter(c => c.position === 'president');

        // Fetch vice presidents for each president
        const vicePresidentsMap = {};
        for (const pres of presidents) {
            const vpResult = await pool.query(
                'SELECT * FROM candidate_vice_presidents WHERE candidate_id = $1 ORDER BY sort_order ASC',
                [pres.id]
            );
            vicePresidentsMap[pres.id] = vpResult.rows;
        }

        const ticket = {
            president: presidents,
            senators: candidates.filter(c => c.position === 'senator'),
            deputies: candidates.filter(c => c.position === 'deputy'),
            andean: candidates.filter(c => c.position === 'andean'),
        };

        res.json({
            party,
            ticket,
            vice_presidents: vicePresidentsMap,
            total_candidates: candidates.length
        });
    } catch (err) {
        console.error('Party ticket error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
