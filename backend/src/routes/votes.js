/**
 * VOTA.PE — Votes Route
 *
 * POST /api/votes — Cast a vote (with anti-fraud, scoring recalculation, cache invalidation)
 * GET  /api/votes/stats — Vote statistics
 */
const express = require('express');
const pool = require('../db/pool');
const RankingEngine = require('../engines/rankingEngine');
const MomentumEngine = require('../engines/momentumEngine');
const AntiFraudEngine = require('../engines/antiFraudEngine');

const router = express.Router();

// Voting rules per position
const VOTING_RULES = {
    president: { required: 1, optional: 0, max: 1 },
    senator: { required: 1, optional: 2, max: 3 },
    deputy: { required: 1, optional: 2, max: 3 },
    andean: { required: 1, optional: 2, max: 3 },
};

// POST /api/votes - cast a vote
router.post('/', async (req, res) => {
    try {
        const { candidate_id, position_type, fingerprint } = req.body;
        const voterIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const sessionId = req.headers['x-session-id'] || fingerprint || voterIp;

        if (!candidate_id || !position_type) {
            return res.status(400).json({ error: 'candidate_id and position_type are required' });
        }

        if (!VOTING_RULES[position_type]) {
            return res.status(400).json({ error: 'Invalid position_type' });
        }

        // Anti-fraud check
        const fraudCheck = await AntiFraudEngine.checkVoter(voterIp, fingerprint);
        if (!fraudCheck.allowed) {
            return res.status(403).json({
                error: 'Vote blocked by anti-fraud system',
                issues: fraudCheck.issues,
                risk_level: fraudCheck.riskLevel
            });
        }

        // Check candidate exists and matches position
        const candidateCheck = await pool.query(
            'SELECT id, party_id, position FROM candidates WHERE id = $1 AND is_active = true',
            [candidate_id]
        );
        if (candidateCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        if (candidateCheck.rows[0].position !== position_type) {
            return res.status(400).json({ error: 'Candidate position does not match vote type' });
        }

        // Check vote limit per session (24h window)
        const rules = VOTING_RULES[position_type];
        const existingVotes = await pool.query(
            `SELECT COUNT(*) as cnt FROM votes 
             WHERE (voter_ip = $1 OR voter_fingerprint = $2)
             AND position_type = $3
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [voterIp, fingerprint || '', position_type]
        );

        const currentCount = parseInt(existingVotes.rows[0].cnt);
        if (currentCount >= rules.max) {
            return res.status(429).json({
                error: `Maximum ${rules.max} votes for ${position_type} reached in 24 hours`,
                max: rules.max,
                current: currentCount
            });
        }

        // ==================== CAST VOTE ====================
        await pool.query(
            'INSERT INTO votes (candidate_id, position_type, voter_ip, voter_fingerprint, session_id) VALUES ($1, $2, $3, $4, $5)',
            [candidate_id, position_type, voterIp, fingerprint || '', sessionId]
        );

        // Update vote count
        await pool.query(
            'UPDATE candidates SET vote_count = vote_count + 1, updated_at = NOW() WHERE id = $1',
            [candidate_id]
        );

        // ==================== CACHE INVALIDATION + LAZY RECALCULATION ====================
        const partyId = candidateCheck.rows[0].party_id;

        // 1. Invalidate caches (momentum, candidate score, rankings)
        await MomentumEngine.invalidate(candidate_id);
        await RankingEngine.invalidateCandidate(candidate_id);
        await RankingEngine.invalidateParty(partyId);
        await RankingEngine.invalidateRankings();

        // 2. Recalculate momentum (velocity, acceleration, tendency)
        const momentumData = await MomentumEngine.calculateMomentum(candidate_id);

        // 3. Recalculate candidate final score
        const scoreData = await RankingEngine.recalculateCandidate(candidate_id);

        // 4. Recalculate party score
        await RankingEngine.recalculatePartyScore(partyId);

        // ==================== RESPONSE ====================
        const candidate = await pool.query(
            `SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation 
             FROM candidates c JOIN parties p ON c.party_id = p.id WHERE c.id = $1`,
            [candidate_id]
        );

        res.json({
            success: true,
            vote: { candidate_id, position_type },
            new_score: scoreData?.final_score,
            momentum: {
                score: momentumData?.momentum_score,
                tendency: momentumData?.tendency,
            },
            remaining_votes: rules.max - currentCount - 1,
            candidate: candidate.rows[0]
        });

        // ==================== WEBSOCKET BROADCAST ====================
        if (req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({
                type: 'vote_cast',
                data: {
                    candidate_id,
                    candidate_name: candidate.rows[0]?.name,
                    position_type,
                    new_score: scoreData?.final_score,
                    momentum_score: momentumData?.momentum_score,
                    momentum_tendency: momentumData?.tendency,
                }
            });
        }
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/votes/stats - vote statistics
router.get('/stats', async (req, res) => {
    try {
        const totalVotes = await pool.query('SELECT COUNT(*) as total FROM votes');
        const byPosition = await pool.query(
            'SELECT position_type, COUNT(*) as count FROM votes GROUP BY position_type'
        );
        const recentVotes = await pool.query(
            `SELECT COUNT(*) as count FROM votes WHERE created_at > NOW() - INTERVAL '1 hour'`
        );

        res.json({
            total: parseInt(totalVotes.rows[0].total),
            by_position: byPosition.rows,
            last_hour: parseInt(recentVotes.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
