require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const setupWebSocket = require('./websocket/wsServer');

// Routes
const candidatesRouter = require('./routes/candidates');
const votesRouter = require('./routes/votes');
const rankingRouter = require('./routes/ranking');
const partiesRouter = require('./routes/parties');
const searchRouter = require('./routes/search');
const eventsRouter = require('./routes/events');
const intelligenceRouter = require('./routes/intelligence');
const adminRouter = require('./routes/admin');
const coordinationRouter = require('./routes/coordination');
const ingestionRouter = require('./routes/ingestion');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Maintenance mode middleware
app.use((req, res, next) => {
    if (req.app.get('maintenanceMode') && !req.url.startsWith('/api/admin') && !req.url.startsWith('/api/health')) {
        return res.status(503).json({ error: 'System under maintenance. Please try again later.' });
    }
    next();
});

// API Routes
app.use('/api/candidates', candidatesRouter);
app.use('/api/votes', votesRouter);
app.use('/api/ranking', rankingRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/party', partiesRouter);
app.use('/api/search', searchRouter);
app.use('/api/events', eventsRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coordination', coordinationRouter);
app.use('/api/admin/ingestion', ingestionRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'VOTA.PE API',
        timestamp: new Date().toISOString(),
        wsClients: req.app.get('wsClientCount') ? req.app.get('wsClientCount')() : 0
    });
});

// Vote stats shortcut
app.get('/api/stats', async (req, res) => {
    try {
        const pool = require('./db/pool');
        const totalVotes = await pool.query('SELECT COUNT(*) as total FROM votes');
        const totalCandidates = await pool.query('SELECT COUNT(*) as total FROM candidates WHERE is_active = true');
        const totalParties = await pool.query('SELECT COUNT(*) as total FROM parties');

        res.json({
            total_votes: parseInt(totalVotes.rows[0].total),
            total_candidates: parseInt(totalCandidates.rows[0].total),
            total_parties: parseInt(totalParties.rows[0].total),
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const { broadcast, getClientCount } = setupWebSocket(server);
app.set('wssBroadcast', broadcast);
app.set('wsClientCount', getClientCount);

// Start server — bind to 0.0.0.0 for production (Render, Docker)
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const dbMode = process.env.DATABASE_URL ? '🐘 PostgreSQL' : '🧠 In-Memory';

server.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════╗
║          🗳️  VOTA.PE API SERVER          ║
║       Political Intelligence Engine      ║
╠══════════════════════════════════════════╣
║  REST API:  http://${HOST}:${PORT}               ║
║  WebSocket: ws://${HOST}:${PORT}                 ║
║  Database:  ${dbMode.padEnd(29)}║
║  Mode:      ${(process.env.NODE_ENV || 'development').padEnd(29)}║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
function gracefulShutdown(signal) {
    console.log(`\n[SHUTDOWN] ${signal} received. Closing server...`);

    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed.');

        // Close database pool
        const pool = require('./db/pool');
        pool.end(() => {
            console.log('[SHUTDOWN] Database pool closed.');
            process.exit(0);
        });
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('[SHUTDOWN] Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled rejection:', err);
});

module.exports = app;
