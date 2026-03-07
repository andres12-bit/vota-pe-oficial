'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PartyIndex {
    party_id: number;
    party_name: string;
    abbreviation: string;
    logo: string;
    color: string;
    total_candidates: number;
    avg_hoja: number;
    avg_experience: number;
    avg_integrity: number;
    avg_plan: number;
    avg_final: number;
    quality_index: number;
    presidential_candidate: string | null;
    presidential_photo: string | null;
    presidential_score: number | null;
}

interface RankingRow {
    party_id: number;
    party_name: string;
    abbreviation: string;
    color: string;
    logo: string;
    total: number;
    with_issues?: number;
    avg_integrity?: number;
    professionals?: number;
    avg_hoja?: number;
    experienced?: number;
    avg_experience?: number;
    young_candidates?: number;
}

interface AlertCandidate {
    id: number;
    name: string;
    photo: string;
    position: string;
    integrity_score?: number;
    hoja_score?: number;
    party_name: string;
    abbreviation: string;
    color: string;
    event_count?: number;
    events?: { title: string; type: string }[];
}

interface MetricParty {
    party_name: string;
    abbreviation: string;
    color: string;
    total: number;
    avg_education?: number;
    avg_experience?: number;
    women?: number;
    men?: number;
    women_pct?: number;
    avg_age?: number;
}

interface TopCandidate {
    id: number;
    name: string;
    photo: string;
    position: string;
    hoja_score?: number;
    plan_score?: number;
    final_score: number;
    party_name: string;
    abbreviation: string;
    color: string;
}

interface RadarData {
    planchaIndex: PartyIndex[];
    rankings: {
        sentencias: RankingRow[];
        profesionales: RankingRow[];
        experiencia: RankingRow[];
        jovenes: RankingRow[];
    };
    alerts: {
        antecedentes: AlertCandidate[];
        sinEstudios: AlertCandidate[];
        denuncias: AlertCandidate[];
    };
    metrics: {
        educacion: MetricParty[];
        experiencia: MetricParty[];
        genero: MetricParty[];
        topHV: TopCandidate[];
        topPlan: TopCandidate[];
        edad: MetricParty[];
        global: {
            total_candidates: number;
            total_parties: number;
            avg_score: number;
            total_women: number;
            total_men: number;
        };
    };
}

function getPhoto(photo: string | null | undefined) {
    if (photo && photo.startsWith('http')) return photo;
    return `https://ui-avatars.com/api/?name=?&size=60&background=e0e0e0&color=666`;
}

function ScoreBadge({ value, max = 100, size = 'md' }: { value: number; max?: number; size?: string }) {
    const v = typeof value === 'number' ? Math.round(value * 10) / 10 : 0;
    const pct = Math.round((v / max) * 100);
    const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#eab308' : '#dc2626';
    const sizeClass = size === 'lg' ? 'score-badge-lg' : size === 'sm' ? 'score-badge-sm' : '';
    return (
        <span className={`radar-score-badge ${sizeClass}`} style={{ borderColor: color, color }}>
            {v}
        </span>
    );
}

const TABS = [
    { id: 'indice', label: 'Índice de Calidad', icon: '🏆' },
    { id: 'rankings', label: 'Rankings', icon: '📊' },
    { id: 'alertas', label: 'Alertas', icon: '🚨' },
    { id: 'metricas', label: 'Métricas', icon: '📈' },
];

