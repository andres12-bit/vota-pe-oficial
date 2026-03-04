'use client';

import { useState, useEffect, useRef } from 'react';
import { Candidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
}

type PositionFilter = 'all' | 'president' | 'senator' | 'deputy' | 'andean';

const FILTERS: { id: PositionFilter; label: string; emoji: string }[] = [
    { id: 'all', label: 'Todos', emoji: '🌐' },
    { id: 'president', label: 'Pres.', emoji: '🏛️' },
    { id: 'senator', label: 'Sen.', emoji: '🏢' },
    { id: 'deputy', label: 'Dip.', emoji: '👥' },
    { id: 'andean', label: 'P.And.', emoji: '🌎' },
];

const POS_LABEL: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senador',
    deputy: 'Diputado',
    andean: 'P. Andino',
};

const SCORE_COLORS = {
    hv: '#6366f1',
    plan: '#3b82f6',
    intencion: '#f59e0b',
    integridad: '#10b981',
};

function ScoreRing({ value, size = 38, color, label }: { value: number; size?: number; color: string; label: string }) {
    const r = (size - 4) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(100, value) / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-0.5" title={`${label}: ${value.toFixed(1)}`}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
                    style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: size * 0.28, fontWeight: 900, fill: 'var(--vp-text)' }}>
                    {Math.round(value)}
                </text>
            </svg>
            <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>{label}</span>
        </div>
    );
}

