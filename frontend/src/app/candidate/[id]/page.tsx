'use client';

import { useState, useEffect } from 'react';
import { Candidate, getCandidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';
import { useSelection } from '@/lib/selection';

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
                    <span className="text-base font-black" style={{ color }}>{value.toFixed(1)}</span>
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
        : score >= 40 ? { label: 'ESTABLE', icon: '📊', color: '#0e7490' }
            : { label: 'EN BAJA', icon: '📉', color: 'var(--vp-text-dim)' };
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${level.color}15`, border: `1px solid ${level.color}33` }}>
            <span>{level.icon}</span>
            <span className="text-[10px] font-bold tracking-wider" style={{ color: level.color }}>{level.label}</span>
            <span className="text-xs font-black" style={{ color: level.color }}>{score.toFixed(1)}</span>
        </div>
    );
}

/* ── Professional SVG Icons ── */
const SvgIcon = {
    graduation: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>,
    briefcase: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>,
    building: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 10h1M14 10h1M9 14h1M14 14h1"/></svg>,
    coins: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><path d="M15.35 9.35A7 7 0 1 0 9.35 15.35"/><path d="M9 7v4l2 1"/></svg>,
    scale: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M5 6l7-3 7 3"/><path d="M2 14l3-8 3 8a5 5 0 0 1-6 0z"/><path d="M16 14l3-8 3 8a5 5 0 0 1-6 0z"/></svg>,
    globe: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    target: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    trendUp: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    ruler: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2"/></svg>,
    link: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    shield: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
    fileText: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    clipboard: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6M9 18h6M9 10h6"/></svg>,
    barChart: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    search: (color = 'currentColor', size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

function SubScoreRow({ icon, label, weight, score, explain, detail, color, onClick }: {
    icon: React.ReactNode; label: string; weight: number; score: number; explain: string; detail?: string; color: string; onClick?: () => void;
}) {
    const pct = Math.min(100, score);
    return (
        <div className="cp-subscore-row" onClick={onClick}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.borderColor = `${color}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
            <span className="cp-subscore-icon">{icon}</span>
            <div className="cp-subscore-label">
                <div className="cp-subscore-name">{label}</div>
                <div className="cp-subscore-weight">Peso: {weight}%</div>
            </div>
            <div className="cp-subscore-bar-track">
                <div className="cp-subscore-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 8px ${color}33` }} />
            </div>
            <div className="cp-subscore-value" style={{ color }}>{score}</div>
            <div className="cp-subscore-explain">
                <div className="cp-subscore-explain-text">{explain}</div>
                {detail && <div className="cp-subscore-explain-detail">{detail}</div>}
                <svg className="cp-subscore-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        </div>
    );
}

