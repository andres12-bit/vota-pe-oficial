'use client';

import { useState, useEffect } from 'react';
import { Party, Candidate, getParties, getRanking } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';

interface PlanchaData {
    party: Party;
    presidential: Candidate | null;
}

export default function PlanchasPanel() {
    const [planchas, setPlanchas] = useState<PlanchaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'score' | 'name' | 'candidates'>('score');

    useEffect(() => {
        async function fetchPlanchas() {
            try {
                const [parties, presidents] = await Promise.all([
                    getParties(),
                    getRanking('president'),
                ]);

                // Map each party to its presidential candidate
                const data: PlanchaData[] = parties.map(party => {
                    const pres = presidents.find(c =>
                        c.party_id === party.id ||
                        c.party_abbreviation === party.abbreviation ||
                        c.party_name === party.name
                    ) || null;

                    return { party, presidential: pres };
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
    const sorted = [...planchas].sort((a, b) => {
        if (sortBy === 'score') {
            const scoreA = a.party.party_full_score || (a.presidential?.final_score || 0);
            const scoreB = b.party.party_full_score || (b.presidential?.final_score || 0);
            return scoreB - scoreA;
        }
        if (sortBy === 'name') return a.party.name.localeCompare(b.party.name);
        if (sortBy === 'candidates') return (b.party.candidate_count || 0) - (a.party.candidate_count || 0);
        return 0;
    });

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
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex gap-2">
                    {[
                        { id: 'score' as const, label: 'Puntaje' },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sorted.map((plancha, index) => {
                    const { party, presidential } = plancha;
                    const score = party.party_full_score || (presidential?.final_score || 0);
                    const rank = party.ranking_position || index + 1;

                    return (
                        <Link
                            key={party.id}
                            href={`/party/${party.id}`}
                            className="panel-glow block rounded-xl p-4 transition-all hover:scale-[1.02] hover:brightness-110"
                            style={{ borderLeft: `3px solid ${party.color}` }}
                        >
                            {/* Party header */}
                            <div className="flex items-start gap-3 mb-3">
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
                                        {party.abbreviation}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="shrink-0 text-right">
                                    <span className="score-badge">{Number(score).toFixed(1)}</span>
                                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>
                                        {party.candidate_count || 0} cand.
                                    </div>
                                </div>
                            </div>

                            {/* Presidential candidate */}
                            {presidential && (
                                <div className="flex items-center gap-2.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
                                            Candidato(a) Presidencial — {presidential.region}
                                        </div>
                                    </div>
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
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
