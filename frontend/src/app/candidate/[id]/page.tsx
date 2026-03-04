'use client';

import { useState, useEffect } from 'react';
import { Candidate, getCandidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

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

function SubScoreRow({ icon, label, weight, score, explain, detail, color, onClick }: {
    icon: string; label: string; weight: number; score: number; explain: string; detail?: string; color: string; onClick?: () => void;
}) {
    const pct = Math.min(100, score);
    return (
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group" onClick={onClick}>
            <span className="text-sm shrink-0">{icon}</span>
            <div className="w-28 shrink-0">
                <div className="text-[10px] font-semibold" style={{ color: 'var(--vp-text)' }}>{label}</div>
                <div className="text-[8px]" style={{ color: 'var(--vp-text-dim)' }}>Peso: {weight}%</div>
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}44`
                }} />
            </div>
            <div className="w-10 text-right text-xs font-black shrink-0" style={{ color }}>{score}</div>
            <div className="w-36 shrink-0 flex items-center gap-1">
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-semibold truncate" style={{ color: 'var(--vp-text-dim)' }}>{explain}</div>
                    {detail && <div className="text-[8px] truncate" style={{ color: 'var(--vp-text-dim)', opacity: 0.6 }}>{detail}</div>}
                </div>
                <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity shrink-0" style={{ color: 'var(--vp-text-dim)' }}>▶</span>
            </div>
        </div>
    );
}

function ScoreDetailModal({ title, icon, score, color, children, onClose }: {
    title: string; icon: string; score: number; color: string; children: React.ReactNode; onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}
                style={{ background: '#1a1a2e', border: `1px solid ${color}44`, boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${color}15` }}>
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between rounded-t-2xl" style={{ background: `${color}20`, borderBottom: `1px solid ${color}33` }}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                            <div className="text-sm font-bold" style={{ color }}>{title}</div>
                            <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>Informe detallado del análisis</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-black" style={{ color }}>{score}<span className="text-xs font-semibold">/100</span></div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--vp-text-dim)' }}>✕</button>
                    </div>
                </div>
                <div className="p-5 space-y-4">{children}</div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, icon, color }: { label: string; value: string; icon?: string; color?: string }) {
    return (
        <div className="flex items-start gap-2 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {icon && <span className="text-sm mt-0.5 shrink-0">{icon}</span>}
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: color || 'var(--vp-text-dim)' }}>{label}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--vp-text)' }}>{value}</div>
            </div>
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
    const [activeModal, setActiveModal] = useState<string | null>(null);

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
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--vp-text-dim)' }}>Cargando Intelligence Report...</p>
                </div>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
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

    // Score formula breakdown — NEW formula
    const hojaScore = Number((candidate as any).hoja_score) || 0;
    const planScore = Number((candidate as any).plan_score) || 0;
    const intencionScore = Math.min(100, (candidate.vote_count / 5000) * 100); // normalized to position max
    const formulaBreakdown = {
        hojaVida: { value: hojaScore * 0.30, weight: 30, raw: hojaScore },
        planGobierno: { value: planScore * 0.30, weight: 30, raw: planScore },
        intencion: { value: intencionScore * 0.25, weight: 25, raw: intencionScore },
        integrity: { value: integrScore * 0.15, weight: 15, raw: integrScore },
    };

    // ======== DETAILED SUB-BREAKDOWNS ========
    const hv = (candidate as any).hoja_de_vida || {};
    const hvEdu = hv.education || {};
    const hvFinances = hv.finances || {};

    // Hoja de Vida sub-scores (same formulas as backend)
    const hvDetail = (() => {
        // Education (25%)
        let educationScore = 10;
        const technical = (hvEdu.technical || []).filter((t: any) => t && (t.institution || t.specialty));
        const university = (hvEdu.university || []).filter((u: any) => u && (u.institution || u.degree));
        const graduatedUni = (hvEdu.university || []).filter((u: any) => u && u.completed);
        const postgraduate = (hvEdu.postgraduate || []).filter((p: any) => p && (p.institution || p.specialty));
        const completedPostgrad = (hvEdu.postgraduate || []).filter((p: any) => p && p.completed);
        if (technical.length > 0) educationScore = Math.max(educationScore, 30);
        if (university.length > 0) educationScore = Math.max(educationScore, 55);
        if (graduatedUni.length > 0) educationScore = Math.max(educationScore, 70);
        if (postgraduate.length > 0) educationScore = Math.max(educationScore, 85);
        if (completedPostgrad.length > 0) educationScore = 100;
        const totalDegrees = technical.length + university.length + postgraduate.length;
        if (totalDegrees >= 3) educationScore = Math.min(100, educationScore + 10);
        const eduExplain = completedPostgrad.length > 0 ? 'Posgrado completado' : postgraduate.length > 0 ? 'Estudios de posgrado' : graduatedUni.length > 0 ? 'Universidad completada' : university.length > 0 ? 'Estudios universitarios' : technical.length > 0 ? 'Estudios técnicos' : 'Educación básica';


        // Work + Political detection (JNE stores political roles like ALCALDE in work_experience)
        const POLITICAL_KEYWORDS = ['alcalde', 'congresista', 'gobernador', 'regidor', 'ministro', 'viceministro', 'presidente regional', 'consejero regional', 'teniente alcalde', 'parlamentario', 'senador', 'diputado'];
        const allWorkExp = (hv.work_experience || []).filter((w: any) => w && (w.position || w.employer));
        const isPoliticalRole = (w: any) => {
            const pos = ((w.position || '') + ' ' + (w.employer || '')).toLowerCase();
            return POLITICAL_KEYWORDS.some(kw => pos.includes(kw)) || pos.includes('municipalidad') || pos.includes('gobierno regional') || pos.includes('congreso');
        };
        const politicalFromWork = allWorkExp.filter(isPoliticalRole);
        const pureWorkExp = allWorkExp.filter((w: any) => !isPoliticalRole(w));

        // Work (20%) — only non-political jobs
        let workScore = Math.min(100, pureWorkExp.length * 15);
        pureWorkExp.forEach((w: any) => { if (w.start_year && w.end_year && (parseInt(w.end_year) - parseInt(w.start_year)) >= 5) workScore = Math.min(100, workScore + 10); });

        // Political (15%) — from political_history + political roles in work_experience
        const polHistory = (hv.political_history || []).filter((p: any) => p && (p.organization || p.position));
        const allPolitical = [...polHistory, ...politicalFromWork];
        let politicalScore = Math.min(100, allPolitical.length * 20);
        allPolitical.forEach((p: any) => { const pos = ((p.position || '') + ' ' + (p.employer || '')).toLowerCase(); if (pos.includes('alcalde') || pos.includes('presidente') || pos.includes('secretario general') || pos.includes('congresista') || pos.includes('gobernador') || pos.includes('ministro')) politicalScore = Math.min(100, politicalScore + 15); });


        // Finance (10%)
        let financeScore = 0;
        const hasAnyIncome = (hvFinances.total_income || 0) > 0 || (hvFinances.public_income || 0) > 0 || (hvFinances.private_income || 0) > 0 || (hvFinances.other_private || 0) > 0 || (hvFinances.other_public || 0) > 0 || (hvFinances.individual_private || 0) > 0 || (hvFinances.individual_public || 0) > 0;
        const hasAssets = (hvFinances.properties || []).length > 0 || (hvFinances.vehicles || []).length > 0;
        const hasDeclared = hasAnyIncome || hasAssets || (hvFinances && Object.keys(hvFinances).length > 0);
        financeScore = hasDeclared ? 100 : 0;

        // Judicial (25%)
        const sentences = hv.sentences || [];
        let judicialScore = 100;
        sentences.forEach((s: any) => { const type = (s.type || '').toLowerCase(); const verdict = (s.verdict || '').toLowerCase(); if (type.includes('penal')) { if (verdict.includes('condena') || verdict.includes('culpable')) judicialScore -= 50; else if (verdict.includes('suspendid')) judicialScore -= 30; else judicialScore -= 20; } else if (type.includes('civil')) judicialScore -= 10; else judicialScore -= 15; });
        const resignations = hv.resignations || [];
        if (resignations.length === 0) judicialScore = Math.min(100, judicialScore + 5);
        else if (resignations.length > 3) judicialScore -= 10;
        judicialScore = Math.max(0, Math.min(100, judicialScore));

        return {
            education: { score: educationScore, weight: 25, explain: eduExplain, details: `${technical.length} técnicos, ${university.length} universitarios, ${postgraduate.length} posgrados` },
            work: { score: workScore, weight: 20, explain: `${pureWorkExp.length} experiencia(s) laboral(es)` },
            political: { score: politicalScore, weight: 15, explain: allPolitical.length > 0 ? `${allPolitical.length} cargo(s) político(s)` : 'Sin cargos políticos' },
            finance: { score: financeScore, weight: 10, explain: hasDeclared ? 'Declaración financiera presentada' : 'Sin declaración' },
            judicial: { score: judicialScore, weight: 25, explain: sentences.length === 0 ? 'Sin sentencias' : `${sentences.length} sentencia(s) registrada(s)` },
        };
    })();

    // Plan de Gobierno sub-scores
    const planDetail = (() => {
        const items = candidate.plan_gobierno || [];
        if (items.length === 0) return null;
        const JNE_DIMS = ['social', 'economic', 'ambiental', 'institucional', 'seguridad', 'relaciones'];
        const dims = new Set<number>();
        items.forEach(item => { const d = (item.dimension || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); JNE_DIMS.forEach((j, idx) => { if (d.includes(j)) dims.add(idx); }); });
        const coverageScore = Math.min(100, (dims.size / JNE_DIMS.length) * 100);
        let specTotal = 0; items.forEach(item => { const o = (item.objective || '').trim(); specTotal += o.length === 0 ? 0 : o.length < 30 ? 20 : o.length < 80 ? 50 : o.length < 150 ? 75 : 100; });
        const specificityScore = items.length > 0 ? specTotal / items.length : 0;
        const goalsCount = items.filter(item => (item.goals || '').trim().length > 10).length;
        const measurabilityScore = items.length > 0 ? (goalsCount / items.length) * 100 : 0;
        const indicatorsCount = items.filter(item => (item.indicator || '').trim().length > 5).length;
        const indicatorScore = items.length > 0 ? (indicatorsCount / items.length) * 100 : 0;
        let cohTotal = 0; items.forEach(item => { const prob = (item.problem || '').toLowerCase(); const obj = (item.objective || '').toLowerCase(); if (prob.length < 5 || obj.length < 5) return; const words = prob.split(/\s+/).filter(w => w.length > 4); if (words.length === 0) { cohTotal += 30; return; } const m = words.filter(w => obj.includes(w)).length / words.length; cohTotal += m >= 0.3 ? 100 : m >= 0.15 ? 70 : m > 0 ? 40 : 15; });
        const coherenceScore = items.length > 0 ? cohTotal / items.length : 0;

        return {
            coverage: { score: Math.round(coverageScore), weight: 25, explain: `${dims.size} de ${JNE_DIMS.length} dimensiones cubiertas` },
            specificity: { score: Math.round(specificityScore), weight: 25, explain: specificityScore >= 75 ? 'Objetivos detallados' : specificityScore >= 50 ? 'Objetivos moderados' : 'Objetivos vagos' },
            measurability: { score: Math.round(measurabilityScore), weight: 20, explain: `${goalsCount} de ${items.length} ítems con metas concretas` },
            indicators: { score: Math.round(indicatorScore), weight: 15, explain: `${indicatorsCount} de ${items.length} ítems con indicadores` },
            coherence: { score: Math.round(coherenceScore), weight: 15, explain: coherenceScore >= 70 ? 'Buena coherencia problema-objetivo' : coherenceScore >= 40 ? 'Coherencia moderada' : 'Coherencia débil' },
            totalItems: items.length,
        };
    })();

    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            {/* Full Navigation Header */}
            <NavHeader />

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
                                src={getCandidatePhoto(candidate.photo, candidate.name, 128, candidate.party_color)}
                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 128, candidate.party_color); }}
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

                {/* ════════ UNIFIED SCORE PANEL ════════ */}
                <div className="panel-glow">
                    {/* Gauges row */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>📊 Análisis del Score</h3>
                        <div className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--vp-text-dim)' }}>
                            score = (HV×0.30) + (Plan×0.30) + (Intención×0.25) + (Integridad×0.15)
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <ScoreGauge label="Hoja de Vida" value={hojaScore} color="#8b5cf6" subtitle="30%" />
                        <ScoreGauge label="Plan Gob." value={planScore} color="var(--vp-blue)" subtitle="30%" />
                        <ScoreGauge label="Intención" value={intencionScore} color="var(--vp-gold)" subtitle="25%" />
                        <ScoreGauge label="Integridad" value={integrScore} color="var(--vp-green)" subtitle="15%" />
                    </div>

                    {/* Compact formula bars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mb-3">
                        <BreakdownBar label="📄 HV (30%)" value={formulaBreakdown.hojaVida.value} maxValue={30} color="#8b5cf6" />
                        <BreakdownBar label="📋 Plan (30%)" value={formulaBreakdown.planGobierno.value} maxValue={30} color="var(--vp-blue)" />
                        <BreakdownBar label="🗳️ Intención (25%)" value={formulaBreakdown.intencion.value} maxValue={25} color="var(--vp-gold)" />
                        <BreakdownBar label="🛡️ Integridad (15%)" value={formulaBreakdown.integrity.value} maxValue={15} color="var(--vp-green)" />
                    </div>
                    <div className="mb-5 pt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--vp-border)' }}>
                        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--vp-text-dim)' }}>Total</span>
                        <span className="text-sm font-black" style={{ color: 'var(--vp-red)' }}>{finalScore.toFixed(2)}</span>
                    </div>

                    {/* ── Detailed Sub-breakdowns ── */}
                    <div className="text-[10px] font-bold tracking-[2px] uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>🔍 ¿Por qué este Score?</div>

                    {/* HV + Plan side by side on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Hoja de Vida */}
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #8b5cf633' }}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: '#8b5cf611' }}>
                                <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>📄 Hoja de Vida</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#8b5cf622', color: '#8b5cf6' }}>{hojaScore.toFixed(0)}/100 → {(hojaScore * 0.30).toFixed(1)}pts</span>
                            </div>
                            <div className="p-3 space-y-1">
                                <SubScoreRow icon="🎓" label="Educación" weight={25} score={hvDetail.education.score} explain={hvDetail.education.explain} detail={hvDetail.education.details} color="#8b5cf6" onClick={() => setActiveModal('hv-education')} />
                                <SubScoreRow icon="💼" label="Exp. Laboral" weight={20} score={hvDetail.work.score} explain={hvDetail.work.explain} color="#8b5cf6" onClick={() => setActiveModal('hv-work')} />
                                <SubScoreRow icon="🏛️" label="Exp. Política" weight={15} score={hvDetail.political.score} explain={hvDetail.political.explain} color="#8b5cf6" onClick={() => setActiveModal('hv-political')} />
                                <SubScoreRow icon="💰" label="Finanzas" weight={10} score={hvDetail.finance.score} explain={hvDetail.finance.explain} color="#8b5cf6" onClick={() => setActiveModal('hv-finance')} />
                                <SubScoreRow icon="⚖️" label="Judicial" weight={25} score={hvDetail.judicial.score} explain={hvDetail.judicial.explain} color="#8b5cf6" onClick={() => setActiveModal('hv-judicial')} />
                            </div>
                        </div>

                        {/* Plan de Gobierno */}
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(41,121,255,0.2)' }}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(41,121,255,0.06)' }}>
                                <span className="text-xs font-bold" style={{ color: 'var(--vp-blue)' }}>📋 Plan de Gobierno</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(41,121,255,0.12)', color: 'var(--vp-blue)' }}>{planScore.toFixed(0)}/100 → {(planScore * 0.30).toFixed(1)}pts</span>
                            </div>
                            {planDetail ? (
                                <div className="p-3 space-y-1">
                                    <div className="text-[9px] mb-1 px-2 py-0.5 rounded" style={{ background: 'rgba(41,121,255,0.04)', color: 'var(--vp-text-dim)' }}>
                                        {planDetail.totalItems} ítems evaluados
                                    </div>
                                    <SubScoreRow icon="🌐" label="Cobertura" weight={25} score={planDetail.coverage.score} explain={planDetail.coverage.explain} color="var(--vp-blue)" onClick={() => setActiveModal('plan-coverage')} />
                                    <SubScoreRow icon="🎯" label="Especificidad" weight={25} score={planDetail.specificity.score} explain={planDetail.specificity.explain} color="var(--vp-blue)" onClick={() => setActiveModal('plan-specificity')} />
                                    <SubScoreRow icon="📈" label="Metas" weight={20} score={planDetail.measurability.score} explain={planDetail.measurability.explain} color="var(--vp-blue)" onClick={() => setActiveModal('plan-goals')} />
                                    <SubScoreRow icon="📏" label="Indicadores" weight={15} score={planDetail.indicators.score} explain={planDetail.indicators.explain} color="var(--vp-blue)" onClick={() => setActiveModal('plan-indicators')} />
                                    <SubScoreRow icon="🔗" label="Coherencia" weight={15} score={planDetail.coherence.score} explain={planDetail.coherence.explain} color="var(--vp-blue)" onClick={() => setActiveModal('plan-coherence')} />
                                </div>
                            ) : (
                                <div className="p-3 text-xs" style={{ color: 'var(--vp-text-dim)' }}>Sin plan registrado en JNE.</div>
                            )}
                        </div>
                    </div>

                    {/* Intención + Integridad side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Intención */}
                        <div className="rounded-xl overflow-hidden cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border: '1px solid rgba(245,158,11,0.2)' }} onClick={() => setActiveModal('intencion')}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.06)' }}>
                                <span className="text-xs font-bold" style={{ color: 'var(--vp-gold)' }}>🗳️ Intención Ciudadana</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--vp-gold)' }}>{intencionScore.toFixed(0)}/100 → {(intencionScore * 0.25).toFixed(1)}pts</span>
                            </div>
                            <div className="p-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>{candidate.vote_count?.toLocaleString()} votos</div>
                                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>Normalizado al máximo de votos en su cargo</div>
                                </div>
                                <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.25)' }}>
                                    <span className="text-base font-black" style={{ color: 'var(--vp-gold)' }}>{intencionScore.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Integridad */}
                        <div className="rounded-xl overflow-hidden cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border: '1px solid rgba(0,230,118,0.2)' }} onClick={() => setActiveModal('integridad')}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(0,230,118,0.06)' }}>
                                <span className="text-xs font-bold" style={{ color: 'var(--vp-green)' }}>🛡️ Integridad</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--vp-green)' }}>{integrScore.toFixed(0)}/100 → {(integrScore * 0.15).toFixed(1)}pts</span>
                            </div>
                            <div className="p-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>
                                        {integrScore >= 90 ? '✅ Historial limpio' : integrScore >= 70 ? '⚠️ Observaciones menores' : integrScore >= 50 ? '🟡 Alertas moderadas' : '🔴 Alertas significativas'}
                                    </div>
                                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>Sentencias, transparencia, historial partidario</div>
                                </div>
                                <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.08)', border: `2px solid ${integrScore >= 70 ? 'rgba(0,230,118,0.25)' : 'rgba(255,23,68,0.25)'}` }}>
                                    <span className="text-base font-black" style={{ color: integrScore >= 70 ? 'var(--vp-green)' : 'var(--vp-red)' }}>{integrScore.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ SCORE DETAIL MODALS ══ */}
                    {activeModal === 'hv-education' && (() => {
                        const edu = hv.education || {};
                        const tech = (edu.technical || []).filter((t: any) => t && (t.institution || t.specialty));
                        const uni = (edu.university || []).filter((u: any) => u && (u.institution || u.degree));
                        const post = (edu.postgraduate || []).filter((p: any) => p && (p.institution || p.specialty));
                        return (
                            <ScoreDetailModal title="Educación" icon="🎓" score={hvDetail.education.score} color="#8b5cf6" onClose={() => setActiveModal(null)}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8b5cf6' }}>Criterio de evaluación</div>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Se evalúa el nivel educativo: básica (10pts), técnica (30pts), universitaria (55-70pts), posgrado (85-100pts). Bonus por múltiples títulos.</div>
                                {edu.basic && <DetailItem icon="📚" label="Educación Básica" value={`Primaria: ${edu.basic.primary_completed ? 'Completada ✅' : 'No completada'} | Secundaria: ${edu.basic.secondary_completed ? 'Completada ✅' : 'No completada'}`} />}
                                {tech.map((t: any, i: number) => <DetailItem key={`t${i}`} icon="🔧" label={`Técnico ${i + 1}`} value={`${t.specialty || t.degree || 'Sin especificar'} — ${t.institution || 'Sin institución'}${t.completed ? ' ✅' : ''}`} />)}
                                {uni.map((u: any, i: number) => <DetailItem key={`u${i}`} icon="🎓" label={`Universidad ${i + 1}`} value={`${u.degree || 'Sin especificar'} — ${u.institution || ''}${u.completed ? ' ✅' : ''}${u.year ? ` (${u.year})` : ''}`} />)}
                                {post.map((p: any, i: number) => <DetailItem key={`p${i}`} icon="🏆" label={`Posgrado ${i + 1}`} value={`${p.degree || ''} ${p.specialty || ''} — ${p.institution || ''}${p.completed ? ' ✅' : ''}${p.year ? ` (${p.year})` : ''}`} />)}
                                {tech.length === 0 && uni.length === 0 && post.length === 0 && <DetailItem icon="ℹ️" label="Sin registros" value="No se encontraron estudios superiores en JNE." />}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'hv-work' && (() => {
                        const POL_KW = ['alcalde', 'congresista', 'gobernador', 'regidor', 'ministro', 'parlamentario'];
                        const allWork = (hv.work_experience || []).filter((w: any) => w && (w.position || w.employer));
                        const pureWork = allWork.filter((w: any) => { const p = ((w.position || '') + ' ' + (w.employer || '')).toLowerCase(); return !POL_KW.some(kw => p.includes(kw)) && !p.includes('municipalidad') && !p.includes('gobierno regional') && !p.includes('congreso'); });
                        return (
                            <ScoreDetailModal title="Experiencia Laboral" icon="💼" score={hvDetail.work.score} color="#8b5cf6" onClose={() => setActiveModal(null)}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#8b5cf6' }}>Criterio</div>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Cada experiencia no-política = 15pts (máx 100). Bonus +10pts por empleos de 5+ años.</div>
                                {pureWork.length > 0 ? pureWork.map((w: any, i: number) => <DetailItem key={i} icon="💼" label={w.position || 'Cargo'} value={`${w.employer || ''}${w.period ? ` (${w.period})` : ''}${w.comment ? ` — ${w.comment}` : ''}`} />) : <DetailItem icon="ℹ️" label="Sin experiencia laboral" value="No se encontraron experiencias no-políticas en JNE." />}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'hv-political' && (() => {
                        const polHist = (hv.political_history || []).filter((p: any) => p && (p.organization || p.position));
                        const elections = hv.elections || [];
                        return (
                            <ScoreDetailModal title="Experiencia Política" icon="🏛️" score={hvDetail.political.score} color="#8b5cf6" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Cada cargo político = 20pts (máx 100). Bonus +15pts por roles de liderazgo.</div>
                                {polHist.length > 0 && polHist.map((p: any, i: number) => <DetailItem key={`ph${i}`} icon="🏛️" label={p.position || 'Cargo'} value={`${p.organization || ''} (${p.start_year || '?'} - ${p.end_year || 'Actualidad'})`} />)}
                                {elections.length > 0 && elections.map((e: any, i: number) => <DetailItem key={`el${i}`} icon="🗳️" label={e.position || 'Cargo'} value={`${e.organization || ''} (${e.period || '?'})${e.comment ? ` — ${e.comment}` : ''}`} />)}
                                {polHist.length === 0 && elections.length === 0 && <DetailItem icon="ℹ️" label="Sin historial" value="No se encontró historial político en JNE." />}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'hv-finance' && (() => {
                        const fin = hv.finances || {};
                        const props = fin.properties || [];
                        const vehs = fin.vehicles || [];
                        return (
                            <ScoreDetailModal title="Transparencia Financiera" icon="💰" score={hvDetail.finance.score} color="#8b5cf6" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Score 100 si declaró información financiera, 0 si no. No se juzga por monto.</div>
                                {fin.total_income !== undefined && <DetailItem icon="💵" label="Ingreso Total" value={`S/ ${Number(fin.total_income || 0).toLocaleString()}${fin.year ? ` (${fin.year})` : ''}`} />}
                                {props.map((p: any, i: number) => <DetailItem key={`pr${i}`} icon="🏠" label={`Propiedad ${i + 1}`} value={`${p.type || 'Inmueble'}${p.value ? ` — S/ ${Number(p.value).toLocaleString()}` : ''}`} />)}
                                {vehs.map((v: any, i: number) => <DetailItem key={`vh${i}`} icon="🚗" label={`Vehículo ${i + 1}`} value={`${v.type || 'Vehículo'}${v.brand ? ` ${v.brand}` : ''}`} />)}
                                {!fin.total_income && props.length === 0 && vehs.length === 0 && <DetailItem icon="⚠️" label="Sin declaración" value="No declaró información financiera ante el JNE." color="var(--vp-red)" />}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'hv-judicial' && (() => {
                        const sentences = hv.sentences || [];
                        const resignations = (hv.resignations || []).filter((r: any) => r && (r.organization || r.year));
                        return (
                            <ScoreDetailModal title="Limpieza Judicial" icon="⚖️" score={hvDetail.judicial.score} color="#8b5cf6" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Inicia en 100. Penales restan 20-50pts. Civiles restan 10pts. Sin renuncias: +5pts bonus.</div>
                                {sentences.length === 0 ? <DetailItem icon="✅" label="Sin sentencias" value="No se registran sentencias judiciales." color="var(--vp-green)" /> : sentences.map((s: any, i: number) => <DetailItem key={i} icon="⚠️" label={`${s.type || 'Sentencia'}: ${s.crime || 'Sin detalle'}`} value={`${s.court ? `Juzgado: ${s.court}` : ''}${s.sentence ? ` — ${s.sentence}` : 'Sin sentencia especificada'}`} color="var(--vp-red)" />)}
                                {resignations.length > 0 && resignations.map((r: any, i: number) => <DetailItem key={`rn${i}`} icon="🚪" label={`Renuncia ${i + 1}`} value={`${r.organization || ''}${r.year ? ` (${r.year})` : ''}`} />)}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-coverage' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        const JNE_DIMS = ['Social', 'Económica', 'Ambiental', 'Institucional', 'Seguridad', 'Relaciones'];
                        const covered = new Set<string>();
                        items.forEach(item => { const d = (item.dimension || '').toLowerCase(); JNE_DIMS.forEach(j => { if (d.includes(j.toLowerCase().substring(0, 5))) covered.add(j); }); });
                        return (
                            <ScoreDetailModal title="Cobertura Dimensional" icon="🌐" score={planDetail.coverage.score} color="var(--vp-blue)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>JNE exige 6 dimensiones. Score = (cubiertas / 6) x 100.</div>
                                {JNE_DIMS.map((d, i) => <DetailItem key={i} icon={covered.has(d) ? '✅' : '❌'} label={d} value={covered.has(d) ? 'Cubierta' : 'No cubierta'} color={covered.has(d) ? 'var(--vp-green)' : 'var(--vp-red)'} />)}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-specificity' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Especificidad" icon="🎯" score={planDetail.specificity.score} color="var(--vp-blue)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa detalle de objetivos. Corto = 20pts, moderado = 50pts, detallado = 100pts.</div>
                                {items.map((item, i) => { const len = (item.objective || '').length; const lvl = len < 30 ? 'Vago' : len < 80 ? 'Moderado' : 'Detallado'; return <DetailItem key={i} icon={len >= 80 ? '✅' : '⚠️'} label={item.problem || `Ítem ${i + 1}`} value={`"${item.objective || 'Sin objetivo'}" (${len} chars — ${lvl})`} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-goals' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Metas Concretas" icon="📈" score={planDetail.measurability.score} color="var(--vp-blue)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa si cada ítem tiene metas medibles (+10 caracteres).</div>
                                {items.map((item, i) => { const ok = (item.goals || '').trim().length > 10; return <DetailItem key={i} icon={ok ? '✅' : '❌'} label={item.problem || `Ítem ${i + 1}`} value={ok ? item.goals! : 'Sin meta concreta'} color={ok ? 'var(--vp-green)' : 'var(--vp-red)'} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-indicators' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Indicadores" icon="📏" score={planDetail.indicators.score} color="var(--vp-blue)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa si cada ítem tiene indicadores de medición (+5 chars).</div>
                                {items.map((item, i) => { const ok = (item.indicator || '').trim().length > 5; return <DetailItem key={i} icon={ok ? '✅' : '❌'} label={item.problem || `Ítem ${i + 1}`} value={ok ? item.indicator! : 'Sin indicador'} color={ok ? 'var(--vp-green)' : 'var(--vp-red)'} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-coherence' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Coherencia" icon="🔗" score={planDetail.coherence.score} color="var(--vp-blue)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa coincidencia entre problema y objetivo planteado.</div>
                                {items.map((item, i) => <DetailItem key={i} icon="🔗" label={item.problem || `Ítem ${i + 1}`} value={`Objetivo: "${item.objective || 'Sin objetivo'}"`} />)}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'intencion' && (
                        <ScoreDetailModal title="Intención Ciudadana" icon="🗳️" score={Math.round(intencionScore)} color="var(--vp-gold)" onClose={() => setActiveModal(null)}>
                            <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Mide la intención de voto de usuarios de VOTA.PE, normalizada al máximo en su cargo.</div>
                            <DetailItem icon="🗳️" label="Votos recibidos" value={`${(candidate.vote_count || 0).toLocaleString()} votos en VOTA.PE`} />
                            <DetailItem icon="📊" label="Cálculo" value="Score = (votos / máx votos en su cargo) x 100. Peso: 25%." />
                            <DetailItem icon="ℹ️" label="Nota" value="Aumentará cuando más usuarios voten. Plataforma en fase inicial." color="var(--vp-gold)" />
                        </ScoreDetailModal>
                    )}

                    {activeModal === 'integridad' && (() => {
                        const sentences = hv.sentences || [];
                        const resignations = (hv.resignations || []).filter((r: any) => r && (r.organization || r.year));
                        const polHistory = (hv.political_history || []).filter((p: any) => p && p.organization);
                        const parties = new Set(polHistory.map((p: any) => p.organization));
                        const fin = hv.finances || {};
                        return (
                            <ScoreDetailModal title="Integridad" icon="🛡️" score={Math.round(integrScore)} color="var(--vp-green)" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa: Judicial (40%), Estabilidad (20%), Transparencia (20%), Coherencia (20%).</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--vp-text-dim)' }}>⚖️ Limpieza Judicial (40%)</div>
                                {sentences.length === 0 ? <DetailItem icon="✅" label="Sin sentencias" value="Historial limpio." color="var(--vp-green)" /> : sentences.map((s: any, i: number) => <DetailItem key={i} icon="🔴" label={`${s.type}: ${s.crime || ''}`} value={s.sentence || 'Sin especificar'} color="var(--vp-red)" />)}
                                <div className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: 'var(--vp-text-dim)' }}>🏛️ Estabilidad Partidaria (20%)</div>
                                <DetailItem icon="🏛️" label="Partidos" value={`${parties.size} partido(s): ${[...parties].join(', ') || 'N/A'}`} />
                                {resignations.length > 0 ? <DetailItem icon="🚪" label="Renuncias" value={`${resignations.length} renuncia(s)`} color="var(--vp-gold)" /> : <DetailItem icon="✅" label="Renuncias" value="Sin renuncias" color="var(--vp-green)" />}
                                <div className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: 'var(--vp-text-dim)' }}>💰 Transparencia (20%)</div>
                                <DetailItem icon={fin.total_income > 0 ? '✅' : '⚠️'} label="Declaración" value={fin.total_income > 0 ? `Ingreso: S/ ${Number(fin.total_income).toLocaleString()}` : 'Sin ingresos declarados'} />
                                <div className="text-[10px] font-bold uppercase tracking-wider mt-3 mb-1" style={{ color: 'var(--vp-text-dim)' }}>📋 Coherencia (20%)</div>
                                <DetailItem icon="🗳️" label="Elecciones" value={`${(hv.elections || []).length} participación(es)`} />
                            </ScoreDetailModal>
                        );
                    })()}
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
                                    src={getCandidatePhoto(candidate.photo, candidate.name, 96, candidate.party_color)}
                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 96, candidate.party_color); }}
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
                                        src={getCandidatePhoto(vp.photo, vp.name, 96, candidate.party_color)}
                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(vp.name, 96, candidate.party_color); }}
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
                        <div className="text-[10px] px-3 py-2 rounded-lg mb-5" style={{ background: 'rgba(41,121,255,0.06)', border: '1px solid rgba(41,121,255,0.15)', color: 'var(--vp-text-dim)' }}>
                            ℹ️ Información proveniente del <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--vp-blue)', textDecoration: 'underline' }}>Jurado Nacional de Elecciones (JNE)</a>. Mostrada con fines informativos. VOTA.PE no valida ni garantiza la veracidad de estos datos.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] data-block-gap">
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
                        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--vp-border)' }}>
                            <Link href={`/candidate/${resolvedParams.id}/hoja-vida`}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(188,29,25,0.12), rgba(188,29,25,0.05))',
                                    border: '1px solid rgba(188,29,25,0.25)',
                                    color: '#bc1d19',
                                }}>
                                📋 Ver Hoja de Vida Completa (JNE) →
                            </Link>
                        </div>
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
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>
                                    📜 Resumen de Plan de Gobierno
                                </h3>
                                <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(41,121,255,0.06)', border: '1px solid rgba(41,121,255,0.15)', color: 'var(--vp-text-dim)' }}>
                                    ℹ️ Datos del <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--vp-blue)', textDecoration: 'underline' }}>JNE Voto Informado</a>. Presentados con fines informativos y educativos.
                                </div>
                                {(candidate.plan_pdf_url || candidate.plan_pdf_local) && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {candidate.plan_pdf_url && (
                                            <a
                                                href={candidate.plan_pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(255,23,68,0.15), rgba(255,23,68,0.05))',
                                                    border: '1px solid rgba(255,23,68,0.3)',
                                                    color: 'var(--vp-red)',
                                                }}
                                            >
                                                📄 Plan Completo (PDF)
                                            </a>
                                        )}
                                        {candidate.plan_pdf_local && (
                                            <a
                                                href={candidate.plan_pdf_local}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(41,121,255,0.15), rgba(41,121,255,0.05))',
                                                    border: '1px solid rgba(41,121,255,0.3)',
                                                    color: 'var(--vp-blue)',
                                                }}
                                            >
                                                📋 Resumen (PDF)
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-6 data-block-gap">
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
            <SiteFooter />
        </div>
    );
}
