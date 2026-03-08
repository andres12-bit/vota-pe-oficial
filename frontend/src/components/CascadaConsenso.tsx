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
            <div className="panel-glow module-card cascada-panel" style={{ marginBottom: 0 }}>
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
                                <div className="cascada-pos-bar-track"><div className="cascada-pos-bar-fill" style={{ width: `${Math.max(pct, 8)}%`, background: POSITION_GRADIENTS[pos] }} /></div>
                                <span className="cascada-pos-count" style={{ color: POSITION_COLORS[pos] }}>{count}</span>
                            </div>
                        );
                    })}
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