export default function LiveMomentum({ candidates }: Props) {
    const [filter, setFilter] = useState<PositionFilter>('all');
    const [pulseIdx, setPulseIdx] = useState(0);
    const [showAll, setShowAll] = useState(false);

    // Pulse animation for "live" feel
    useEffect(() => {
        const timer = setInterval(() => setPulseIdx(p => (p + 1) % 5), 3000);
        return () => clearInterval(timer);
    }, []);

    const filtered = filter === 'all' ? candidates : candidates.filter(c => c.position === filter);
    const sorted = [...filtered].sort((a, b) => Number(b.final_score) - Number(a.final_score));
    const displayed = showAll ? sorted.slice(0, 12) : sorted.slice(0, 5);
    const totalVotes = sorted.reduce((s, c) => s + Number(c.vote_count || 0), 0) || 1;

    return (
        <div className="panel-glow module-card" style={{ overflow: 'hidden' }}>
            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--vp-red), #ef5350)', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-wide" style={{ color: 'var(--vp-text)' }}>
                            <span style={{ color: 'var(--vp-red)' }}>RANKING</span> EN VIVO
                        </h3>
                        <p className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>Score integral · HV + Plan + Intención + Integridad</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                    <span className="text-[8px] font-bold tracking-wider uppercase" style={{ color: '#16a34a' }}>LIVE</span>
                </div>
            </div>

            {/* ===== FILTER TABS ===== */}
            <div className="flex gap-1 mb-4" style={{ scrollbarWidth: 'none', overflowX: 'auto' }}>
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => { setFilter(f.id); setShowAll(false); }}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                        style={{
                            background: filter === f.id ? 'var(--vp-red)' : 'rgba(0,0,0,0.04)',
                            color: filter === f.id ? '#fff' : 'var(--vp-text-dim)',
                            border: 'none', cursor: 'pointer',
                            transform: filter === f.id ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        {f.emoji} {f.label}
                    </button>
                ))}
            </div>

            {/* ===== CANDIDATE CARDS ===== */}
            <div className="flex flex-col gap-2">
                {displayed.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: 'var(--vp-text-dim)' }}>Sin datos disponibles</div>
                )}
                {displayed.map((c, i) => {
                    const votePct = ((Number(c.vote_count || 0) / totalVotes) * 100).toFixed(1);
                    const isHighlighted = pulseIdx === i;
                    const rank = i + 1;
                    const medalColors = ['#fbbf24', '#94a3b8', '#cd7f32', '#6b7280', '#6b7280'];
                    const hvScore = Number(c.hoja_score || 0);
                    const planScore = Number(c.plan_score || 0);
                    const intencionScore = Number(c.intelligence_score || 0);
                    const integrityScore = Number(c.integrity_score || 0);

                    return (
                        <Link href={`/candidate/${c.id}`} key={c.id}
                            className="block rounded-xl transition-all"
                            style={{
                                background: isHighlighted ? 'rgba(239,68,68,0.03)' : 'rgba(0,0,0,0.015)',
                                border: `1px solid ${isHighlighted ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.04)'}`,
                                padding: '10px 12px',
                                transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
                                transition: 'all 0.5s ease',
                            }}
                        >
                            {/* Top row: rank + avatar + name + score */}
                            <div className="flex items-center gap-2.5">
                                {/* Rank badge */}
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                                    style={{
                                        background: rank <= 3 ? medalColors[i] : 'rgba(0,0,0,0.08)',
                                        color: rank <= 3 ? '#fff' : 'var(--vp-text-dim)',
                                    }}>
                                    {rank}
                                </div>

                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <img
                                        src={getCandidatePhoto(c.photo, c.name, 44, c.party_color)}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 44, c.party_color); }}
                                        alt={c.name}
                                        width={44} height={44}
                                        className="w-11 h-11 rounded-full object-cover"
                                        style={{ border: `2.5px solid ${c.party_color || 'var(--vp-border)'}` }}
                                        loading="lazy"
                                    />
                                    {rank <= 3 && (
                                        <div className="absolute -top-1 -right-1 text-[10px]">
                                            {rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}
                                        </div>
                                    )}
                                </div>

                                {/* Name + party */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate" style={{ color: 'var(--vp-text)' }}>
                                        {c.name.split(' ').slice(-2).join(' ')}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ background: `${c.party_color}20`, color: c.party_color || 'var(--vp-text-dim)' }}>
                                            {c.party_abbreviation}
                                        </span>
                                        <span className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>
                                            {POS_LABEL[c.position]}
                                        </span>
                                    </div>
                                </div>

                                {/* Main score */}
                                <div className="shrink-0 text-right">
                                    <div className="text-lg font-black" style={{ color: 'var(--vp-red)', lineHeight: 1 }}>
                                        {Number(c.final_score).toFixed(1)}
                                    </div>
                                    <div className="text-[8px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                                        SCORE
                                    </div>
                                </div>
                            </div>

                            {/* Score breakdown mini-rings */}
                            <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                <div className="flex items-center gap-3">
                                    <ScoreRing value={hvScore} size={32} color={SCORE_COLORS.hv} label="HV" />
                                    <ScoreRing value={planScore} size={32} color={SCORE_COLORS.plan} label="Plan" />
                                    <ScoreRing value={intencionScore} size={32} color={SCORE_COLORS.intencion} label="Int." />
                                    <ScoreRing value={integrityScore} size={32} color={SCORE_COLORS.integridad} label="Intg." />
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    <div className="text-[10px] font-bold" style={{ color: 'var(--vp-text)' }}>
                                        {Number(c.vote_count || 0).toLocaleString()} votos
                                    </div>
                                    <div className="text-[8px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                                        {votePct}% del total
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Show more / less */}
            {sorted.length > 4 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-3 py-2 text-[10px] font-bold rounded-lg transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--vp-text-dim)', border: 'none', cursor: 'pointer' }}
                >
                    {showAll ? '▲ Ver menos' : `▼ Ver más (${sorted.length} total)`}
                </button>
            )}



            {/* ===== FOOTER STATS ===== */}
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px dashed var(--vp-border)' }}>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                    <span className="text-[9px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                        {filtered.length} candidatos · {totalVotes.toLocaleString()} votos
                    </span>
                </div>
                <span className="text-[9px] font-bold" style={{ color: 'var(--vp-text-dim)' }}>
                    Datos JNE + VOTA.PE
                </span>
            </div>
        </div>
    );
}
