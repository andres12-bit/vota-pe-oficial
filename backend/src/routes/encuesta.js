/**
 * VOTA.PE — Encuesta (Poll) Route
 *
 * GET  /api/encuesta         — List all active polls with results
 * POST /api/encuesta/:id/vote — Vote on a poll option
 * GET  /api/encuesta/:id      — Get single poll with results
 */
const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/encuesta — list all polls
router.get('/', async (req, res) => {
    try {
        const polls = await pool.query(
            'SELECT * FROM encuesta_polls ORDER BY id ASC'
        );

        // Attach vote counts per option
        const enriched = [];
        for (const poll of polls.rows) {
            const votes = await pool.query(
                'SELECT option_index, COUNT(*) as count FROM encuesta_votes WHERE poll_id = $1 GROUP BY option_index',
                [poll.id]
            );

            const totalVotes = await pool.query(
                'SELECT COUNT(DISTINCT voter_fingerprint) as total FROM encuesta_votes WHERE poll_id = $1',
                [poll.id]
            );

            const voteCounts = {};
            for (const v of votes.rows) {
                voteCounts[v.option_index] = parseInt(v.count);
            }

            enriched.push({
                ...poll,
                vote_counts: voteCounts,
                total_votes: parseInt(totalVotes.rows[0]?.total || 0),
            });
        }

        res.json({ polls: enriched });
    } catch (err) {
        console.error('Encuesta list error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/encuesta/:id — single poll with results
router.get('/:id', async (req, res) => {
    try {
        const poll = await pool.query(
            'SELECT * FROM encuesta_polls WHERE id = $1',
            [parseInt(req.params.id)]
        );

        if (poll.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        const votes = await pool.query(
            'SELECT option_index, COUNT(*) as count FROM encuesta_votes WHERE poll_id = $1 GROUP BY option_index',
            [parseInt(req.params.id)]
        );

        const totalVotes = await pool.query(
            'SELECT COUNT(DISTINCT voter_fingerprint) as total FROM encuesta_votes WHERE poll_id = $1',
            [parseInt(req.params.id)]
        );

        const voteCounts = {};
        for (const v of votes.rows) {
            voteCounts[v.option_index] = parseInt(v.count);
        }

        res.json({
            ...poll.rows[0],
            vote_counts: voteCounts,
            total_votes: parseInt(totalVotes.rows[0]?.total || 0),
        });
    } catch (err) {
        console.error('Encuesta get error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/encuesta/:id/vote — vote on a poll (1 vote per IP, editable)
router.post('/:id/vote', async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const { option_index, fingerprint } = req.body;
        const voterIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const voterFingerprint = fingerprint || voterIp;

        if (option_index === undefined || option_index === null) {
            return res.status(400).json({ error: 'option_index is required' });
        }

        // Check poll exists
        const poll = await pool.query(
            'SELECT * FROM encuesta_polls WHERE id = $1',
            [pollId]
        );
        if (poll.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        const options = poll.rows[0].options;
        if (option_index < 0 || option_index >= options.length) {
            return res.status(400).json({ error: 'Invalid option_index' });
        }

        // Check if already voted (by fingerprint)
        const existing = await pool.query(
            'SELECT id, option_index FROM encuesta_votes WHERE poll_id = $1 AND voter_fingerprint = $2',
            [pollId, voterFingerprint]
        );

        let changed = false;
        let previousVote = null;

        if (existing.rows.length > 0) {
            const oldOption = existing.rows[0].option_index;

            // Same vote — no change needed
            if (oldOption === option_index) {
                return res.json({
                    success: true,
                    poll_id: pollId,
                    option_voted: option_index,
                    already_same: true,
                    message: 'Ya votaste por esta opción'
                });
            }

            // Different vote — swap: delete old, insert new (net count stays 1)
            await pool.query(
                'DELETE FROM encuesta_votes WHERE poll_id = $1 AND voter_fingerprint = $2',
                [pollId, voterFingerprint]
            );
            changed = true;
            previousVote = oldOption;
        }

        // Cast vote
        await pool.query(
            'INSERT INTO encuesta_votes (poll_id, option_index, voter_fingerprint, voter_ip) VALUES ($1, $2, $3, $4)',
            [pollId, option_index, voterFingerprint, voterIp]
        );

        // Get updated results
        const votes = await pool.query(
            'SELECT option_index, COUNT(*) as count FROM encuesta_votes WHERE poll_id = $1 GROUP BY option_index',
            [pollId]
        );

        const totalVotes = await pool.query(
            'SELECT COUNT(DISTINCT voter_fingerprint) as total FROM encuesta_votes WHERE poll_id = $1',
            [pollId]
        );

        const voteCounts = {};
        for (const v of votes.rows) {
            voteCounts[v.option_index] = parseInt(v.count);
        }

        const result = {
            success: true,
            poll_id: pollId,
            option_voted: option_index,
            changed: changed,
            previous_vote: previousVote,
            vote_counts: voteCounts,
            total_votes: parseInt(totalVotes.rows[0]?.total || 0),
        };

        // WebSocket broadcast
        if (req.app.get('wssBroadcast')) {
            req.app.get('wssBroadcast')({
                type: 'encuesta_vote',
                data: {
                    poll_id: pollId,
                    option_index,
                    vote_counts: voteCounts,
                    total_votes: result.total_votes,
                }
            });
        }

        res.json(result);
    } catch (err) {
        console.error('Encuesta vote error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
