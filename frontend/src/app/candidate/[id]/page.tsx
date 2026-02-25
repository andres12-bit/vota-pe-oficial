'use client';

import { useState, useEffect } from 'react';
import { Candidate, getCandidate } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';

function StarRating({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const partial = rating - full;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= full) {
            stars.push(<span key={i} className="star-filled text-lg">★</span>);
        } else if (i === full + 1 && partial > 0) {
            stars.push(
                <span key={i} className="text-lg relative inline-block">
                    <span className="star-empty">★</span>
                    <span className="star-filled absolute left-0 top-0 overflow-hidden" style={{ width: `${partial * 100}%` }}>★</span>
                </span>
            );
        } else {
            stars.push(<span key={i} className="star-empty text-lg">★</span>);
        }
    }
    return <span className="inline-flex">{stars}</span>;
}

function ScoreGauge({ label, value, color, subtitle }: { label: string; value: number; color: string; subtitle?: string }) {
    return (
        <div className="text-center group">
            <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="2.5"
                        strokeDasharray={`${value} 100`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1.5s ease-out', filter: `drop-shadow(0 0 6px ${color}55)` }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-black" style={{ color }}>{value.toFixed(0)}</span>
                </div>
            </div>
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
            {subtitle && <div className="text-[9px] mt-0.5" style={{ color: 'var(--vp-text-dim)', opacity: 0.6 }}>{subtitle}</div>}
        </div>
    );
}

function BreakdownBar({ label, value, maxValue = 100, color }: { label: string; value: number; maxValue?: number; color: string }) {
    const pct = Math.min(100, (value / maxValue) * 100);
    return (
        <div className="flex items-center gap-3 py-1.5">
            <div className="w-28 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{
                    width: `${pct}%`, background: color,
                    transition: 'width 1.5s ease-out',
                    boxShadow: `0 0 8px ${color}55`
                }} />
            </div>
            <div className="w-10 text-right text-xs font-bold" style={{ color }}>{value.toFixed(1)}</div>
        </div>
    );
}

