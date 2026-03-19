'use client';

import { useState, useEffect, useMemo } from 'react';
import { Candidate, Party, getPartyFullTicket } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';
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
        const experienceScores = allCandidates.map(c => Number(c.experience_score || 0));
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

        // Antecedentes: % of candidates with clean judicial records (no sentences)
        const cleanCount = cleanCandidates.length;
        const antecedentesScore = allCandidates.length > 0 ? (cleanCount / allCandidates.length) * 100 : 0;

        return {
            totalCandidates: allCandidates.length,
            avgScore: avg(scores),
            avgHoja: avg(hojaScores),
            avgPlan: avg(planScores),
            avgExperiencia: avg(experienceScores),
            avgIntegrity: avg(integrity),
            antecedentesScore,
            cleanCount,
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

            {/* ═══ FULL-WIDTH PARTY HERO BANNER ═══ */}
            <div className="cp-hero-banner" style={{ paddingBottom: president ? '48px' : '36px' }}>
                <div className="cp-hero-inner">
                    <button onClick={() => window.history.back()} className="cp-back-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Volver
                    </button>
                    <div className="cp-hero-content">
                        {/* Party Logo / Abbreviation */}
                        <div className="pp-hero-logo" style={{ background: party.color || 'var(--vp-red)' }}>
                            {party.logo ? (
                                <img src={party.logo} alt={party.name} className="pp-hero-logo-img"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : null}
                            <span className="pp-hero-logo-text" style={{ display: party.logo ? 'none' : 'flex' }}>
                                {party.abbreviation?.slice(0, 3)}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="cp-hero-info">
                            <h1 className="cp-hero-name">{party.name}</h1>
                            <div className="cp-hero-badges">
                                <span className="cp-badge-position" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                                    Ranking #{party.ranking_position || '-'}
                                </span>
                                <span className="cp-badge-ai" style={{ cursor: 'default' }}>
                                    {analytics?.totalCandidates || 0} candidatos
                                </span>
                            </div>
                            {analytics && (
                                <div className="pp-hero-stats">
                                    <div className="pp-stat">
                                        <span className="pp-stat-val" style={{ color: '#ff6b6b' }}>{analytics.avgScore.toFixed(1)}</span>
                                        <span className="pp-stat-lbl">Score Prom.</span>
                                    </div>
                                    <div className="pp-stat">
                                        <span className="pp-stat-val" style={{ color: '#4ade80' }}>{analytics.totalVotes.toLocaleString('es-PE')}</span>
                                        <span className="pp-stat-lbl">Votos</span>
                                    </div>
                                    <div className="pp-stat">
                                        <span className="pp-stat-val" style={{ color: '#fbbf24' }}>{analytics.topScore.toFixed(1)}</span>
                                        <span className="pp-stat-lbl">Top Score</span>
                                    </div>
                                    <div className="pp-stat">
                                        <span className="pp-stat-val" style={{ color: '#93c5fd' }}>{analytics.topRegion}</span>
                                        <span className="pp-stat-lbl">Más Cand.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Score Circle */}
                        <div className="cp-hero-score-wrap">
                            <div className="cp-hero-score-circle">
                                <svg viewBox="0 0 120 120" className="cp-hero-score-svg">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="52" fill="none" stroke={party.color || '#fff'} strokeWidth="8"
                                        strokeDasharray={`${(Number(party.party_full_score || 0) / 100) * 327} 327`} strokeLinecap="round"
                                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 1.5s ease-out' }} />
                                </svg>
                                <div className="cp-hero-score-value">{Number(party.party_full_score || 0).toFixed(1)}</div>
                            </div>
                            <div className="cp-hero-score-label">SCORE PLANCHA</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ PRESIDENTIAL CANDIDATE + JUDICIAL SUMMARY CARDS ═══ */}
            {analytics && (
                <div className="cp-score-cards" style={{ gridTemplateColumns: president ? '1fr 1fr' : '1fr' }}>
                    {/* Presidential Candidate Card */}
                    {president && (
                        <div className="pp-president-card" style={{ borderTopColor: party.color || '#c62828' }}>
                            <div className="pp-pres-header">
                                <span>🏛️</span>
                                <span style={{ color: party.color }}>Candidato Presidencial</span>
                            </div>
                            <Link href={`/candidate/${president.id}`} className="pp-pres-profile">
                                <img
                                    src={getCandidatePhoto(president.photo, president.name, 64, party.color)}
                                    onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(president.name, 64, party.color); } }}
                                    alt={president.name} width={64} height={64}
                                    className="pp-pres-photo"
                                    style={{ borderColor: party.color }}
                                />
                                <div className="pp-pres-info">
                                    <div className="pp-pres-name">{president.name}</div>
                                    <StarRating rating={Number(president.stars_rating)} />
                                    <div className="pp-pres-stats">
                                        <span className="pp-pres-score" style={{ color: 'var(--vp-red)' }}>{Number(president.final_score).toFixed(1)}</span>
                                        <span className="pp-pres-score" style={{ color: 'var(--vp-green)' }}>Int: {Number(president.integrity_score || 0).toFixed(0)}</span>
                                        <span className="pp-pres-score" style={{ color: 'var(--vp-blue)' }}>🗳️ {Number(president.vote_count || 0).toLocaleString('es-PE')}</span>
                                    </div>
                                </div>
                            </Link>
                            {/* VP row */}
                            {(() => {
                                const candidateVPs = vicePresidents[String(president.id)] || [];
                                return candidateVPs.length > 0 && (
                                    <div className="pp-vp-row">
                                        {candidateVPs.map(vp => (
                                            <div key={vp.id} className="pp-vp-item">
                                                <img
                                                    src={getCandidatePhoto(vp.photo, vp.name, 28, party.color)}
                                                    onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(vp.name, 28, party.color); } }}
                                                    alt={vp.name} width={28} height={28}
                                                    className="pp-vp-photo"
                                                />
                                                <div className="pp-vp-info">
                                                    <div className="pp-vp-name">{vp.name}</div>
                                                    <div className="pp-vp-role">{vp.position_label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                            <Link href={`/candidate/${president.id}`} className="pp-pres-btn" style={{ background: party.color }}>
                                Ver perfil completo →
                            </Link>
                        </div>
                    )}

                    {/* Judicial / Score Summary Card */}
                    <div className="pp-judicial-card" style={{ borderTopColor: '#1e3a5f' }}>
                        <div className="pp-pres-header">
                            <span>⚖️</span>
                            <span style={{ color: '#1e3a5f' }}>Situación Judicial</span>
                        </div>
                        <div className="pp-judicial-bar-wrap">
                            <div className="pp-judicial-bar">
                                <div style={{ width: `${(analytics.candidatesClean / analytics.totalCandidates) * 100}%`, background: '#16a34a' }} />
                                {analytics.candidatesWithSentences > 0 && (
                                    <div style={{ width: `${(analytics.candidatesWithSentences / analytics.totalCandidates) * 100}%`, background: '#dc2626' }} />
                                )}
                            </div>
                            <div className="pp-judicial-legend">
                                <span style={{ color: '#16a34a' }}>✅ {analytics.candidatesClean} limpios</span>
                                {analytics.candidatesWithSentences > 0 && (
                                    <span style={{ color: '#dc2626' }}>⚠️ {analytics.candidatesWithSentences} con sentencia{analytics.candidatesWithSentences > 1 ? 's' : ''}</span>
                                )}
                            </div>
                        </div>
                        {/* Formula Bars */}
                        <div className="pp-formula-section">
                            <div className="pp-formula-title">Fórmula de Plancha</div>
                            <ScoreBar label={`Antecedentes (${analytics.cleanCount}/${analytics.totalCandidates})`} value={analytics.antecedentesScore} color="#0ea5e9" />
                            <ScoreBar label="Plan de Gob." value={analytics.avgPlan} color="#2563eb" />
                            <ScoreBar label="Hoja de Vida" value={analytics.avgHoja} color="#312e81" />
                            <ScoreBar label="Score Prom." value={analytics.avgScore} color="#f59e0b" />
                        </div>
                        <button onClick={() => setShowJudicialModal(true)} className="pp-judicial-btn">
                            Ver detalle judicial →
                        </button>
                        {/* Position counts */}
                        <div className="pp-position-counts">
                            {Object.entries(ticket).map(([pos, cands]) => (
                                <div key={pos} className="pp-pos-item">
                                    <span className="pp-pos-count" style={{ color: party.color }}>{cands.length}</span>
                                    <span className="pp-pos-label">
                                        {positionLabels[pos === 'president' ? 'president' : pos]?.replace(/^[^\s]+\s/, '') || pos}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="internal-page-wrapper">

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
                                                            onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 32, party.color); } }}
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
                                                    onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 48, party.color); } }}
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
                                                        onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 40, party?.color || '#666'); } }}
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
                                                onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 28, party?.color || '#666'); } }}
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
