'use client';

import { useState, useEffect } from 'react';
import { Candidate, Party, getStats, getParties, getRanking } from '@/lib/api';
import { getCandidatePhoto, getAvatarUrl, getPhotoFallback } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
}

interface PlanchaScore {
    party: Party;
    score: number;
}

function computePlanchaScore(candidates: Candidate[]): number {
    const total = candidates.length;
    if (total === 0) return 0;
    // Antecedentes: % of candidates with clean records (no sentences)
    const cleanCount = candidates.filter(c => {
        const hv = (c as any).hoja_de_vida || {};
        return !hv.sentences || hv.sentences.length === 0;
    }).length;
    const antecedentesScore = (cleanCount / total) * 100;
    const avgPlan = candidates.reduce((s, c) => s + Number((c as any).plan_score || 0), 0) / total;
    const avgHV = candidates.reduce((s, c) => s + Number((c as any).hoja_score || 0), 0) / total;
    const avgScore = candidates.reduce((s, c) => s + Number(c.final_score || 0), 0) / total;
    return (antecedentesScore * 0.30) + (avgPlan * 0.25) + (avgHV * 0.25) + (avgScore * 0.20);
}

export default function ResumenElectoral({ candidates }: Props) {
    const [stats, setStats] = useState<any>(null);
    const [topPlanchas, setTopPlanchas] = useState<PlanchaScore[]>([]);
    const [topPresidents, setTopPresidents] = useState<Candidate[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [s, parties, presidents, senators, deputies, andean] = await Promise.all([
                    getStats().catch(() => null),
                    getParties().catch(() => []),
                    getRanking('president').catch(() => []),
                    getRanking('senator').catch(() => []),
                    getRanking('deputy').catch(() => []),
                    getRanking('andean').catch(() => []),
                ]);
                if (s) setStats(s);
                if (presidents.length > 0) {
                    setTopPresidents(presidents.slice(0, 3));
                }

                // Compute plancha scores client-side using ALL candidates
                if (parties.length > 0) {
                    const allCandidates = [...presidents, ...senators, ...deputies, ...andean];
                    const planchaScores: PlanchaScore[] = parties.map(party => {
                        const partyCandidates = allCandidates.filter(c => c.party_id === party.id);
                        return { party, score: computePlanchaScore(partyCandidates) };
                    }).filter(p => p.score > 0);

                    planchaScores.sort((a, b) => b.score - a.score);
                    setTopPlanchas(planchaScores.slice(0, 3));
                }
            } catch (e) {
                console.error('ResumenElectoral load error:', e);
            }
        }
        load();
    }, []);

    const totalCandidates = stats?.total_candidates ?? candidates.length;
    const totalParties = stats?.total_parties ?? 38;
    const totalVotes = stats?.total_votes ?? 0;
    const antecedentesCount = stats?.total_with_antecedentes ?? 0;

    return (
        <div className="resumen-electoral-panel">
            {/* Header */}
            <div className="resumen-header">
                <div className="resumen-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                </div>
                <div>
                    <h3 className="resumen-header-title">
                        <span style={{ color: 'var(--vp-red)' }}>PULSO</span> ELECTORAL
                    </h3>
                    <span className="resumen-header-sub">Elecciones Generales 2026</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="resumen-stats-grid">
                <div className="resumen-stat-item">
                    <span className="resumen-stat-value" style={{ color: 'var(--vp-red)' }}>{totalCandidates.toLocaleString()}</span>
                    <span className="resumen-stat-label">Candidatos</span>
                </div>
                <div className="resumen-stat-item">
                    <span className="resumen-stat-value" style={{ color: '#2563eb' }}>{totalParties}</span>
                    <span className="resumen-stat-label">Partidos</span>
                </div>
                <div className="resumen-stat-item">
                    <span className="resumen-stat-value" style={{ color: '#16a34a' }}>{totalVotes.toLocaleString()}</span>
                    <span className="resumen-stat-label">Votos</span>
                </div>
                <div className="resumen-stat-item">
                    <span className="resumen-stat-value" style={{ color: '#ca8a04' }}>4</span>
                    <span className="resumen-stat-label">Cargos</span>
                </div>
            </div>

            {/* Top 3 Presidenciales */}
            {topPresidents.length > 0 && (
                <div className="resumen-section">
                    <div className="resumen-section-header">
                        <h4 className="resumen-section-title">🏆 Top Presidenciales</h4>
                        <Link href="/radar" className="resumen-ver-mas">Ver más →</Link>
                    </div>
                    <div className="resumen-top3">
                        {topPresidents.map((c, i) => (
                            <Link href={`/candidate/${c.id}`} key={c.id} className="resumen-top3-item">
                                <span className="resumen-top3-rank" style={{
                                    background: i === 0 ? '#ca8a04' : i === 1 ? '#94a3b8' : '#b87333',
                                }}>{i + 1}</span>
                                <img
                                    src={getCandidatePhoto(c.photo, c.name, 36, c.party_color)}
                                    onError={(e) => {
                                        const fb = getPhotoFallback((e.target as HTMLImageElement).src);
                                        if (fb && !(e.target as HTMLImageElement).dataset.retried) {
                                            (e.target as HTMLImageElement).dataset.retried = '1';
                                            (e.target as HTMLImageElement).src = fb;
                                        } else {
                                            (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 36, c.party_color);
                                        }
                                    }}
                                    alt={c.name}
                                    className="resumen-top3-avatar"
                                    style={{ borderColor: c.party_color }}
                                />
                                <div className="resumen-top3-info">
                                    <span className="resumen-top3-name">{c.name.split(' ').slice(0, 1).join('')} {c.name.split(' ').slice(-2).join(' ')}</span>
                                    <span className="resumen-top3-party" style={{ color: c.party_color }}>{c.party_abbreviation}</span>
                                </div>
                                <div className="resumen-top3-score-wrap">
                                    <span className="resumen-top3-score">{Number(c.final_score).toFixed(1)}</span>
                                    <div className="resumen-top3-bar">
                                        <div className="resumen-top3-bar-fill" style={{ width: `${Math.min(100, Number(c.final_score))}%`, background: c.party_color }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Top 3 Planchas — computed client-side using formula */}
            {topPlanchas.length > 0 && (
                <div className="resumen-section">
                    <div className="resumen-section-header">
                        <h4 className="resumen-section-title">⚡ Mejores Planchas</h4>
                        <Link href="/radar" className="resumen-ver-mas">Ver más →</Link>
                    </div>
                    <div className="resumen-top3">
                        {topPlanchas.map((item, i) => (
                            <Link href={`/party/${item.party.id}`} key={item.party.id} className="resumen-best-plancha">
                                <span className="resumen-top3-rank" style={{
                                    background: i === 0 ? '#ca8a04' : i === 1 ? '#94a3b8' : '#b87333',
                                }}>{i + 1}</span>
                                {item.party.logo && (
                                    <img
                                        src={item.party.logo}
                                        alt={item.party.name}
                                        className="resumen-plancha-logo"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                                <div className="resumen-plancha-info">
                                    <span className="resumen-plancha-name">{item.party.name}</span>
                                    <span className="resumen-plancha-abbr" style={{ color: item.party.color }}>{item.party.abbreviation} · {item.party.candidate_count} cand.</span>
                                </div>
                                <span className="resumen-plancha-score" style={{
                                    background: item.score >= 50 ? '#16a34a' : item.score >= 35 ? '#ca8a04' : '#dc2626',
                                }}>
                                    {item.score.toFixed(1)}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Insights */}
            <div className="resumen-section">
                <div className="resumen-section-header">
                    <h4 className="resumen-section-title">📊 Datos Clave</h4>
                    <Link href="/radar" className="resumen-ver-mas">Ver más →</Link>
                </div>
                <div className="resumen-insights">
                    <div className="resumen-insight-row">
                        <span className="resumen-insight-label">Con antecedentes</span>
                        <span className="resumen-insight-value" style={{ color: antecedentesCount > 0 ? '#dc2626' : '#16a34a' }}>
                            ⚠️ {antecedentesCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="resumen-footer">
                <div className="resumen-footer-dot" />
                <span>Datos JNE · PulsoElectoral.pe ©</span>
            </div>
        </div>
    );
}
