'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Candidate, getCandidatesBySector } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';
import { useSelection } from '@/lib/selection';
import Link from 'next/link';

/* ─── Sector definitions ─── */
const SECTORS = [
    { id: 'agricultura', name: 'Agricultura y Ganadería' },
    { id: 'pesca', name: 'Pesca y Acuicultura' },
    { id: 'mineria', name: 'Minería e Hidrocarburos' },
    { id: 'energia', name: 'Energía' },
    { id: 'industria', name: 'Industria y Producción' },
    { id: 'comercio', name: 'Comercio' },
    { id: 'transporte', name: 'Transporte y Logística' },
    { id: 'telecom', name: 'Telecomunicaciones y Tecnología' },
    { id: 'turismo', name: 'Turismo' },
    { id: 'cultura', name: 'Cultura' },
    { id: 'educacion', name: 'Educación' },
    { id: 'salud', name: 'Salud' },
    { id: 'seguridad', name: 'Seguridad y Defensa' },
    { id: 'justicia', name: 'Justicia' },
    { id: 'economia', name: 'Economía y Finanzas' },
    { id: 'trabajo', name: 'Trabajo y Empleo' },
    { id: 'vivienda', name: 'Vivienda y Construcción' },
    { id: 'ambiente', name: 'Medio Ambiente' },
    { id: 'social', name: 'Desarrollo Social' },
    { id: 'deporte', name: 'Deporte y Recreación' },
    { id: 'exterior', name: 'Relaciones Exteriores' },
    { id: 'gobierno', name: 'Gobierno y Admin. Pública' },
];

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

const PAGE_SIZE = 50;

function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} style={{ color: i <= Math.round(rating) ? '#c62828' : '#ddd', fontSize: 10 }}>★</span>
        );
    }
    return <span style={{ display: 'inline-flex', gap: 1 }}>{stars}</span>;
}

function TrendIndicator({ momentum }: { momentum: number }) {
    if (momentum >= 50) return <span style={{ fontSize: 10, fontWeight: 800, color: '#2e7d32' }}>▲</span>;
    if (momentum <= 30) return <span style={{ fontSize: 10, fontWeight: 800, color: '#c62828' }}>▼</span>;
    return <span style={{ fontSize: 10, fontWeight: 800, color: '#90a4ae' }}>—</span>;
}

/* ─── Score color helper ─── */
function getScoreColor(score: number): string {
    if (score >= 85) return '#2e7d32';
    if (score >= 70) return '#e65100';
    return '#c62828';
}

function getScoreBg(score: number): string {
    if (score >= 85) return 'rgba(46,125,50,0.08)';
    if (score >= 70) return 'rgba(230,81,0,0.08)';
    return 'rgba(198,40,40,0.08)';
}

