'use client';

import { useState, useEffect, useMemo } from 'react';
import { Candidate, Party, getPartyFullTicket } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

interface VicePresident {
    id: number;
    candidate_id: number;
    name: string;
    position_label: string;
    photo: string | null;
    biography: string;
    sort_order: number;
}

function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} className={`text-xs ${i <= Math.round(rating) ? 'star-filled' : 'star-empty'}`}>★</span>
        );
    }
    return <span>{stars}</span>;
}

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium w-20 shrink-0" style={{ color: 'var(--vp-text-dim)' }}>{label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{value.toFixed(1)}</span>
        </div>
    );
}

function MetricBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
    return (
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
            <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
        </div>
    );
}

const positionLabels: Record<string, string> = {
    president: '🏛️ Presidente',
    senators: '👔 Senadores',
    deputies: '📋 Diputados',
    andean: '🌎 Parlamento Andino',
};

const positionColors: Record<string, string> = {
    senators: '#1565c0',
    deputies: '#2e7d32',
    andean: '#7B1FA2',
};

export default function PartyPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [party, setParty] = useState<Party | null>(null);
    const [ticket, setTicket] = useState<Record<string, Candidate[]>>({});
    const [vicePresidents, setVicePresidents] = useState<Record<string, VicePresident[]>>({});
    const [loading, setLoading] = useState(true);
    const [showJudicialModal, setShowJudicialModal] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getPartyFullTicket(parseInt(resolvedParams.id));
                setParty(data.party as unknown as Party);
                setTicket(data.ticket);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setVicePresidents((data as any).vice_presidents || {});
            } catch (err) {
                console.error('Error loading party:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [resolvedParams.id]);

    // Compute analytics
    const analytics = useMemo(() => {
        const allCandidates = Object.values(ticket).flat();
        if (allCandidates.length === 0) return null;

        const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const scores = allCandidates.map(c => Number(c.final_score));
        const hojaScores = allCandidates.map(c => Number((c as any).hoja_score || 0));
        const planScores = allCandidates.map(c => Number((c as any).plan_score || 0));
        const maxVotes = Math.max(...allCandidates.map(c => c.vote_count || 0), 1);
        const intencionScores = allCandidates.map(c => Math.min(100, ((c.vote_count || 0) / maxVotes) * 100));
        const integrity = allCandidates.map(c => Number(c.integrity_score));

        // Region analysis
        const regionCounts: Record<string, number> = {};
        allCandidates.forEach(c => {
            const r = c.region || 'Sin región';
            regionCounts[r] = (regionCounts[r] || 0) + 1;
        });
        const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];

        // Top candidates per position
        const topByPosition: Record<string, Candidate[]> = {};
        Object.entries(ticket).forEach(([pos, candidates]) => {
            if (pos !== 'president') {
                topByPosition[pos] = [...candidates]
                    .sort((a, b) => Number(b.final_score) - Number(a.final_score))
                    .slice(0, 5);
            }
        });

        // Sentencias analysis
        const sentencedCandidates = allCandidates.filter(c => {
            const hv = (c as any).hoja_de_vida || {};
            return (hv.sentences || []).length > 0;
        });
        const cleanCandidates = allCandidates.filter(c => {
            const hv = (c as any).hoja_de_vida || {};
            return (hv.sentences || []).length === 0;
        });

        return {
            totalCandidates: allCandidates.length,
            avgScore: avg(scores),
            avgHoja: avg(hojaScores),
            avgPlan: avg(planScores),
            avgIntencion: avg(intencionScores),
            avgIntegrity: avg(integrity),
            topScore: Math.max(...scores),
            topRegion: topRegion ? topRegion[0] : 'N/A',
            topByPosition,
            totalVotes: allCandidates.reduce((s, c) => s + Number(c.vote_count || 0), 0),
            candidatesWithSentences: sentencedCandidates.length,
            candidatesClean: cleanCandidates.length,
            sentencedCandidates,
            cleanCandidates,
        };
    }, [ticket]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    if (!party) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--vp-red)' }}>Partido no encontrado</p>
            </div>
        );
    }

    const president = ticket.president?.[0];

    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            <NavHeader />

            <main className="internal-page-wrapper">
                {/* Party Header */}
                <div className="panel-glow mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black"
                            style={{ background: party.color || 'var(--vp-red)', boxShadow: `0 0 20px ${party.color}44`, color: '#fff' }}>
                            {party.abbreviation?.slice(0, 3)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-black" style={{ color: 'var(--vp-text)' }}>{party.name}</h1>
                            <div className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                                Ranking #{party.ranking_position || '-'} · {analytics?.totalCandidates || 0} candidatos
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-glow-red" style={{ color: 'var(--vp-red)' }}>
                                {Number(party.party_full_score || 0).toFixed(1)}
                            </div>
                            <div className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>SCORE</div>
                        </div>
                    </div>
                </div>

                {/* ===== UNIFIED ANALYSIS PANEL ===== */}
                {analytics && (
                    <div className="panel-glow mb-6">
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                            📊 Análisis de la Plancha
                        </h3>

                        {/* Row 1: Key Stats + Presidential Candidate side by side */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-4">
                            {/* Left: Stats + Bars */}
                            <div className="flex-1">
                                {/* Compact Stats Row */}
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-lg font-black" style={{ color: 'var(--vp-red)' }}>{analytics.avgScore.toFixed(1)}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Score Prom.</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-lg font-black" style={{ color: 'var(--vp-green)' }}>{analytics.totalVotes.toLocaleString('es-PE')}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Votos</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-lg font-black" style={{ color: 'var(--vp-gold)' }}>{analytics.topScore.toFixed(1)}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Top Score</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-lg font-black truncate" style={{ color: 'var(--vp-blue)', fontSize: analytics.topRegion.length > 8 ? '0.75rem' : undefined }}>{analytics.topRegion}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Más Cand.</div>
                                    </div>
                                </div>

                                {/* Score Bars with new formula */}
                                <div className="text-[9px] font-bold tracking-wider uppercase mb-1.5" style={{ color: 'var(--vp-text-dim)' }}>
                                    Componentes del Score (promedio plancha)
                                </div>
                                <ScoreBar label="Hoja de Vida" value={analytics.avgHoja} color="#8b5cf6" />
                                <ScoreBar label="Plan de Gob." value={analytics.avgPlan} color="#2563eb" />
                                <ScoreBar label="Intención" value={analytics.avgIntencion} color="#f59e0b" />
                                <ScoreBar label="Integridad" value={analytics.avgIntegrity} color="#16a34a" />
                            </div>

                            {/* Right: Presidential Candidate compact */}
                            {president && (
                                <div className="lg:w-[280px] shrink-0 p-3 rounded-xl" style={{ background: `${party.color}08`, border: `1px solid ${party.color}22` }}>
                                    <div className="text-[9px] font-bold tracking-wider uppercase mb-2" style={{ color: party.color }}>🏛️ Candidato Presidencial</div>
                                    <Link href={`/candidate/${president.id}`} className="flex items-center gap-2.5 mb-2.5">
                                        <img
                                            src={getCandidatePhoto(president.photo, president.name, 56, party.color)}
                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(president.name, 56, party.color); }}
                                            alt={president.name}
                                            width={56}
                                            height={56}
                                            className="w-14 h-14 rounded-full object-cover shrink-0"
                                            style={{ border: `2px solid ${party.color}` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black truncate" style={{ color: 'var(--vp-text)' }}>{president.name}</div>
                                            <StarRating rating={Number(president.stars_rating)} />
                                        </div>
                                    </Link>
                                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                                        <div className="text-center p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                                            <div className="text-base font-black" style={{ color: 'var(--vp-red)' }}>{Number(president.final_score).toFixed(1)}</div>
                                            <div className="text-[7px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>Score</div>
                                        </div>
                                        <div className="text-center p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                                            <div className="text-base font-black" style={{ color: 'var(--vp-green)' }}>{Number(president.integrity_score || 0).toFixed(0)}</div>
                                            <div className="text-[7px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>Integridad</div>
                                        </div>
                                        <div className="text-center p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.7)' }}>
                                            <div className="text-base font-black" style={{ color: 'var(--vp-blue)' }}>{Number(president.vote_count || 0).toLocaleString('es-PE')}</div>
                                            <div className="text-[7px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>Votos</div>
                                        </div>
                                    </div>
                                    {/* VP row */}
                                    {(() => {
                                        const candidateVPs = vicePresidents[String(president.id)] || [];
                                        return candidateVPs.length > 0 && (
                                            <div className="flex gap-2 mt-1">
                                                {candidateVPs.map(vp => (
                                                    <div key={vp.id} className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        <img
                                                            src={getCandidatePhoto(vp.photo, vp.name, 28, party.color)}
                                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(vp.name, 28, party.color); }}
                                                            alt={vp.name}
                                                            width={28}
                                                            height={28}
                                                            className="w-7 h-7 rounded-full shrink-0 object-cover"
                                                            style={{ border: '1.5px solid var(--vp-border)' }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-[9px] font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{vp.name}</div>
                                                            <div className="text-[7px]" style={{ color: 'var(--vp-text-dim)' }}>{vp.position_label}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                    <Link href={`/candidate/${president.id}`} className="block mt-2.5">
                                        <div className="text-center py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-[1.02]"
                                            style={{ background: party.color, color: '#fff' }}>
                                            Ver perfil completo →
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Row 2: Judicial summary + Position counts */}
                        <div className="pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            {/* Judicial summary - improved */}
                            <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                                <div className="text-base">⚖️</div>
                                <div className="flex-1">
                                    <div className="text-[9px] font-bold tracking-wider uppercase mb-1.5" style={{ color: 'var(--vp-text-dim)' }}>Situación Judicial</div>
                                    <div className="flex items-center gap-1.5">
                                        {/* Proportional bar */}
                                        <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: '#e5e7eb' }}>
                                            <div className="h-full transition-all" style={{ width: `${(analytics.candidatesClean / analytics.totalCandidates) * 100}%`, background: '#16a34a' }} />
                                            {analytics.candidatesWithSentences > 0 && (
                                                <div className="h-full transition-all" style={{ width: `${(analytics.candidatesWithSentences / analytics.totalCandidates) * 100}%`, background: '#dc2626' }} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
                                            <span className="text-[10px] font-bold" style={{ color: '#16a34a' }}>{analytics.candidatesClean} limpios</span>
                                        </div>
                                        {analytics.candidatesWithSentences > 0 && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
                                                <span className="text-[10px] font-bold" style={{ color: '#dc2626' }}>{analytics.candidatesWithSentences} con sentencia{analytics.candidatesWithSentences > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowJudicialModal(true)}
                                    className="text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                                    style={{ background: 'var(--vp-red)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                    Ver detalle →
                                </button>
                            </div>
                            {/* Position counts */}
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(ticket).map(([pos, cands]) => (
                                    <div key={pos} className="text-center py-1">
                                        <span className="text-base font-black" style={{ color: party.color }}>{cands.length}</span>
                                        <span className="text-[9px] font-bold tracking-wider uppercase ml-1.5" style={{ color: 'var(--vp-text-dim)' }}>
                                            {positionLabels[pos === 'president' ? 'president' : pos]?.replace(/^[^\s]+\s/, '') || pos}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== TOP CANDIDATES PER POSITION — SINGLE PANEL, 3 COLUMNS ===== */}
                {analytics && Object.keys(analytics.topByPosition).length > 0 && (
                    <div className="panel-glow mb-6">
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                            🏆 Mejores Candidatos por Cargo
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                Top 5
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {Object.entries(analytics.topByPosition).map(([position, topCandidates]) => (
                                topCandidates.length > 0 && (
                                    <div key={position}>
                                        <div className="text-xs font-bold tracking-wider uppercase mb-2 pb-1.5 flex items-center gap-1.5" style={{ color: positionColors[position] || party.color, borderBottom: `2px solid ${positionColors[position] || party.color}33` }}>
                                            {positionLabels[position]?.replace(/^[^\s]+\s/, '') || position}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {topCandidates.map((candidate, i) => (
                                                <Link href={`/candidate/${candidate.id}`} key={candidate.id}>
                                                    <div className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-white/5" style={{ background: i === 0 ? `${positionColors[position] || party.color}06` : 'transparent' }}>
                                                        <span className="text-xs font-black w-4 text-center shrink-0" style={{ color: i < 3 ? 'var(--vp-gold)' : 'var(--vp-text-dim)' }}>
                                                            {i + 1}
                                                        </span>
                                                        <img
                                                            src={getCandidatePhoto(candidate.photo, candidate.name, 32, party.color)}
                                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 32, party.color); }}
                                                            alt={candidate.name}
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 rounded-full shrink-0 object-cover"
                                                            style={{ border: '1.5px solid var(--vp-border)' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                                            <div className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>{candidate.region}</div>
                                                        </div>
                                                        <span className="score-badge shrink-0 text-[10px]">{Number(candidate.final_score).toFixed(1)}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== ALL CANDIDATES BY POSITION (Cards with Analysis) ===== */}
                {Object.entries(ticket).filter(([position]) => position !== 'president').map(([position, candidates]) => (
                    candidates.length > 0 && (
                        <div key={position} className="panel-glow mb-6">
                            <h3 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                                <span>{positionLabels[position] || position}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                    {candidates.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {candidates.map(candidate => (
                                    <Link href={`/candidate/${candidate.id}`} key={candidate.id}>
                                        <div className="panel-glow-subtle transition-colors hover:bg-white/5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <img
                                                    src={getCandidatePhoto(candidate.photo, candidate.name, 48, party.color)}
                                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 48, party.color); }}
                                                    alt={candidate.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-full shrink-0 object-cover"
                                                    style={{ border: '2px solid var(--vp-border)' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                                    <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                                        {candidate.region}
                                                        {candidate.list_position ? ` · N°${candidate.list_position}` : ''}
                                                    </div>
                                                    <StarRating rating={Number(candidate.stars_rating)} />
                                                </div>
                                                <span className="score-badge shrink-0">{Number(candidate.final_score).toFixed(1)}</span>
                                            </div>
                                            {/* Mini score bars */}
                                            <div className="mt-1">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-[8px] w-10 shrink-0" style={{ color: 'var(--vp-text-dim)' }}>IQ</span>
                                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(candidate.intelligence_score))}%`, background: 'var(--vp-blue)' }} />
                                                    </div>
                                                    <span className="text-[8px] font-bold w-6 text-right" style={{ color: 'var(--vp-text-dim)' }}>{Number(candidate.intelligence_score).toFixed(0)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-[8px] w-10 shrink-0" style={{ color: 'var(--vp-text-dim)' }}>Mom</span>
                                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(candidate.momentum_score))}%`, background: 'var(--vp-gold)' }} />
                                                    </div>
                                                    <span className="text-[8px] font-bold w-6 text-right" style={{ color: 'var(--vp-text-dim)' }}>{Number(candidate.momentum_score).toFixed(0)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[8px] w-10 shrink-0" style={{ color: 'var(--vp-text-dim)' }}>Int</span>
                                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number(candidate.integrity_score))}%`, background: 'var(--vp-green)' }} />
                                                    </div>
                                                    <span className="text-[8px] font-bold w-6 text-right" style={{ color: 'var(--vp-text-dim)' }}>{Number(candidate.integrity_score).toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </main>

            {/* ===== JUDICIAL DETAIL MODAL ===== */}
            {showJudicialModal && analytics && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden" style={{ background: 'var(--vp-surface, #fff)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff' }}>
                            <span className="text-2xl">⚖️</span>
                            <div className="flex-1">
                                <h3 className="text-base font-black">Situación Judicial</h3>
                                <p className="text-[10px] opacity-70">{party?.name} · {analytics.totalCandidates} candidatos</p>
                            </div>
                            {/* Summary badges */}
                            <div className="flex gap-2">
                                <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    ✅ {analytics.candidatesClean} limpios
                                </div>
                                {analytics.candidatesWithSentences > 0 && (
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                        ⚠️ {analytics.candidatesWithSentences} con sentencias
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowJudicialModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-white/20 transition-colors"
                                style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                            >×</button>
                        </div>

                        {/* Content - scrollable */}
                        <div className="overflow-y-auto p-4" style={{ flex: 1 }}>
                            {/* CANDIDATES WITH SENTENCES */}
                            {analytics.candidatesWithSentences > 0 && (
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full" style={{ background: '#dc2626' }} />
                                        <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: '#dc2626' }}>
                                            Candidatos con Sentencias ({analytics.candidatesWithSentences})
                                        </h4>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {analytics.sentencedCandidates.map((c: any) => {
                                            const hv = c.hoja_de_vida || {};
                                            const sentences = hv.sentences || [];
                                            return (
                                                <Link href={`/candidate/${c.id}`} key={c.id}
                                                    className="flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                                                    style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                                                    onClick={() => setShowJudicialModal(false)}
                                                >
                                                    <img
                                                        src={getCandidatePhoto(c.photo, c.name, 40, party?.color || '#666')}
                                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 40, party?.color || '#666'); }}
                                                        alt={c.name}
                                                        width={40} height={40}
                                                        className="w-10 h-10 rounded-full shrink-0 object-cover"
                                                        style={{ border: '2px solid #fecaca' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold truncate" style={{ color: '#1f2937' }}>{c.name}</div>
                                                        <div className="text-[9px] font-medium mb-1" style={{ color: '#6b7280' }}>
                                                            {c.position === 'president' ? 'Presidente' : c.position === 'senator' ? 'Senador' : c.position === 'deputy' ? 'Diputado' : 'P. Andino'}
                                                            {c.region ? ` · ${c.region}` : ''}
                                                        </div>
                                                        {sentences.map((s: any, i: number) => (
                                                            <div key={i} className="text-[9px] p-1.5 rounded-lg mb-1" style={{ background: 'rgba(220,38,38,0.08)' }}>
                                                                <span className="font-bold" style={{ color: '#dc2626' }}>
                                                                    {s.type || 'Sentencia'}
                                                                </span>
                                                                {s.case_number && <span style={{ color: '#6b7280' }}> · Exp: {s.case_number}</span>}
                                                                {s.court && <span style={{ color: '#6b7280' }}> · {s.court}</span>}
                                                                {s.verdict && <span style={{ color: '#991b1b' }}> · {s.verdict}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="score-badge shrink-0 text-[10px]">{Number(c.final_score).toFixed(1)}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* CLEAN CANDIDATES */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-3 h-3 rounded-full" style={{ background: '#16a34a' }} />
                                    <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: '#16a34a' }}>
                                        Candidatos sin Sentencias ({analytics.candidatesClean})
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {analytics.cleanCandidates.map((c: any) => (
                                        <Link href={`/candidate/${c.id}`} key={c.id}
                                            className="flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-green-50"
                                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                                            onClick={() => setShowJudicialModal(false)}
                                        >
                                            <img
                                                src={getCandidatePhoto(c.photo, c.name, 28, party?.color || '#666')}
                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 28, party?.color || '#666'); }}
                                                alt={c.name}
                                                width={28} height={28}
                                                className="w-7 h-7 rounded-full shrink-0 object-cover"
                                                style={{ border: '1.5px solid #bbf7d0' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold truncate" style={{ color: '#1f2937' }}>{c.name}</div>
                                                <div className="text-[8px]" style={{ color: '#6b7280' }}>
                                                    {c.position === 'president' ? 'Pres.' : c.position === 'senator' ? 'Sen.' : c.position === 'deputy' ? 'Dip.' : 'P.And.'}
                                                    {c.region ? ` · ${c.region}` : ''}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold" style={{ color: '#16a34a' }}>✅</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <button
                                onClick={() => setShowJudicialModal(false)}
                                className="text-xs font-bold px-6 py-2 rounded-lg transition-all hover:scale-105"
                                style={{ background: 'var(--vp-red)', color: '#fff', border: 'none', cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SiteFooter />
        </div>
    );
}
