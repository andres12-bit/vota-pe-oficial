'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
    president: 'Presidente', senator: 'Senador', deputy: 'Diputado', andean: 'P. Andino',
};
const POSITION_COLORS: Record<string, string> = {
    president: '#c62828', senator: '#1565c0', deputy: '#2e7d32', andean: '#6a1b9a',
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch encuesta data
    useEffect(() => {
        getEncuestas().then(setPolls).catch(() => { });
    }, []);

    // Listen for real vote events from WebSocket
    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'vote_registered') return;
        const data = lastMessage.data as { position?: string; region?: string };
        const region = data.region || REGIONS[Math.floor(Math.random() * REGIONS.length)];
        setVotes(prev => [{
            name: `Usuario ${region}`,
            position: data.position || POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
            region, time: 'ahora', timestamp: Date.now(),
        }, ...prev].slice(0, 30));
    }, [lastMessage]);

    // Simulate periodic votes
    useEffect(() => {
        const initial: VoteEvent[] = [];
        for (let i = 0; i < 12; i++) {
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
            initial.push({
                name: `Usuario ${region}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region, time: `hace ${(i + 1) * 4}s`, timestamp: Date.now() - (i + 1) * 4000,
            });
        }
        setVotes(initial);
        intervalRef.current = setInterval(() => {
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
            setVotes(prev => [{
                name: `Usuario ${region}`,
                position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
                region, time: 'ahora', timestamp: Date.now(),
            }, ...prev].slice(0, 30));
        }, 5000 + Math.random() * 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    // Update relative times
    useEffect(() => {
        const timer = setInterval(() => {
            setVotes(prev => prev.map(v => ({ ...v, time: timeAgo(v.timestamp) })));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Compute stats
    const stats = useMemo(() => {
        const posCount: Record<string, number> = { president: 0, senator: 0, deputy: 0, andean: 0 };
        votes.forEach(v => { posCount[v.position] = (posCount[v.position] || 0) + 1; });
        return {
            posCount, total: votes.length,
            lastMinute: votes.filter(v => (Date.now() - v.timestamp) < 60000).length,
            regions: new Set(votes.map(v => v.name.replace('Usuario ', ''))).size,
        };
    }, [votes]);

    // Encuesta analytics
    const encuestaAnalytics = useMemo(() => {
        if (!polls.length) return null;
        const active = polls.filter(p => p.is_active);
        const totalVotes = polls.reduce((s, p) => s + (p.total_votes || 0), 0);
        // Sort: presidential poll first, then by votes
        const filtered = [...polls].filter(p => !p.question.includes('tema más importante'));
        const sorted = filtered.sort((a, b) => {
            const aIsPres = a.category === 'Presidencia' ? 1 : 0;
            const bIsPres = b.category === 'Presidencia' ? 1 : 0;
            if (aIsPres !== bIsPres) return bIsPres - aIsPres;
            return (b.total_votes || 0) - (a.total_votes || 0);
        });
        return { active: active.length, total: polls.length, totalVotes, sortedPolls: sorted };
    }, [polls]);

    const BAR_COLORS = ['#c62828', '#1565c0', '#2e7d32', '#f59e0b', '#7c3aed', '#d97706'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* ===== CASCADA DE CONSENSO (compact) ===== */}
            <div className="panel-glow module-card" style={{ marginBottom: 0 }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #1565c0, #42a5f5)', boxShadow: '0 4px 12px rgba(21,101,192,0.3)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-3h2v3z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xs font-black tracking-wide" style={{ color: 'var(--vp-text)' }}>
                                CASCADA DE <span style={{ color: '#1565c0' }}>CONSENSO</span>
                            </h3>
                            <p className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>Participación en tiempo real</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                        <span className="text-[8px] font-bold" style={{ color: '#16a34a' }}>LIVE</span>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { value: stats.total, label: 'Votos', color: 'var(--vp-text)' },
                        { value: stats.lastMinute, label: 'Últ. minuto', color: '#16a34a' },
                        { value: stats.regions, label: 'Regiones', color: '#1565c0' },
                    ].map((kpi, i) => (
                        <div key={i} className="text-center rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div className="text-base font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                            <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {/* Position breakdown - compact */}
                <div className="flex flex-col gap-1.5">
                    {POSITIONS.map(pos => {
                        const count = stats.posCount[pos] || 0;
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                            <div key={pos} className="flex items-center gap-2 text-[10px]">
                                <span className="font-bold w-16 truncate" style={{ color: POSITION_COLORS[pos] }}>{POSITION_LABELS[pos]}</span>
                                <span className="text-[9px] font-bold w-4 text-right" style={{ color: 'var(--vp-text-dim)' }}>{count}</span>
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: POSITION_COLORS[pos] }} />
                                </div>
                                <span className="text-[9px] font-bold w-7 text-right" style={{ color: 'var(--vp-text-dim)' }}>{pct.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>

                {/* Activity feed - 3 items */}
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="flex flex-col gap-1">
                        {votes.slice(0, 3).map((vote, i) => (
                            <div key={`${vote.timestamp}-${i}`} className="flex items-center justify-between text-[9px] py-0.5 animate-fade-in">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: POSITION_COLORS[vote.position] || '#999' }} />
                                    <span className="font-semibold" style={{ color: 'var(--vp-text)' }}>{vote.name}</span>
                                    <span style={{ color: POSITION_COLORS[vote.position], fontWeight: 600 }}>{POSITION_LABELS[vote.position]}</span>
                                </div>
                                <span className="font-bold" style={{ color: 'var(--vp-text-dim)' }}>{vote.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== ENCUESTAS CIUDADANAS (expandable polls) ===== */}
            <div className="panel-glow module-card" style={{ marginBottom: 0 }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                            <span className="text-sm">🗳️</span>
                        </div>
                        <div>
                            <h3 className="text-xs font-black tracking-wide" style={{ color: 'var(--vp-text)' }}>
                                ENCUESTAS <span style={{ color: '#d97706' }}>CIUDADANAS</span>
                            </h3>
                            <p className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>Toca para ver detalle</p>
                        </div>
                    </div>
                </div>

                {encuestaAnalytics ? (
                    <>
                        {/* KPI row */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center rounded-lg p-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
                                <div className="text-base font-black" style={{ color: '#d97706' }}>{encuestaAnalytics.active}</div>
                                <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>Activas</div>
                            </div>
                            <div className="text-center rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                <div className="text-base font-black" style={{ color: 'var(--vp-text)' }}>{encuestaAnalytics.totalVotes.toLocaleString()}</div>
                                <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>Total votos</div>
                            </div>
                            <div className="text-center rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                <div className="text-base font-black" style={{ color: '#1565c0' }}>
                                    {encuestaAnalytics.totalVotes > 0 ? Math.round(encuestaAnalytics.totalVotes / encuestaAnalytics.total).toLocaleString() : 0}
                                </div>
                                <div className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>Prom/encuesta</div>
                            </div>
                        </div>

                        {/* Poll cards - expandable */}
                        <div className="flex flex-col gap-2">
                            {encuestaAnalytics.sortedPolls.map((poll, i) => {
                                const isExpanded = expandedPoll === poll.id;
                                const topOption = poll.options.reduce((best, opt, idx) => {
                                    const count = poll.vote_counts?.[idx] || 0;
                                    return count > best.count ? { name: opt, count, idx } : best;
                                }, { name: '', count: 0, idx: 0 });
                                const topPct = poll.total_votes > 0 ? ((topOption.count / poll.total_votes) * 100).toFixed(0) : '0';
                                const isPres = poll.category === 'Presidencia';

                                return (
                                    <div key={poll.id}>
                                        {/* Collapsed card */}
                                        <div
                                            onClick={() => setExpandedPoll(isExpanded ? null : poll.id)}
                                            className="rounded-xl p-2.5 transition-all"
                                            style={{
                                                background: isPres ? 'rgba(198,40,40,0.04)' : 'rgba(0,0,0,0.015)',
                                                border: `1px solid ${isPres ? 'rgba(198,40,40,0.12)' : 'rgba(0,0,0,0.04)'}`,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm shrink-0">{poll.emoji || '📊'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] font-bold" style={{ color: 'var(--vp-text)' }}>
                                                        {poll.question}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-semibold" style={{ color: 'var(--vp-text-dim)' }}>
                                                            {poll.total_votes.toLocaleString()} votos
                                                        </span>
                                                        {isPres && (
                                                            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded"
                                                                style={{ background: 'rgba(198,40,40,0.08)', color: '#c62828' }}>
                                                                🔥 DESTACADA
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Mini winner bar - always show */}
                                                    {!isExpanded && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                                                <div className="h-full rounded-full" style={{
                                                                    width: `${topPct}%`,
                                                                    background: isPres ? 'linear-gradient(90deg, #c62828, #ef5350)' : BAR_COLORS[i % BAR_COLORS.length],
                                                                    transition: 'width 0.5s ease',
                                                                }} />
                                                            </div>
                                                            <span className="text-[9px] font-black shrink-0" style={{ color: 'var(--vp-text)' }}>{topPct}%</span>
                                                        </div>
                                                    )}
                                                    {!isExpanded && (
                                                        <div className="text-[8px] font-semibold mt-0.5 truncate" style={{ color: 'var(--vp-text-dim)' }}>
                                                            👆 {topOption.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] shrink-0 mt-0.5 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', color: 'var(--vp-text-dim)' }}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="rounded-b-xl px-3 pb-3 pt-1 animate-fade-in"
                                                style={{ background: isPres ? 'rgba(198,40,40,0.02)' : 'rgba(0,0,0,0.01)', borderLeft: `1px solid ${isPres ? 'rgba(198,40,40,0.12)' : 'rgba(0,0,0,0.04)'}`, borderRight: `1px solid ${isPres ? 'rgba(198,40,40,0.12)' : 'rgba(0,0,0,0.04)'}`, borderBottom: `1px solid ${isPres ? 'rgba(198,40,40,0.12)' : 'rgba(0,0,0,0.04)'}` }}>
                                                <div className="flex flex-col gap-1.5">
                                                    {poll.options.map((opt, idx) => {
                                                        const count = poll.vote_counts?.[idx] || 0;
                                                        const pct = poll.total_votes > 0 ? (count / poll.total_votes) * 100 : 0;
                                                        const isWinner = idx === topOption.idx;
                                                        return (
                                                            <div key={idx}>
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className="text-[9px] font-semibold truncate" style={{ color: isWinner ? 'var(--vp-text)' : 'var(--vp-text-dim)', maxWidth: '60%' }}>
                                                                        {isWinner && '👑 '}{opt}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold" style={{ color: isWinner ? BAR_COLORS[idx % BAR_COLORS.length] : 'var(--vp-text-dim)' }}>
                                                                        {pct.toFixed(1)}% <span style={{ fontWeight: 400, fontSize: '8px' }}>({count.toLocaleString()})</span>
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                                    <div className="h-full rounded-full transition-all duration-500" style={{
                                                                        width: `${pct}%`,
                                                                        background: isWinner
                                                                            ? `linear-gradient(90deg, ${BAR_COLORS[idx % BAR_COLORS.length]}, ${BAR_COLORS[idx % BAR_COLORS.length]}88)`
                                                                            : 'rgba(0,0,0,0.1)',
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="text-[7px] font-bold text-right mt-1.5" style={{ color: 'var(--vp-text-dim)' }}>
                                                    {poll.options.length} opciones · {poll.total_votes.toLocaleString()} votos totales
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA button to ENCUESTA tab */}
                        <button
                            onClick={onNavigateEncuesta}
                            className="w-full mt-3 py-2.5 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.02]"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
                            }}
                        >
                            🗳️ Participar en encuestas →
                        </button>
                    </>
                ) : (
                    <div className="text-center py-4 text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                        Cargando encuestas...
                    </div>
                )}
            </div>
        </div>
    );
}
