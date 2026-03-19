'use client';

import { useState, useEffect, useMemo } from 'react';
import { Party, Candidate, getParties, getRanking } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';
import Link from 'next/link';

interface PlanchaData {
    party: Party;
    presidential: Candidate | null;
    allCandidates: Candidate[];
}

// Helper: compute plancha score from candidate data using the formula
// (HV×0.30) + (Exp×0.25) + (Int×0.35) + (Plan×0.10)
function getPlanchaScore(p: PlanchaData): number {
    const cands = p.allCandidates;
    const n = cands.length;
    if (n === 0) return 0;
    const avgHoja = cands.reduce((s, c) => s + Number((c as any).hoja_score || 0), 0) / n;
    const avgExp = cands.reduce((s, c) => s + Number(c.experience_score || 0), 0) / n;
    const avgInt = cands.reduce((s, c) => s + Number(c.integrity_score || 0), 0) / n;
    const avgPlan = cands.reduce((s, c) => s + Number((c as any).plan_score || 0), 0) / n;
    return parseFloat(((avgHoja * 0.30) + (avgExp * 0.25) + (avgInt * 0.35) + (avgPlan * 0.10)).toFixed(1));
}

export default function PlanchasPanel() {
    const [planchas, setPlanchas] = useState<PlanchaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'score' | 'name' | 'candidates' | 'totalScore'>('score');

    useEffect(() => {
        async function fetchPlanchas() {
            try {
                // Fetch each endpoint independently so partial failures don't kill everything
                const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T, label = ''): Promise<T> => {
                    try { return await fn(); } catch (e) { console.error(`[PlanchasPanel] safeFetch ${label} FAILED:`, e); return fallback; }
                };

                const [parties, presidents, senators, deputies, andean] = await Promise.all([
                    safeFetch(getParties, [], 'parties'),
                    safeFetch(() => getRanking('president'), [], 'president'),
                    safeFetch(() => getRanking('senator'), [], 'senator'),
                    safeFetch(() => getRanking('deputy'), [], 'deputy'),
                    safeFetch(() => getRanking('andean'), [], 'andean'),
                ]);

                if (!parties.length) {
                    setError('No se pudieron cargar los partidos. Intenta de nuevo.');
                    setLoading(false);
                    return;
                }

                const allCandidates = [...(presidents || []), ...(senators || []), ...(deputies || []), ...(andean || [])];

                const data: PlanchaData[] = parties.map(party => {
                    const pres = (presidents || []).find(c =>
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
                setError('Error cargando planchas. Intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        }
        fetchPlanchas();
    }, []);

    const sorted = useMemo(() => {
        return [...planchas].sort((a, b) => {
            if (sortBy === 'score') {
                return getPlanchaScore(b) - getPlanchaScore(a);
            }
            if (sortBy === 'name') return a.party.name.localeCompare(b.party.name);
            if (sortBy === 'candidates') return b.allCandidates.length - a.allCandidates.length;
            if (sortBy === 'totalScore') {
                const totalA = a.allCandidates.reduce((s, c) => s + Number(c.final_score || 0), 0);
                const totalB = b.allCandidates.reduce((s, c) => s + Number(c.final_score || 0), 0);
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

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <p className="text-lg mb-2">⚠️</p>
                    <p className="text-sm mb-3" style={{ color: 'var(--vp-text-dim)' }}>{error}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--vp-red)' }}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="planchas-page">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                    🏛️ <span style={{ color: 'var(--vp-red)' }}>PLANCHAS</span> PRESIDENCIALES
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    Elecciones Generales 2026 — {planchas.length} organizaciones políticas
                </p>
            </div>

            {/* ═══════════ ANALYTICS DASHBOARD ═══════════ */}
            {/* Dashboard removed */}

            {/* Sort controls */}
            <div className="planchas-sort-bar">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { id: 'score' as const, label: 'Score' },
                        { id: 'totalScore' as const, label: 'Score Total' },
                        { id: 'name' as const, label: 'A-Z' },
                        { id: 'candidates' as const, label: 'Candidatos' },
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSortBy(s.id)}
                            className={`planchas-sort-btn ${sortBy === s.id ? 'active' : ''}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <span className="planchas-count-badge">
                    {planchas.length} planchas
                </span>
            </div>

            {/* Cards Grid — responsive 1/2/3 columns */}
            <div className="planchas-grid">
                {sorted.map((plancha, index) => (
                    <PlanchaCard key={plancha.party.id} plancha={plancha} rank={index + 1} />
                ))}
            </div>
        </div>
    );
}

/* ======================== ANALYTICS DASHBOARD ======================== */
function PlanchasDashboard({ planchas, sorted }: { planchas: PlanchaData[]; sorted: PlanchaData[] }) {
    const stats = useMemo(() => {
        const totalCandidates = planchas.reduce((s, p) => s + p.allCandidates.length, 0);
        const totalVotes = planchas.reduce((s, p) => s + p.allCandidates.reduce((v, c) => v + (c.vote_count || 0), 0), 0);

        const scores = planchas.map(p => getPlanchaScore(p));
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const maxScore = Math.max(...scores);
        const bestIdx = scores.indexOf(maxScore);
        const bestPlancha = planchas[bestIdx];

        // Quality tiers
        const excelente = scores.filter(s => s >= 70).length;
        const buena = scores.filter(s => s >= 50 && s < 70).length;
        const regular = scores.filter(s => s >= 30 && s < 50).length;
        const baja = scores.filter(s => s < 30).length;

        // Global component averages across ALL candidates
        const allC = planchas.flatMap(p => p.allCandidates);
        const globalAvg = (field: string) => allC.length > 0 ? allC.reduce((s, c) => s + Number((c as any)[field] || 0), 0) / allC.length : 0;
        const avgHoja = globalAvg('hoja_score');
        const avgExp = globalAvg('experience_score');
        const avgInt = globalAvg('integrity_score');
        const avgPlan = globalAvg('plan_score');

        // Integrity insights
        const sentencedCandidates = allC.filter(c => {
            const hv = (c as any).hoja_de_vida || {};
            return (hv.sentences || []).length > 0;
        }).length;
        const cleanCandidates = totalCandidates - sentencedCandidates;
        const partiesWithSentences = planchas.filter(p => 
            p.allCandidates.some(c => {
                const hv = (c as any).hoja_de_vida || {};
                return (hv.sentences || []).length > 0;
            })
        ).length;

        // Position totals
        const posTotals = {
            president: allC.filter(c => c.position === 'president').length,
            senator: allC.filter(c => c.position === 'senator').length,
            deputy: allC.filter(c => c.position === 'deputy').length,
            andean: allC.filter(c => c.position === 'andean').length,
        };

        return { totalCandidates, totalVotes, avgScore, maxScore, bestPlancha, excelente, buena, regular, baja, avgHoja, avgExp, avgInt, avgPlan, sentencedCandidates, cleanCandidates, partiesWithSentences, posTotals };
    }, [planchas]);

    const top5 = sorted.slice(0, 5);

    if (planchas.length === 0) return null;

    return (
        <div className="pd-dashboard">
            {/* ── Row 1: KPI Cards ── */}
            <div className="pd-kpi-row">
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: 'var(--vp-red)' }}>{planchas.length}</span><span className="pd-kpi-lbl">Planchas</span></div>
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: '#2563eb' }}>{stats.totalCandidates.toLocaleString()}</span><span className="pd-kpi-lbl">Candidatos</span></div>
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: '#16a34a' }}>{stats.cleanCandidates.toLocaleString()}</span><span className="pd-kpi-lbl">Sin Sentencias</span></div>
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: '#dc2626' }}>{stats.sentencedCandidates}</span><span className="pd-kpi-lbl">Con Sentencias</span></div>
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: '#ca8a04' }}>{Number(stats.avgScore || 0).toFixed(1)}</span><span className="pd-kpi-lbl">Score Promedio</span></div>
                <div className="pd-kpi"><span className="pd-kpi-val" style={{ color: '#16a34a' }}>{Number(stats.maxScore || 0).toFixed(1)}</span><span className="pd-kpi-lbl">Mejor Score</span></div>
            </div>

            {/* ── Row 2: Three columns ── */}
            <div className="pd-two-cols">
                {/* Left: Component Averages + Quality Distribution */}
                <div className="pd-card">
                    <h3 className="pd-card-title">📊 Promedios por Componente</h3>
                    <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 10px', fontStyle: 'italic' }}>
                        Promedios globales de los {stats.totalCandidates.toLocaleString()} candidatos
                    </p>
                    {[
                        { label: 'Hoja de Vida', value: stats.avgHoja, weight: '30%', color: '#312e81' },
                        { label: 'Experiencia', value: stats.avgExp, weight: '25%', color: '#f59e0b' },
                        { label: 'Integridad', value: stats.avgInt, weight: '35%', color: '#0ea5e9' },
                        { label: 'Plan de Gobierno', value: stats.avgPlan, weight: '10%', color: '#2563eb' },
                    ].map(comp => (
                        <div key={comp.label} className="pd-pos-row" style={{ marginBottom: 4 }}>
                            <span className="pd-pos-label" style={{ fontSize: '0.65rem', width: 95 }}>{comp.label} ({comp.weight})</span>
                            <div className="pd-pos-bar-wrap">
                                <div className="pd-pos-bar" style={{ width: `${comp.value}%`, background: comp.color }} />
                            </div>
                            <span className="pd-pos-count" style={{ color: comp.color, fontSize: '0.7rem', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>{comp.value.toFixed(1)}</span>
                        </div>
                    ))}

                    <h3 className="pd-card-title" style={{ marginTop: 16 }}>⚖️ Situación Judicial Global</h3>
                    <div className="pd-dist-bar" style={{ borderRadius: 6 }}>
                        <div className="pd-dist-seg" style={{ flex: stats.cleanCandidates, background: '#16a34a' }} title={`Limpios: ${stats.cleanCandidates}`}>{stats.cleanCandidates}</div>
                        {stats.sentencedCandidates > 0 && <div className="pd-dist-seg" style={{ flex: stats.sentencedCandidates, background: '#dc2626' }} title={`Con sentencia: ${stats.sentencedCandidates}`}>{stats.sentencedCandidates}</div>}
                    </div>
                    <div className="pd-dist-legend">
                        <span><i style={{ background: '#16a34a' }} /> ✅ Limpios ({stats.cleanCandidates})</span>
                        <span><i style={{ background: '#dc2626' }} /> ⚠️ Con sentencias ({stats.sentencedCandidates})</span>
                    </div>
                    <p style={{ fontSize: '0.6rem', color: '#6b7280', margin: '6px 0 0', fontStyle: 'italic' }}>
                        {stats.partiesWithSentences} de {planchas.length} planchas tienen candidatos con sentencias judiciales
                    </p>
                </div>

                {/* Right: Top 5 + Quality Distribution + Positions */}
                <div className="pd-card">
                    <h3 className="pd-card-title">🏆 Top 5 Planchas</h3>
                    <div className="pd-top5">
                        {top5.map((p, i) => {
                            const sc = getPlanchaScore(p);
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={p.party.id} className="pd-top5-row">
                                    <span className="pd-top5-rank">{medals[i] || `${i + 1}`}</span>
                                    <span className="pd-top5-name">{p.party.abbreviation}</span>
                                    <div className="pd-top5-bar-wrap">
                                        <div className="pd-top5-bar" style={{ width: `${(sc / (stats.maxScore || 1)) * 100}%`, background: p.party.color || 'var(--vp-red)' }} />
                                    </div>
                                    <span className="pd-top5-score">{Number(sc || 0).toFixed(1)}</span>
                                </div>
                            );
                        })}
                    </div>

                    <h3 className="pd-card-title" style={{ marginTop: 16 }}>📋 Distribución de Calidad</h3>
                    <div className="pd-dist-bar">
                        {stats.excelente > 0 && <div className="pd-dist-seg" style={{ flex: stats.excelente, background: '#16a34a' }} title={`Excelente: ${stats.excelente}`}>{stats.excelente}</div>}
                        {stats.buena > 0 && <div className="pd-dist-seg" style={{ flex: stats.buena, background: '#2563eb' }} title={`Buena: ${stats.buena}`}>{stats.buena}</div>}
                        {stats.regular > 0 && <div className="pd-dist-seg" style={{ flex: stats.regular, background: '#ca8a04' }} title={`Regular: ${stats.regular}`}>{stats.regular}</div>}
                        {stats.baja > 0 && <div className="pd-dist-seg" style={{ flex: stats.baja, background: '#dc2626' }} title={`Baja: ${stats.baja}`}>{stats.baja}</div>}
                    </div>
                    <div className="pd-dist-legend">
                        <span><i style={{ background: '#16a34a' }} /> Excelente ≥70 ({stats.excelente})</span>
                        <span><i style={{ background: '#2563eb' }} /> Buena 50-69 ({stats.buena})</span>
                        <span><i style={{ background: '#ca8a04' }} /> Regular 30-49 ({stats.regular})</span>
                        <span><i style={{ background: '#dc2626' }} /> Baja &lt;30 ({stats.baja})</span>
                    </div>

                    <h3 className="pd-card-title" style={{ marginTop: 16 }}>👥 Candidatos por Cargo</h3>
                    <div className="pd-pos-bars">
                        {[
                            { label: 'Presidente', count: stats.posTotals.president, color: '#dc2626', icon: '🏛️' },
                            { label: 'Senador', count: stats.posTotals.senator, color: '#2563eb', icon: '👔' },
                            { label: 'Diputado', count: stats.posTotals.deputy, color: '#16a34a', icon: '📋' },
                            { label: 'P. Andino', count: stats.posTotals.andean, color: '#7c3aed', icon: '🌎' },
                        ].map(pos => (
                            <div key={pos.label} className="pd-pos-row">
                                <span className="pd-pos-icon">{pos.icon}</span>
                                <span className="pd-pos-label">{pos.label}</span>
                                <div className="pd-pos-bar-wrap">
                                    <div className="pd-pos-bar" style={{ width: `${(pos.count / Math.max(...Object.values(stats.posTotals), 1)) * 100}%`, background: pos.color }} />
                                </div>
                                <span className="pd-pos-count" style={{ color: pos.color }}>{pos.count.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Best Plancha highlight */}
            {stats.bestPlancha && (
                <div className="pd-best-strip">
                    <span className="pd-best-medal">🏆</span>
                    <span className="pd-best-text">
                        Mejor plancha: <strong style={{ color: stats.bestPlancha.party.color }}>{stats.bestPlancha.party.name}</strong>
                        {' '}({stats.bestPlancha.party.abbreviation}) — Score Plancha: <strong>{Number(stats.maxScore || 0).toFixed(1)}</strong>
                    </span>
                </div>
            )}
        </div>
    );
}

/* ======================== PLANCHA CARD ======================== */
function PlanchaCard({ plancha, rank }: { plancha: PlanchaData; rank: number }) {
    const { party, presidential, allCandidates } = plancha;

    const totalCandidates = allCandidates.length;
    const totalScore = allCandidates.reduce((s, c) => s + Number(c.final_score || 0), 0);
    const totalVotes = allCandidates.reduce((s, c) => s + (c.vote_count || 0), 0);
    const avgIntelligence = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.intelligence_score || 0), 0) / totalCandidates : 0;
    const avgMomentum = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.momentum_score || 0), 0) / totalCandidates : 0;
    const avgIntegrity = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.integrity_score || 0), 0) / totalCandidates : 0;
    const avgStars = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.stars_rating || 0), 0) / totalCandidates : 0;

    // New scoring averages
    const avgHojaScore = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number((c as any).hoja_score || 0), 0) / totalCandidates : 0;
    const avgPlanScore = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number((c as any).plan_score || 0), 0) / totalCandidates : 0;
    const avgExperiencia = totalCandidates > 0 ? allCandidates.reduce((s, c) => s + Number(c.experience_score || 0), 0) / totalCandidates : 0;
    // Antecedentes: % of candidates with NO sentences (clean record from hoja_de_vida)
    const cleanCandidates = allCandidates.filter(c => {
        const hv = (c as any).hoja_de_vida || {};
        return !hv.sentences || hv.sentences.length === 0;
    }).length;
    const antecedentesScore = totalCandidates > 0 ? (cleanCandidates / totalCandidates) * 100 : 0;
    // Average final score of all candidates
    const avgFinalScore = totalCandidates > 0 ? totalScore / totalCandidates : 0;

    // Calculate plancha score using the formula: 
    // plancha = (HV×0.30) + (Experiencia×0.25) + (Integridad×0.35) + (Plan×0.10)
    const calculatedPlanchaScore = (avgHojaScore * 0.30) + (avgExperiencia * 0.25) + (avgIntegrity * 0.35) + (avgPlanScore * 0.10);
    const displayScore = Number(calculatedPlanchaScore || 0);

    const byPosition = {
        president: allCandidates.filter(c => c.position === 'president').length,
        senator: allCandidates.filter(c => c.position === 'senator').length,
        deputy: allCandidates.filter(c => c.position === 'deputy').length,
        andean: allCandidates.filter(c => c.position === 'andean').length,
    };

    return (
        <div className="plancha-card" style={{ borderTop: `3px solid ${party.color}` }}>
            {/* ── Header: Rank + Name + Score ── */}
            <div className="plancha-card-header">
                <div className="plancha-rank-badge" style={{ background: rank <= 3 ? 'var(--vp-red)' : '#6b7280', color: '#fff' }}>
                    {rank}
                </div>
                {party.logo && (
                    <img
                        src={party.logo}
                        alt={party.name}
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                )}
                <div className="plancha-party-info">
                    <h3 className="plancha-party-name">{party.name}</h3>
                    <span className="plancha-party-abbr" style={{ color: party.color }}>
                        {party.abbreviation} · {totalCandidates} candidatos
                    </span>
                </div>
                <div className="plancha-score-col">
                    <span className="plancha-score-badge" style={{ background: displayScore >= 50 ? '#16a34a' : displayScore >= 35 ? '#ca8a04' : '#dc2626' }}>
                        {Number(displayScore || 0).toFixed(1)}
                    </span>
                    <span className="plancha-score-label">PUNTOS</span>
                </div>
            </div>

            {/* ── Presidential Candidate ── */}
            {presidential && (
                <Link href={`/candidate/${presidential.id}`} className="plancha-presidential">
                    <img
                        src={getCandidatePhoto(presidential.photo, presidential.name, 40, party.color)}
                        onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(presidential.name, 40, party.color); } }}
                        alt={presidential.name}
                        width={40}
                        height={40}
                        className="plancha-pres-avatar"
                        style={{ border: `2px solid ${party.color}` }}
                    />
                    <div className="plancha-pres-info">
                        <div className="plancha-pres-name">{presidential.name}</div>
                        <div className="plancha-pres-role">Candidato(a) Presidencial</div>
                    </div>
                    <span className="plancha-pres-score" style={{ background: Number(presidential.final_score) >= 50 ? '#16a34a' : Number(presidential.final_score) >= 35 ? '#ca8a04' : '#dc2626' }}>
                        {Number(presidential.final_score || 0).toFixed(1)}
                    </span>
                </Link>
            )}

            {/* ── Stats Row ── */}
            <div className="plancha-stats-grid">
                <div className="plancha-mini-stat">
                    <span className="plancha-mini-val" style={{ color: 'var(--vp-red)' }}>{Number(totalScore || 0).toFixed(0)}</span>
                    <span className="plancha-mini-lbl">SCORE TOTAL</span>
                </div>
                <div className="plancha-mini-stat">
                    <span className="plancha-mini-val" style={{ color: '#16a34a' }}>{totalVotes.toLocaleString()}</span>
                    <span className="plancha-mini-lbl">VOTOS TOTALES</span>
                </div>
                <div className="plancha-mini-stat">
                    <span className="plancha-mini-val" style={{ color: '#2563eb' }}>{totalCandidates}</span>
                    <span className="plancha-mini-lbl">CANDIDATOS</span>
                </div>
                <div className="plancha-mini-stat">
                    <span className="plancha-mini-val" style={{ color: '#ca8a04' }}>{Number(avgStars || 0).toFixed(1)}</span>
                    <span className="plancha-mini-lbl">ESTRELLAS PROM.</span>
                </div>
            </div>

            {/* ── Componentes del Score de Plancha ── */}
            <div className="plancha-section">
                <h4 className="plancha-section-title">📊 FÓRMULA DE PLANCHA</h4>
                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0 0 8px', fontStyle: 'italic' }}>
                    plancha = (HV×0.30) + (Exp×0.25) + (Integridad×0.35) + (Plan×0.10)
                </p>
                <div className="plancha-breakdown">
                    <div className="plancha-brk-item">
                        <span>📄 Hoja de Vida (30%)</span>
                        <div style={{ flex: 1, margin: '0 8px', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${avgHojaScore}%`, height: '100%', background: '#312e81', borderRadius: 3 }} />
                        </div>
                        <span className="plancha-brk-val" style={{ color: '#312e81' }}>{Number(avgHojaScore * 0.30 || 0).toFixed(1)}</span>
                    </div>
                    <div className="plancha-brk-item">
                        <span>🏛️ Experiencia (25%)</span>
                        <div style={{ flex: 1, margin: '0 8px', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${avgExperiencia}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                        </div>
                        <span className="plancha-brk-val" style={{ color: '#f59e0b' }}>{Number(avgExperiencia * 0.25 || 0).toFixed(1)}</span>
                    </div>
                    <div className="plancha-brk-item">
                        <span>⚖️ Integridad (35%)</span>
                        <div style={{ flex: 1, margin: '0 8px', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${avgIntegrity}%`, height: '100%', background: '#0ea5e9', borderRadius: 3 }} />
                        </div>
                        <span className="plancha-brk-val" style={{ color: '#0ea5e9' }}>{Number(avgIntegrity * 0.35 || 0).toFixed(1)}</span>
                    </div>
                    <div className="plancha-brk-item">
                        <span>📋 Plan de Gobierno (10%)</span>
                        <div style={{ flex: 1, margin: '0 8px', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${avgPlanScore}%`, height: '100%', background: '#2563eb', borderRadius: 3 }} />
                        </div>
                        <span className="plancha-brk-val" style={{ color: '#2563eb' }}>{Number(avgPlanScore * 0.10 || 0).toFixed(1)}</span>
                    </div>
                    <div className="plancha-brk-item" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 6, marginTop: 4 }}>
                        <span style={{ fontWeight: 700 }}>TOTAL</span>
                        <span className="plancha-brk-val" style={{ color: displayScore >= 50 ? '#16a34a' : displayScore >= 35 ? '#ca8a04' : '#dc2626', fontWeight: 700, fontSize: '1rem' }}>
                            {Number(displayScore || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Candidatos por Cargo ── */}
            <div className="plancha-section">
                <h4 className="plancha-section-title">CANDIDATOS POR CARGO</h4>
                <div className="plancha-positions">
                    <PosCount icon="🏛️" label="PRES." count={byPosition.president} color={party.color} />
                    <PosCount icon="👔" label="SEN." count={byPosition.senator} color={party.color} />
                    <PosCount icon="📋" label="DIP." count={byPosition.deputy} color={party.color} />
                    <PosCount icon="🌎" label="P.AND." count={byPosition.andean} color={party.color} />
                </div>
            </div>

            {/* ── CTA ── */}
            <Link href={`/party/${party.id}`}
                className="plancha-cta"
                style={{ background: party.color }}>
                Ver Plancha Completa →
            </Link>
        </div>
    );
}

/* ======================== SUB-COMPONENTS ======================== */
function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
    const pct = Math.min(100, value);
    return (
        <div className="plancha-metric-row">
            <span className="plancha-metric-label">{label}</span>
            <div className="plancha-metric-track">
                <div className="plancha-metric-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="plancha-metric-val" style={{ color }}>{Number(value || 0).toFixed(1)}</span>
        </div>
    );
}

function PosCount({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
    return (
        <div className="plancha-pos-item">
            <span className="plancha-pos-icon">{icon}</span>
            <span className="plancha-pos-count" style={{ color }}>{count}</span>
            <span className="plancha-pos-label">{label}</span>
        </div>
    );
}
