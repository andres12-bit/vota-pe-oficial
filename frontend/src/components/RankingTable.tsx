'use client';

import { useState, useMemo } from 'react';
import { Candidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import { useSelection } from '@/lib/selection';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
    position: string;
    onVote: (id: number, position: string) => void;
}

const positionLabels: Record<string, string> = {
    president: 'Presidencial',
    senator: 'Senadores',
    deputy: 'Diputados',
    andean: 'Parlamento Andino',
};

// REGIONS removed — now extracted dynamically from candidate data in the component

const PAGE_SIZE = 50;

function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}>★</span>
        );
    }
    return <span className="text-xs">{stars}</span>;
}

function TrendIndicator({ momentum }: { momentum: number }) {
    if (momentum >= 50) return <span className="text-sm font-bold" style={{ color: 'var(--vp-green)' }}>▲</span>;
    if (momentum <= 30) return <span className="text-sm font-bold" style={{ color: 'var(--vp-red)' }}>▼</span>;
    return <span className="text-sm font-bold" style={{ color: 'var(--vp-text-dim)' }}>—</span>;
}

export default function RankingTable({ candidates, position, onVote }: Props) {
    const [regionFilter, setRegionFilter] = useState('');
    const [partyFilter, setPartyFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [page, setPage] = useState(1);
    const { state: selState, addCandidate, isInCart } = useSelection();
    const cartActive = selState === 'draft' || selState === 'editing';

    // Extract unique regions dynamically from actual data
    const uniqueRegions = useMemo(() => {
        const regions = new Set<string>();
        candidates.forEach(c => {
            if (c.region) regions.add(c.region);
        });
        return Array.from(regions).sort();
    }, [candidates]);

    // Calculate unique parties from data
    const uniqueParties = useMemo(() => {
        const parties = new Map<string, string>();
        candidates.forEach(c => {
            if (c.party_abbreviation && !parties.has(c.party_abbreviation)) {
                parties.set(c.party_abbreviation, c.party_name || c.party_abbreviation);
            }
        });
        return Array.from(parties.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [candidates]);

    // Filter and paginate
    const filtered = useMemo(() => {
        let list = candidates;
        if (regionFilter) list = list.filter(c => c.region === regionFilter);
        if (partyFilter) list = list.filter(c => c.party_abbreviation === partyFilter);
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.party_name?.toLowerCase().includes(q));
        }
        return list;
    }, [candidates, regionFilter, partyFilter, searchFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset page when filters change
    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    return (
        <div className="panel-glow p-5 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-wider uppercase">
                    <span style={{ color: 'var(--vp-text-dim)' }}>Ranking</span>{' '}
                    <span className="text-glow-red" style={{ color: 'var(--vp-red)' }}>{positionLabels[position] || position}</span>
                </h2>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                    {filtered.length} candidatos
                </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 mb-6">
                <input
                    type="text"
                    placeholder="🔍 Buscar candidato..."
                    value={searchFilter}
                    onChange={e => handleFilterChange(setSearchFilter)(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)', outline: 'none' }}
                />
                <select
                    value={regionFilter}
                    onChange={e => handleFilterChange(setRegionFilter)(e.target.value)}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)', outline: 'none' }}
                >
                    <option value="">Todas las regiones</option>
                    {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                    value={partyFilter}
                    onChange={e => handleFilterChange(setPartyFilter)(e.target.value)}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)', outline: 'none' }}
                >
                    <option value="">Todos los partidos</option>
                    {uniqueParties.map(([abbr, name]) => <option key={abbr} value={abbr}>{abbr} — {name}</option>)}
                </select>
                {(regionFilter || partyFilter || searchFilter) && (
                    <button
                        onClick={() => { setRegionFilter(''); setPartyFilter(''); setSearchFilter(''); setPage(1); }}
                        className="text-[10px] px-4 py-2 rounded-lg font-bold whitespace-nowrap"
                        style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}
                    >
                        ✕ Limpiar filtros
                    </button>
                )}
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[40px_1fr_80px_40px_90px_90px_80px_90px] gap-2 px-6 py-2 text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)', borderBottom: '1px solid var(--vp-border)' }}>
                <span>#</span>
                <span>Candidato</span>
                <span className="text-center">Score</span>
                <span className="text-center">Tend.</span>
                <span className="text-center">Momentum</span>
                <span className="text-center">Inteligencia</span>
                <span className="text-center">Votar</span>
                <span className="text-center">Selección</span>
            </div>

            {/* Candidates */}
            <div className="flex flex-col">
                {paginated.map((candidate, i) => {
                    const globalRank = (page - 1) * PAGE_SIZE + i + 1;
                    return (
                        <div key={candidate.id}>
                            {/* Desktop */}
                            <div className="hidden md:grid grid-cols-[40px_1fr_80px_40px_90px_90px_80px_90px] gap-2 items-center px-6 py-4 rounded-lg transition-colors hover:bg-white/5 ranking-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span className="text-sm font-bold" style={{ color: globalRank <= 3 ? 'var(--vp-gold)' : 'var(--vp-text-dim)' }}>
                                    {globalRank}
                                </span>
                                <Link href={`/candidate/${candidate.id}`} className="flex items-center gap-3 pl-1">
                                    <img
                                        src={getCandidatePhoto(candidate.photo, candidate.name, 48, candidate.party_color)}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 48, candidate.party_color); }}
                                        alt={candidate.name}
                                        width={48}
                                        height={48}
                                        className="candidate-avatar"
                                        style={{ width: 48, height: 48 }}
                                        loading="lazy"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                        <div className="text-[10px] flex items-center gap-1" style={{ color: candidate.party_color }}>
                                            {candidate.party_abbreviation}
                                            {candidate.list_position ? (
                                                <span className="inline-flex items-center justify-center px-1.5 py-0 rounded text-[9px] font-black" style={{ background: candidate.party_color + '22', color: candidate.party_color, border: `1px solid ${candidate.party_color}44` }}>
                                                    N°{candidate.list_position}
                                                </span>
                                            ) : null}
                                            <span style={{ color: 'var(--vp-text-dim)' }}>— {candidate.region}</span>
                                        </div>
                                        <div className="mt-0.5"><StarRating rating={Number(candidate.stars_rating)} /></div>
                                    </div>
                                </Link>
                                <div className="text-center">
                                    <span className="score-badge">{Number(candidate.final_score).toFixed(1)}</span>
                                </div>
                                <div className="text-center">
                                    <TrendIndicator momentum={Number(candidate.momentum_score)} />
                                </div>
                                <div className="text-center">
                                    <div className="w-full h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.05)', maxWidth: '70px' }}>
                                        <div className="momentum-bar" style={{ width: `${Math.min(100, Number(candidate.momentum_score))}%` }} />
                                    </div>
                                    <span className="text-[10px] mt-1 block" style={{ color: 'var(--vp-text-dim)' }}>{Number(candidate.momentum_score).toFixed(1)}</span>
                                </div>
                                <div className="text-center text-xs font-semibold" style={{ color: Number(candidate.intelligence_score) > 60 ? 'var(--vp-green)' : 'var(--vp-text-dim)' }}>
                                    {Number(candidate.intelligence_score).toFixed(1)}
                                </div>
                                <div className="text-center">
                                    <button
                                        onClick={() => onVote(candidate.id, candidate.position)}
                                        className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:scale-105"
                                        style={{ background: 'var(--vp-red)', color: 'white', boxShadow: '0 0 8px var(--vp-red-glow)' }}
                                    >
                                        VOTAR
                                    </button>
                                </div>
                                <div className="text-center">
                                    {isInCart(candidate.id) ? (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--vp-green)', background: 'rgba(0,230,118,0.1)' }}>
                                            ✅ Agregado
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => addCandidate(candidate)}
                                            className="agregar-seleccion-btn text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
                                        >
                                            ➕ Agregar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Mobile — vertical card layout */}
                            <div className="md:hidden flex flex-col rounded-xl p-3 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                {/* Top: rank + candidate info + score */}
                                <div className="flex items-start gap-2.5 mb-2.5">
                                    <span className="text-sm font-bold w-6 text-center shrink-0 pt-1" style={{ color: globalRank <= 3 ? 'var(--vp-gold)' : 'var(--vp-text-dim)' }}>
                                        {globalRank}
                                    </span>
                                    <Link href={`/candidate/${candidate.id}`} className="flex items-start gap-2.5 flex-1 min-w-0">
                                        <img
                                            src={getCandidatePhoto(candidate.photo, candidate.name, 40, candidate.party_color)}
                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 40, candidate.party_color); }}
                                            alt={candidate.name}
                                            width={40}
                                            height={40}
                                            className="candidate-avatar shrink-0"
                                            loading="lazy"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                            <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: candidate.party_color }}>
                                                {candidate.party_abbreviation}
                                                {candidate.list_position ? (
                                                    <span className="inline-flex items-center justify-center px-1 py-0 rounded text-[8px] font-black" style={{ background: candidate.party_color + '22', color: candidate.party_color }}>
                                                        N°{candidate.list_position}
                                                    </span>
                                                ) : null}
                                                <span style={{ color: 'var(--vp-text-dim)' }}>— {candidate.region}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <TrendIndicator momentum={Number(candidate.momentum_score)} />
                                                <StarRating rating={Number(candidate.stars_rating)} />
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="shrink-0 text-right pt-0.5">
                                        <span className="score-badge">{Number(candidate.final_score).toFixed(1)}</span>
                                    </div>
                                </div>
                                {/* Bottom: buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onVote(candidate.id, candidate.position)}
                                        className="flex-1 text-xs font-bold py-2 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
                                        style={{ background: 'var(--vp-red)', color: 'white', boxShadow: '0 0 12px var(--vp-red-glow)' }}
                                    >
                                        🗳️ VOTAR
                                    </button>
                                    {cartActive && (
                                        isInCart(candidate.id) ? (
                                            <span className="flex-1 text-xs font-bold py-2 rounded-lg text-center" style={{ color: 'var(--vp-green)', background: 'rgba(0,230,118,0.1)' }}>
                                                ✅ Agregado
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => addCandidate(candidate)}
                                                className="agregar-seleccion-btn flex-1 text-xs font-bold py-2 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                ➕ Agregar
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--vp-border)' }}>
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-30"
                        style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}
                    >
                        ← Anterior
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 7) {
                                pageNum = i + 1;
                            } else if (page <= 4) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 3) {
                                pageNum = totalPages - 6 + i;
                            } else {
                                pageNum = page - 3 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg"
                                    style={{
                                        background: page === pageNum ? 'var(--vp-red)' : 'transparent',
                                        color: page === pageNum ? 'white' : 'var(--vp-text-dim)',
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-30"
                        style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}
                    >
                        Siguiente →
                    </button>
                    <span className="text-[10px] ml-2" style={{ color: 'var(--vp-text-dim)' }}>
                        Pág. {page}/{totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}