const RANKING_TABS = [
    { id: 'sentencias', label: 'Más Problemas de Integridad', icon: '⚠️', title: 'Partidos con Más Problemas de Integridad', desc: 'Candidatos con integrity_score < 40', field: 'with_issues', fieldLabel: 'con problemas', secondField: 'avg_integrity', secondLabel: 'prom.' },
    { id: 'profesionales', label: 'Más Profesionales', icon: '🎓', title: 'Partidos con Más Profesionales', desc: 'Candidatos con hoja_score > 70', field: 'professionals', fieldLabel: 'profesionales', secondField: 'avg_hoja', secondLabel: 'prom.' },
    { id: 'experiencia', label: 'Más Experiencia Política', icon: '🏛️', title: 'Partidos con Más Experiencia', desc: 'Candidatos con experience_score > 60', field: 'experienced', fieldLabel: 'con experiencia', secondField: 'avg_experience', secondLabel: 'prom.' },
    { id: 'jovenes', label: 'Más Candidatos Jóvenes', icon: '👶', title: 'Partidos con Más Candidatos Jóvenes', desc: 'Candidatos menores de 35 años', field: 'young_candidates', fieldLabel: 'jóvenes', secondField: '', secondLabel: '' },
];

export default function RadarPage() {
    const router = useRouter();
    const [data, setData] = useState<RadarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('indice');
    const [activeRankingTab, setActiveRankingTab] = useState('sentencias');

    useEffect(() => {
        fetch(`${API}/api/radar/overview`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, []);

    if (loading) return (
        <div className="radar-page">
            <div className="radar-loading">
                <div className="radar-spinner" />
                <p>Cargando Radar Electoral...</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="radar-page">
            <div className="radar-error">
                <p>❌ Error cargando datos</p>
                <button className="radar-retry-btn" onClick={() => window.location.reload()}>Reintentar</button>
            </div>
        </div>
    );

    const { planchaIndex, rankings, alerts, metrics } = data;

    return (
        <>
            <NavHeader />
            <div className="radar-page">
                {/* Hero */}
                <div className="radar-hero">
                    <div className="radar-hero-content">
                        <span className="radar-hero-badge">⚡ Centro de Inteligencia Electoral</span>
                        <h1 className="radar-hero-title">Radar Electoral</h1>
                        <p className="radar-hero-subtitle">
                            Análisis profundo de datos políticos. Transparencia total sobre candidatos y partidos.
                        </p>
                        {metrics?.global && (
                            <div className="radar-hero-stats">
                                <div className="radar-hero-stat">
                                    <span className="stat-value">{metrics.global.total_candidates}</span>
                                    <span className="stat-label">Candidatos</span>
                                </div>
                                <div className="radar-hero-stat">
                                    <span className="stat-value">{metrics.global.total_parties}</span>
                                    <span className="stat-label">Partidos</span>
                                </div>
                                <div className="radar-hero-stat">
                                    <span className="stat-value">{typeof metrics.global.avg_score === 'number' ? metrics.global.avg_score.toFixed(1) : metrics.global.avg_score}</span>
                                    <span className="stat-label">Score Prom.</span>
                                </div>
                                <div className="radar-hero-stat">
                                    <span className="stat-value">
                                        {metrics.global.total_women > 0 ? Math.round(metrics.global.total_women / (metrics.global.total_women + (metrics.global.total_men || 1)) * 100) : 0}%
                                    </span>
                                    <span className="stat-label">Mujeres</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="radar-tabs-container">
                    <div className="radar-tabs">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                className={`radar-tab ${activeTab === t.id ? 'radar-tab-active' : ''}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <span className="radar-tab-icon">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="radar-content">
                    {/* ==================== INDICE ==================== */}
                    {activeTab === 'indice' && (
                        <div className="radar-section">
                            <div className="radar-section-header">
                                <h2>🏆 Índice de Calidad de Plancha</h2>
                                <p className="radar-section-desc">Evaluación integral de cada partido basada en educación, experiencia, integridad y plan de gobierno de todos sus candidatos.</p>
                            </div>
                            <div className="radar-indice-table-wrap">
                                <table className="radar-indice-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th className="col-party">Partido</th>
                                            <th className="col-pres">Candidato Pres.</th>
                                            <th>Educación</th>
                                            <th>Experiencia</th>
                                            <th>Integridad</th>
                                            <th>Plan Gob.</th>
                                            <th>Índice Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planchaIndex.map((p, i) => (
                                            <tr key={p.party_id} className={i < 3 ? 'radar-top-row' : ''}>
                                                <td>
                                                    <span className={`radar-rank ${i < 3 ? 'radar-rank-top' : ''}`}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="radar-party-cell">
                                                        <span className="radar-party-dot" style={{ background: p.color }} />
                                                        <div>
                                                            <div className="radar-party-name">{p.abbreviation}</div>
                                                            <div className="radar-party-sub">{p.total_candidates} candidatos</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="col-pres">
                                                    {p.presidential_candidate ? (
                                                        <div className="radar-pres-cell">
                                                            <img src={getPhoto(p.presidential_photo)} alt="" className="radar-pres-photo" />
                                                            <span className="radar-pres-name">{p.presidential_candidate.split(' ').slice(0, 2).join(' ')}</span>
                                                        </div>
                                                    ) : <span className="text-dim">—</span>}
                                                </td>
                                                <td><ScoreBadge value={p.avg_hoja} size="sm" /></td>
                                                <td><ScoreBadge value={p.avg_experience} size="sm" /></td>
                                                <td><ScoreBadge value={p.avg_integrity} size="sm" /></td>
                                                <td><ScoreBadge value={p.avg_plan} size="sm" /></td>
                                                <td><ScoreBadge value={p.quality_index} size="lg" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ==================== RANKINGS ==================== */}
                    {activeTab === 'rankings' && (
                        <div className="radar-section">
                            <div className="radar-section-header">
                                <h2>📊 Rankings por Partido</h2>
                                <p className="radar-section-desc">Análisis comparativo de partidos en diferentes métricas clave</p>
                            </div>
                            <div className="radar-ranking-tabs">
                                {RANKING_TABS.map(rt => (
                                    <button
                                        key={rt.id}
                                        className={`radar-ranking-tab ${activeRankingTab === rt.id ? 'active' : ''}`}
                                        onClick={() => setActiveRankingTab(rt.id)}
                                    >
                                        {rt.icon} {rt.label}
                                    </button>
                                ))}
                            </div>
                            {RANKING_TABS.map(meta => {
                                if (activeRankingTab !== meta.id) return null;
                                const rows = (rankings as Record<string, RankingRow[]>)[meta.id] || [];
                                return (
                                    <div key={meta.id} className="radar-ranking-card">
                                        <h3 className="radar-ranking-title">{meta.icon} {meta.title}</h3>
                                        <p className="radar-ranking-desc">{meta.desc}</p>
                                        {rows.length === 0 ? (
                                            <p className="radar-empty">No hay datos para este ranking</p>
                                        ) : (
                                            <div className="radar-ranking-list">
                                                {rows.map((row, i) => (
                                                    <div key={row.party_id} className="radar-ranking-item">
                                                        <span className="radar-ranking-pos">{i + 1}</span>
                                                        <span className="radar-party-dot" style={{ background: row.color }} />
                                                        <div className="radar-ranking-info">
                                                            <span className="radar-ranking-name">{row.party_name}</span>
                                                            <span className="radar-ranking-sub">{row.abbreviation} · {row.total} candidatos</span>
                                                        </div>
                                                        <div className="radar-ranking-values">
                                                            <span className="radar-ranking-main">
                                                                {(row as unknown as Record<string, unknown>)[meta.field] as number || 0} {meta.fieldLabel}
                                                            </span>
                                                            {meta.secondField && (
                                                                <span className="radar-ranking-secondary">
                                                                    {(row as unknown as Record<string, unknown>)[meta.secondField] as number || 0} {meta.secondLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ==================== ALERTAS ==================== */}
                    {activeTab === 'alertas' && (
                        <div className="radar-section">
                            <div className="radar-section-header">
                                <h2>🚨 Alertas Electorales</h2>
                                <p className="radar-section-desc">Candidatos que requieren atención especial según sus datos declarados</p>
                            </div>
                            <div className="radar-alerts-grid">
                                {/* Low integrity */}
                                <div className="radar-alert-card radar-alert-red">
                                    <div className="radar-alert-header">
                                        <span className="radar-alert-icon">🛡️</span>
                                        <div>
                                            <h3>Baja Integridad</h3>
                                            <p>{alerts.antecedentes.length} candidatos con score &lt; 30</p>
                                        </div>
                                    </div>
                                    <div className="radar-alert-list">
                                        {alerts.antecedentes.length === 0 ? (
                                            <p className="radar-empty-inline">✅ Sin alertas</p>
                                        ) : alerts.antecedentes.map(c => (
                                            <div key={c.id} className="radar-alert-item" onClick={() => router.push(`/candidate/${c.id}`)}>
                                                <img src={getPhoto(c.photo)} alt="" className="radar-alert-photo" />
                                                <div className="radar-alert-info">
                                                    <span className="radar-alert-name">{c.name}</span>
                                                    <span className="radar-alert-meta">{c.position} · {c.abbreviation}</span>
                                                </div>
                                                <ScoreBadge value={c.integrity_score || 0} size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* No education */}
                                <div className="radar-alert-card radar-alert-yellow">
                                    <div className="radar-alert-header">
                                        <span className="radar-alert-icon">📚</span>
                                        <div>
                                            <h3>Sin Estudios Declarados</h3>
                                            <p>{alerts.sinEstudios.length} candidatos sin información educativa</p>
                                        </div>
                                    </div>
                                    <div className="radar-alert-list">
                                        {alerts.sinEstudios.length === 0 ? (
                                            <p className="radar-empty-inline">✅ Todos declararon estudios</p>
                                        ) : alerts.sinEstudios.map(c => (
                                            <div key={c.id} className="radar-alert-item" onClick={() => router.push(`/candidate/${c.id}`)}>
                                                <img src={getPhoto(c.photo)} alt="" className="radar-alert-photo" />
                                                <div className="radar-alert-info">
                                                    <span className="radar-alert-name">{c.name}</span>
                                                    <span className="radar-alert-meta">{c.position} · {c.abbreviation}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Negative events */}
                                <div className="radar-alert-card radar-alert-orange">
                                    <div className="radar-alert-header">
                                        <span className="radar-alert-icon">📰</span>
                                        <div>
                                            <h3>Con Denuncias/Eventos Negativos</h3>
                                            <p>{alerts.denuncias.length} candidatos con eventos negativos</p>
                                        </div>
                                    </div>
                                    <div className="radar-alert-list">
                                        {alerts.denuncias.length === 0 ? (
                                            <p className="radar-empty-inline">✅ Sin eventos negativos registrados</p>
                                        ) : alerts.denuncias.map(c => (
                                            <div key={c.id} className="radar-alert-item" onClick={() => router.push(`/candidate/${c.id}`)}>
                                                <img src={getPhoto(c.photo)} alt="" className="radar-alert-photo" />
                                                <div className="radar-alert-info">
                                                    <span className="radar-alert-name">{c.name}</span>
                                                    <span className="radar-alert-meta">{c.abbreviation} · {c.event_count} eventos</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== METRICAS ==================== */}
                    {activeTab === 'metricas' && (
                        <div className="radar-section">
                            <div className="radar-section-header">
                                <h2>📈 Métricas Electorales</h2>
                                <p className="radar-section-desc">Dashboard completo con estadísticas por partido y candidato</p>
                            </div>
                            <div className="radar-metrics-grid">
                                {/* Education */}
                                <div className="radar-metric-card">
                                    <h3>🎓 Promedio de Educación por Partido</h3>
                                    <div className="radar-bars">
                                        {metrics.educacion.slice(0, 10).map(p => (
                                            <div key={p.abbreviation} className="radar-bar-row">
                                                <span className="radar-bar-label">{p.abbreviation}</span>
                                                <div className="radar-bar-track">
                                                    <div className="radar-bar-fill" style={{ width: `${p.avg_education}%`, background: p.color || '#c62828' }} />
                                                </div>
                                                <span className="radar-bar-value">{p.avg_education}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="radar-metric-card">
                                    <h3>🏛️ Experiencia Promedio por Partido</h3>
                                    <div className="radar-bars">
                                        {metrics.experiencia.slice(0, 10).map(p => (
                                            <div key={p.abbreviation} className="radar-bar-row">
                                                <span className="radar-bar-label">{p.abbreviation}</span>
                                                <div className="radar-bar-track">
                                                    <div className="radar-bar-fill" style={{ width: `${p.avg_experience}%`, background: p.color || '#1565c0' }} />
                                                </div>
                                                <span className="radar-bar-value">{p.avg_experience}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="radar-metric-card">
                                    <h3>👫 Paridad de Género</h3>
                                    <div className="radar-gender-grid">
                                        {metrics.genero.slice(0, 10).map(p => (
                                            <div key={p.abbreviation} className="radar-gender-row">
                                                <span className="radar-gender-party">{p.abbreviation}</span>
                                                <div className="radar-gender-bar">
                                                    <div className="radar-gender-women" style={{ width: `${p.women_pct || 0}%` }}>
                                                        {(p.women_pct || 0) >= 15 ? `♀ ${p.women_pct}%` : ''}
                                                    </div>
                                                    <div className="radar-gender-men" style={{ width: `${100 - (p.women_pct || 0)}%` }}>
                                                        {(100 - (p.women_pct || 0)) >= 15 ? `♂ ${Math.round(100 - (p.women_pct || 0))}%` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="radar-metric-card">
                                    <h3>🏗️ Edad Promedio por Partido</h3>
                                    <div className="radar-bars">
                                        {metrics.edad.slice(0, 10).map(p => (
                                            <div key={p.abbreviation} className="radar-bar-row">
                                                <span className="radar-bar-label">{p.abbreviation}</span>
                                                <div className="radar-bar-track">
                                                    <div className="radar-bar-fill" style={{ width: `${Math.min((p.avg_age || 0) / 70 * 100, 100)}%`, background: p.color || '#e65100' }} />
                                                </div>
                                                <span className="radar-bar-value">{p.avg_age || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Hojas de Vida */}
                                <div className="radar-metric-card">
                                    <h3>📄 Top 10 Hojas de Vida</h3>
                                    <div className="radar-top-list">
                                        {metrics.topHV.map((c, i) => (
                                            <div key={c.id} className="radar-top-item" onClick={() => router.push(`/candidate/${c.id}`)}>
                                                <span className="radar-top-pos">{i + 1}</span>
                                                <img src={getPhoto(c.photo)} alt="" className="radar-top-photo" />
                                                <div className="radar-top-info">
                                                    <span className="radar-top-name">{c.name}</span>
                                                    <span className="radar-top-meta">{c.abbreviation} · {c.position}</span>
                                                </div>
                                                <ScoreBadge value={c.hoja_score || 0} size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Plan de Gobierno */}
                                <div className="radar-metric-card">
                                    <h3>📋 Top 10 Plan de Gobierno</h3>
                                    <div className="radar-top-list">
                                        {metrics.topPlan.map((c, i) => (
                                            <div key={c.id} className="radar-top-item" onClick={() => router.push(`/candidate/${c.id}`)}>
                                                <span className="radar-top-pos">{i + 1}</span>
                                                <img src={getPhoto(c.photo)} alt="" className="radar-top-photo" />
                                                <div className="radar-top-info">
                                                    <span className="radar-top-name">{c.name}</span>
                                                    <span className="radar-top-meta">{c.abbreviation} · {c.position}</span>
                                                </div>
                                                <ScoreBadge value={c.plan_score || 0} size="sm" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <SiteFooter />
        </>
    );
}
