const express = require('express');
const crypto = require('crypto');
const pool = require('../db/pool');
const RankingEngine = require('../engines/rankingEngine');
const IntelligenceEngine = require('../engines/intelligenceEngine');
const MomentumEngine = require('../engines/momentumEngine');
const EventsEngine = require('../engines/eventsEngine');
const AntiFraudEngine = require('../engines/antiFraudEngine');

const router = express.Router();

// JWT-like auth using Node.js built-in crypto (no external dependency needed)
const JWT_SECRET = process.env.JWT_SECRET || 'votape-jwt-secret-2026';
const JWT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + JWT_EXPIRY })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [header, body, signature] = parts;
        const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expected) return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (payload.exp && payload.exp < Date.now()) return null;
        return payload;
    } catch { return null; }
}

// Admin login endpoint (before auth middleware)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const adminKey = process.env.ADMIN_KEY || 'votape-admin-2026';

    // Check credentials
    if ((username === 'admin' && password === adminKey) || password === adminKey) {
        const token = generateToken({ role: 'admin', username: username || 'admin' });
        return res.json({ success: true, token, expires_in: '24h' });
    }

    res.status(401).json({ error: 'Invalid credentials' });
});

// Admin auth middleware — supports JWT Bearer token OR legacy x-admin-key header
const adminAuth = (req, res, next) => {
    // Allow login endpoint through
    if (req.path === '/login') return next();

    // 1. Check Bearer JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const payload = verifyToken(authHeader.slice(7));
        if (payload && payload.role === 'admin') {
            req.adminUser = payload;
            return next();
        }
    }

    // 2. Check legacy x-admin-key header (backward compat)
    const adminKey = req.headers['x-admin-key'];
    if (adminKey === process.env.ADMIN_KEY || adminKey === 'votape-admin-2026') {
        return next();
    }

    // 3. Allow access in development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    res.status(403).json({ error: 'Admin access required. Use POST /api/admin/login to get a JWT token.' });
};

router.use(adminAuth);

// ==================== CANDIDATES ====================

// GET /api/admin/candidates
router.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      ORDER BY c.id
    `);
        res.json({ candidates: result.rows, total: result.rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/candidates - Create candidate
router.post('/candidates', async (req, res) => {
    try {
        const { name, photo, party_id, position, region, biography, intelligence_score, momentum_score, integrity_score, risk_score, stars_rating } = req.body;
        if (!name || !party_id || !position) {
            return res.status(400).json({ error: 'name, party_id, and position are required' });
        }
        const result = await pool.query(
            `INSERT INTO candidates (name, photo, party_id, position, region, biography, intelligence_score, momentum_score, integrity_score, risk_score, stars_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [name, photo, party_id, position, region || '', biography || '', intelligence_score || 50, momentum_score || 0, integrity_score || 50, risk_score || 25, stars_rating || 3.0]
        );

        // Calculate initial final score
        await RankingEngine.recalculateCandidate(result.rows[0].id);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/admin/candidates/:id - Update candidate
