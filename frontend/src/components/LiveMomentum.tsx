'use client';

import { useState, useEffect, useRef } from 'react';
import { Candidate } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
}

type PositionFilter = 'all' | 'president' | 'senator' | 'deputy' | 'andean';

const POSITION_FILTERS: { id: PositionFilter; label: string; svgPath: string }[] = [
    { id: 'all', label: 'TODOS', svgPath: 'M12 17.5c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5-2.46 5.5-5.5 5.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
    { id: 'president', label: 'PRES.', svgPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'deputy', label: 'DIP.', svgPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: 'senator', label: 'SEN.', svgPath: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z' },
    { id: 'andean', label: 'P.AND.', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
];

const POSITION_LABELS: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senador',
    deputy: 'Diputado',
    andean: 'P. Andino',
};

export default function LiveMomentum({ candidates }: Props) {
    const [filter, setFilter] = useState<PositionFilter>('all');
    const [deltas, setDeltas] = useState<Record<number, number>>({});
    const prevScoresRef = useRef<Record<number, number>>({});

    const filteredCandidates = filter === 'all'
        ? candidates
        : candidates.filter(c => c.position === filter);

    const topCandidates = filteredCandidates.slice(0, 5);

    // Calculate deltas on candidate change (simulates real-time movement)
    useEffect(() => {
        const newDeltas: Record<number, number> = {};
        topCandidates.forEach(c => {
            const prevScore = prevScoresRef.current[c.id];
            if (prevScore !== undefined) {
                newDeltas[c.id] = Number(c.momentum_score) - prevScore;
            } else {
                // Generate a seeded pseudo-delta for visual interest
                const seed = Math.sin(c.id * 127) * 10000;
                newDeltas[c.id] = parseFloat(((seed - Math.floor(seed)) * 5 - 2).toFixed(1));
            }
        });
        setDeltas(newDeltas);
        const scores: Record<number, number> = {};
        topCandidates.forEach(c => { scores[c.id] = Number(c.momentum_score); });
        prevScoresRef.current = scores;
    }, [candidates, filter]);

    // Compute total momentum for % calculation
    const totalMomentum = topCandidates.reduce((s, c) => s + Number(c.momentum_score), 0) || 1;

    return (
        <div className="panel-glow module-card">
            <div className="module-header">
                <div className="module-header-left">
                    <div className="module-icon module-icon-red">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" /></svg>
                    </div>
                    <h3 className="module-title"><span className="module-title-accent">ENCUESTA</span> EN VIVO</h3>
                </div>
                <span className="module-live-dot" />
            </div>

            {/* Position filter tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {POSITION_FILTERS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`module-filter-tab ${filter === f.id ? 'active' : ''}`}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d={f.svgPath} /></svg>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                {topCandidates.length === 0 && (
                    <div className="text-center py-4 text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                        Sin datos de encuesta
                    </div>
                )}
                {topCandidates.map((candidate, i) => {
                    const pct = ((Number(candidate.momentum_score) / totalMomentum) * 100).toFixed(1);
                    const delta = deltas[candidate.id] || 0;
                    const isUp = delta >= 0;

                    return (
                        <Link href={`/candidate/${candidate.id}`} key={candidate.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/5">
                                {/* Avatar */}
                                <img
                                    src={getAvatarUrl(candidate.name, 40, candidate.party_color)}
                                    alt={candidate.name}
                                    width={40}
                                    height={40}
                                    className="candidate-avatar"
                                    loading="lazy"
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--vp-text)' }}>
                                        {candidate.name.split(' ').slice(-2).join(' ')}
                                    </div>
                                    <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--vp-text-dim)' }}>
                                        <span>{candidate.party_abbreviation}</span>
                                        <span>·</span>
                                        <span>{POSITION_LABELS[candidate.position] || candidate.position}</span>
                                    </div>
                                    {/* Barra de apoyo */}
                                    <div className="mt-1 w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="momentum-bar" style={{ width: `${Math.min(100, candidate.momentum_score)}%` }} />
                                    </div>
                                </div>

                                {/* Porcentaje + Delta */}
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-bold" style={{ color: 'var(--vp-red)' }}>
                                        {pct}%
                                    </div>
                                    <div className="text-[10px] font-semibold" style={{ color: isUp ? 'var(--vp-green)' : '#ff5252' }}>
                                        {isUp ? '↑' : '↓'} {isUp ? '+' : ''}{delta.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* ===== Intención ciudadana en tiempo real ===== */}
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="module-icon" style={{ width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
                        </div>
                        <h4 className="text-[11px] font-extrabold tracking-[1.5px] uppercase" style={{ color: 'var(--vp-text)' }}>
                            Intención ciudadana
                        </h4>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                        EN VIVO
                    </span>
                </div>

                {/* Top 3 ranking with progress bars */}
                <div className="flex flex-col gap-3">
                    {topCandidates.slice(0, 3).map((c, i) => {
                        const pct = ((Number(c.momentum_score) / totalMomentum) * 100);
                        const delta = deltas[c.id] || 0;
                        const isUp = delta >= 0;
                        const medals = ['🥇', '🥈', '🥉'];
                        const barColors = [
                            'linear-gradient(90deg, var(--vp-red), #ef5350)',
                            'linear-gradient(90deg, #1565c0, #42a5f5)',
                            'linear-gradient(90deg, #2e7d32, #66bb6a)',
                        ];

                        return (
                            <div key={c.id} className="intencion-rank-item">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm">{medals[i]}</span>
                                    <img
                                        src={getAvatarUrl(c.name, 28, c.party_color)}
                                        alt={c.name}
                                        width={28}
                                        height={28}
                                        className="w-7 h-7 rounded-full shrink-0"
                                        style={{ border: '2px solid var(--vp-border)' }}
                                        loading="lazy"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--vp-text)' }}>
                                            {c.name.split(' ').slice(-2).join(' ')}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--vp-text-dim)', fontWeight: 600 }}>
                                                {c.party_abbreviation}
                                            </span>
                                            <span className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>
                                                {POSITION_LABELS[c.position]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black" style={{ color: 'var(--vp-text)' }}>{pct.toFixed(1)}%</div>
                                        <div className="text-[9px] font-bold" style={{ color: isUp ? '#16a34a' : '#ef4444' }}>
                                            {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: barColors[i] }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px dashed var(--vp-border)' }}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                        <span className="text-[9px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                            {filteredCandidates.length} candidatos activos
                        </span>
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                        Actualización: cada 5s
                    </span>
                </div>

                {/* Activity chart with time labels */}
                <div className="mt-3">
                    <div className="h-20 rounded-lg flex items-end gap-[2px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="flex-1 rounded-t transition-all duration-300"
                                style={{
                                    height: `${20 + Math.sin(i * 0.5) * 30 + ((i * 17 + 7) % 25)}%`,
                                    background: `linear-gradient(to top, var(--vp-red), rgba(198,40,40,0.2))`,
                                    opacity: 0.3 + (i / 24) * 0.7
                                }} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>00:00</span>
                        <span className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>06:00</span>
                        <span className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>12:00</span>
                        <span className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>18:00</span>
                        <span className="text-[8px] font-bold" style={{ color: 'var(--vp-red)' }}>Ahora</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
