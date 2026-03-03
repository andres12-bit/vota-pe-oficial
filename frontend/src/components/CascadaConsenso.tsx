'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useWebSocket } from '@/lib/websocket';

interface VoteEvent {
    name: string;
    position: string;
    region: string;
    time: string;
    timestamp: number;
}

const POSITION_ICONS: Record<string, string> = {
    president: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    senator: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
    deputy: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    andean: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

const POSITION_LABELS: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senador',
    deputy: 'Diputado',
    andean: 'P. Andino',
};

const POSITION_COLORS: Record<string, string> = {
    president: '#c62828',
    senator: '#1565c0',
    deputy: '#2e7d32',
    andean: '#6a1b9a',
};

const REGIONS = [
    'Lima', 'Arequipa', 'Cusco', 'Piura', 'La Libertad', 'Junín',
    'Lambayeque', 'Tacna', 'Puno', 'Ica', 'Huancavelica', 'Cajamarca',
    'Loreto', 'Ucayali', 'San Martín', 'Tumbes', 'Moquegua', 'Ayacucho',
    'Áncash', 'Huánuco', 'Madre de Dios', 'Pasco', 'Apurímac', 'Callao',
    'Amazonas',
];

const POSITIONS = ['president', 'senator', 'deputy', 'andean'];

function timeAgo(ms: number): string {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    return `hace ${Math.floor(seconds / 60)}m`;
}

export default function CascadaConsenso() {
    const [votes, setVotes] = useState<VoteEvent[]>([]);
    const { lastMessage } = useWebSocket();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for real vote events from WebSocket
    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'vote_registered') return;
        const data = lastMessage.data as { position?: string; region?: string };
        const region = data.region || REGIONS[Math.floor(Math.random() * REGIONS.length)];
        const newVote: VoteEvent = {
            name: `Usuario ${region}`,
            position: data.position || POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
            region,
            time: 'ahora',
            timestamp: Date.now(),
        };
        setVotes(prev => [newVote, ...prev].slice(0, 30));
    }, [lastMessage]);

    // Simulate periodic votes for demo
    useEffect(() => {
        const initial: VoteEvent[] = [];
        for (let i = 0; i < 12; i++) {
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
            initial.push({
                name: `Usuario ${region}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region,
                time: `hace ${(i + 1) * 4}s`,
                timestamp: Date.now() - (i + 1) * 4000,
            });
        }
        setVotes(initial);

        intervalRef.current = setInterval(() => {
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
            const simVote: VoteEvent = {
                name: `Usuario ${region}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region,
                time: 'ahora',
                timestamp: Date.now(),
            };
            setVotes(prev => [simVote, ...prev].slice(0, 30));
        }, 5000 + Math.random() * 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Update relative times every 5s
    useEffect(() => {
        const timer = setInterval(() => {
            setVotes(prev => prev.map(v => ({ ...v, time: timeAgo(v.timestamp) })));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Compute stats
    const stats = useMemo(() => {
        const posCount: Record<string, number> = { president: 0, senator: 0, deputy: 0, andean: 0 };
        const regionCount: Record<string, number> = {};
        votes.forEach(v => {
            posCount[v.position] = (posCount[v.position] || 0) + 1;
            const r = v.name.replace('Usuario ', '');
            regionCount[r] = (regionCount[r] || 0) + 1;
        });
        const topRegions = Object.entries(regionCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const maxRegionCount = topRegions.length > 0 ? topRegions[0][1] : 1;
        return { posCount, topRegions, maxRegionCount, total: votes.length };
    }, [votes]);

    return (
        <div className="panel-glow module-card">
            {/* === HEADER === */}
            <div className="module-header">
                <div className="module-header-left">
                    <div className="module-icon module-icon-blue">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-3h2v3z" /></svg>
                    </div>
                    <h3 className="module-title">CASCADA DE <span className="module-title-accent">CONSENSO</span></h3>
                </div>
                <span className="module-live-dot" />
            </div>

            {/* === STATS SUMMARY CARDS === */}
            <div className="cascada-stats-grid">
                <div className="cascada-stat-card">
                    <div className="cascada-stat-number">{stats.total}</div>
                    <div className="cascada-stat-label">Votos registrados</div>
                </div>
                <div className="cascada-stat-card">
                    <div className="cascada-stat-number" style={{ color: '#16a34a' }}>
                        {votes.filter(v => (Date.now() - v.timestamp) < 60000).length}
                    </div>
                    <div className="cascada-stat-label">Último minuto</div>
                </div>
                <div className="cascada-stat-card">
                    <div className="cascada-stat-number" style={{ color: '#1565c0' }}>
                        {new Set(votes.map(v => v.name.replace('Usuario ', ''))).size}
                    </div>
                    <div className="cascada-stat-label">Regiones activas</div>
                </div>
            </div>

            {/* === POSITION BREAKDOWN === */}
            <div className="cascada-section">
                <div className="cascada-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--vp-text-dim)' }}>
                        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
                    </svg>
                    Distribución por cargo
                </div>
                <div className="cascada-pos-bars">
                    {POSITIONS.map(pos => {
                        const count = stats.posCount[pos] || 0;
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={pos} className="cascada-pos-row">
                                <div className="cascada-pos-info">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill={POSITION_COLORS[pos]}>
                                        <path d={POSITION_ICONS[pos]} />
                                    </svg>
                                    <span className="cascada-pos-label">{POSITION_LABELS[pos]}</span>
                                    <span className="cascada-pos-count">{count}</span>
                                </div>
                                <div className="cascada-pos-bar-track">
                                    <div
                                        className="cascada-pos-bar-fill"
                                        style={{ width: `${pct}%`, background: POSITION_COLORS[pos] }}
                                    />
                                </div>
                                <span className="cascada-pos-pct">{pct.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* === RECENT ACTIVITY FEED (compact) === */}
            <div className="cascada-section">
                <div className="cascada-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--vp-text-dim)' }}>
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                    Actividad reciente
                </div>
                <div className="cascada-feed">
                    {votes.slice(0, 5).map((vote, i) => (
                        <div key={`${vote.timestamp}-${i}`} className="cascada-feed-item animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="cascada-feed-dot" style={{ background: POSITION_COLORS[vote.position] || '#999' }} />
                            <div className="cascada-feed-content">
                                <span className="cascada-feed-name">{vote.name}</span>
                                <span className="cascada-feed-pos">
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill={POSITION_COLORS[vote.position] || '#999'} style={{ opacity: 0.7 }}>
                                        <path d={POSITION_ICONS[vote.position] || ''} />
                                    </svg>
                                    {POSITION_LABELS[vote.position]}
                                </span>
                            </div>
                            <span className="cascada-feed-time">{vote.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* === TOP REGIONS === */}
            <div className="cascada-section">
                <div className="cascada-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--vp-text-dim)' }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Regiones más activas
                </div>
                <div className="cascada-regions">
                    {stats.topRegions.map(([region, count], i) => (
                        <div key={region} className="cascada-region-row">
                            <span className="cascada-region-rank">{i + 1}</span>
                            <span className="cascada-region-name">{region}</span>
                            <div className="cascada-region-bar-track">
                                <div
                                    className="cascada-region-bar-fill"
                                    style={{ width: `${(count / stats.maxRegionCount) * 100}%` }}
                                />
                            </div>
                            <span className="cascada-region-count">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* === LIVE INDICATOR === */}
            <div className="mt-3 pt-3 flex items-center justify-center gap-2" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--vp-red)' }} />
                <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>
                    TRANSMISIÓN EN VIVO
                </span>
            </div>
        </div>
    );
}
