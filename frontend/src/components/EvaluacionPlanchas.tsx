'use client';

import { useState, useEffect } from 'react';
import { Party, Candidate, getParties, getRanking } from '@/lib/api';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

interface Props {
    onNavigate: (tab: TabType) => void;
}

interface PartyWithScore extends Party {
    avgScore: number;
    presidentName?: string;
}

const SCORE_COLORS = {
    high: '#16a34a',
    mid: '#ca8a04',
    low: '#dc2626',
};

function getScoreColor(score: number) {
    if (score >= 70) return SCORE_COLORS.high;
    if (score >= 40) return SCORE_COLORS.mid;
    return SCORE_COLORS.low;
}

function getScoreLabel(score: number) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Baja';
    return 'Muy baja';
}

export default function EvaluacionPlanchas({ onNavigate }: Props) {
    const [partyScores, setPartyScores] = useState<PartyWithScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [partiesData, presidentsData] = await Promise.all([
                    getParties(),
                    getRanking('president'),
                ]);

                // Compute avg score per party from their presidential candidates
                const partyMap = new Map<number, PartyWithScore>();
                partiesData.forEach(p => {
                    partyMap.set(p.id, {
                        ...p,
                        avgScore: p.party_full_score > 0 ? p.party_full_score : 0,
                        presidentName: undefined,
                    });
                });

                // Enrich with president final_score data
                presidentsData.forEach((c: Candidate) => {
                    const partyId = c.party_id;
                    if (partyId && partyMap.has(partyId)) {
                        const pm = partyMap.get(partyId)!;
                        pm.avgScore = Number(c.final_score) || 0;
                        pm.presidentName = c.name?.split(' ').slice(-2).join(' ');
                    }
                });

                const scored = Array.from(partyMap.values())
                    .filter(p => p.avgScore > 0)
                    .sort((a, b) => b.avgScore - a.avgScore);

                setPartyScores(scored);
            } catch {
                setPartyScores([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const topParties = partyScores.slice(0, 8);
    const maxScore = topParties.length > 0 ? topParties[0].avgScore : 100;

    const excellent = partyScores.filter(p => p.avgScore >= 80).length;
    const good = partyScores.filter(p => p.avgScore >= 60 && p.avgScore < 80).length;
    const regular = partyScores.filter(p => p.avgScore >= 40 && p.avgScore < 60).length;
    const low = partyScores.filter(p => p.avgScore < 40).length;
    const avgScore = partyScores.length > 0 ? partyScores.reduce((s, p) => s + p.avgScore, 0) / partyScores.length : 0;

    return (
        <section className="evaluacion-section">
            {/* Module header */}
            <div className="module-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1rem' }}>
                <div className="module-header-left">
                    <div className="module-icon" style={{ background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', color: '#fff', boxShadow: '0 2px 8px rgba(106, 27, 154, 0.25)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                    <div>
                        <h2 className="module-title" style={{ fontSize: 13 }}>EVALUACIÓN <span className="module-title-accent">DE PLANCHAS</span></h2>
                        <p className="text-[9px]" style={{ color: 'var(--vp-text-dim)', letterSpacing: '0.5px', marginTop: 2 }}>
                            Ranking basado en el score del candidato presidencial
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    <p className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>Cargando planchas...</p>
                </div>
            ) : partyScores.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                    Sin datos de planchas disponibles
                </div>
            ) : (
                <>
                    {/* === STATS DASHBOARD === */}
                    <div className="planchas-stats-row">
                        <div className="planchas-stat-card">
                            <div className="planchas-stat-number" style={{ color: 'var(--vp-red)' }}>{partyScores.length}</div>
                            <div className="planchas-stat-label">Planchas evaluadas</div>
                        </div>
                        <div className="planchas-stat-card">
                            <div className="planchas-stat-number" style={{ color: getScoreColor(avgScore) }}>{avgScore.toFixed(1)}</div>
                            <div className="planchas-stat-label">Score promedio</div>
                        </div>
                        <div className="planchas-stat-card">
                            <div className="planchas-stat-number" style={{ color: '#16a34a' }}>{excellent + good}</div>
                            <div className="planchas-stat-label">Buenas+ (60+)</div>
                        </div>
                        <div className="planchas-stat-card">
                            <div className="planchas-stat-number" style={{ color: '#dc2626' }}>{low}</div>
                            <div className="planchas-stat-label">Bajas (&lt;40)</div>
                        </div>
                    </div>

                    {/* === DISTRIBUTION BAR === */}
                    <div className="planchas-section">
                        <div className="planchas-section-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--vp-text-dim)' }}>
                                <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
                            </svg>
                            Distribución de calidad
                        </div>
                        <div className="planchas-dist-bar">
                            {excellent > 0 && <div className="planchas-dist-segment" style={{ flex: excellent, background: '#16a34a' }} title={`Excelente: ${excellent}`} />}
                            {good > 0 && <div className="planchas-dist-segment" style={{ flex: good, background: '#22c55e' }} title={`Buena: ${good}`} />}
                            {regular > 0 && <div className="planchas-dist-segment" style={{ flex: regular, background: '#ca8a04' }} title={`Regular: ${regular}`} />}
                            {low > 0 && <div className="planchas-dist-segment" style={{ flex: low, background: '#dc2626' }} title={`Baja: ${low}`} />}
                        </div>
                        <div className="planchas-dist-legend">
                            <span><span className="planchas-legend-dot" style={{ background: '#16a34a' }} />Excelente ({excellent})</span>
                            <span><span className="planchas-legend-dot" style={{ background: '#22c55e' }} />Buena ({good})</span>
                            <span><span className="planchas-legend-dot" style={{ background: '#ca8a04' }} />Regular ({regular})</span>
                            <span><span className="planchas-legend-dot" style={{ background: '#dc2626' }} />Baja ({low})</span>
                        </div>
                    </div>

                    {/* === TOP RANKING === */}
                    <div className="planchas-section">
                        <div className="planchas-section-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--vp-text-dim)' }}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Ranking de planchas
                        </div>
                        <div className="planchas-ranking">
                            {topParties.map((party, i) => {
                                const scoreColor = getScoreColor(party.avgScore);
                                const medals = ['🥇', '🥈', '🥉'];
                                const pct = maxScore > 0 ? (party.avgScore / maxScore) * 100 : 0;

                                return (
                                    <div key={party.id} className="planchas-rank-row">
                                        <span className="planchas-rank-pos">
                                            {i < 3 ? medals[i] : <span className="planchas-rank-num">{i + 1}</span>}
                                        </span>
                                        <div className="planchas-rank-color" style={{ background: party.color }} />
                                        <div className="planchas-rank-info">
                                            <div className="planchas-rank-name">{party.abbreviation}</div>
                                            <div className="planchas-rank-full">
                                                {party.presidentName || party.name}
                                            </div>
                                        </div>
                                        <div className="planchas-rank-bar-track">
                                            <div className="planchas-rank-bar-fill" style={{ width: `${pct}%`, background: scoreColor }} />
                                        </div>
                                        <div className="planchas-rank-score-wrap">
                                            <span className="planchas-rank-score" style={{ color: scoreColor }}>
                                                {party.avgScore.toFixed(1)}
                                            </span>
                                            <span className="planchas-rank-label" style={{ color: scoreColor }}>
                                                {getScoreLabel(party.avgScore)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* === CTA === */}
                    <div className="text-center mt-5">
                        <button
                            onClick={() => onNavigate('planchas')}
                            className="evaluacion-cta-btn"
                        >
                            Ver análisis completo →
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
