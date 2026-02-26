'use client';

import { useState, useEffect, useMemo } from 'react';
import { Party, Candidate, getParties, getRanking } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';

interface PlanchaData {
    party: Party;
    presidential: Candidate | null;
    allCandidates: Candidate[];
}

export default function PlanchasPanel() {
    const [planchas, setPlanchas] = useState<PlanchaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'score' | 'name' | 'candidates' | 'totalScore'>('score');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchPlanchas() {
            try {
                const [parties, presidents, senators, deputies, andean] = await Promise.all([
                    getParties(),
                    getRanking('president'),
                    getRanking('senator'),
                    getRanking('deputy'),
                    getRanking('andean'),
                ]);

                const allCandidates = [...presidents, ...senators, ...deputies, ...andean];

                const data: PlanchaData[] = parties.map(party => {
                    const pres = presidents.find(c =>
                        c.party_id === party.id ||
                        c.party_abbreviation === party.abbreviation ||
                        c.party_name === party.name
                    ) || null;

                    const partyCandidates = allCandidates.filter(c =>
                        c.party_id === party.id ||
                        c.party_abbreviation === party.abbreviation
                    );

                    return { party, presidential: pres, allCandidates: partyCandidates };
                });

                setPlanchas(data);
            } catch (err) {
                console.error('Error fetching planchas:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlanchas();
    }, []);

    // Sort planchas
    const sorted = useMemo(() => {
        return [...planchas].sort((a, b) => {
            if (sortBy === 'score') {
                return (b.party.party_full_score || 0) - (a.party.party_full_score || 0);
            }
            if (sortBy === 'name') return a.party.name.localeCompare(b.party.name);
            if (sortBy === 'candidates') return b.allCandidates.length - a.allCandidates.length;
            if (sortBy === 'totalScore') {
                const totalA = a.allCandidates.reduce((s, c) => s + (c.final_score || 0), 0);
                const totalB = b.allCandidates.reduce((s, c) => s + (c.final_score || 0), 0);
                return totalB - totalA;
            }
            return 0;
        });
    }, [planchas, sortBy]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    <p className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>Cargando planchas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1100px] mx-auto w-full px-2">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                    🏛️ <span style={{ color: 'var(--vp-red)' }}>PLANCHAS</span> PRESIDENCIALES
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    Elecciones Generales 2026 — {planchas.length} organizaciones políticas
                </p>
            </div>

            {/* Sort controls */}
            <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { id: 'score' as const, label: 'Score Promedio' },
                        { id: 'totalScore' as const, label: 'Score Total' },
                        { id: 'name' as const, label: 'A-Z' },
                        { id: 'candidates' as const, label: 'Candidatos' },
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSortBy(s.id)}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: sortBy === s.id ? 'var(--vp-red)' : 'rgba(255,255,255,0.05)',
                                color: sortBy === s.id ? 'white' : 'var(--vp-text-dim)',
                                border: `1px solid ${sortBy === s.id ? 'var(--vp-red)' : 'var(--vp-border)'}`,
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(255,23,68,0.1)', color: 'var(--vp-red)' }}>
                    {planchas.length} planchas
                </span>
            </div>

            {/* Planchas Grid */}
            <div className="flex flex-col gap-4">
                {sorted.map((plancha, index) => {
                    const { party, presidential, allCandidates } = plancha;
                    const score = party.party_full_score || 0;
                    const rank = party.ranking_position || index + 1;
                    const isExpanded = expandedId === party.id;

                    // Calculate aggregate metrics
                    const totalCandidates = allCandidates.length;
                    const totalScore = allCandidates.reduce((s, c) => s + (c.final_score || 0), 0);
                    const avgIntelligence = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.intelligence_score || 0), 0) / totalCandidates : 0;
                    const avgMomentum = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.momentum_score || 0), 0) / totalCandidates : 0;
                    const avgIntegrity = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.integrity_score || 0), 0) / totalCandidates : 0;
                    const totalVotes = allCandidates.reduce((s, c) => s + (c.vote_count || 0), 0);
                    const avgStars = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.stars_rating || 0), 0) / totalCandidates : 0;

                    // Breakdown by position
                    const byPosition = {
                        president: allCandidates.filter(c => c.position === 'president').length,
                        senator: allCandidates.filter(c => c.position === 'senator').length,
                        deputy: allCandidates.filter(c => c.position === 'deputy').length,
                        andean: allCandidates.filter(c => c.position === 'andean').length,
                    };

                    return (
                        <div
                            key={party.id}
                            className="panel-glow rounded-xl p-4 transition-all"
                            style={{ borderLeft: `3px solid ${party.color}` }}
                        >
                            {/* Party header row — always visible */}
                            <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : party.id)}>
                                {/* Rank */}
                                <span className="text-lg font-black w-7 text-center shrink-0" style={{ color: rank <= 3 ? 'var(--vp-gold)' : 'var(--vp-text-dim)' }}>
                                    {rank}
                                </span>

                                {/* Party info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold leading-tight" style={{ color: 'var(--vp-text)' }}>
                                        {party.name}
                                    </div>
                                    <div className="text-[10px] font-bold tracking-wider mt-0.5" style={{ color: party.color }}>
                                        {party.abbreviation} · {totalCandidates} candidatos
                                    </div>
                                </div>

                                {/* Score + expand */}
                                <div className="shrink-0 text-right flex items-center gap-2">
                                    <div>
                                        <span className="score-badge">{Number(score).toFixed(1)}</span>
                                        <div className="text-[9px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>
                                            promedio
                                        </div>
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--vp-text-dim)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                                </div>
                            </div>

                            {/* Presidential candidate */}
                            {presidential && (
                                <Link href={`/candidate/${presidential.id}`}>
                                    <div className="flex items-center gap-2.5 pt-2 mt-2 hover:bg-white/5 rounded-lg p-2 transition-colors" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <img
                                            src={getAvatarUrl(presidential.name, 36, party.color)}
                                            alt={presidential.name}
                                            width={36}
                                            height={36}
                                            className="rounded-full shrink-0"
                                            style={{ border: `2px solid ${party.color}` }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--vp-text)' }}>
                                                {presidential.name}
                                            </div>
                                            <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                                Candidato(a) Presidencial
                                            </div>
                                        </div>
                                        <span className="score-badge text-xs">{Number(presidential.final_score).toFixed(1)}</span>
                                    </div>
                                </Link>
                            )}

                            {/* Expanded: Full Statistics */}
                            {isExpanded && (
                                <div className="mt-4 pt-3 animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        <StatCard label="Score Total" value={totalScore.toFixed(0)} color="var(--vp-red)" />
                                        <StatCard label="Votos Totales" value={totalVotes.toLocaleString()} color="var(--vp-green)" />
                                        <StatCard label="Candidatos" value={String(totalCandidates)} color="var(--vp-blue)" />
                                        <StatCard label="Estrellas Prom." value={avgStars.toFixed(1)} color="var(--vp-gold)" />
                                    </div>

                                    {/* Métricas de Inteligencia */}
                                    <div className="mb-4">
                                        <h4 className="text-[10px] font-bold tracking-[2px] uppercase mb-2" style={{ color: 'var(--vp-text-dim)' }}>
                                            MÉTRICAS DE INTELIGENCIA
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                            <MetricBar label="Inteligencia" value={avgIntelligence} max={100} color="var(--vp-blue)" />
                                            <MetricBar label="Momentum" value={avgMomentum} max={100} color="var(--vp-green)" />
                                            <MetricBar label="Integridad" value={avgIntegrity} max={100} color="var(--vp-gold)" />
                                        </div>
                                    </div>

                                    {/* Desglose del Score Final */}
                                    <div className="mb-4">
                                        <h4 className="text-[10px] font-bold tracking-[2px] uppercase mb-2" style={{ color: 'var(--vp-text-dim)' }}>
                                            DESGLOSE DEL SCORE FINAL
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ color: 'var(--vp-text-dim)' }}>Votos (40%)</span>
                                                <span className="font-bold" style={{ color: 'var(--vp-text)' }}>
                                                    {(totalCandidates > 0 ? (allCandidates.reduce((s, c) => s + Math.min(100, (c.vote_count / 1000) * 10), 0) / totalCandidates * 0.40) : 0).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ color: 'var(--vp-text-dim)' }}>Inteligencia (25%)</span>
                                                <span className="font-bold" style={{ color: 'var(--vp-text)' }}>{(avgIntelligence * 0.25).toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ color: 'var(--vp-text-dim)' }}>Momentum (20%)</span>
                                                <span className="font-bold" style={{ color: 'var(--vp-text)' }}>{(avgMomentum * 0.20).toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ color: 'var(--vp-text-dim)' }}>Integridad (15%)</span>
                                                <span className="font-bold" style={{ color: 'var(--vp-text)' }}>{(avgIntegrity * 0.15).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Candidatos por Cargo */}
                                    <div className="mb-3">
                                        <h4 className="text-[10px] font-bold tracking-[2px] uppercase mb-2" style={{ color: 'var(--vp-text-dim)' }}>
                                            CANDIDATOS POR CARGO
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            <PositionCount icon="🏛️" label="Pres." count={byPosition.president} color={party.color} />
                                            <PositionCount icon="👔" label="Sen." count={byPosition.senator} color={party.color} />
                                            <PositionCount icon="📋" label="Dip." count={byPosition.deputy} color={party.color} />
                                            <PositionCount icon="🌎" label="P.And." count={byPosition.andean} color={party.color} />
                                        </div>
                                    </div>

                                    {/* Link to full plancha */}
                                    <Link href={`/party/${party.id}`}
                                        className="block text-center text-xs font-bold py-2 rounded-lg mt-2 transition-all hover:brightness-125"
                                        style={{ background: `${party.color}20`, color: party.color, border: `1px solid ${party.color}33` }}>
                                        Ver Plancha Completa →
                                    </Link>
                                </div>
                            )}

                            {/* Score bar */}
                            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, (Number(score) / 60) * 100)}%`,
                                        background: `linear-gradient(90deg, ${party.color}, var(--vp-red))`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper components
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-lg font-black" style={{ color }}>{value}</div>
            <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
        </div>
    );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold w-20 shrink-0" style={{ color: 'var(--vp-text-dim)' }}>{label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] font-bold w-10 text-right" style={{ color }}>{value.toFixed(1)}</span>
        </div>
    );
}

function PositionCount({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
    return (
        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-sm">{icon}</div>
            <div className="text-sm font-black" style={{ color }}>{count}</div>
            <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
        </div>
    );
}
