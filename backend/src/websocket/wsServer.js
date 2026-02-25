const { WebSocketServer } = require('ws');

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });
    const clients = new Set();

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log(`[WS] Client connected. Total: ${clients.size}`);

        ws.on('close', () => {
            clients.delete(ws);
            console.log(`[WS] Client disconnected. Total: ${clients.size}`);
        });

        ws.on('error', (err) => {
            console.error('[WS] Error:', err.message);
            clients.delete(ws);
        });

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            data: { message: 'Connected to VOTA.PE real-time feed', timestamp: Date.now() }
        }));
    });

    // Broadcast function
    function broadcast(message) {
        const payload = JSON.stringify(message);
        let sent = 0;
        for (const client of clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(payload);
                sent++;
            }
        }
        return sent;
    }

    // Periodic heartbeat (every 15 seconds)
    setInterval(() => {
        broadcast({
            type: 'heartbeat',
            data: { timestamp: Date.now(), clients: clients.size }
        });
    }, 15000);

    // Periodic ranking snapshot broadcast (every 60 seconds)
    // This allows the frontend to auto-refresh rankings without polling
    setInterval(async () => {
        try {
            const pool = require('../db/pool');

            // Top 5 momentum candidates
            const momentum = await pool.query(`
                SELECT c.id, c.name, c.momentum_score, c.final_score, c.vote_count,
                       p.abbreviation as party_abbreviation, p.color as party_color
                FROM candidates c JOIN parties p ON c.party_id = p.id
                WHERE c.is_active = true
                ORDER BY c.momentum_score DESC LIMIT 5
            `);

            // Total votes
            const stats = await pool.query('SELECT SUM(vote_count) as total FROM candidates');

            broadcast({
                type: 'ranking_snapshot',
                data: {
                    timestamp: Date.now(),
                    top_momentum: momentum.rows,
                    total_votes: parseInt(stats.rows[0].total) || 0,
                }
            });
        } catch (err) {
            // Silently fail — DB may not be connected
        }
    }, 60000);

    // Periodic engine recalculation (every 5 minutes)
    setInterval(async () => {
        try {
            const MomentumEngine = require('../engines/momentumEngine');
            const IntelligenceEngine = require('../engines/intelligenceEngine');
            const RankingEngine = require('../engines/rankingEngine');
            const pool = require('../db/pool');

            console.log('[ENGINE] Starting periodic recalculation...');

            // Recalculate momentum for all candidates
            await MomentumEngine.recalculateAll();

            // Recalculate intelligence for all active candidates
            await IntelligenceEngine.recalculateAll();

            // Recalculate final scores for all candidates
            const candidates = await pool.query('SELECT id, party_id FROM candidates WHERE is_active = true');
            const partyIds = new Set();
            for (const c of candidates.rows) {
                await RankingEngine.recalculateCandidate(c.id);
                partyIds.add(c.party_id);
            }

            // Recalculate party scores
            for (const pid of partyIds) {
                await RankingEngine.recalculatePartyScore(pid);
            }

            console.log(`[ENGINE] Recalculated ${candidates.rows.length} candidates, ${partyIds.size} parties`);

            // Broadcast that rankings were updated
            broadcast({
                type: 'ranking_updated',
                data: { timestamp: Date.now(), candidates_updated: candidates.rows.length }
            });
        } catch (err) {
            console.error('[ENGINE] Recalculation error:', err.message);
        }
    }, 5 * 60 * 1000); // 5 minutes

    return { wss, broadcast, getClientCount: () => clients.size };
}

module.exports = setupWebSocket;
