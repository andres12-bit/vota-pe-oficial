'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { EncuestaPoll, getEncuestas } from '@/lib/api';

interface Props {
    onNavigateEncuesta?: () => void;
}

interface VoteEvent {
    name: string;
    position: string;
    region: string;
    time: string;
    timestamp: number;
}

const POSITION_LABELS: Record<string, string> = {
    president: 'Presidente', senator: 'Senadores', deputy: 'Diputados', andean: 'Parlamento Andino',
};
const POSITION_COLORS: Record<string, string> = {
    president: '#c62828', senator: '#1565c0', deputy: '#2e7d32', andean: '#6a1b9a',
};
const POSITION_GRADIENTS: Record<string, string> = {
    president: 'linear-gradient(90deg, #c62828, #ef5350)',
    senator: 'linear-gradient(90deg, #1565c0, #42a5f5)',
    deputy: 'linear-gradient(90deg, #2e7d32, #66bb6a)',
    andean: 'linear-gradient(90deg, #6a1b9a, #ab47bc)',
};

const REGIONS = [
    'Lima', 'Arequipa', 'Cusco', 'Piura', 'La Libertad', 'Junín',
    'Lambayeque', 'Tacna', 'Puno', 'Ica', 'Huancavelica', 'Cajamarca',
    'Loreto', 'Ucayali', 'San Martín', 'Tumbes', 'Moquegua', 'Ayacucho',
    'Áncash', 'Huánuco', 'Madre de Dios', 'Pasco', 'Apurímac', 'Callao', 'Amazonas',
];
const POSITIONS = ['president', 'senator', 'deputy', 'andean'];

function timeAgo(ms: number): string {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    return `hace ${Math.floor(seconds / 60)}m`;
}