router.put('/candidates/:id', async (req, res) => {
    try {
        const { name, photo, party_id, position, region, biography, intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, is_active } = req.body;
        const result = await pool.query(
            `UPDATE candidates SET
        name = COALESCE($1, name), photo = COALESCE($2, photo), party_id = COALESCE($3, party_id),
        position = COALESCE($4, position), region = COALESCE($5, region), biography = COALESCE($6, biography),
        intelligence_score = COALESCE($7, intelligence_score), momentum_score = COALESCE($8, momentum_score),
        integrity_score = COALESCE($9, integrity_score), risk_score = COALESCE($10, risk_score),
        stars_rating = COALESCE($11, stars_rating), is_active = COALESCE($12, is_active),
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
            [name, photo, party_id, position, region, biography, intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

        await RankingEngine.recalculateCandidate(req.params.id);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/admin/candidates/:id
router.delete('/candidates/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM candidates WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });
        res.json({ message: 'Candidate deleted', candidate: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/candidates/:id/toggle - Activate/deactivate
router.post('/candidates/:id/toggle', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE candidates SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, name, is_active',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== PARTIES ====================

// POST /api/admin/parties
router.post('/parties', async (req, res) => {
    try {
        const { name, abbreviation, logo, color } = req.body;
        const result = await pool.query(
            'INSERT INTO parties (name, abbreviation, logo, color) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, abbreviation, logo, color || '#ff1744']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/admin/parties/:id
router.put('/parties/:id', async (req, res) => {
    try {
        const { name, abbreviation, logo, color } = req.body;
        const result = await pool.query(
            `UPDATE parties SET name = COALESCE($1, name), abbreviation = COALESCE($2, abbreviation),
       logo = COALESCE($3, logo), color = COALESCE($4, color), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
            [name, abbreviation, logo, color, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Party not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/admin/parties/:id
router.delete('/parties/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM parties WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Party not found' });
        res.json({ message: 'Party deleted', party: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== INTELLIGENCE ====================

// PUT /api/admin/intelligence/:candidateId - Edit intelligence profile
router.put('/intelligence/:candidateId', async (req, res) => {
    try {
        const { integrity_score, risk_score } = req.body;
        const result = await pool.query(
            `UPDATE candidates SET
        integrity_score = COALESCE($1, integrity_score),
        risk_score = COALESCE($2, risk_score),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
            [integrity_score, risk_score, req.params.candidateId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Candidate not found' });

        // Recalculate intelligence and final score
        const intelligence = await IntelligenceEngine.calculateIntelligenceScore(req.params.candidateId);
        await RankingEngine.recalculateCandidate(req.params.candidateId);

        res.json({ candidate: result.rows[0], intelligence });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/admin/recalculate/all - Force full recalculation
router.post('/recalculate/all', async (req, res) => {
    try {
        await IntelligenceEngine.recalculateAll();
        await MomentumEngine.recalculateAll();

        const candidates = await pool.query('SELECT id, party_id FROM candidates WHERE is_active = true');
        for (const c of candidates.rows) {
            await RankingEngine.recalculateCandidate(c.id);
        }
        const partyIds = [...new Set(candidates.rows.map(c => c.party_id))];
        for (const pid of partyIds) {
            await RankingEngine.recalculatePartyScore(pid);
        }

        res.json({ message: 'Full system recalculation complete', candidates: candidates.rows.length, parties: partyIds.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== EVENTS ====================

// GET /api/admin/events/pending
router.get('/events/pending', async (req, res) => {
    try {
        const events = await EventsEngine.getPendingEvents();
        res.json({ events, total: events.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== VOTES & ANTI-FRAUD ====================

// GET /api/admin/votes - View votes with filters
router.get('/votes', async (req, res) => {
    try {
        const { ip, candidate_id, limit = 100 } = req.query;
        let query = 'SELECT v.*, c.name as candidate_name FROM votes v JOIN candidates c ON v.candidate_id = c.id';
        const params = [];
        const conditions = [];

        if (ip) {
            params.push(ip);
            conditions.push(`v.voter_ip = $${params.length}`);
        }
        if (candidate_id) {
            params.push(candidate_id);
            conditions.push(`v.candidate_id = $${params.length}`);
        }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        params.push(parseInt(limit));
        query += ` ORDER BY v.created_at DESC LIMIT $${params.length}`;

        const result = await pool.query(query, params);
        res.json({ votes: result.rows, total: result.rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/fraud/stats
router.get('/fraud/stats', async (req, res) => {
    try {
        const stats = await AntiFraudEngine.getStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/fraud/block-ip
router.post('/fraud/block-ip', async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) return res.status(400).json({ error: 'ip is required' });
        const result = await AntiFraudEngine.blockIP(ip);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/fraud/unblock-ip
router.post('/fraud/unblock-ip', async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) return res.status(400).json({ error: 'ip is required' });
        const result = await AntiFraudEngine.unblockIP(ip);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/fraud/votes/:ip - Delete fraudulent votes
router.delete('/fraud/votes/:ip', async (req, res) => {
    try {
        const result = await AntiFraudEngine.deleteFraudulentVotes(req.params.ip);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== USERS ====================

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ users: result.rows, total: result.rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/users/:id/block
router.post('/users/:id/block', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET is_blocked = NOT is_blocked WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== SYSTEM ====================

// GET /api/admin/system/status
router.get('/system/status', async (req, res) => {
    try {
        const cache = require('../db/redis');
        const candidates = await pool.query('SELECT COUNT(*) as cnt FROM candidates');
        const parties = await pool.query('SELECT COUNT(*) as cnt FROM parties');
        const votes = await pool.query('SELECT COUNT(*) as cnt FROM votes');
        const events = await pool.query('SELECT COUNT(*) as cnt FROM candidate_events');
        const wsClients = req.app.get('wsClientCount') ? req.app.get('wsClientCount')() : 0;

        res.json({
            status: 'online',
            candidates: parseInt(candidates.rows[0].cnt),
            parties: parseInt(parties.rows[0].cnt),
            total_votes: parseInt(votes.rows[0].cnt),
            total_events: parseInt(events.rows[0].cnt),
            ws_clients: wsClients,
            cache: cache.getStats(),
            engines: {
                scoring_formula: '(vote_score × 0.40) + (intelligence × 0.25) + (momentum × 0.20) + (integrity × 0.15)',
                cache_ttl: '300s',
                cache_keys: ['candidate_score:{id}', 'party_score:{id}', 'momentum:{id}', 'intelligence:{id}', 'ranking:{position}'],
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/system/maintenance
router.post('/system/maintenance', async (req, res) => {
    const { enabled } = req.body;
    req.app.set('maintenanceMode', enabled);

    if (req.app.get('wssBroadcast')) {
        req.app.get('wssBroadcast')({
            type: 'system_status',
            data: { maintenance: enabled }
        });
    }

    res.json({ maintenance_mode: enabled });
});

module.exports = router;