function MomentumIndicator({ score }: { score: number }) {
    const level = score >= 70 ? { label: 'EN ALZA', icon: '🔥', color: 'var(--vp-red)' }
        : score >= 40 ? { label: 'ESTABLE', icon: '📊', color: 'var(--vp-gold)' }
            : { label: 'EN BAJA', icon: '📉', color: 'var(--vp-text-dim)' };
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${level.color}15`, border: `1px solid ${level.color}33` }}>
            <span>{level.icon}</span>
            <span className="text-[10px] font-bold tracking-wider" style={{ color: level.color }}>{level.label}</span>
            <span className="text-xs font-black" style={{ color: level.color }}>{score.toFixed(0)}</span>
        </div>
    );
}

const positionLabels: Record<string, string> = {
    president: 'Candidato(a) a la Presidencia',
    senator: 'Candidato(a) al Senado',
    deputy: 'Candidato(a) a la Cámara de Diputados',
    andean: 'Candidato(a) al Parlamento Andino'
};

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getCandidate(parseInt(resolvedParams.id));
                setCandidate(data);
            } catch (err) {
                console.error('Error loading candidate:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [resolvedParams.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg)' }}>
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--vp-text-dim)' }}>Cargando Intelligence Report...</p>
                </div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg)' }}>
                <div className="text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg font-bold" style={{ color: 'var(--vp-red)' }}>Candidato no encontrado</p>
                    <Link href="/" className="text-sm mt-3 inline-block px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>← Volver al inicio</Link>
                </div>
            </div>
        );
    }

    const intScore = Number(candidate.intelligence_score);
    const momScore = Number(candidate.momentum_score);
    const integrScore = Number(candidate.integrity_score);
    const riskScore = Number(candidate.risk_score);
    const finalScore = Number(candidate.final_score);
    const starsVal = Number(candidate.stars_rating);

    // Score formula breakdown
    const voteScoreRaw = Math.min(100, (candidate.vote_count / 1000) * 10);
    const formulaBreakdown = {
        votes: { value: voteScoreRaw * 0.40, weight: 40, raw: voteScoreRaw },
        intelligence: { value: intScore * 0.25, weight: 25, raw: intScore },
        momentum: { value: momScore * 0.20, weight: 20, raw: momScore },
        integrity: { value: integrScore * 0.15, weight: 15, raw: integrScore },
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--vp-bg)' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid var(--vp-border)', backdropFilter: 'blur(20px)' }}>
                <Link href="/" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--vp-text-dim)' }}>
                    ← <span className="text-glow-red font-black" style={{ color: 'var(--vp-red)' }}>VOTA<span style={{ color: 'var(--vp-text)' }}>.PE</span></span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>Intelligence Report</span>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--vp-green)' }} />
                </div>
            </header>

            <main className="internal-page-wrapper space-y-10">
                {/* Profile Hero Card */}
                <div className="panel-glow relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5" style={{ background: candidate.party_color, filter: 'blur(60px)' }} />

                    <div className="flex flex-col md:flex-row items-center gap-6 relative">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-2xl shrink-0 relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${candidate.party_color}33, ${candidate.party_color}11)`, border: `2px solid ${candidate.party_color}66`, boxShadow: `0 0 40px ${candidate.party_color}22` }}>
                            <img
                                src={getAvatarUrl(candidate.name, 128, candidate.party_color)}
                                alt={candidate.name}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black mb-1 leading-tight" style={{ color: 'var(--vp-text)' }}>{candidate.name}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                                <Link href={`/party/${candidate.party_id}`}
                                    className="text-sm font-bold px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                                    style={{ background: candidate.party_color + '22', color: candidate.party_color, border: `1px solid ${candidate.party_color}44` }}>
                                    {candidate.party_abbreviation} • {candidate.party_name}
                                </Link>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                    {positionLabels[candidate.position] || candidate.position}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <StarRating rating={starsVal} />
                                <span className="text-xs font-bold" style={{ color: 'var(--vp-gold)' }}>{starsVal.toFixed(1)}/5.0</span>
                                <MomentumIndicator score={momScore} />
                            </div>
                            <div className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>📍 {candidate.region}</div>
                            {candidate.biography && (
                                <p className="text-xs mt-2 leading-relaxed max-w-xl" style={{ color: 'var(--vp-text-dim)' }}>{candidate.biography}</p>
                            )}
                        </div>

                        {/* Final Score */}
                        <div className="text-center shrink-0 p-4 rounded-xl" style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.15)' }}>
                            <div className="text-5xl font-black" style={{ color: 'var(--vp-red)', textShadow: '0 0 30px rgba(255,23,68,0.3)' }}>
                                {finalScore.toFixed(1)}
                            </div>
                            <div className="text-[10px] font-bold tracking-[2px] uppercase mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                                SCORE FINAL
                            </div>
                            <div className="text-sm font-bold mt-2" style={{ color: 'var(--vp-text)' }}>
                                🗳️ {candidate.vote_count?.toLocaleString()} votos
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Gauges + Formula */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: '2.5rem' }}>
                    {/* Gauges */}
                    <div className="panel-glow">
                        <h3 className="text-[10px] font-bold tracking-[2px] uppercase mb-5" style={{ color: 'var(--vp-text-dim)' }}>
                            📊 Métricas de Inteligencia
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            <ScoreGauge label="Inteligencia" value={intScore} color="var(--vp-blue)" subtitle="Intel" />
                            <ScoreGauge label="Momentum" value={momScore} color="var(--vp-gold)" subtitle="Tendencia" />
                            <ScoreGauge label="Integridad" value={integrScore} color="var(--vp-green)" subtitle="Transparencia" />
                            <ScoreGauge label="Riesgo" value={riskScore} color="var(--vp-red)" subtitle="Alerta" />
                        </div>
                    </div>

                    {/* Formula Breakdown */}
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-5" style={{ color: 'var(--vp-text-dim)' }}>
                            🧮 Desglose del Score Final
                        </h3>
                        <div className="text-[9px] mb-3 font-mono px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--vp-text-dim)' }}>
                            score = (votos×0.40) + (intel×0.25) + (momentum×0.20) + (integridad×0.15)
                        </div>
                        <BreakdownBar label={`Votos (40%)`} value={formulaBreakdown.votes.value} maxValue={40} color="var(--vp-red)" />
                        <BreakdownBar label={`Intel (25%)`} value={formulaBreakdown.intelligence.value} maxValue={25} color="var(--vp-blue)" />
                        <BreakdownBar label={`Momentum (20%)`} value={formulaBreakdown.momentum.value} maxValue={20} color="var(--vp-gold)" />
                        <BreakdownBar label={`Integridad (15%)`} value={formulaBreakdown.integrity.value} maxValue={15} color="var(--vp-green)" />
                        <div className="mt-2 pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--vp-border)' }}>
                            <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>Total</span>
                            <span className="text-sm font-black" style={{ color: 'var(--vp-red)' }}>{finalScore.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Proposals */}
                {candidate.proposals && candidate.proposals.length > 0 && (
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-5" style={{ color: 'var(--vp-text-dim)' }}>
                            📋 Propuestas ({candidate.proposals.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
                            {candidate.proposals.map(p => (
                                <div key={p.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                    <div className="flex items-start gap-2">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                            {p.category}
                                        </span>
                                        <div>
                                            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--vp-text)' }}>{p.title}</div>
                                            <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>{p.description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Events Timeline */}
                {candidate.events && candidate.events.length > 0 && (
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-5" style={{ color: 'var(--vp-text-dim)' }}>
                            📰 Historial de Eventos
                        </h3>
                        <div className="flex flex-col gap-[1.5rem]">
                            {candidate.events.map(e => {
                                const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
                                    positive: { icon: '✅', color: 'var(--vp-green)', bg: 'rgba(0,230,118,0.05)', label: 'POSITIVO' },
                                    negative: { icon: '⚠️', color: 'var(--vp-gold)', bg: 'rgba(255,193,7,0.05)', label: 'NEGATIVO' },
                                    corruption: { icon: '🔴', color: 'var(--vp-red)', bg: 'rgba(255,23,68,0.05)', label: 'CORRUPCIÓN' },
                                    achievement: { icon: '🏆', color: 'var(--vp-blue)', bg: 'rgba(41,121,255,0.05)', label: 'LOGRO' },
                                };
                                const config = typeConfig[e.event_type] || typeConfig.positive;
                                const impact = Number(e.impact_score);
                                return (
                                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: config.bg, border: `1px solid ${config.color}22` }}>
                                        <span className="text-lg shrink-0">{config.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${config.color}22`, color: config.color }}>{config.label}</span>
                                                {e.created_at && <span className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>{new Date(e.created_at).toLocaleDateString('es-PE')}</span>}
                                            </div>
                                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{e.title}</div>
                                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>{e.description}</div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-lg font-black" style={{ color: impact >= 0 ? 'var(--vp-green)' : 'var(--vp-red)' }}>
                                                {impact > 0 ? '+' : ''}{impact.toFixed(0)}
                                            </div>
                                            <div className="text-[8px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>impacto</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === FÓRMULA PRESIDENCIAL === */}
                {candidate.vice_presidents && candidate.vice_presidents.length > 0 && (
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-6" style={{ color: 'var(--vp-text-dim)' }}>
                            🏛️ Fórmula Presidencial
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* El candidato principal */}
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl" style={{ background: `${candidate.party_color}11`, border: `1px solid ${candidate.party_color}33` }}>
                                <img
                                    src={getAvatarUrl(candidate.name, 96, candidate.party_color)}
                                    alt={candidate.name}
                                    width={96} height={96}
                                    className="w-24 h-24 rounded-full mb-4 object-cover"
                                    style={{ border: `3px solid ${candidate.party_color}`, boxShadow: `0 0 20px ${candidate.party_color}33` }}
                                />
                                <div className="text-base font-bold" style={{ color: 'var(--vp-text)' }}>{candidate.name.split(' ').slice(-2).join(' ')}</div>
                                <div className="text-[11px] font-bold tracking-wider uppercase mt-2" style={{ color: candidate.party_color }}>
                                    Presidente(a) de la República
                                </div>
                            </div>

                            {/* Vicepresidentes */}
                            {candidate.vice_presidents.map(vp => (
                                <div key={vp.id} className="flex flex-col items-center text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                    <img
                                        src={getAvatarUrl(vp.name, 96, candidate.party_color)}
                                        alt={vp.name}
                                        width={96} height={96}
                                        className="w-24 h-24 rounded-full mb-4 object-cover"
                                        style={{ border: '2px solid var(--vp-border)' }}
                                    />
                                    <div className="text-base font-bold" style={{ color: 'var(--vp-text)' }}>{vp.name.split(' ').slice(-2).join(' ')}</div>
                                    <div className="text-[11px] font-bold tracking-wider uppercase mt-2" style={{ color: 'var(--vp-text-dim)' }}>
                                        {vp.position_label}
                                    </div>
                                    {vp.biography && (
                                        <div className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>{vp.biography}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === HOJA DE VIDA (Education & Experience) === */}
                {(candidate.education || candidate.experience) && (
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-6" style={{ color: 'var(--vp-text-dim)' }}>
                            📋 Hoja de Vida
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
                            {candidate.education && (
                                <div className="p-5 rounded-2xl" style={{ background: 'rgba(68,138,255,0.05)', border: '1px solid rgba(68,138,255,0.15)' }}>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <span className="text-xl">🎓</span>
                                        <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--vp-blue)' }}>Formación Académica</span>
                                    </div>
                                    <div className="text-sm leading-loose" style={{ color: 'var(--vp-text)' }}>
                                        {candidate.education.split('. ').map((line, i) => (
                                            <div key={i} className="flex items-start gap-2.5 mb-2.5">
                                                <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--vp-blue)' }}>●</span>
                                                <span>{line.replace(/\.$/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {candidate.experience && (
                                <div className="p-5 rounded-2xl" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <span className="text-xl">💼</span>
                                        <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--vp-green)' }}>Experiencia Profesional</span>
                                    </div>
                                    <div className="text-sm leading-loose" style={{ color: 'var(--vp-text)' }}>
                                        {candidate.experience.split('. ').map((line, i) => (
                                            <div key={i} className="flex items-start gap-2.5 mb-2.5">
                                                <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--vp-green)' }}>●</span>
                                                <span>{line.replace(/\.$/, '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {candidate.birth_date && (
                            <div className="mt-4 text-sm" style={{ color: 'var(--vp-text-dim)' }}>
                                📅 Fecha de nacimiento: <span className="font-semibold" style={{ color: 'var(--vp-text)' }}>{candidate.birth_date}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* === PLAN DE GOBIERNO === */}
                {candidate.plan_gobierno && candidate.plan_gobierno.length > 0 && (() => {
                    // Group by dimension
                    const dimensions = candidate.plan_gobierno!.reduce((acc, item) => {
                        if (!acc[item.dimension]) acc[item.dimension] = [];
                        acc[item.dimension].push(item);
                        return acc;
                    }, {} as Record<string, typeof candidate.plan_gobierno>);

                    const dimensionColors: Record<string, string> = {
                        'DIMENSIÓN SOCIAL': 'var(--vp-red)',
                        'DIMENSIÓN ECONÓMICA': 'var(--vp-gold)',
                        'DIMENSIÓN AMBIENTAL': 'var(--vp-green)',
                        'DIMENSIÓN INSTITUCIONAL': 'var(--vp-blue)',
                    };

                    const dimensionIcons: Record<string, string> = {
                        'DIMENSIÓN SOCIAL': '🏥',
                        'DIMENSIÓN ECONÓMICA': '💰',
                        'DIMENSIÓN AMBIENTAL': '🌿',
                        'DIMENSIÓN INSTITUCIONAL': '⚖️',
                    };

                    return (
                        <div className="panel-glow">
                            <h3 className="text-xs font-bold tracking-[2px] uppercase mb-6" style={{ color: 'var(--vp-text-dim)' }}>
                                📜 Resumen de Plan de Gobierno
                            </h3>
                            <div className="flex flex-col gap-6">
                                {Object.entries(dimensions).map(([dimension, items]) => {
                                    const color = dimensionColors[dimension] || 'var(--vp-text-dim)';
                                    const icon = dimensionIcons[dimension] || '📋';
                                    return (
                                        <div key={dimension} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}33` }}>
                                            <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ background: `${color}11` }}>
                                                <span className="text-lg">{icon}</span>
                                                <span className="text-sm font-bold tracking-wider uppercase" style={{ color }}>{dimension}</span>
                                            </div>
                                            <div className="divide-y" style={{ borderColor: 'var(--vp-border)' }}>
                                                {items!.map(item => (
                                                    <div key={item.id} className="p-5 md:p-6" style={{ borderColor: `${color}15` }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div>
                                                                <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color }}>Problema</div>
                                                                <div className="text-base font-semibold leading-snug" style={{ color: 'var(--vp-text)' }}>{item.problem}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color }}>Objetivo</div>
                                                                <div className="text-sm leading-relaxed" style={{ color: 'var(--vp-text)' }}>{item.objective}</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4" style={{ borderTop: `1px dashed ${color}22` }}>
                                                            <div>
                                                                <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: 'var(--vp-text-dim)' }}>Meta</div>
                                                                <div className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>{item.goals}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: 'var(--vp-text-dim)' }}>Indicador</div>
                                                                <div className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>{item.indicator}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Party Link */}
                <div className="panel-glow">
                    <Link href={`/party/${candidate.party_id}`}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ background: `${candidate.party_color}11`, border: `1px solid ${candidate.party_color}33` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: candidate.party_color + '33', color: candidate.party_color }}>
                                {candidate.party_abbreviation}
                            </div>
                            <div>
                                <div className="text-sm font-bold" style={{ color: 'var(--vp-text)' }}>{candidate.party_name}</div>
                                <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>Ver plancha completa →</div>
                            </div>
                        </div>
                        <span className="text-xl">→</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