export default function RankingTable({ candidates, position, onVote }: Props) {
    const [regionFilter, setRegionFilter] = useState('');
    const [partyFilter, setPartyFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [sectorCandidates, setSectorCandidates] = useState<Candidate[] | null>(null);
    const [sectorLoading, setSectorLoading] = useState(false);
    const [page, setPage] = useState(1);
    const { state: selState, addCandidate, isInCart } = useSelection();
    const cartActive = selState === 'draft' || selState === 'editing';

    const handleSectorSelect = useCallback(async (sectorId: string) => {
        if (sectorId === sectorFilter) {
            setSectorFilter('');
            setSectorCandidates(null);
            setPage(1);
            return;
        }
        setSectorFilter(sectorId);
        setSectorLoading(true);
        setPage(1);
        try {
            const data = await getCandidatesBySector(sectorId, position);
            setSectorCandidates(data);
        } catch (err) {
            console.error('Error fetching sector candidates:', err);
            setSectorCandidates([]);
        } finally {
            setSectorLoading(false);
        }
    }, [sectorFilter, position]);

    useEffect(() => {
        setSectorFilter('');
        setSectorCandidates(null);
    }, [position]);

    const uniqueRegions = useMemo(() => {
        const regions = new Set<string>();
        candidates.forEach(c => { if (c.region) regions.add(c.region); });
        return Array.from(regions).sort();
    }, [candidates]);

    const uniqueParties = useMemo(() => {
        const parties = new Map<string, string>();
        candidates.forEach(c => {
            if (c.party_abbreviation && !parties.has(c.party_abbreviation)) {
                parties.set(c.party_abbreviation, c.party_name || c.party_abbreviation);
            }
        });
        return Array.from(parties.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [candidates]);

    const filtered = useMemo(() => {
        let list = sectorCandidates !== null ? sectorCandidates : candidates;
        if (regionFilter) list = list.filter(c => c.region === regionFilter);
        if (partyFilter) list = list.filter(c => c.party_abbreviation === partyFilter);
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.party_name?.toLowerCase().includes(q));
        }
        return list;
    }, [candidates, sectorCandidates, regionFilter, partyFilter, searchFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setPage(1);
    };

    const activeSectorName = SECTORS.find(s => s.id === sectorFilter)?.name;

    return (
        <div style={{ padding: 0 }}>
            {/* ─── Header ─── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', margin: 0, lineHeight: 1.2 }}>
                    <span style={{ color: '#1B2A4A' }}>Lista de Candidatos </span>
                    <span style={{ color: '#c62828' }}>{positionLabels[position] || position}</span>
                </h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 20, background: '#c62828', color: '#fff' }}>
                    {sectorLoading ? '...' : filtered.length} candidatos
                </span>
            </div>

            {/* ─── Sector Filter Chips — always visible ─── */}
            <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#78909c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#90a4ae" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                    Filtrar por Sector
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {SECTORS.map(s => {
                        const isActive = sectorFilter === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => handleSectorSelect(s.id)}
                                style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
                                    border: isActive ? '1.5px solid #c62828' : '1px solid rgba(0,0,0,0.1)',
                                    background: isActive ? '#c62828' : '#fff',
                                    color: isActive ? '#fff' : '#455a64',
                                    boxShadow: isActive ? '0 2px 10px rgba(198,40,40,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                            >
                                {s.name}
                            </button>
                        );
                    })}
                </div>
                {sectorFilter && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#607d8b' }}>
                            Mostrando candidatos con propuestas en <strong style={{ color: '#c62828' }}>{activeSectorName}</strong>
                        </span>
                        <button onClick={() => { setSectorFilter(''); setSectorCandidates(null); setPage(1); }}
                            style={{ fontSize: 10, fontWeight: 700, color: '#c62828', background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.15)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer' }}>
                            ✕ Quitar
                        </button>
                    </div>
                )}
            </div>

            {/* ─── Search & Filters ─── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar candidato..."
                        value={searchFilter}
                        onChange={e => handleFilterChange(setSearchFilter)(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, fontSize: 12,
                            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none',
                        }}
                    />
                </div>
                {position !== 'president' && (
                    <select
                        value={regionFilter}
                        onChange={e => handleFilterChange(setRegionFilter)(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none', flex: '0 0 auto' }}
                    >
                        <option value="">Todas las regiones</option>
                        {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                )}
                <select
                    value={partyFilter}
                    onChange={e => handleFilterChange(setPartyFilter)(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none', flex: '0 0 auto' }}
                >
                    <option value="">Todos los partidos</option>
                    {uniqueParties.map(([abbr, name]) => <option key={abbr} value={abbr}>{abbr} — {name}</option>)}
                </select>
            </div>

            {/* ─── Candidate Cards Grid ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {paginated.map((candidate, i) => {
                    const globalRank = (page - 1) * PAGE_SIZE + i + 1;
                    const score = Number(candidate.final_score);
                    const planScore = Number(candidate.plan_score);
                    const sentenceCount = ((candidate as any).hoja_de_vida?.sentences || []).length;
                    const inCart = isInCart(candidate.id);

                    return (
                        <div key={candidate.id} style={{
                            borderRadius: 14, overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.06)',
                            background: '#fff',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            position: 'relative',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                        >
                            {/* Rank badge */}
                            <div style={{
                                position: 'absolute', top: 12, left: 12, zIndex: 2,
                                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 800,
                                background: globalRank === 1 ? 'linear-gradient(135deg, #c62828, #b71c1c)' : globalRank === 2 ? 'linear-gradient(135deg, #37474f, #263238)' : globalRank === 3 ? 'linear-gradient(135deg, #5d4037, #3e2723)' : 'rgba(0,0,0,0.06)',
                                color: globalRank <= 3 ? '#fff' : '#90a4ae',
                                boxShadow: globalRank <= 3 ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                            }}>
                                {globalRank}
                            </div>

                            {/* Top section — photo, name, party */}
                            <Link href={`/candidate/${candidate.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <img
                                        src={getCandidatePhoto(candidate.photo, candidate.name, 60, candidate.party_color)}
                                        onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 60, candidate.party_color); } }}
                                        alt={candidate.name}
                                        width={60} height={60}
                                        style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${candidate.party_color || '#ccc'}`, flexShrink: 0 }}
                                        loading="lazy"
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {candidate.name}
                                        </div>
                                        {(candidate as any).is_current_congressman && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                                fontSize: 9, fontWeight: 700, marginTop: 3,
                                                padding: '2px 7px', borderRadius: 4,
                                                background: 'linear-gradient(135deg, #f9a825, #ff8f00)',
                                                color: '#fff', letterSpacing: '0.02em',
                                                boxShadow: '0 1px 4px rgba(249,168,37,0.3)',
                                            }}>
                                                🏛️ CONGRESISTA ACTUAL
                                            </div>
                                        )}
                                        <div style={{ fontSize: 11, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ fontWeight: 700, color: candidate.party_color }}>{candidate.party_abbreviation}</span>
                                            {candidate.list_position ? (
                                                <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: candidate.party_color + '15', color: candidate.party_color }}>
                                                    N°{candidate.list_position}
                                                </span>
                                            ) : null}
                                            <span style={{ color: '#b0bec5', fontSize: 10 }}>· {candidate.region}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                            <TrendIndicator momentum={Number(candidate.momentum_score)} />
                                            <span style={{ fontSize: 9, fontWeight: 600, color: '#90a4ae' }}>Intención {Number(candidate.momentum_score).toFixed(0)}</span>
                                            <StarRating rating={Number(candidate.stars_rating)} />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Stats row */}
                            <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                <div style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Score</div>
                                    <div style={{
                                        fontSize: 16, fontWeight: 800, color: getScoreColor(score),
                                        display: 'inline-block', padding: '1px 8px', borderRadius: 6,
                                        background: getScoreBg(score),
                                    }}>
                                        {score.toFixed(1)}
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Plan Gob.</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: planScore >= 60 ? '#2e7d32' : planScore >= 30 ? '#e65100' : '#c62828' }}>
                                        {Math.round(planScore)}%
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '10px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sentencias</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: sentenceCount > 0 ? '#c62828' : '#2e7d32' }}>
                                        {sentenceCount > 0 ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                {sentenceCount}
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                0
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div style={{ padding: '10px 18px 14px' }}>
                                {inCart ? (
                                    <div style={{
                                        textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '8px 0', borderRadius: 8,
                                        color: '#2e7d32', background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.12)',
                                    }}>
                                        Seleccionado
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => { onVote(candidate.id, candidate.position); addCandidate(candidate); }}
                                            style={{
                                                flex: 1, fontSize: 12, fontWeight: 700, padding: '9px 0', borderRadius: 8,
                                                background: 'linear-gradient(135deg, #c62828, #b71c1c)', color: '#fff',
                                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(198,40,40,0.25)', letterSpacing: '0.04em',
                                            }}
                                            onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1.02)'; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(198,40,40,0.35)'; }}
                                            onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; (e.target as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(198,40,40,0.25)'; }}
                                        >
                                            VOTAR
                                        </button>
                                        {cartActive && (
                                            <button
                                                onClick={() => addCandidate(candidate)}
                                                className="agregar-seleccion-btn"
                                                style={{
                                                    flex: 1, fontSize: 11, fontWeight: 700, padding: '9px 0', borderRadius: 8,
                                                    border: '1px solid rgba(0,0,0,0.1)', background: '#f8f9fa', color: '#455a64',
                                                    cursor: 'pointer', transition: 'all 0.2s',
                                                }}
                                            >
                                                + Agregar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        style={{
                            fontSize: 11, fontWeight: 700, padding: '8px 18px', borderRadius: 8,
                            background: page <= 1 ? '#f5f5f5' : '#fff', color: page <= 1 ? '#ccc' : '#c62828',
                            border: '1px solid rgba(0,0,0,0.06)', cursor: page <= 1 ? 'default' : 'pointer',
                        }}
                    >
                        ← Anterior
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 7) pageNum = i + 1;
                            else if (page <= 4) pageNum = i + 1;
                            else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                            else pageNum = page - 3 + i;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    style={{
                                        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                                        background: page === pageNum ? '#c62828' : 'transparent',
                                        color: page === pageNum ? '#fff' : '#90a4ae',
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
                        style={{
                            fontSize: 11, fontWeight: 700, padding: '8px 18px', borderRadius: 8,
                            background: page >= totalPages ? '#f5f5f5' : '#fff', color: page >= totalPages ? '#ccc' : '#c62828',
                            border: '1px solid rgba(0,0,0,0.06)', cursor: page >= totalPages ? 'default' : 'pointer',
                        }}
                    >
                        Siguiente →
                    </button>
                    <span style={{ fontSize: 10, marginLeft: 8, color: '#90a4ae', fontWeight: 600 }}>
                        Pág. {page}/{totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}