function ScoreDetailModal({ title, icon, score, color, children, onClose }: {
    title: string; icon: string; score: number; color: string; children: React.ReactNode; onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}
                style={{ background: '#ffffff', border: `1px solid ${color}44`, boxShadow: `0 25px 60px rgba(0,0,0,0.15), 0 0 40px ${color}10` }}>
                <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between rounded-t-2xl" style={{ background: `${color}15`, borderBottom: `1px solid ${color}33` }}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                            <div className="text-sm font-bold" style={{ color }}>{title}</div>
                            <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>Informe detallado del análisis</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-black" style={{ color }}>{score}<span className="text-xs font-semibold">/100</span></div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: 'var(--vp-text-dim)' }}>✕</button>
                    </div>
                </div>
                <div className="p-5 space-y-4">{children}</div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, icon, color }: { label: string; value: string; icon?: string; color?: string }) {
    return (
        <div className="flex items-start gap-2 py-2 px-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
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
    vice_president_1: 'Primer(a) Vicepresidente(a)',
    vice_president_2: 'Segundo(a) Vicepresidente(a)',
    senator: 'Candidato(a) al Senado',
    deputy: 'Candidato(a) a la Cámara de Diputados',
    andean: 'Candidato(a) al Parlamento Andino'
};

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { addCandidate, isInCart, state: selState } = useSelection();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [sectorData, setSectorData] = useState<any>(null);
    const [sectorModal, setSectorModal] = useState<{ id: string; name: string; emoji: string; percentage: number } | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);

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
        // Fetch sector analysis
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/candidates/sector-analysis`)
            .then(r => r.json()).then(d => setSectorData(d)).catch(() => { });
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
    const finalScoreDB = Number(candidate.final_score);
    const starsVal = Number(candidate.stars_rating);

    // Score formula breakdown — position-aware
    const hojaScore = Number((candidate as any).hoja_score) || 0;
    const planScore = Number((candidate as any).plan_score) || 0;
    const experienceScore = Number((candidate as any).experience_score) || 0;
    const intencionScore = Math.min(100, (candidate.vote_count / 5000) * 100); // display-only indicator
    const isPresident = candidate.position === 'president';
    const formulaBreakdown = isPresident ? {
        hojaVida: { value: hojaScore * 0.30, weight: 30, raw: hojaScore },
        planGobierno: { value: planScore * 0.30, weight: 30, raw: planScore },
        experiencia: { value: experienceScore * 0.25, weight: 25, raw: experienceScore },
        integrity: { value: integrScore * 0.15, weight: 15, raw: integrScore },
    } : {
        hojaVida: { value: hojaScore * 0.40, weight: 40, raw: hojaScore },
        planGobierno: { value: 0, weight: 0, raw: 0 },
        experiencia: { value: experienceScore * 0.35, weight: 35, raw: experienceScore },
        integrity: { value: integrScore * 0.25, weight: 25, raw: integrScore },
    };
    // Compute final score from the formula breakdown (not from DB)
    const finalScore = parseFloat((formulaBreakdown.hojaVida.value + formulaBreakdown.planGobierno.value + formulaBreakdown.experiencia.value + formulaBreakdown.integrity.value).toFixed(1));

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

        // Work (20%) — only non-political jobs. 15pts each + 40pts bonus for 20+ year jobs, max 100.
        let workScore = pureWorkExp.length * 15;
        pureWorkExp.forEach((w: any) => {
            let from = parseInt(w.start_year || w.year_from || w.from || 0);
            let to = parseInt(w.end_year || w.year_to || w.to || 0);
            if ((!from || !to) && w.period) {
                const years = (w.period + '').match(/(\d{4})/g);
                if (years && years.length >= 1) {
                    if (!from) from = parseInt(years[0]);
                    if (!to && years.length >= 2) to = parseInt(years[1]);
                }
            }
            if (!to) to = new Date().getFullYear();
            if (from > 0 && (to - from) >= 20) workScore += 40;
        });
        workScore = Math.min(100, workScore);

        // Political (15%) — from political_history + political roles in work_experience. Flat: 20pts each, max 100.
        const polHistory = (hv.political_history || []).filter((p: any) => p && (p.organization || p.position));
        const allPolitical = [...polHistory, ...politicalFromWork];
        let politicalScore = Math.min(100, allPolitical.length * 20);


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
        let goalsCount = 0; items.forEach(item => { const g = (item.goals || '').trim(); const o = (item.objective || '').trim(); if (g.length > 3) goalsCount++; else if (o.length > 50) goalsCount += 0.5; else if ((item.problem || '').length > 100) goalsCount += 0.3; });
        const measurabilityScore = items.length > 0 ? Math.min(100, (goalsCount / items.length) * 100) : 0;
        const indicatorsCount = items.filter(item => (item.indicator || '').trim().length > 5).length;
        const indicatorScore = items.length > 0 ? (indicatorsCount / items.length) * 100 : 0;
        let cohTotal = 0; items.forEach(item => { const prob = (item.problem || '').toLowerCase(); const obj = (item.objective || '').toLowerCase(); if (prob.length < 5 || obj.length < 5) return; const words = prob.split(/\s+/).filter(w => w.length > 4); if (words.length === 0) { cohTotal += 30; return; } const m = words.filter(w => obj.includes(w)).length / words.length; cohTotal += m >= 0.3 ? 100 : m >= 0.15 ? 70 : m > 0 ? 40 : 15; });
        const coherenceScore = items.length > 0 ? cohTotal / items.length : 0;

        return {
            coverage: { score: parseFloat(coverageScore.toFixed(1)), weight: 25, explain: `${dims.size} de ${JNE_DIMS.length} dimensiones cubiertas` },
            specificity: { score: parseFloat(specificityScore.toFixed(1)), weight: 25, explain: specificityScore >= 75 ? 'Objetivos detallados' : specificityScore >= 50 ? 'Objetivos moderados' : 'Objetivos vagos' },
            measurability: { score: parseFloat(measurabilityScore.toFixed(1)), weight: 20, explain: `${goalsCount} de ${items.length} ítems con metas concretas` },
            indicators: { score: parseFloat(indicatorScore.toFixed(1)), weight: 15, explain: `${indicatorsCount} de ${items.length} ítems con indicadores` },
            coherence: { score: parseFloat(coherenceScore.toFixed(1)), weight: 15, explain: coherenceScore >= 70 ? 'Buena coherencia problema-objetivo' : coherenceScore >= 40 ? 'Coherencia moderada' : 'Coherencia débil' },
            totalItems: items.length,
        };
    })();

    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            {/* Full Navigation Header */}
            <NavHeader />

            <main className="internal-page-wrapper space-y-10">
                {/* ← Back Navigation */}
                <button onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02] cursor-pointer"
                    style={{ color: 'var(--vp-text-dim)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vp-border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,23,68,0.08)'; e.currentTarget.style.color = 'var(--vp-red)'; e.currentTarget.style.borderColor = 'rgba(255,23,68,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--vp-text-dim)'; e.currentTarget.style.borderColor = 'var(--vp-border)'; }}>
                    ← Volver
                </button>

                {/* Party Link — Ver plancha completa */}
                <div className="panel-glow">
                    <Link href={`/party/${candidate.party_id}`}
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ background: `${candidate.party_color}11`, border: `1px solid ${candidate.party_color}33` }}>
                        <div className="flex items-center gap-3">
                            {candidate.party_logo ? (
                                <img
                                    src={candidate.party_logo}
                                    alt={candidate.party_name}
                                    className="w-10 h-10 rounded-lg object-contain"
                                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.removeProperty('display'); }}
                                />
                            ) : null}
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: candidate.party_color + '33', color: candidate.party_color, display: candidate.party_logo ? 'none' : 'flex' }}>
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
                                onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 128, candidate.party_color); } }}
                                alt={candidate.name}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-black mb-1 leading-tight" style={{ color: 'var(--vp-text)' }}>{candidate.name}</h1>
                            {(candidate as any).is_current_congressman && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, fontWeight: 700, marginBottom: 8,
                                    padding: '4px 12px', borderRadius: 6,
                                    background: 'linear-gradient(135deg, #f9a825, #ff8f00)',
                                    color: '#fff', letterSpacing: '0.03em',
                                    boxShadow: '0 2px 8px rgba(249,168,37,0.35)',
                                }}>
                                    🏛️ CONGRESISTA ACTUAL {(candidate as any).congress_bancada ? `· ${(candidate as any).congress_bancada}` : ''}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                                <Link href={`/party/${candidate.party_id}`}
                                    className="text-sm font-bold px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                                    style={{ background: candidate.party_color + '22', color: candidate.party_color, border: `1px solid ${candidate.party_color}44` }}>
                                    {candidate.party_abbreviation} • {candidate.party_name}
                                </Link>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                    {positionLabels[candidate.position] || candidate.position}
                                </span>
                                {sectorData?.analysis && (() => {
                                    const pn = ((candidate as any).party_jne_name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
                                    const me = Object.values(sectorData.analysis as Record<string, any>).find((e: any) => {
                                        const en = (e.party_name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
                                        return en === pn || pn.includes(en) || en.includes(pn);
                                    });
                                    const aiPct = me?.ai_analysis?.percentage || 0;
                                    return (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg cursor-pointer hover:scale-105 transition-transform inline-flex items-center gap-1"
                                            style={{ background: 'rgba(30,58,95,0.1)', color: '#1e3a5f', border: '1px solid rgba(30,58,95,0.3)' }}
                                            onClick={() => setShowAiModal(true)}>
                                            🤖 IA: {aiPct}%
                                        </span>
                                    );
                                })()}
                            </div>
                            {/* Intención Ciudadana */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.2)' }}>
                                    <span>🗳️</span>
                                    <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-red)' }}>INTENCIÓN</span>
                                    <span className="text-sm font-black" style={{ color: 'var(--vp-red)' }}>{candidate.vote_count?.toLocaleString() || '0'}</span>
                                </div>
                                <MomentumIndicator score={momScore} />
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <StarRating rating={starsVal} />
                                <span className="text-xs font-bold" style={{ color: '#0e7490' }}>{starsVal.toFixed(1)}/5.0</span>
                            </div>
                            {/* Elegir Candidato Button */}
                            {candidate && (
                                <button
                                    onClick={() => addCandidate(candidate)}
                                    disabled={isInCart(candidate.id)}
                                    className="mt-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.03] cursor-pointer"
                                    style={isInCart(candidate.id)
                                        ? { background: 'rgba(0,230,118,0.1)', color: 'var(--vp-green)', border: '1px solid rgba(0,230,118,0.3)', cursor: 'default' }
                                        : { background: 'rgba(255,23,68,0.12)', color: 'var(--vp-red)', border: '1px solid rgba(255,23,68,0.4)' }
                                    }
                                    onMouseEnter={(e) => { if (!isInCart(candidate.id)) { e.currentTarget.style.background = 'rgba(255,23,68,0.25)'; } }}
                                    onMouseLeave={(e) => { if (!isInCart(candidate.id)) { e.currentTarget.style.background = 'rgba(255,23,68,0.12)'; } }}>
                                    {isInCart(candidate.id) ? '✅ En tu selección' : '➕ Elegir candidato'}
                                </button>
                            )}
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

                {/* ═══ UNIFIED SCORE PANEL ═══ */}
                <div className="cp-score-panel">
                    {/* ── Gradient accent bar ── */}
                    <div className="cp-score-panel-accent" />

                    {/* ── Header: Score gauges row ── */}
                    <div className="cp-score-gauges" style={!isPresident ? { justifyContent: 'space-around' } : undefined}>
                        {[
                            { label: 'Hoja de Vida', score: hojaScore, weight: isPresident ? 30 : 40, accent: '#6366f1', icon: SvgIcon.fileText('#6366f1', 18) },
                            ...(isPresident ? [{ label: 'Plan de Gobierno', score: planScore, weight: 30, accent: '#0ea5e9', icon: SvgIcon.clipboard('#0ea5e9', 18) }] : []),
                            { label: 'Experiencia', score: experienceScore, weight: isPresident ? 25 : 35, accent: '#f59e0b', icon: SvgIcon.briefcase('#f59e0b', 18) },
                            { label: 'Integridad', score: integrScore, weight: isPresident ? 15 : 25, accent: '#10b981', icon: SvgIcon.shield('#10b981', 18) },
                        ].map((g, idx) => (
                            <div key={idx} className="cp-gauge-item">
                                <div className="cp-gauge-ring">
                                    <svg viewBox="0 0 48 48">
                                        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
                                        <circle cx="24" cy="24" r="20" fill="none" stroke={g.accent} strokeWidth="3"
                                            strokeDasharray={`${(g.score / 100) * 125.7} 125.7`} strokeLinecap="round"
                                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 6px ${g.accent}40)` }} />
                                    </svg>
                                    <span className="cp-gauge-val" style={{ color: g.accent }}>{g.score.toFixed(1)}</span>
                                </div>
                                <div className="cp-gauge-meta">
                                    <span className="cp-gauge-label">{g.label}</span>
                                    <span className="cp-gauge-weight">{g.weight}% del score</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Formula bar ── */}
                    <div className="cp-formula-bar">
                        <div className="cp-formula-bar-header">
                            <div className="cp-formula-bar-title">
                                {SvgIcon.barChart('#64748b', 14)}
                                <span>Análisis del Score</span>
                            </div>
                            <div className="cp-formula-equation">
                                {isPresident ? 'score = (HV×0.30) + (Plan×0.30) + (Exp×0.25) + (Integ×0.15)' : 'score = (HV×0.40) + (Exp×0.35) + (Integ×0.25)'}
                            </div>
                            <div className="cp-formula-result">
                                <span className="cp-formula-result-val">{finalScore.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="cp-formula-bars">
                            {[
                                { key: 'hv', label: 'Hoja de Vida', value: formulaBreakdown.hojaVida.value, raw: formulaBreakdown.hojaVida.raw, weight: isPresident ? 30 : 40, bg: 'linear-gradient(90deg, #6366f1, #818cf8)', color: '#6366f1',
                                  explain: `Score HV: ${formulaBreakdown.hojaVida.raw.toFixed(1)}/100. Evalúa educación (25%), experiencia laboral (20%), experiencia política (15%), transparencia financiera (10%) y limpieza judicial (25%).` },
                                ...(isPresident ? [{ key: 'plan', label: 'Plan de Gobierno', value: formulaBreakdown.planGobierno.value, raw: formulaBreakdown.planGobierno.raw, weight: 30, bg: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', color: '#0ea5e9',
                                  explain: `Score Plan: ${formulaBreakdown.planGobierno.raw.toFixed(1)}/100. Evalúa cobertura dimensional (25%), especificidad (25%), metas (20%), indicadores (15%) y coherencia (15%).` }] : []),
                                { key: 'exp', label: 'Experiencia', value: formulaBreakdown.experiencia.value, raw: formulaBreakdown.experiencia.raw, weight: isPresident ? 25 : 35, bg: 'linear-gradient(90deg, #f59e0b, #fbbf24)', color: '#f59e0b',
                                  explain: `Score Exp: ${formulaBreakdown.experiencia.raw.toFixed(1)}/100. Cada experiencia = 15pts + bonus 40pts por 20+ años (máx 100).` },
                                { key: 'integ', label: 'Integridad', value: formulaBreakdown.integrity.value, raw: formulaBreakdown.integrity.raw, weight: isPresident ? 15 : 25, bg: 'linear-gradient(90deg, #10b981, #34d399)', color: '#10b981',
                                  explain: `Score Integ: ${formulaBreakdown.integrity.raw.toFixed(1)}/100. Basado únicamente en sentencias judiciales. 100 = sin sentencias. -25 pts por cada sentencia.` },
                            ].map((seg) => (
                                <div key={seg.key} className="cp-formula-segment-wrap" style={{ flex: Math.max(seg.value, 0.5) }}>
                                    <div className="cp-formula-segment-bar"
                                        style={{ background: seg.bg, cursor: 'pointer' }}
                                        onClick={() => setActiveModal(activeModal === `formula-${seg.key}` ? null : `formula-${seg.key}`)}
                                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scaleY(1.15)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'scaleY(1)'; }}>
                                        <span>{seg.value.toFixed(1)}</span>
                                    </div>
                                    <div className="cp-formula-segment-label">{seg.label} ({seg.weight}%)</div>
                                    {activeModal === `formula-${seg.key}` && (
                                        <div className="cp-formula-popover" style={{ borderColor: `${seg.color}33` }}>
                                            <div className="cp-formula-popover-header" style={{ color: seg.color }}>
                                                {seg.label}: {seg.raw.toFixed(0)}/100 × {seg.weight}% = {seg.value.toFixed(1)} pts
                                            </div>
                                            <div className="cp-formula-popover-body">{seg.explain}</div>
                                            <div className="cp-formula-popover-close" onClick={(e) => { e.stopPropagation(); setActiveModal(null); }}>✕</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Detail header ── */}
                    <div className="cp-detail-header">
                        {SvgIcon.search('#64748b', 14)}
                        <span>¿Por qué este Score?</span>
                    </div>

                    {/* ── HV + Plan side by side (presidential) or HV full-width (others) ── */}
                    <div className="cp-detail-grid" style={!isPresident ? { gridTemplateColumns: '1fr' } : undefined}>
                        {/* Hoja de Vida */}
                        <div className="cp-detail-card" style={{ borderColor: '#6366f122' }}>
                            <div className="cp-detail-card-header" style={{ background: 'linear-gradient(135deg, #6366f10d, #6366f104)' }}>
                                <div className="cp-detail-card-title">
                                    {SvgIcon.fileText('#6366f1', 16)}
                                    <span style={{ color: '#6366f1' }}>Hoja de Vida</span>
                                </div>
                                <span className="cp-detail-card-badge" style={{ background: '#6366f115', color: '#6366f1' }}>{hojaScore.toFixed(1)}/100 → {(hojaScore * (isPresident ? 0.30 : 0.40)).toFixed(1)}pts</span>
                            </div>
                            <div className="cp-detail-card-body" style={!isPresident ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' } : undefined}>
                                <SubScoreRow icon={SvgIcon.graduation('#6366f1')} label="Educación" weight={25} score={hvDetail.education.score} explain={hvDetail.education.explain} detail={hvDetail.education.details} color="#6366f1" onClick={() => setActiveModal('hv-education')} />
                                <SubScoreRow icon={SvgIcon.briefcase('#6366f1')} label="Exp. Laboral" weight={20} score={hvDetail.work.score} explain={hvDetail.work.explain} color="#6366f1" onClick={() => setActiveModal('hv-work')} />
                                <SubScoreRow icon={SvgIcon.building('#6366f1')} label="Exp. Política" weight={15} score={hvDetail.political.score} explain={hvDetail.political.explain} color="#6366f1" onClick={() => setActiveModal('hv-political')} />
                                <SubScoreRow icon={SvgIcon.coins('#6366f1')} label="Finanzas" weight={10} score={hvDetail.finance.score} explain={hvDetail.finance.explain} color="#6366f1" onClick={() => setActiveModal('hv-finance')} />
                                <SubScoreRow icon={SvgIcon.scale('#6366f1')} label="Judicial" weight={25} score={hvDetail.judicial.score} explain={hvDetail.judicial.explain} color="#6366f1" onClick={() => setActiveModal('hv-judicial')} />
                            </div>
                        </div>

                        {/* Plan de Gobierno — only for presidential candidates */}
                        {isPresident && (
                        <div className="cp-detail-card" style={{ borderColor: '#0ea5e922' }}>
                            <div className="cp-detail-card-header" style={{ background: 'linear-gradient(135deg, #0ea5e90d, #0ea5e904)' }}>
                                <div className="cp-detail-card-title">
                                    {SvgIcon.clipboard('#0ea5e9', 16)}
                                    <span style={{ color: '#0ea5e9' }}>Plan de Gobierno</span>
                                </div>
                                <span className="cp-detail-card-badge" style={{ background: '#0ea5e915', color: '#0ea5e9' }}>{planScore.toFixed(1)}/100 → {(planScore * 0.30).toFixed(1)}pts</span>
                            </div>
                            {planDetail ? (
                                <div className="cp-detail-card-body">
                                    <div className="cp-detail-items-count">{planDetail.totalItems} ítems evaluados</div>
                                    <SubScoreRow icon={SvgIcon.globe('#0ea5e9')} label="Cobertura" weight={25} score={planDetail.coverage.score} explain={planDetail.coverage.explain} color="#0ea5e9" onClick={() => setActiveModal('plan-coverage')} />
                                    <SubScoreRow icon={SvgIcon.target('#0ea5e9')} label="Especificidad" weight={25} score={planDetail.specificity.score} explain={planDetail.specificity.explain} color="#0ea5e9" onClick={() => setActiveModal('plan-specificity')} />
                                    <SubScoreRow icon={SvgIcon.trendUp('#0ea5e9')} label="Metas" weight={20} score={planDetail.measurability.score} explain={planDetail.measurability.explain} color="#0ea5e9" onClick={() => setActiveModal('plan-goals')} />
                                    <SubScoreRow icon={SvgIcon.ruler('#0ea5e9')} label="Indicadores" weight={15} score={planDetail.indicators.score} explain={planDetail.indicators.explain} color="#0ea5e9" onClick={() => setActiveModal('plan-indicators')} />
                                    <SubScoreRow icon={SvgIcon.link('#0ea5e9')} label="Coherencia" weight={15} score={planDetail.coherence.score} explain={planDetail.coherence.explain} color="#0ea5e9" onClick={() => setActiveModal('plan-coherence')} />
                                </div>
                            ) : (
                                <div className="cp-detail-card-body cp-detail-empty">Sin plan registrado en JNE.</div>
                            )}
                        </div>
                        )}
                    </div>

                    {/* ── Experiencia + Integridad ── */}
                    <div className="cp-detail-grid">
                        {/* Experiencia */}
                        <div className="cp-detail-card cp-detail-card-compact" style={{ borderColor: '#f59e0b22', cursor: 'pointer' }}
                            onClick={() => setActiveModal('experiencia')}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f59e0b55'; e.currentTarget.style.background = '#f59e0b06'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f59e0b22'; e.currentTarget.style.background = 'transparent'; }}>
                            <div className="cp-detail-card-header" style={{ background: 'linear-gradient(135deg, #f59e0b0d, #f59e0b04)' }}>
                                <div className="cp-detail-card-title">
                                    {SvgIcon.briefcase('#f59e0b', 16)}
                                    <span style={{ color: '#f59e0b' }}>Experiencia Laboral</span>
                                </div>
                                <span className="cp-detail-card-badge" style={{ background: '#f59e0b15', color: '#f59e0b' }}>{experienceScore.toFixed(1)}/100 → {(experienceScore * 0.25).toFixed(1)}pts</span>
                            </div>
                            <div className="cp-detail-compact-body">
                                <div className="cp-detail-compact-info">
                                    <div className="cp-detail-compact-status" style={{ color: 'var(--vp-text)' }}>
                                        {experienceScore >= 80 ? 'Amplia experiencia' : experienceScore >= 50 ? 'Experiencia moderada' : experienceScore >= 20 ? 'Experiencia limitada' : 'Sin experiencia registrada'}
                                    </div>
                                    <div className="cp-detail-compact-sub">Basado en experiencia laboral y profesional declarada</div>
                                </div>
                                <div className="cp-detail-compact-score" style={{ borderColor: '#f59e0b33' }}>
                                    <span style={{ color: '#f59e0b' }}>{experienceScore.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Integridad */}
                        <div className="cp-detail-card cp-detail-card-compact" style={{ borderColor: '#10b98122', cursor: 'pointer' }}
                            onClick={() => setActiveModal('integridad')}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b98155'; e.currentTarget.style.background = '#10b98106'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#10b98122'; e.currentTarget.style.background = 'transparent'; }}>
                            <div className="cp-detail-card-header" style={{ background: 'linear-gradient(135deg, #10b9810d, #10b98104)' }}>
                                <div className="cp-detail-card-title">
                                    {SvgIcon.shield('#10b981', 16)}
                                    <span style={{ color: '#10b981' }}>Integridad</span>
                                </div>
                                <span className="cp-detail-card-badge" style={{ background: '#10b98115', color: '#10b981' }}>{integrScore.toFixed(1)}/100 → {(integrScore * 0.15).toFixed(1)}pts</span>
                            </div>
                            <div className="cp-detail-compact-body">
                                <div className="cp-detail-compact-info">
                                    <div className="cp-detail-compact-status" style={{ color: 'var(--vp-text)' }}>
                                        {integrScore >= 90 ? 'Historial limpio' : integrScore >= 70 ? 'Observaciones menores' : integrScore >= 50 ? 'Alertas moderadas' : 'Alertas significativas'}
                                    </div>
                                    <div className="cp-detail-compact-sub">Basado en sentencias judiciales declaradas (-25 pts c/u)</div>
                                </div>
                                <div className="cp-detail-compact-score" style={{ borderColor: `${integrScore >= 70 ? '#10b981' : 'var(--vp-red)'}33` }}>
                                    <span style={{ color: integrScore >= 70 ? '#10b981' : 'var(--vp-red)' }}>{integrScore.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Desempeño Congresal (only for congress members) ── */}
                    {(candidate as any).is_current_congressman && (candidate as any).congress_proyectos && (
                        <div style={{
                            marginTop: 16, borderRadius: 14, overflow: 'hidden',
                            border: '1px solid rgba(249,168,37,0.2)',
                            background: '#fff',
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #1B2A4A, #2c3e6b)',
                                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 20 }}>🏛️</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Desempeño Congresal 2021-2026</div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                                        Bancada: {(candidate as any).congress_bancada}
                                        {(candidate as any).congress_bancada_original && (
                                            <span style={{ color: '#f9a825' }}> (antes: {(candidate as any).congress_bancada_original})</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Proyectos de Ley</div>
                                    <div style={{
                                        fontSize: 28, fontWeight: 900,
                                        color: (candidate as any).congress_proyectos >= 40 ? '#2e7d32' : (candidate as any).congress_proyectos >= 20 ? '#e65100' : '#c62828',
                                    }}>
                                        {(candidate as any).congress_proyectos}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#b0bec5', marginTop: 2 }}>presentados</div>
                                </div>
                                <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Asistencia al Pleno</div>
                                    <div style={{
                                        fontSize: 28, fontWeight: 900,
                                        color: (candidate as any).congress_asistencia >= 85 ? '#2e7d32' : (candidate as any).congress_asistencia >= 75 ? '#e65100' : '#c62828',
                                    }}>
                                        {(candidate as any).congress_asistencia}%
                                    </div>
                                    <div style={{ fontSize: 9, color: '#b0bec5', marginTop: 2 }}>de sesiones</div>
                                </div>
                                <div style={{ flex: 1, padding: '16px 12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Cambio de Bancada</div>
                                    <div style={{
                                        fontSize: 28, fontWeight: 900,
                                        color: (candidate as any).congress_cambio_bancada ? '#c62828' : '#2e7d32',
                                    }}>
                                        {(candidate as any).congress_cambio_bancada ? 'SÍ' : 'NO'}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#b0bec5', marginTop: 2 }}>tránsfuga</div>
                                </div>
                            </div>

                            {/* Committees */}
                            {(candidate as any).congress_comisiones?.length > 0 && (
                                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#607d8b' }}>Comisiones:</span>
                                    {((candidate as any).congress_comisiones as string[]).map((c: string) => (
                                        <span key={c} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f0f4f8', color: '#455a64' }}>{c}</span>
                                    ))}
                                </div>
                            )}

                            {/* Highlight */}
                            {(candidate as any).congress_destacado && (
                                <div style={{ padding: '12px 20px', fontSize: 12, color: '#455a64', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                    <span>💡</span>
                                    <span>{(candidate as any).congress_destacado}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══ SCORE DETAIL MODALS ══ */}
                    {activeModal === 'hv-education' && (() => {
                        const edu = hv.education || {};
                        const tech = (edu.technical || []).filter((t: any) => t && (t.institution || t.specialty));
                        const uni = (edu.university || []).filter((u: any) => u && (u.institution || u.degree));
                        const post = (edu.postgraduate || []).filter((p: any) => p && (p.institution || p.specialty));
                        return (
                            <ScoreDetailModal title="Educación" icon="🎓" score={hvDetail.education.score} color="#6366f1" onClose={() => setActiveModal(null)}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6366f1' }}>Criterio de evaluación</div>
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
                            <ScoreDetailModal title="Experiencia Laboral" icon="💼" score={hvDetail.work.score} color="#6366f1" onClose={() => setActiveModal(null)}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6366f1' }}>Criterio</div>
                                <div className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>Cada experiencia no-política = 15pts (máx 100). Bonus +40pts por empleos de 20+ años.</div>
                                {pureWork.length > 0 ? pureWork.map((w: any, i: number) => <DetailItem key={i} icon="💼" label={w.position || 'Cargo'} value={`${w.employer || ''}${w.period ? ` (${w.period})` : ''}${w.comment ? ` — ${w.comment}` : ''}`} />) : <DetailItem icon="ℹ️" label="Sin experiencia laboral" value="No se encontraron experiencias no-políticas en JNE." />}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'hv-political' && (() => {
                        const polHist = (hv.political_history || []).filter((p: any) => p && (p.organization || p.position));
                        const elections = hv.elections || [];
                        return (
                            <ScoreDetailModal title="Experiencia Política" icon="🏛️" score={hvDetail.political.score} color="#6366f1" onClose={() => setActiveModal(null)}>
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
                            <ScoreDetailModal title="Transparencia Financiera" icon="💰" score={hvDetail.finance.score} color="#6366f1" onClose={() => setActiveModal(null)}>
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
                            <ScoreDetailModal title="Limpieza Judicial" icon="⚖️" score={hvDetail.judicial.score} color="#6366f1" onClose={() => setActiveModal(null)}>
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
                            <ScoreDetailModal title="Cobertura Dimensional" icon="🌐" score={planDetail.coverage.score} color="#0ea5e9" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>JNE exige 6 dimensiones. Score = (cubiertas / 6) x 100.</div>
                                {JNE_DIMS.map((d, i) => <DetailItem key={i} icon={covered.has(d) ? '✅' : '❌'} label={d} value={covered.has(d) ? 'Cubierta' : 'No cubierta'} color={covered.has(d) ? 'var(--vp-green)' : 'var(--vp-red)'} />)}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-specificity' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Especificidad" icon="🎯" score={planDetail.specificity.score} color="#0ea5e9" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa detalle de objetivos. Corto = 20pts, moderado = 50pts, detallado = 100pts.</div>
                                {items.map((item, i) => { const len = (item.objective || '').length; const lvl = len < 30 ? 'Vago' : len < 80 ? 'Moderado' : 'Detallado'; return <DetailItem key={i} icon={len >= 80 ? '✅' : '⚠️'} label={item.problem || `Ítem ${i + 1}`} value={`"${item.objective || 'Sin objetivo'}" (${len} chars — ${lvl})`} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-goals' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Metas Concretas" icon="📈" score={planDetail.measurability.score} color="#0ea5e9" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa si cada ítem tiene metas medibles.</div>
                                {items.map((item, i) => { const ok = (item.goals || '').trim().length > 3 || (item.objective || '').trim().length > 50; return <DetailItem key={i} icon={ok ? '✅' : '❌'} label={item.problem || `Ítem ${i + 1}`} value={ok ? (item.goals || item.objective || 'Meta implícita') : 'Sin meta concreta'} color={ok ? 'var(--vp-green)' : 'var(--vp-red)'} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-indicators' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Indicadores" icon="📏" score={planDetail.indicators.score} color="#0ea5e9" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa si cada ítem tiene indicadores de medición (+5 chars).</div>
                                {items.map((item, i) => { const ok = (item.indicator || '').trim().length > 5; return <DetailItem key={i} icon={ok ? '✅' : '❌'} label={item.problem || `Ítem ${i + 1}`} value={ok ? item.indicator! : 'Sin indicador'} color={ok ? 'var(--vp-green)' : 'var(--vp-red)'} />; })}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'plan-coherence' && planDetail && (() => {
                        const items = candidate.plan_gobierno || [];
                        return (
                            <ScoreDetailModal title="Coherencia" icon="🔗" score={planDetail.coherence.score} color="#0ea5e9" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa coincidencia entre problema y objetivo planteado.</div>
                                {items.map((item, i) => <DetailItem key={i} icon="🔗" label={item.problem || `Ítem ${i + 1}`} value={`Objetivo: "${item.objective || 'Sin objetivo'}"`} />)}
                            </ScoreDetailModal>
                        );
                    })()}

                    {activeModal === 'experiencia' && (
                        <ScoreDetailModal title="Experiencia Laboral" icon="💼" score={parseFloat(experienceScore.toFixed(1))} color="#f59e0b" onClose={() => setActiveModal(null)}>
                            <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa la experiencia laboral y profesional declarada ante el JNE. Cada trabajo válido = 15pts, bonus +40pts por 20+ años continuos.</div>
                            <DetailItem icon="💼" label="Trabajos registrados" value={`${(hv.work_experience || []).filter((w: any) => w && (w.position || w.employer)).length} experiencia(s) laboral(es) declarada(s)`} />
                            <DetailItem icon="📊" label="Score" value={`${experienceScore.toFixed(1)}/100 → Contribuye ${(experienceScore * 0.25).toFixed(1)} pts al score final (25%)`} />
                            <DetailItem icon="ℹ️" label="Nota" value="Este score se extrae de la Hoja de Vida (sección Exp. Laboral) como componente independiente de la fórmula." color="#f59e0b" />
                        </ScoreDetailModal>
                    )}

                    {activeModal === 'integridad' && (() => {
                        const sentences = hv.sentences || [];
                        return (
                            <ScoreDetailModal title="Integridad" icon="🛡️" score={parseFloat(integrScore.toFixed(1))} color="#10b981" onClose={() => setActiveModal(null)}>
                                <div className="text-xs mb-4" style={{ color: 'var(--vp-text-dim)' }}>Evalúa únicamente las sentencias judiciales declaradas ante el JNE. Inicia en 100 y se descuenta 25 puntos por cada sentencia.</div>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--vp-text-dim)' }}>⚖️ Sentencias Judiciales</div>
                                {sentences.length === 0 ? <DetailItem icon="✅" label="Sin sentencias" value="Historial limpio. Score: 100/100" color="var(--vp-green)" /> : (
                                    <>
                                        {sentences.map((s: any, i: number) => <DetailItem key={i} icon="🔴" label={`${s.type || 'Sentencia'}: ${s.crime || 'Sin detalle'}`} value={`${s.sentence || 'Sin especificar'} → -25 pts`} color="var(--vp-red)" />)}
                                        <DetailItem icon="📊" label="Cálculo" value={`100 - (${sentences.length} sentencia(s) × 25) = ${Math.max(0, 100 - sentences.length * 25)} pts`} color="#10b981" />
                                    </>
                                )}
                            </ScoreDetailModal>
                        );
                    })()}
                </div>


                {/* Proposals — hidden by request
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
                */}

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
                                    achievement: { icon: '🏆', color: 'var(--vp-blue)', bg: 'rgba(30,58,95,0.05)', label: 'LOGRO' },
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

                {/* === FÓRMULA PRESIDENCIAL (compact) === */}
                {candidate.vice_presidents && candidate.vice_presidents.length > 0 && (
                    <div className="panel-glow">
                        <h3 className="text-xs font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--vp-text-dim)' }}>
                            🏛️ Fórmula Presidencial
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Presidente */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-[200px]" style={{ background: `${candidate.party_color}11`, border: `1px solid ${candidate.party_color}33` }}>
                                <img
                                    src={getCandidatePhoto(candidate.photo, candidate.name, 48, candidate.party_color)}
                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 48, candidate.party_color); }}
                                    alt={candidate.name} width={48} height={48}
                                    className="w-12 h-12 rounded-full object-cover shrink-0"
                                    style={{ border: `2px solid ${candidate.party_color}` }}
                                />
                                <div>
                                    <div className="text-sm font-bold" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: candidate.party_color }}>Presidente(a)</div>
                                </div>
                            </div>
                            {/* Vicepresidentes */}
                            {candidate.vice_presidents.map(vp => {
                                const vpContent = (
                                    <div key={vp.id} className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 min-w-[200px] cursor-pointer hover:scale-[1.01] transition-all" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                        <img
                                            src={getCandidatePhoto(vp.photo, vp.name, 48, candidate.party_color)}
                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(vp.name, 48, candidate.party_color); }}
                                            alt={vp.name} width={48} height={48}
                                            className="w-12 h-12 rounded-full object-cover shrink-0"
                                            style={{ border: '2px solid var(--vp-border)' }}
                                        />
                                        <div>
                                            <div className="text-sm font-bold" style={{ color: 'var(--vp-text)' }}>{vp.name}</div>
                                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>{vp.position_label}</div>
                                            <div className="text-[9px] font-semibold mt-0.5" style={{ color: 'var(--vp-blue)' }}>Ver perfil →</div>
                                        </div>
                                    </div>
                                );
                                return (vp as any).candidate_profile_id
                                    ? <Link key={vp.id} href={`/candidate/${(vp as any).candidate_profile_id}`}>{vpContent}</Link>
                                    : vpContent;
                            })}
                        </div>
                    </div>
                )}

                {/* === HOJA DE VIDA === */}
                {(candidate.education || candidate.experience) && (
                    <div className="panel-glow">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>📋 Hoja de Vida</h3>
                            <div className="text-[9px] px-2 py-1 rounded" style={{ background: 'rgba(30,58,95,0.06)', border: '1px solid rgba(30,58,95,0.15)', color: 'var(--vp-text-dim)' }}>
                                ℹ️ Fuente: <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--vp-blue)', textDecoration: 'underline' }}>JNE</a>
                            </div>
                        </div>

                        {isPresident ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {candidate.education && (
                                        <div className="p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.05)', border: '1px solid rgba(30,58,95,0.15)' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm">🎓</span>
                                                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--vp-blue)' }}>Formación Académica</span>
                                            </div>
                                            <div className="text-xs leading-relaxed" style={{ color: 'var(--vp-text)' }}>
                                                {candidate.education.split('. ').filter(l => l.trim()).map((line, i) => (
                                                    <div key={i} className="flex items-start gap-1.5 mb-1">
                                                        <span className="text-[9px] mt-0.5 shrink-0" style={{ color: 'var(--vp-blue)' }}>•</span>
                                                        <span>{line.replace(/\.$/, '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {candidate.experience && (
                                        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm">💼</span>
                                                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--vp-green)' }}>Experiencia Profesional</span>
                                            </div>
                                            <div className="text-xs leading-relaxed" style={{ color: 'var(--vp-text)' }}>
                                                {candidate.experience.split('. ').filter(l => l.trim()).map((line, i) => (
                                                    <div key={i} className="flex items-start gap-1.5 mb-1">
                                                        <span className="text-[9px] mt-0.5 shrink-0" style={{ color: 'var(--vp-green)' }}>•</span>
                                                        <span>{line.replace(/\.$/, '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--vp-border)' }}>
                                    <Link href={`/candidate/${resolvedParams.id}/hoja-vida`}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(188,29,25,0.12), rgba(188,29,25,0.05))',
                                            border: '1px solid rgba(188,29,25,0.25)',
                                            color: '#bc1d19',
                                        }}>
                                        📋 Ver Hoja de Vida Completa (JNE) →
                                    </Link>
                                </div>
                            </>
                        ) : (
                            /* ── Full embedded HV for non-presidential candidates ── */
                            <div className="space-y-3">
                                {/* Formación Académica */}
                                {(() => {
                                    const edu = hvEdu;
                                    const technical = (edu.technical || []).filter((t: any) => t && (t.institution || t.specialty));
                                    const university = (edu.university || []).filter((u: any) => u && (u.institution || u.degree));
                                    const postgraduate = (edu.postgraduate || []).filter((p: any) => p && (p.institution || p.specialty));
                                    const hasEdu = technical.length > 0 || university.length > 0 || postgraduate.length > 0;
                                    return (
                                        <div className="p-4 rounded-xl" style={{ background: 'rgba(30,58,95,0.04)', border: '1px solid rgba(30,58,95,0.12)' }}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-base">🎓</span>
                                                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--vp-blue)' }}>Formación Académica</span>
                                            </div>
                                            {hasEdu ? (
                                                <div className="space-y-2 text-xs" style={{ color: 'var(--vp-text)' }}>
                                                    {postgraduate.map((p: any, i: number) => (
                                                        <div key={`pg-${i}`} className="flex items-start gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)' }}>
                                                            <span className="text-[10px] mt-0.5 shrink-0">🏅</span>
                                                            <div>
                                                                <span className="font-semibold">{p.degree || 'Postgrado'}</span>
                                                                {p.specialty && <span> en {p.specialty}</span>}
                                                                {p.institution && <span className="opacity-70"> ({p.institution})</span>}
                                                                {p.completed && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {university.map((u: any, i: number) => (
                                                        <div key={`uni-${i}`} className="flex items-start gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(30,58,95,0.04)' }}>
                                                            <span className="text-[10px] mt-0.5 shrink-0">🎓</span>
                                                            <div>
                                                                <span className="font-semibold">{u.degree || 'Universitario'}</span>
                                                                {u.institution && <span className="opacity-70"> ({u.institution})</span>}
                                                                {u.completed && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {technical.map((t: any, i: number) => (
                                                        <div key={`tech-${i}`} className="flex items-start gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.04)' }}>
                                                            <span className="text-[10px] mt-0.5 shrink-0">📚</span>
                                                            <div>
                                                                <span className="font-semibold">{t.specialty || 'Técnico'}</span>
                                                                {t.institution && <span className="opacity-70"> ({t.institution})</span>}
                                                                {t.completed && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs italic" style={{ color: 'var(--vp-text-dim)' }}>No registra formación académica superior.</div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Experiencia Laboral + Política side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Experiencia Laboral */}
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.12)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-base">💼</span>
                                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--vp-green)' }}>Experiencia Laboral</span>
                                        </div>
                                        {hv.work_experience && hv.work_experience.length > 0 ? (
                                            <div className="space-y-2 text-xs" style={{ color: 'var(--vp-text)' }}>
                                                {hv.work_experience.map((w: any, i: number) => (
                                                    <div key={i} className="py-1.5 px-2 rounded-lg" style={{ background: 'rgba(0,230,118,0.04)' }}>
                                                        <div className="font-semibold">{w.position || '—'}</div>
                                                        <div className="opacity-70 mt-0.5">{w.employer || '—'}</div>
                                                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>
                                                            {w.period || (w.start_year ? `${w.start_year} - ${w.end_year || 'Actualidad'}` : '')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs italic" style={{ color: 'var(--vp-text-dim)' }}>Sin experiencia registrada.</div>
                                        )}
                                    </div>

                                    {/* Experiencia Política */}
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-base">🏛️</span>
                                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: '#6366f1' }}>Cargos Partidarios</span>
                                        </div>
                                        {hv.political_history && hv.political_history.length > 0 && hv.political_history.some((p: any) => p.organization || p.position) ? (
                                            <div className="space-y-2 text-xs" style={{ color: 'var(--vp-text)' }}>
                                                {hv.political_history.filter((p: any) => p.organization || p.position).map((p: any, i: number) => (
                                                    <div key={i} className="py-1.5 px-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.04)' }}>
                                                        <div className="font-semibold">{p.position || '—'}</div>
                                                        <div className="opacity-70 mt-0.5">{p.organization || '—'}</div>
                                                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--vp-text-dim)' }}>
                                                            {p.start_year ? `${p.start_year} - ${p.end_year || 'Actualidad'}` : ''}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs italic" style={{ color: 'var(--vp-text-dim)' }}>Sin cargos partidarios registrados.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Sentencias + Finanzas side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Sentencias */}
                                    <div className="p-4 rounded-xl" style={{ background: hv.sentences && hv.sentences.length > 0 ? 'rgba(255,23,68,0.04)' : 'rgba(16,185,129,0.04)', border: `1px solid ${hv.sentences && hv.sentences.length > 0 ? 'rgba(255,23,68,0.15)' : 'rgba(16,185,129,0.12)'}` }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-base">⚖️</span>
                                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: hv.sentences && hv.sentences.length > 0 ? 'var(--vp-red)' : '#10b981' }}>Sentencias Judiciales</span>
                                        </div>
                                        {hv.sentences && hv.sentences.length > 0 ? (
                                            <div className="space-y-2 text-xs" style={{ color: 'var(--vp-text)' }}>
                                                {hv.sentences.map((s: any, i: number) => (
                                                    <div key={i} className="py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,23,68,0.04)' }}>
                                                        <div className="font-semibold">{s.type || 'Sentencia'}</div>
                                                        {s.case_number && <div className="opacity-70 mt-0.5">Exp: {s.case_number}</div>}
                                                        {s.verdict && <div className="opacity-70 mt-0.5">Fallo: {s.verdict}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#10b981' }}>
                                                <span>✅</span> Sin sentencias judiciales registradas
                                            </div>
                                        )}
                                    </div>

                                    {/* Finanzas */}
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-base">💰</span>
                                            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: '#f59e0b' }}>Declaración de Ingresos</span>
                                        </div>
                                        {(() => {
                                            const pubIncome = (hvFinances.public_income || 0) + (hvFinances.individual_public || 0) + (hvFinances.other_public || 0);
                                            const privIncome = (hvFinances.private_income || 0) + (hvFinances.individual_private || 0) + (hvFinances.other_private || 0);
                                            const totalIncome = hvFinances.total_income || (pubIncome + privIncome);
                                            return (
                                                <div className="space-y-2 text-xs" style={{ color: 'var(--vp-text)' }}>
                                                    <div className="flex justify-between py-1 px-2 rounded" style={{ background: 'rgba(245,158,11,0.04)' }}>
                                                        <span className="opacity-70">Sector Público</span>
                                                        <span className="font-semibold">S/ {pubIncome.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between py-1 px-2 rounded" style={{ background: 'rgba(245,158,11,0.04)' }}>
                                                        <span className="opacity-70">Sector Privado</span>
                                                        <span className="font-semibold">S/ {privIncome.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between py-1.5 px-2 rounded-lg font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                                        <span>Total Ingresos</span>
                                                        <span>S/ {totalIncome.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Link to full detailed page */}
                                <div className="pt-2" style={{ borderTop: '1px solid var(--vp-border)' }}>
                                    <Link href={`/candidate/${resolvedParams.id}/hoja-vida`}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(188,29,25,0.08), rgba(188,29,25,0.03))',
                                            border: '1px solid rgba(188,29,25,0.2)',
                                            color: '#bc1d19',
                                        }}>
                                        📋 Ver formato completo JNE →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* === ANÁLISIS SECTORIAL DEL PLAN DE GOBIERNO (PDF COMPLETO) === */}
                {(() => {
                    if (!isPresident) return null;
                    if (!sectorData || !sectorData.analysis) return null;
                    const partyName = ((candidate as any).party_jne_name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
                    const matchEntry = Object.values(sectorData.analysis as Record<string, any>).find((entry: any) => {
                        const entryName = (entry.party_name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
                        return entryName === partyName || partyName.includes(entryName) || entryName.includes(partyName);
                    });
                    if (!matchEntry) return null;
                    const sectors = (matchEntry as any).sectors || [];
                    const ai = (matchEntry as any).ai_analysis || { percentage: 0, total_matches: 0 };
                    const totalWords = (matchEntry as any).total_words || 0;
                    const getBarColor = (pct: number) => pct >= 60 ? 'var(--vp-green)' : pct >= 30 ? '#ca8a04' : pct > 0 ? 'var(--vp-red)' : 'rgba(255,255,255,0.1)';

                    // Keyword map for filtering plan_gobierno items by sector
                    const SECTOR_KW: Record<string, string[]> = {
                        agricultura: ['agrícola', 'agricultura', 'ganadería', 'agropecuario', 'agro', 'riego', 'semilla', 'cosecha', 'campesino', 'agrario', 'cultivo', 'ganado'],
                        pesca: ['pesca', 'acuicultura', 'marítimo', 'pesquero', 'hidrobiológico', 'litoral', 'recurso marino'],
                        mineria: ['minería', 'minero', 'petróleo', 'gas natural', 'hidrocarburo', 'canon', 'mina', 'oro', 'cobre', 'zinc', 'plata'],
                        energia: ['energía', 'eléctrica', 'electricidad', 'renovable', 'solar', 'eólica', 'hidroeléctrica', 'electrificación'],
                        industria: ['industria', 'manufactura', 'producción', 'fábrica', 'productividad', 'mype', 'pyme', 'mipyme'],
                        comercio: ['comercio', 'exportación', 'importación', 'arancel', 'mercado', 'competitividad', 'emprendimiento', 'tlc'],
                        transporte: ['transporte', 'vial', 'carretera', 'ferrocarril', 'tren', 'puerto', 'aeropuerto', 'logística', 'tránsito', 'metro'],
                        telecom: ['telecomunicación', 'internet', 'digital', 'tic', 'tecnología', 'conectividad', 'fibra óptica', 'banda ancha', 'gobierno digital'],
                        turismo: ['turismo', 'turístico', 'patrimonio', 'arqueológico', 'hotelería', 'visitante', 'turista', 'artesanía'],
                        cultura: ['cultura', 'cultural', 'arte', 'museo', 'patrimonio cultural', 'identidad', 'intercultural', 'quechua'],
                        educacion: ['educación', 'educativo', 'escuela', 'universidad', 'docente', 'profesor', 'alumno', 'estudiante', 'pedagógico', 'colegio', 'enseñanza', 'aprendizaje'],
                        salud: ['salud', 'hospital', 'médico', 'sanitario', 'vacuna', 'epidemia', 'essalud', 'paciente', 'clínica', 'enfermedad', 'desnutrición', 'anemia'],
                        seguridad: ['seguridad', 'policía', 'delincuencia', 'narcotráfico', 'defensa', 'militar', 'crimen', 'violencia', 'seguridad ciudadana'],
                        justicia: ['justicia', 'judicial', 'corrupción', 'fiscal', 'penal', 'juez', 'poder judicial', 'impunidad', 'anticorrupción'],
                        economia: ['economía', 'económico', 'fiscal', 'tributario', 'presupuesto', 'deuda', 'inflación', 'pbi', 'inversión', 'finanzas'],
                        trabajo: ['empleo', 'trabajo', 'laboral', 'sueldo', 'salario', 'pensión', 'desempleo', 'informalidad', 'trabajador', 'afp', 'onp'],
                        vivienda: ['vivienda', 'construcción', 'urbanismo', 'saneamiento', 'agua potable', 'alcantarillado'],
                        ambiente: ['ambiente', 'ambiental', 'contaminación', 'deforestación', 'residuo', 'reciclaje', 'clima', 'ecológico', 'biodiversidad', 'bosque', 'amazonía'],
                        social: ['social', 'pobreza', 'inclusión', 'discapacidad', 'adulto mayor', 'género', 'niñez', 'vulnerable', 'programa social', 'igualdad'],
                        deporte: ['deporte', 'deportivo', 'recreación', 'olímpico', 'estadio', 'atleta', 'actividad física'],
                        exterior: ['exterior', 'diplomacia', 'relaciones internacionales', 'tratado', 'frontera', 'migración', 'cooperación internacional'],
                        gobierno: ['gobierno', 'administración pública', 'descentralización', 'gestión pública', 'funcionario', 'burocracia', 'reforma del estado', 'modernización', 'municipalidad'],
                    };

                    const normalize = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                    // Filter plan items matching a sector
                    const getMatchingItems = (sectorId: string) => {
                        const keywords = SECTOR_KW[sectorId] || [];
                        if (!candidate.plan_gobierno || keywords.length === 0) return [];
                        return candidate.plan_gobierno.filter(item => {
                            const text = normalize([item.dimension, item.problem, item.objective, item.goals, item.indicator].join(' '));
                            return keywords.some(kw => text.includes(normalize(kw)));
                        });
                    };

                    return (
                        <>
                            <div className="panel-glow">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                    <h3 className="text-xs font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>
                                        📊 Análisis Sectorial del Plan de Gobierno
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                            style={{ background: ai.percentage > 0 ? 'rgba(30,58,95,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${ai.percentage > 0 ? 'rgba(30,58,95,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                                            onClick={() => setShowAiModal(true)}>
                                            <span className="text-sm">🤖</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ai.percentage > 0 ? 'var(--vp-blue)' : 'var(--vp-text-dim)' }}>
                                                IA: {ai.percentage}%
                                            </span>
                                        </div>
                                        <span className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>{totalWords.toLocaleString()} palabras analizadas (PDF)</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    {sectors.map((sector: any) => (
                                        <div key={sector.id} className="flex items-center gap-3 py-1.5 cursor-pointer rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors px-1 -mx-1"
                                            style={{ opacity: sector.percentage === 0 ? 0.4 : 1 }}
                                            onClick={() => sector.percentage > 0 && setSectorModal({ id: sector.id, name: sector.name, emoji: sector.emoji, percentage: sector.percentage })}>
                                            <span className="text-sm w-6 text-center shrink-0">{sector.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{sector.name}</span>
                                                    <span className="text-[10px] font-bold ml-2 shrink-0" style={{ color: getBarColor(sector.percentage) }}>
                                                        {sector.percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sector.percentage}%`, background: getBarColor(sector.percentage), minWidth: sector.percentage > 0 ? '4px' : '0' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 text-[9px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--vp-text-dim)' }}>
                                    * Análisis basado en el PDF completo del plan de gobierno. Click en un sector para ver propuestas relacionadas.
                                </div>
                            </div>

                            {/* Sector Detail Modal */}
                            {sectorModal && (() => {
                                const items = getMatchingItems(sectorModal.id);
                                return (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                                        onClick={(e) => { if (e.target === e.currentTarget) setSectorModal(null); }}>
                                        <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--vp-bg-panel-solid)', border: '1px solid var(--vp-border)' }}>
                                            <div className="sticky top-0 z-10 flex items-center justify-between p-5 rounded-t-2xl" style={{ background: 'var(--vp-bg-panel-solid)', borderBottom: '1px solid var(--vp-border)' }}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{sectorModal.emoji}</span>
                                                    <div>
                                                        <h3 className="text-base font-bold" style={{ color: 'var(--vp-text)' }}>{sectorModal.name}</h3>
                                                        <span className="text-xs font-bold" style={{ color: getBarColor(sectorModal.percentage) }}>{sectorModal.percentage}% del plan de gobierno</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSectorModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform"
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--vp-text-dim)' }}>✕</button>
                                            </div>
                                            <div className="p-5 space-y-3">
                                                {items.length > 0 ? items.map((item, idx) => (
                                                    <div key={item.id || idx} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                                        <div className="text-[9px] font-bold uppercase tracking-wider mb-2 px-2 py-0.5 rounded-full inline-block" style={{ background: 'rgba(30,58,95,0.08)', color: 'var(--vp-blue)' }}>
                                                            {item.dimension}
                                                        </div>
                                                        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--vp-text)' }}>📌 {item.problem}</div>
                                                        <div className="text-xs leading-relaxed mb-2" style={{ color: 'var(--vp-text)' }}>🎯 {item.objective}</div>
                                                        {item.goals && <div className="text-[11px] leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>📐 Meta: {item.goals}</div>}
                                                    </div>
                                                )) : (
                                                    <div className="text-center py-8">
                                                        <span className="text-3xl">📋</span>
                                                        <p className="text-sm mt-2" style={{ color: 'var(--vp-text-dim)' }}>No se encontraron propuestas específicas del resumen JNE para este sector.</p>
                                                        <p className="text-[10px] mt-1" style={{ color: 'var(--vp-text-dim)' }}>El porcentaje se calculó del PDF completo, que contiene más detalle que el resumen estructurado.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* AI Content Detection Modal */}
                            {showAiModal && (() => {
                                const signals = ai.signals || {};
                                const classLabel = ai.classification === 'alto' ? '🔴 Alta probabilidad de contenido IA'
                                    : ai.classification === 'moderado' ? '🟡 Probabilidad moderada de contenido IA'
                                        : ai.classification === 'bajo' ? '🟢 Baja probabilidad de contenido IA'
                                            : '✅ Mínima probabilidad de contenido IA';
                                const signalLabels: Record<string, { label: string; emoji: string; description: string }> = {
                                    sentence_uniformity: { label: 'Uniformidad de oraciones', emoji: '📏', description: 'IA genera oraciones de largo similar' },
                                    vocabulary_diversity: { label: 'Diversidad de vocabulario', emoji: '📖', description: 'IA usa vocabulario más repetitivo' },
                                    formulaic_phrases: { label: 'Frases formulaicas', emoji: '🔄', description: 'Expresiones típicas de texto generado por IA' },
                                    paragraph_uniformity: { label: 'Uniformidad de párrafos', emoji: '📐', description: 'IA genera párrafos de tamaño similar' },
                                    connector_density: { label: 'Densidad de conectores', emoji: '🔗', description: 'IA usa más conectores y transiciones' },
                                    word_uniformity: { label: 'Uniformidad de palabras', emoji: '🔤', description: 'IA usa palabras de largo más uniforme' },
                                };
                                const getSignalColor = (score: number) => score >= 60 ? 'var(--vp-red)' : score >= 30 ? '#ca8a04' : 'var(--vp-green)';
                                return (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                                        onClick={(e) => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
                                        <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--vp-bg-panel-solid)', border: '1px solid var(--vp-border)' }}>
                                            <div className="sticky top-0 z-10 flex items-center justify-between p-5 rounded-t-2xl" style={{ background: 'var(--vp-bg-panel-solid)', borderBottom: '1px solid var(--vp-border)' }}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🤖</span>
                                                    <div>
                                                        <h3 className="text-base font-bold" style={{ color: 'var(--vp-text)' }}>Detección de Contenido IA</h3>
                                                        <span className="text-xs font-bold" style={{ color: ai.percentage >= 40 ? 'var(--vp-red)' : 'var(--vp-text-dim)' }}>{ai.percentage}% probabilidad de contenido generado por IA</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowAiModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform"
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--vp-text-dim)' }}>✕</button>
                                            </div>
                                            <div className="p-5">
                                                {/* Gauge + Classification */}
                                                <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: ai.percentage >= 40 ? 'rgba(255,23,68,0.05)' : 'rgba(0,230,118,0.05)', border: `1px solid ${ai.percentage >= 40 ? 'rgba(255,23,68,0.15)' : 'rgba(0,230,118,0.15)'}` }}>
                                                    <div className="relative w-16 h-16 shrink-0">
                                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={ai.percentage >= 40 ? 'var(--vp-red)' : ai.percentage >= 20 ? '#ca8a04' : 'var(--vp-green)'} strokeWidth="3" strokeDasharray={`${ai.percentage} ${100 - ai.percentage}`} strokeLinecap="round" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-sm font-black" style={{ color: ai.percentage >= 40 ? 'var(--vp-red)' : 'var(--vp-green)' }}>{ai.percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold mb-1" style={{ color: 'var(--vp-text)' }}>{classLabel}</div>
                                                        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                                                            {ai.details || 'Análisis basado en patrones estadísticos del texto extraído del PDF completo.'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Signal Breakdown */}
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--vp-text-dim)' }}>📊 Señales de detección</h4>
                                                <div className="space-y-3 mb-5">
                                                    {Object.entries(signalLabels).map(([key, meta]) => {
                                                        const sig = signals[key];
                                                        if (!sig) return null;
                                                        return (
                                                            <div key={key} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[11px] font-semibold" style={{ color: 'var(--vp-text)' }}>{meta.emoji} {meta.label}</span>
                                                                    <span className="text-[10px] font-bold" style={{ color: getSignalColor(sig.score) }}>{sig.score}/100</span>
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                                    <div className="h-full rounded-full transition-all" style={{ width: `${sig.score}%`, background: getSignalColor(sig.score), minWidth: sig.score > 0 ? '4px' : '0' }} />
                                                                </div>
                                                                <div className="text-[9px]" style={{ color: 'var(--vp-text-dim)' }}>{meta.description}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Top Formulaic Phrases */}
                                                {signals.formulaic_phrases?.topPhrases?.length > 0 && (
                                                    <>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--vp-text-dim)' }}>🔄 Frases formulaicas detectadas</h4>
                                                        <div className="space-y-1.5">
                                                            {signals.formulaic_phrases.topPhrases.map((p: any, i: number) => (
                                                                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--vp-border)' }}>
                                                                    <span className="text-[11px]" style={{ color: 'var(--vp-text)' }}>"{p.phrase}"</span>
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,23,68,0.1)', color: 'var(--vp-red)' }}>{p.count}x</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                                <div className="mt-4 pt-3 text-[9px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--vp-text-dim)' }}>
                                                    * Detección heurística basada en análisis estadístico de patrones de escritura. No es un resultado definitivo.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    );
                })()}

                {/* === PLAN DE GOBIERNO === */}
                {isPresident && candidate.plan_gobierno && candidate.plan_gobierno.length > 0 && (() => {
                    // Group by dimension
                    const dimensions = candidate.plan_gobierno!.reduce((acc, item) => {
                        if (!acc[item.dimension]) acc[item.dimension] = [];
                        acc[item.dimension].push(item);
                        return acc;
                    }, {} as Record<string, typeof candidate.plan_gobierno>);

                    const dimensionColors: Record<string, string> = {
                        'DIMENSIÓN SOCIAL': 'var(--vp-red)',
                        'DIMENSIÓN ECONÓMICA': '#0e7490',
                        'DIMENSIÓN AMBIENTAL': 'var(--vp-green)',
                        'DIMENSIÓN INSTITUCIONAL': '#1e3a5f',
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
                                <div className="text-[10px] px-3 py-2 rounded-lg" style={{ background: 'rgba(30,58,95,0.06)', border: '1px solid rgba(30,58,95,0.15)', color: 'var(--vp-text-dim)' }}>
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
                                                    background: 'linear-gradient(135deg, rgba(30,58,95,0.15), rgba(30,58,95,0.05))',
                                                    border: '1px solid rgba(30,58,95,0.3)',
                                                    color: '#1e3a5f',
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


            </main>
            <SiteFooter />
        </div>
    );
}