function PeruMapSVG() {
    return (
        <svg viewBox="0 0 300 400" className="cascada-peru-map" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="peruHeatRadial" cx="45%" cy="45%" r="60%">
                    <stop offset="0%" stopColor="#c62828" stopOpacity="0.7" />
                    <stop offset="30%" stopColor="#e53935" stopOpacity="0.5" />
                    <stop offset="55%" stopColor="#ff6d00" stopOpacity="0.4" />
                    <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="sparkleGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <path d="M130,20 L110,25 L95,40 L80,45 L65,55 L55,70 L45,90 L40,110 L35,130 L30,145 L25,165 L30,185 L40,200 L45,215 L50,235 L55,250 L65,265 L75,280 L85,295 L95,310 L110,325 L125,335 L140,340 L155,345 L170,340 L185,330 L195,315 L205,295 L210,275 L215,255 L220,235 L225,215 L230,195 L225,175 L215,155 L205,140 L195,125 L185,110 L175,95 L165,80 L155,65 L145,50 L138,35 Z" fill="url(#peruHeatRadial)" stroke="rgba(198,40,40,0.25)" strokeWidth="1.5" filter="url(#glow)" />
            {/* Heat hotspots */}
            <circle cx="120" cy="180" r="14" fill="#c62828" opacity="0.35"><animate attributeName="opacity" values="0.2;0.45;0.2" dur="2.5s" repeatCount="indefinite" /></circle>
            <circle cx="150" cy="130" r="10" fill="#e53935" opacity="0.3"><animate attributeName="opacity" values="0.15;0.4;0.15" dur="3s" repeatCount="indefinite" /></circle>
            <circle cx="100" cy="240" r="8" fill="#ff6d00" opacity="0.3"><animate attributeName="opacity" values="0.15;0.35;0.15" dur="3.5s" repeatCount="indefinite" /></circle>
            <circle cx="170" cy="280" r="7" fill="#f59e0b" opacity="0.25"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.8s" repeatCount="indefinite" /></circle>
            {/* Sparkle dots */}
            <circle cx="135" cy="160" r="2" fill="#fff" opacity="0.7" filter="url(#sparkleGlow)"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.8s" repeatCount="indefinite" /></circle>
            <circle cx="110" cy="200" r="1.5" fill="#fff" opacity="0.6" filter="url(#sparkleGlow)"><animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.2s" repeatCount="indefinite" /></circle>
            <circle cx="155" cy="250" r="1.5" fill="#fff" opacity="0.5" filter="url(#sparkleGlow)"><animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" /></circle>
            <circle cx="90" cy="170" r="1" fill="#fff" opacity="0.5" filter="url(#sparkleGlow)"><animate attributeName="opacity" values="0.1;0.6;0.1" dur="3s" repeatCount="indefinite" /></circle>
            <circle cx="170" cy="310" r="1" fill="#fff" opacity="0.4" filter="url(#sparkleGlow)"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" /></circle>
        </svg>
    );
}

export default function CascadaConsenso({ onNavigateEncuesta }: Props) {
    const [votes, setVotes] = useState<VoteEvent[]>([]);
    const [polls, setPolls] = useState<EncuestaPoll[]>([]);
    const [expandedPoll, setExpandedPoll] = useState<number | null>(null);
    const { lastMessage } = useWebSocket();

    useEffect(() => { getEncuestas().then(setPolls).catch(() => { }); }, []);

    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'vote_registered') return;
        const data = lastMessage.data as { position?: string; region?: string };
        const region = data.region || REGIONS[Math.floor(Math.random() * REGIONS.length)];
        setVotes(prev => [{ name: `Usuario ${region}`, position: data.position || POSITIONS[Math.floor(Math.random() * POSITIONS.length)], region, time: 'ahora', timestamp: Date.now() }, ...prev].slice(0, 30));
    }, [lastMessage]);

    useEffect(() => {
        const timer = setInterval(() => { setVotes(prev => prev.map(v => ({ ...v, time: timeAgo(v.timestamp) }))); }, 5000);
        return () => clearInterval(timer);
    }, []);

    const stats = useMemo(() => {
        const posCount: Record<string, number> = { president: 0, senator: 0, deputy: 0, andean: 0 };
        votes.forEach(v => { posCount[v.position] = (posCount[v.position] || 0) + 1; });
        return { posCount, total: votes.length, lastMinute: votes.filter(v => (Date.now() - v.timestamp) < 60000).length, regions: new Set(votes.map(v => v.name.replace('Usuario ', ''))).size };
    }, [votes]);

    const encuestaAnalytics = useMemo(() => {
        if (!polls.length) return null;
        const active = polls.filter(p => p.is_active);
        const totalVotes = polls.reduce((s, p) => s + (p.total_votes || 0), 0);
        const filtered = [...polls].filter(p => !p.question.includes('tema más importante'));
        const sorted = filtered.sort((a, b) => {
            const aP = a.category === 'Presidencia' ? 1 : 0; const bP = b.category === 'Presidencia' ? 1 : 0;
            if (aP !== bP) return bP - aP;
            return (b.total_votes || 0) - (a.total_votes || 0);
        });
        return { active: active.length, total: polls.length, totalVotes, sortedPolls: sorted };
    }, [polls]);

    const BAR_COLORS = ['#c62828', '#1565c0', '#2e7d32', '#f59e0b', '#7c3aed', '#d97706'];
    const maxPosVotes = Math.max(1, ...Object.values(stats.posCount));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* ===== ACTIVIDAD EN VIVO ===== */}
            <div className="panel-glow module-card cascada-panel" style={{ marginBottom: 0, position: 'relative', overflow: 'hidden' }}>
                <div className="cascada-map-bg"><PeruMapSVG /></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="cascada-header">
                        <div><h3 className="cascada-title">ACTIVIDAD <span style={{ color: 'var(--vp-red)' }}>EN VIVO</span></h3></div>
                        <div className="cascada-active-badge"><div className="cascada-active-dot" /><span>{Math.max(18, stats.regions)} ▸</span></div>
                    </div>
                    <div className="cascada-subtitle"><h4>CASCADA DE CONSENSO</h4><p>Índice Medición de actualidad electoral</p></div>
                    <div className="cascada-positions">
                        {POSITIONS.map(pos => {
                            const count = stats.posCount[pos] || 0;
                            const pct = maxPosVotes > 0 ? (count / maxPosVotes) * 100 : 0;
                            return (
                                <div key={pos} className="cascada-pos-row">
                                    <span className="cascada-pos-label">{POSITION_LABELS[pos]}</span>
                                    <span className="cascada-pos-count" style={{ color: POSITION_COLORS[pos] }}>{count}</span>
                                    <div className="cascada-pos-bar-track"><div className="cascada-pos-bar-fill" style={{ width: `${pct}%`, background: POSITION_GRADIENTS[pos] }} /></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ===== ENCUESTAS CIUDADANAS ===== */}
            <div className="panel-glow module-card encuestas-panel" style={{ marginBottom: 0 }}>
                <div className="encuestas-header">
                    <div className="flex items-center gap-2">
                        <span className="encuestas-icon">🗳️</span>
                        <h3 className="encuestas-title">ENCUESTAS <span style={{ color: '#d97706' }}>CIUDADANAS</span></h3>
                    </div>
                    {encuestaAnalytics && (
                        <div className="encuestas-dots">
                            {encuestaAnalytics.sortedPolls.slice(0, 4).map((_, i) => (
                                <div key={i} className="encuestas-dot" style={{ background: i === 0 ? '#1565c0' : 'rgba(255,255,255,0.2)' }} />
                            ))}
                        </div>
                    )}
                </div>
                {encuestaAnalytics ? (
                    <div className="encuestas-list">
                        {encuestaAnalytics.sortedPolls.map((poll, i) => {
                            const isExpanded = expandedPoll === poll.id;
                            const topOption = poll.options.reduce((best, opt, idx) => { const count = poll.vote_counts?.[idx] || 0; return count > best.count ? { name: opt, count, idx } : best; }, { name: '', count: 0, idx: 0 });
                            const topPct = poll.total_votes > 0 ? ((topOption.count / poll.total_votes) * 100).toFixed(0) : '0';
                            return (
                                <div key={poll.id} className="encuesta-card" onClick={() => setExpandedPoll(isExpanded ? null : poll.id)}>
                                    <div className="encuesta-question"><span className="encuesta-emoji">{poll.emoji || '📊'}</span><span>{poll.question}</span></div>
                                    <div className="encuesta-result">
                                        <span className="encuesta-votes">{poll.total_votes.toLocaleString()} votes</span>
                                        <div className="encuesta-bar-track"><div className="encuesta-bar-fill" style={{ width: `${topPct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} /></div>
                                        <span className="encuesta-pct">{topPct}%</span>
                                    </div>
                                    {isExpanded && (
                                        <div className="encuesta-expanded">
                                            {poll.options.map((opt, idx) => {
                                                const count = poll.vote_counts?.[idx] || 0; const pct = poll.total_votes > 0 ? (count / poll.total_votes) * 100 : 0; const isWinner = idx === topOption.idx;
                                                return (
                                                    <div key={idx} className="encuesta-option">
                                                        <div className="encuesta-option-header">
                                                            <span className={isWinner ? 'encuesta-option-winner' : ''}>{isWinner && '👑 '}{opt}</span>
                                                            <span style={{ color: isWinner ? BAR_COLORS[idx % BAR_COLORS.length] : 'var(--vp-text-dim)' }}>{pct.toFixed(1)}% ({count.toLocaleString()})</span>
                                                        </div>
                                                        <div className="encuesta-option-bar-track"><div className="encuesta-option-bar-fill" style={{ width: `${pct}%`, background: isWinner ? `linear-gradient(90deg, ${BAR_COLORS[idx % BAR_COLORS.length]}, ${BAR_COLORS[idx % BAR_COLORS.length]}88)` : 'rgba(255,255,255,0.08)' }} /></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 10, color: 'var(--vp-text-dim)' }}>Cargando encuestas...</div>
                )}
                <button onClick={onNavigateEncuesta} className="encuestas-cta">→ Participar en encuestas →</button>
            </div>
        </div>
    );
}
