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
        const intelligence = allCandidates.map(c => Number(c.intelligence_score));
        const momentum = allCandidates.map(c => Number(c.momentum_score));
        const integrity = allCandidates.map(c => Number(c.integrity_score));

        // Region analysis
        const regionCounts: Record<string, number> = {};
        const regionScores: Record<string, number[]> = {};
        allCandidates.forEach(c => {
            const r = c.region || 'Sin región';
            regionCounts[r] = (regionCounts[r] || 0) + 1;
            if (!regionScores[r]) regionScores[r] = [];
            regionScores[r].push(Number(c.final_score));
        });
        const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];
        const strongestRegion = Object.entries(regionScores)
            .map(([r, s]) => ({ region: r, avg: avg(s), count: s.length }))
            .filter(r => r.count >= 2)
            .sort((a, b) => b.avg - a.avg)[0];

        // Top candidates per position
        const topByPosition: Record<string, Candidate[]> = {};
        Object.entries(ticket).forEach(([pos, candidates]) => {
            if (pos !== 'president') {
                topByPosition[pos] = [...candidates]
                    .sort((a, b) => Number(b.final_score) - Number(a.final_score))
                    .slice(0, 5);
            }
        });

        return {
            totalCandidates: allCandidates.length,
            avgScore: avg(scores),
            avgIntelligence: avg(intelligence),
            avgMomentum: avg(momentum),
            avgIntegrity: avg(integrity),
            topScore: Math.max(...scores),
            topRegion: topRegion ? topRegion[0] : 'N/A',
            topRegionCount: topRegion ? topRegion[1] : 0,
            strongestRegion: strongestRegion?.region || 'N/A',
            strongestRegionAvg: strongestRegion?.avg || 0,
            topByPosition,
            totalVotes: allCandidates.reduce((s, c) => s + Number(c.vote_count || 0), 0),
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

                {/* ===== ANALYTICS DASHBOARD ===== */}
                {analytics && (
                    <div className="panel-glow mb-6">
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                            📊 Análisis de la Plancha
                        </h3>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            <MetricBox icon="🎯" label="Score Prom." value={analytics.avgScore.toFixed(1)} color="var(--vp-red)" />
                            <MetricBox icon="🗳️" label="Votos Total" value={analytics.totalVotes.toLocaleString('es-PE')} color="var(--vp-green)" />
                            <MetricBox icon="⭐" label="Top Score" value={analytics.topScore.toFixed(1)} color="var(--vp-gold)" />
                            <MetricBox icon="📍" label="Más Candidatos" value={analytics.topRegion} color="var(--vp-blue)" />
                        </div>

                        {/* Score Breakdown Bars */}
                        <div className="mb-4">
                            <div className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--vp-text-dim)' }}>
                                Métricas Promedio
                            </div>
                            <ScoreBar label="Inteligencia" value={analytics.avgIntelligence} color="var(--vp-blue)" />
                            <ScoreBar label="Momentum" value={analytics.avgMomentum} color="var(--vp-gold)" />
                            <ScoreBar label="Integridad" value={analytics.avgIntegrity} color="var(--vp-green)" />
                        </div>

                        {/* Candidates by Position */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            {Object.entries(ticket).map(([pos, cands]) => (
                                <div key={pos} className="text-center p-2">
                                    <div className="text-lg font-black" style={{ color: party.color }}>{cands.length}</div>
                                    <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>
                                        {positionLabels[pos === 'president' ? 'president' : pos]?.replace(/^[^\s]+\s/, '') || pos}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== PRESIDENTIAL ANALYSIS CARD ===== */}
                {president && (
                    <div className="panel-glow mb-6" style={{ border: `2px solid ${party.color}33`, background: `linear-gradient(135deg, ${party.color}08, transparent)` }}>
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                            🏛️ Análisis del Candidato Presidencial
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-5">
                            {/* Left: Photo + Basic Info */}
                            <Link href={`/candidate/${president.id}`} className="shrink-0">
                                <div className="flex sm:flex-col items-center gap-3 sm:text-center">
                                    <img
                                        src={getCandidatePhoto(president.photo, president.name, 80, party.color)}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(president.name, 80, party.color); }}
                                        alt={president.name}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-full object-cover"
                                        style={{ border: `3px solid ${party.color}`, boxShadow: `0 0 20px ${party.color}33` }}
                                    />
                                    <div>
                                        <div className="text-base font-black" style={{ color: 'var(--vp-text)' }}>{president.name}</div>
                                        <div className="text-[11px] font-bold" style={{ color: party.color }}>Presidente(a)</div>
                                        <StarRating rating={Number(president.stars_rating)} />
                                    </div>
                                </div>
                            </Link>

                            {/* Right: Scores + Metrics */}
                            <div className="flex-1">
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-xl font-black" style={{ color: 'var(--vp-red)' }}>{Number(president.final_score).toFixed(1)}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Score Final</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-xl font-black" style={{ color: 'var(--vp-blue)' }}>{Number(president.intelligence_score).toFixed(0)}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Inteligencia</div>
                                    </div>
                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                        <div className="text-xl font-black" style={{ color: 'var(--vp-green)' }}>{Number(president.vote_count || 0).toLocaleString('es-PE')}</div>
                                        <div className="text-[8px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>Votos</div>
                                    </div>
                                </div>

                                <ScoreBar label="Inteligencia" value={Number(president.intelligence_score)} color="var(--vp-blue)" />
                                <ScoreBar label="Momentum" value={Number(president.momentum_score)} color="var(--vp-gold)" />
                                <ScoreBar label="Integridad" value={Number(president.integrity_score)} color="var(--vp-green)" />
                                <ScoreBar label="Riesgo" value={Number(president.risk_score)} color="var(--vp-red)" />

                                <Link href={`/candidate/${president.id}`} className="block mt-3">
                                    <div className="text-center py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                        style={{ background: party.color, color: '#fff', boxShadow: `0 0 12px ${party.color}44` }}>
                                        Ver perfil completo →
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Vice Presidents */}
                        {(() => {
                            const candidateVPs = vicePresidents[String(president.id)] || [];
                            return candidateVPs.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5 pt-4" style={{ borderTop: `1px solid ${party.color}22` }}>
                                    {candidateVPs.map(vp => (
                                        <div key={vp.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                            <img
                                                src={getCandidatePhoto(vp.photo, vp.name, 44, party.color)}
                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(vp.name, 44, party.color); }}
                                                alt={vp.name}
                                                width={44}
                                                height={44}
                                                className="w-11 h-11 rounded-full shrink-0 object-cover"
                                                style={{ border: '2px solid var(--vp-border)' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{vp.name}</div>
                                                <div className="text-[10px] font-medium" style={{ color: 'var(--vp-text-dim)' }}>
                                                    {vp.position_label}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
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
            <SiteFooter />
        </div>
    );
}
