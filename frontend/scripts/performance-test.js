#!/usr/bin/env node
/**
 * PulsoElectoral.pe — Performance & WebSocket Test Suite
 * ══════════════════════════════════════════════════════
 * Tests page load times, API response, and WebSocket connectivity.
 * 
 * Usage: node scripts/performance-test.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const SITE_URL = 'https://pulsoelectoral.pe';
const API_BASE = 'https://pulsoelectoral.pe/api';
const WS_URL = 'wss://pulsoelectoral.pe/ws';

// ─── Utility ─────────────────────────────────────────
function color(code, text) {
    return `\x1b[${code}m${text}\x1b[0m`;
}
const green = (t) => color('32', t);
const red = (t) => color('31', t);
const yellow = (t) => color('33', t);
const cyan = (t) => color('36', t);
const bold = (t) => color('1', t);
const dim = (t) => color('2', t);

function formatMs(ms) {
    if (ms < 100) return green(`${ms}ms`);
    if (ms < 500) return yellow(`${ms}ms`);
    return red(`${ms}ms`);
}

// ─── HTTP Request Helper ─────────────────────────────
function fetchUrl(urlStr) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const parsed = new URL(urlStr);
        const client = parsed.protocol === 'https:' ? https : http;
        
        const req = client.get(urlStr, { timeout: 15000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    time: Date.now() - start,
                    size: Buffer.byteLength(data),
                    headers: res.headers,
                });
            });
        });
        
        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// ─── WebSocket Test ──────────────────────────────────
function testWebSocket(url, timeout = 8000) {
    return new Promise((resolve) => {
        try {
            // Dynamic import for ws if available, otherwise skip
            let WebSocket;
            try {
                WebSocket = require('ws');
            } catch {
                resolve({ connected: false, error: 'ws module not installed (npm i ws)', time: 0 });
                return;
            }

            const start = Date.now();
            const ws = new WebSocket(url);
            let firstMessageTime = null;
            let messageCount = 0;
            let messages = [];

            const timer = setTimeout(() => {
                ws.close();
                resolve({
                    connected: true,
                    connectTime: firstMessageTime || Date.now() - start,
                    messageCount,
                    messages: messages.slice(0, 3),
                    time: Date.now() - start,
                });
            }, timeout);

            ws.on('open', () => {
                const connectTime = Date.now() - start;
                console.log(`   ${green('✓')} WebSocket connected in ${formatMs(connectTime)}`);
            });

            ws.on('message', (data) => {
                messageCount++;
                if (!firstMessageTime) firstMessageTime = Date.now() - start;
                try {
                    const parsed = JSON.parse(data.toString());
                    messages.push(parsed);
                    if (messageCount <= 3) {
                        console.log(`   ${cyan('→')} Message #${messageCount}: ${dim(parsed.type || 'unknown')} (${formatMs(Date.now() - start)})`);
                    }
                } catch {
                    messages.push({ raw: data.toString().substring(0, 100) });
                }
            });

            ws.on('error', (err) => {
                clearTimeout(timer);
                resolve({ connected: false, error: err.message, time: Date.now() - start });
            });

            ws.on('close', () => {
                clearTimeout(timer);
                resolve({
                    connected: messageCount > 0 || firstMessageTime !== null,
                    connectTime: firstMessageTime || Date.now() - start,
                    messageCount,
                    messages: messages.slice(0, 3),
                    time: Date.now() - start,
                });
            });
        } catch (err) {
            resolve({ connected: false, error: err.message, time: 0 });
        }
    });
}

// ─── Main Test Suite ─────────────────────────────────
async function runTests() {
    console.log('');
    console.log(bold('══════════════════════════════════════════════════════'));
    console.log(bold('  PulsoElectoral.pe — Performance & WebSocket Test'));
    console.log(bold('══════════════════════════════════════════════════════'));
    console.log('');

    const results = [];

    // ── 1. Page Load Tests ───────────────────────────
    console.log(bold('📊 1. PAGE LOAD TESTS'));
    console.log(dim('   Testing response times for key pages...'));
    console.log('');

    const pages = [
        { name: 'Homepage', url: `${SITE_URL}/` },
        { name: 'Search Page', url: `${SITE_URL}/search` },
        { name: 'Radar Electoral', url: `${SITE_URL}/radar` },
        { name: 'Legal Page', url: `${SITE_URL}/legal` },
    ];

    for (const page of pages) {
        try {
            const result = await fetchUrl(page.url);
            const sizeKB = (result.size / 1024).toFixed(1);
            const status = result.status === 200 ? green('200') : red(String(result.status));
            console.log(`   ${status} ${page.name.padEnd(20)} ${formatMs(result.time).padEnd(16)} ${dim(sizeKB + ' KB')}`);
            results.push({ test: page.name, time: result.time, status: result.status, pass: result.status === 200 && result.time < 5000 });
        } catch (err) {
            console.log(`   ${red('✗')} ${page.name.padEnd(20)} ${red(err.message)}`);
            results.push({ test: page.name, time: 0, pass: false });
        }
    }

    // ── 2. API Endpoint Tests ────────────────────────
    console.log('');
    console.log(bold('🔌 2. API ENDPOINT TESTS'));
    console.log(dim('   Testing backend API response times...'));
    console.log('');

    const apiEndpoints = [
        { name: 'Candidates List', url: `${API_BASE}/candidates` },
        { name: 'Stats', url: `${API_BASE}/stats` },
        { name: 'Parties', url: `${API_BASE}/parties` },
    ];

    for (const endpoint of apiEndpoints) {
        try {
            const result = await fetchUrl(endpoint.url);
            const sizeKB = (result.size / 1024).toFixed(1);
            const status = result.status < 400 ? green(String(result.status)) : red(String(result.status));
            console.log(`   ${status} ${endpoint.name.padEnd(20)} ${formatMs(result.time).padEnd(16)} ${dim(sizeKB + ' KB')}`);
            results.push({ test: `API: ${endpoint.name}`, time: result.time, status: result.status, pass: result.status < 400 && result.time < 3000 });
        } catch (err) {
            console.log(`   ${red('✗')} ${endpoint.name.padEnd(20)} ${red(err.message)}`);
            results.push({ test: `API: ${endpoint.name}`, time: 0, pass: false });
        }
    }

    // ── 3. WebSocket Connectivity ────────────────────
    console.log('');
    console.log(bold('⚡ 3. WEBSOCKET REAL-TIME TEST'));
    console.log(dim(`   Connecting to ${WS_URL}...`));
    console.log('');

    const wsResult = await testWebSocket(WS_URL, 6000);

    if (wsResult.error) {
        console.log(`   ${red('✗')} WebSocket: ${red(wsResult.error)}`);
        results.push({ test: 'WebSocket', time: 0, pass: false });
    } else if (wsResult.connected) {
        console.log(`   ${green('✓')} Connection established`);
        console.log(`   ${cyan('→')} Messages received: ${bold(String(wsResult.messageCount))}`);
        console.log(`   ${cyan('→')} First message at: ${formatMs(wsResult.connectTime)}`);
        console.log(`   ${cyan('→')} Total test time: ${formatMs(wsResult.time)}`);
        results.push({ test: 'WebSocket', time: wsResult.connectTime, pass: true });
    } else {
        console.log(`   ${yellow('⚠')} WebSocket connected but no messages received in ${wsResult.time}ms`);
        results.push({ test: 'WebSocket', time: wsResult.time, pass: false });
    }

    // ── 4. Concurrent Load Test ──────────────────────
    console.log('');
    console.log(bold('🚀 4. CONCURRENT LOAD TEST'));
    console.log(dim('   Simulating 10 simultaneous requests...'));
    console.log('');

    const concurrentStart = Date.now();
    const concurrentRequests = Array(10).fill(null).map(() => fetchUrl(`${SITE_URL}/`));
    
    try {
        const concurrentResults = await Promise.all(concurrentRequests);
        const concurrentTime = Date.now() - concurrentStart;
        const avgTime = Math.round(concurrentResults.reduce((sum, r) => sum + r.time, 0) / concurrentResults.length);
        const maxTime = Math.max(...concurrentResults.map(r => r.time));
        const minTime = Math.min(...concurrentResults.map(r => r.time));
        const allOk = concurrentResults.every(r => r.status === 200);

        console.log(`   ${allOk ? green('✓') : red('✗')} All 10 requests completed in ${formatMs(concurrentTime)}`);
        console.log(`   ${cyan('→')} Average: ${formatMs(avgTime)}  |  Min: ${formatMs(minTime)}  |  Max: ${formatMs(maxTime)}`);
        results.push({ test: 'Concurrent (10x)', time: avgTime, pass: allOk && avgTime < 3000 });
    } catch (err) {
        console.log(`   ${red('✗')} Concurrent test failed: ${err.message}`);
        results.push({ test: 'Concurrent (10x)', time: 0, pass: false });
    }

    // ── Summary ──────────────────────────────────────
    console.log('');
    console.log(bold('══════════════════════════════════════════════════════'));
    console.log(bold('  SUMMARY'));
    console.log(bold('══════════════════════════════════════════════════════'));
    console.log('');

    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    const avgTotal = Math.round(results.filter(r => r.time > 0).reduce((s, r) => s + r.time, 0) / results.filter(r => r.time > 0).length);

    for (const r of results) {
        const icon = r.pass ? green('✓') : red('✗');
        const time = r.time > 0 ? formatMs(r.time) : dim('N/A');
        console.log(`   ${icon} ${r.test.padEnd(25)} ${time}`);
    }

    console.log('');
    console.log(`   ${bold('Results:')} ${passed}/${total} passed`);
    console.log(`   ${bold('Avg response:')} ${formatMs(avgTotal)}`);

    if (passed === total) {
        console.log(`\n   ${green('🎉 ALL TESTS PASSED — Site is performing well!')}\n`);
    } else {
        console.log(`\n   ${yellow('⚠ Some tests need attention')}\n`);
    }

    console.log(bold('══════════════════════════════════════════════════════'));
    console.log('');
}

runTests().catch(console.error);
