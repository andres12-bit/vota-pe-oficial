'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCandidatePhoto, getPhotoFallback, getAvatarUrl } from '@/lib/avatars';

/* ═══════════════════════════════════════════════════════════════
   HOMEPAGE SECTIONS — Premium redesign v3
   ═══════════════════════════════════════════════════════════════ */

// ── Section: CTA Banner — Animated ──
function CTABanner({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const line1 = 'Tu voto define';
    const line2 = 'el futuro del Perú';
    const fullText = line1 + '\n' + line2;
    const [displayedText, setDisplayedText] = useState('');
    const [showSubtitle, setShowSubtitle] = useState(false);
    const [typingDone, setTypingDone] = useState(false);

    useEffect(() => {
        let i = 0;
        let timeout: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            i = 0;
            setDisplayedText('');
            setShowSubtitle(false);
            setTypingDone(false);

            const interval = setInterval(() => {
                i++;
                setDisplayedText(fullText.slice(0, i));
                if (i >= fullText.length) {
                    clearInterval(interval);
                    setTypingDone(true);
                    setTimeout(() => setShowSubtitle(true), 300);
                    timeout = setTimeout(() => runCycle(), 5000);
                }
            }, 55);
        };

        runCycle();
        return () => clearTimeout(timeout);
    }, []);

    // Split displayed text into line1 and line2 parts
    const shown1 = displayedText.slice(0, line1.length);
    const shown2 = displayedText.length > line1.length + 1 ? displayedText.slice(line1.length + 1) : '';
    const cursorOnLine1 = displayedText.length <= line1.length;

    return (
        <section className="hp-section hp-cta-banner">
            <div className="hp-container">
                <div className="hp-cta-inner">
                    <div className="hp-cta-text">
                        <h2 className="hp-cta-title">
                            <span style={{ color: '#1B2A4A' }}>{shown1}</span>
                            {!typingDone && cursorOnLine1 && <span className="hp-cta-title-cursor" />}
                            <br />
                            <span style={{ color: '#c62828' }}>{shown2}</span>
                            {!typingDone && !cursorOnLine1 && <span className="hp-cta-title-cursor" />}
                        </h2>
                        <p className={`hp-cta-subtitle${showSubtitle ? ' hp-visible' : ''}`}>
                            Más de 27 millones de peruanos elegirán a sus representantes.
                            Infórmate, compara y elige responsablemente.
                        </p>
                    </div>
                    <div className="hp-cta-actions">
                        <button onClick={() => onNavigate('comparar')} className="hp-cta-button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                            Analiza tu candidato
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Section 1: ¿Qué elegiremos? ──
function QueElegiremos({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const roles = [
        {
            label: 'Presidente', desc: '1 titular + 2 vicepresidentes', tab: 'president',
            icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M12 1l1.5 2.5L12 5l-1.5-1.5z" fill="#c62828" stroke="#c62828" /></svg>,
        },
        {
            label: 'Senadores', desc: '60 escaños', tab: 'senator',
            icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M12 2L3 10h18L12 2z" /><line x1="8" y1="14" x2="8" y2="18" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="16" y1="14" x2="16" y2="18" /></svg>,
        },
        {
            label: 'Diputados', desc: '130 escaños', tab: 'deputy',
            icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="19" cy="11" r="1.5" fill="#c62828" stroke="none" /></svg>,
        },
        {
            label: 'Parl. Andino', desc: '5 titulares', tab: 'andean',
            icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
        },
    ];
    return (
        <section className="hp-section hp-que-elegiremos">
            <div className="hp-container">
                <h2 className="hp-section-title hp-title-center">
                    ¿Qué elegiremos en estas <span className="hp-red">Elecciones 2026</span>?
                </h2>
                <p className="hp-section-subtitle">
                    Estas son las autoridades que votaremos el 12 de abril de 2026
                </p>
                <div className="hp-roles-grid">
                    {roles.map((r) => (
                        <button key={r.label} className="hp-role-card hp-role-card-clickable" onClick={() => onNavigate(r.tab)}>
                            <div className="hp-role-icon">{r.icon}</div>
                            <h3 className="hp-role-label">{r.label}</h3>
                            <span className="hp-role-desc">{r.desc}</span>
                            <span className="hp-role-arrow">Ver candidatos →</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Section 2: Candidatos Presidenciales — Enhanced Cards ──
interface CandidateCard {
    id: number;
    name: string;
    party: string;
    photo: string | null;
    score: number;
    party_color: string;
    party_abbreviation?: string;
    integrity_score?: number;
    experience_score?: number;
    plan_score?: number;
    region?: string;
}

function CandidatosPresidenciales({ candidates }: { candidates: CandidateCard[] }) {
    const top6 = candidates.slice(0, 6);
    return (
        <section className="hp-section hp-candidatos" id="candidatos-presidenciales">
            <div className="hp-container">
                <div className="hp-section-header-row">
                    <div>
                        <h2 className="hp-section-title">Candidatos Presidenciales</h2>
                        <p className="hp-section-subtitle hp-subtitle-left">Los principales candidatos a la presidencia del Perú 2026</p>
                    </div>
                    <Link href="/?tab=president" className="hp-ver-todos">Ver todos →</Link>
                </div>
                <div className="hp-candidates-grid">
                    {top6.map((c, idx) => {
                        const photoUrl = getCandidatePhoto(c.photo, c.name, 120, c.party_color);
                        return (
                            <Link href={`/candidate/${c.id}`} key={c.id} className="hp-candidate-card hp-candidate-card-enhanced">
                                {/* Rank badge */}
                                <div className="hp-card-rank" style={{ background: idx === 0 ? '#c62828' : idx === 1 ? '#1565c0' : idx === 2 ? '#ca8a04' : '#6b7280' }}>
                                    #{idx + 1}
                                </div>
                                <div className="hp-card-photo" style={{ borderColor: c.party_color }}>
                                    <img
                                        src={photoUrl}
                                        alt={c.name}
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            const fallback = getPhotoFallback(img.src);
                                            if (fallback) {
                                                img.src = fallback;
                                            } else {
                                                img.src = getAvatarUrl(c.name, 120, c.party_color);
                                            }
                                        }}
                                    />
                                </div>
                                <h3 className="hp-card-name">{c.name}</h3>
                                <span className="hp-card-party">{c.party}</span>
                                {c.party_abbreviation && (
                                    <span className="hp-card-party-abbr" style={{ color: c.party_color }}>{c.party_abbreviation}</span>
                                )}
                                {c.region && (
                                    <span className="hp-card-region">📍 {c.region}</span>
                                )}

                                {/* Score breakdown mini bars */}
                                <div className="hp-card-scores">
                                    <div className="hp-card-score-row">
                                        <span className="hp-card-score-label">Score Final</span>
                                        <div className="hp-card-score-bar">
                                            <div className="hp-card-score-fill" style={{ width: `${c.score}%`, background: c.party_color }} />
                                        </div>
                                        <span className="hp-card-score-val" style={{ color: c.party_color }}>{c.score.toFixed(1)}</span>
                                    </div>
                                    {c.integrity_score !== undefined && (
                                        <div className="hp-card-score-row">
                                            <span className="hp-card-score-label">Integridad</span>
                                            <div className="hp-card-score-bar">
                                                <div className="hp-card-score-fill" style={{ width: `${c.integrity_score}%`, background: '#16a34a' }} />
                                            </div>
                                            <span className="hp-card-score-val" style={{ color: '#16a34a' }}>{c.integrity_score.toFixed(0)}</span>
                                        </div>
                                    )}
                                    {c.plan_score !== undefined && (
                                        <div className="hp-card-score-row">
                                            <span className="hp-card-score-label">Plan Gob.</span>
                                            <div className="hp-card-score-bar">
                                                <div className="hp-card-score-fill" style={{ width: `${c.plan_score}%`, background: '#ca8a04' }} />
                                            </div>
                                            <span className="hp-card-score-val" style={{ color: '#ca8a04' }}>{c.plan_score.toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>

                                <span className="hp-card-btn">Ver perfil completo →</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ── Section 3: Explorar por Categoría ──
function ExplorarCategoria({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const cats = [
        {
            id: 'president', label: 'Presidente', desc: 'Fórmulas presidenciales', count: '36 fórmulas',
            icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
        },
        {
            id: 'senator', label: 'Senado', desc: 'Candidatos al Senado', count: '700+ candidatos',
            icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M12 2L3 10h18L12 2z" /><line x1="8" y1="14" x2="8" y2="18" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="16" y1="14" x2="16" y2="18" /></svg>,
        },
        {
            id: 'deputy', label: 'Diputados', desc: 'Candidatos a Diputados', count: '1500+ candidatos',
            icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        },
        {
            id: 'andean', label: 'Parl. Andino', desc: 'Parlamento Andino', count: '130+ candidatos',
            icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
        },
    ];
    return (
        <section className="hp-section hp-explorar hp-bg-light">
            <div className="hp-container">
                <h2 className="hp-section-title hp-title-center">¿Qué elegiremos en estas <span className="hp-red">Elecciones 2026</span>?</h2>
                <h3 className="hp-section-title hp-title-center" style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: -8 }}>Explorar por Categoría</h3>
                <p className="hp-section-subtitle">Encuentra y evalúa candidatos en cada cargo electoral</p>
                <div className="hp-explorar-grid">
                    {cats.map((c) => (
                        <button key={c.id} className="hp-explorar-card" onClick={() => onNavigate(c.id)}>
                            <div className="hp-explorar-icon">{c.icon}</div>
                            <h3 className="hp-explorar-label">{c.label}</h3>
                            <p className="hp-explorar-desc">{c.desc}</p>
                            <span className="hp-explorar-count">{c.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Section 4: Comparador ──
function ComparadorRapido({ onNavigate }: { onNavigate: (tab: string) => void }) {
    return (
        <section className="hp-section hp-comparador">
            <div className="hp-container">
                <div className="hp-comparador-inner">
                    <div className="hp-comparador-text">
                        <h2 className="hp-section-title hp-white">Comparar Candidatos</h2>
                        <p className="hp-comparador-desc">
                            Compara candidatos lado a lado en dimensiones clave: experiencia, educación, propuestas, transparencia y liderazgo.
                            Selecciona 2, 3 o 4 candidatos de la misma categoría para una comparación detallada.
                        </p>
                        <button onClick={() => onNavigate('comparar')} className="hp-comparador-btn">
                            Comparar candidatos →
                        </button>
                    </div>
                    <div className="hp-comparador-visual">
                        <div className="hp-comparador-vs">
                            <div className="hp-vs-circle">
                                <span><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                                <small>Candidato A</small>
                            </div>
                            <span className="hp-vs-badge">VS</span>
                            <div className="hp-vs-circle">
                                <span><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
                                <small>Candidato B</small>
                            </div>
                        </div>
                        <div className="hp-radar-placeholder">
                            <div className="hp-radar-item"><span>Experiencia</span><div className="hp-radar-bar"><div style={{ width: '80%' }} /></div></div>
                            <div className="hp-radar-item"><span>Educación</span><div className="hp-radar-bar"><div style={{ width: '65%' }} /></div></div>
                            <div className="hp-radar-item"><span>Propuestas</span><div className="hp-radar-bar"><div style={{ width: '75%' }} /></div></div>
                            <div className="hp-radar-item"><span>Transparencia</span><div className="hp-radar-bar"><div style={{ width: '90%' }} /></div></div>
                            <div className="hp-radar-item"><span>Liderazgo</span><div className="hp-radar-bar"><div style={{ width: '70%' }} /></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Section 5: Encuesta Ciudadana ──
function EncuestaCiudadana({ onNavigate }: { onNavigate: () => void }) {
    const encuestaData = [
        { name: 'Candidato 1', pct: 32, color: '#c62828' },
        { name: 'Candidato 2', pct: 25, color: '#1565C0' },
        { name: 'Candidato 3', pct: 18, color: '#FF8F00' },
        { name: 'Candidato 4', pct: 14, color: '#43A047' },
        { name: 'Otros', pct: 11, color: '#94a3b8' },
    ];
    return (
        <section className="hp-section hp-encuesta">
            <div className="hp-container">
                <div className="hp-encuesta-inner">
                    <div className="hp-encuesta-text">
                        <h2 className="hp-section-title">Encuesta Ciudadana</h2>
                        <p className="hp-section-subtitle hp-subtitle-left">
                            Tu opinión importa. Vota por tu candidato favorito y mide el pulso ciudadano en tiempo real.
                        </p>
                        <button onClick={onNavigate} className="hp-encuesta-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                            Participar ahora
                        </button>
                    </div>
                    <div className="hp-encuesta-chart">
                        {encuestaData.map((d) => (
                            <div key={d.name} className="hp-encuesta-bar-row">
                                <span className="hp-encuesta-bar-name">{d.name}</span>
                                <div className="hp-encuesta-bar-track">
                                    <div className="hp-encuesta-bar-fill" style={{ width: `${d.pct}%`, background: d.color }} />
                                </div>
                                <span className="hp-encuesta-bar-pct">{d.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Section 6: ¿Cómo funciona la evaluación? ──
function ComoFunciona() {
    const steps = [
        {
            num: 1, title: 'Datos Públicos', desc: 'Hojas de vida, declaraciones juradas y planes de gobierno del JNE.',
            icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
        },
        {
            num: 2, title: 'Análisis Automatizado', desc: 'Algoritmos de evaluación multidimensional procesan los datos.',
            icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
        },
        {
            num: 3, title: 'Score Multidimensional', desc: 'Puntajes en experiencia, educación, propuestas y más.',
            icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
        },
        {
            num: 4, title: 'Ranking Final', desc: 'Clasificación objetiva para tu decisión informada.',
            icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
        },
    ];
    return (
        <section className="hp-section hp-como-funciona hp-bg-light">
            <div className="hp-container">
                <h2 className="hp-section-title hp-title-center">¿Cómo funciona la evaluación?</h2>
                <p className="hp-section-subtitle">Proceso transparente y basado en datos públicos oficiales</p>
                <div className="hp-steps-row">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className="hp-step-card">
                                <div className="hp-step-num">{s.num}</div>
                                <div className="hp-step-icon">{s.icon}</div>
                                <h3 className="hp-step-title">{s.title}</h3>
                                <p className="hp-step-desc">{s.desc}</p>
                            </div>
                            {i < steps.length - 1 && <div className="hp-step-connector">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Section 7: Fórmula del Score Final — with Methodology Modal ──
function FormulaScore() {
    const [showMethodology, setShowMethodology] = useState(false);

    const components = [
        { label: 'Experiencia Política', pct: 25, color: '#c62828' },
        { label: 'Formación Académica', pct: 20, color: '#1565C0' },
        { label: 'Propuestas de Gobierno', pct: 20, color: '#FF8F00' },
        { label: 'Transparencia', pct: 20, color: '#43A047' },
        { label: 'Liderazgo y Trayectoria', pct: 15, color: '#7c3aed' },
    ];

    return (
        <>
            <section className="hp-section hp-formula">
                <div className="hp-container">
                    <div className="hp-formula-inner">
                        <div className="hp-formula-chart">
                            <h2 className="hp-section-title">Fórmula del Score Final</h2>
                            <p className="hp-section-subtitle hp-subtitle-left">Cada candidato es evaluado en 5 dimensiones ponderadas</p>
                            <div className="hp-formula-bars">
                                {components.map((c) => (
                                    <div key={c.label} className="hp-formula-bar-row">
                                        <div className="hp-formula-bar-label">
                                            <span className="hp-formula-dot" style={{ background: c.color }} />
                                            {c.label}
                                        </div>
                                        <div className="hp-formula-bar-track">
                                            <div className="hp-formula-bar-fill" style={{ width: `${c.pct * 4}%`, background: c.color }} />
                                        </div>
                                        <span className="hp-formula-bar-pct">{c.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="hp-formula-text">
                            <div className="hp-formula-card">
                                <h3>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                                    Metodología Objetiva
                                </h3>
                                <ul>
                                    <li>Basada en datos oficiales del JNE y fuentes públicas verificables</li>
                                    <li>Algoritmo sin sesgos partidarios ni políticos</li>
                                    <li>Actualización en tiempo real con nuevos datos</li>
                                    <li>Transparencia total: puedes ver cómo se calcula cada puntaje</li>
                                </ul>
                                <button onClick={() => setShowMethodology(true)} className="hp-formula-link">Ver metodología completa →</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ METHODOLOGY MODAL ═══ */}
            {showMethodology && (
                <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMethodology(false); }}>
                    <div className="animate-fade-in hp-methodology-modal">
                        <button onClick={() => setShowMethodology(false)} className="share-modal-close" style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A4A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            📋 Metodología de Evaluación — PulsoElectoral.pe
                        </h3>

                        <div className="hp-metodo-section">
                            <h4>1. Fuentes de Datos</h4>
                            <ul>
                                <li><strong>Jurado Nacional de Elecciones (JNE):</strong> Hojas de vida, declaraciones juradas patrimoniales, condenas penales y civiles, Plan de Gobierno.</li>
                                <li><strong>Registro Nacional de Identificación (RENIEC):</strong> Verificación de identidad y datos básicos.</li>
                                <li><strong>Contraloría General:</strong> Declaraciones juradas de intereses.</li>
                                <li><strong>Poder Judicial / Ministerio Público:</strong> Antecedentes judiciales y procesos penales.</li>
                            </ul>
                        </div>

                        <div className="hp-metodo-section">
                            <h4>2. Dimensiones de Evaluación</h4>
                            <div className="hp-metodo-grid">
                                <div className="hp-metodo-dim">
                                    <span className="hp-metodo-dim-color" style={{ background: '#c62828' }} />
                                    <div>
                                        <strong>Experiencia Política (25%)</strong>
                                        <p>Años de experiencia en cargos públicos, gestión de presupuestos, legislación aprobada, participación en comisiones parlamentarias.</p>
                                    </div>
                                </div>
                                <div className="hp-metodo-dim">
                                    <span className="hp-metodo-dim-color" style={{ background: '#1565C0' }} />
                                    <div>
                                        <strong>Formación Académica (20%)</strong>
                                        <p>Nivel educativo, relevancia de estudios para el cargo, instituciones acreditadas, posgrados y especializaciones.</p>
                                    </div>
                                </div>
                                <div className="hp-metodo-dim">
                                    <span className="hp-metodo-dim-color" style={{ background: '#FF8F00' }} />
                                    <div>
                                        <strong>Propuestas de Gobierno (20%)</strong>
                                        <p>Calidad y viabilidad del plan de gobierno, metas medibles, presupuesto estimado, coherencia con la realidad nacional.</p>
                                    </div>
                                </div>
                                <div className="hp-metodo-dim">
                                    <span className="hp-metodo-dim-color" style={{ background: '#43A047' }} />
                                    <div>
                                        <strong>Transparencia (20%)</strong>
                                        <p>Declaración jurada patrimonial completa, ausencia de sentencias, rendición de cuentas, conflictos de interés declarados.</p>
                                    </div>
                                </div>
                                <div className="hp-metodo-dim">
                                    <span className="hp-metodo-dim-color" style={{ background: '#7c3aed' }} />
                                    <div>
                                        <strong>Liderazgo y Trayectoria (15%)</strong>
                                        <p>Consistencia en la carrera pública, evaluación ciudadana, capacidad de gestión demostrada en cargos anteriores.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hp-metodo-section">
                            <h4>3. Cálculo del Score Final</h4>
                            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', fontFamily: 'monospace', fontSize: 13, color: '#1B2A4A', marginBottom: 12 }}>
                                Score = (Experiencia × 0.25) + (Educación × 0.20) + (Propuestas × 0.20) + (Transparencia × 0.20) + (Liderazgo × 0.15)
                            </div>
                            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                                Cada dimensión se evalúa en una escala de 0 a 100 puntos. El score final es un promedio ponderado que refleja la evaluación integral del candidato.
                                Los puntajes se actualizan automáticamente cuando se registran nuevos datos en las fuentes oficiales.
                            </p>
                        </div>

                        <div className="hp-metodo-section">
                            <h4>4. Principios Éticos</h4>
                            <ul>
                                <li>✅ No se emiten valoraciones políticas ni ideológicas</li>
                                <li>✅ Los datos son verificables y de fuente pública</li>
                                <li>✅ El algoritmo es neutral — no favorece ni perjudica a ningún candidato</li>
                                <li>✅ Cualquier ciudadano puede auditar los criterios y resultados</li>
                            </ul>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                            <button onClick={() => setShowMethodology(false)} style={{
                                padding: '10px 32px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                color: '#fff', background: '#c62828', border: 'none', cursor: 'pointer'
                            }}>Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Section 8: Análisis y Tendencias — Blog Noticiero ──
function AnalisisTendencias() {
    const articles = [
        {
            title: '68 congresistas buscan reelección: ¿qué hicieron en el periodo 2021-2026?',
            date: '19 Marzo 2026',
            tag: 'Investigación',
            tagColor: '#c62828',
            summary: 'De los 130 congresistas del periodo 2021-2026, 68 se han inscrito como candidatos para las elecciones 2026. Un análisis de su desempeño legislativo revela que el promedio de proyectos presentados es 30, con asistencia al pleno de 79%. Además, un tercio cambió de bancada durante el periodo.',
            source: 'Fuente: Congreso de la República — Registro de Asistencia y Producción Legislativa',
            icon: '🏛️',
        },
        {
            title: 'La nueva bicameralidad: ¿qué cambia para el elector?',
            date: 'Marzo 2026',
            tag: 'Educativo',
            tagColor: '#1565c0',
            summary: 'Con la restitución del Senado aprobada por votación congresal (Ley 31988), los peruanos elegirán por primera vez en décadas tanto senadores como diputados. El Senado tendrá 60 escaños con distrito nacional único, mientras que los 130 diputados se elegirán por distrito electoral múltiple regional.',
            source: 'Fuente: Ley 31988 — Reforma Constitucional de Bicameralidad (aprobada por el Congreso)',
            icon: '🏛️',
        },
        {
            title: 'Tránsfugas en el Congreso: el fenómeno del cambio de bancada',
            date: '19 Marzo 2026',
            tag: 'Análisis',
            tagColor: '#e65100',
            summary: 'En el periodo 2021-2026, más de 40 congresistas cambiaron de bancada al menos una vez. Entre los que buscan reelección, las bancadas de Perú Libre, Acción Popular y Alianza para el Progreso fueron las que más miembros perdieron. El transfuguismo debilita la representación y la gobernabilidad.',
            source: 'Fuente: PUCP — Escuela de Gobierno y Políticas Públicas',
            icon: '🔄',
        },
        {
            title: 'El perfil de los candidatos al nuevo Senado',
            date: 'Marzo 2026',
            tag: 'Perfiles',
            tagColor: '#7c3aed',
            summary: 'De los más de 700 candidatos al Senado, el 43% cuenta con estudios de posgrado, el 28% tiene experiencia previa en el Congreso, y el promedio de edad es de 52 años. Lima concentra el 35% de los candidatos, seguida por Arequipa (8%) y La Libertad (7%).',
            source: 'Fuente: Hojas de Vida del JNE — Infogob',
            icon: '📋',
        },
    ];
    return (
        <section className="hp-section hp-analisis hp-bg-light" id="analisis-tendencias">
            <div className="hp-container">
                <h2 className="hp-section-title hp-title-center">Análisis y Tendencias</h2>
                <p className="hp-section-subtitle">Información electoral actualizada para tu decisión — basada en fuentes oficiales</p>
                <div className="hp-analisis-grid">
                    {articles.map((a, i) => (
                        <article key={i} className="hp-analisis-card hp-analisis-card-blog">
                            <div className="hp-analisis-card-header">
                                <span className="hp-analisis-icon">{a.icon}</span>
                                <div className="hp-analisis-tag" style={{ background: a.tagColor, color: '#fff' }}>{a.tag}</div>
                            </div>
                            <h3 className="hp-analisis-title">{a.title}</h3>
                            <p className="hp-analisis-summary">{a.summary}</p>
                            <div className="hp-analisis-footer">
                                <span className="hp-analisis-source">{a.source}</span>
                                <span className="hp-analisis-date">{a.date}</span>
                            </div>
                        </article>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link href="/blog" style={{ display: 'inline-block', padding: '12px 32px', background: '#c62828', color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 12px rgba(198,40,40,0.3)', transition: 'all 0.2s' }}>
                        📰 Ver todo el Blog Electoral →
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ── Main Export ──
export default function HomepageSections({
    candidates = [],
    onNavigate,
}: {
    candidates: CandidateCard[];
    onNavigate: (tab: string) => void;
}) {
    return (
        <div className="hp-sections-wrapper">
            <CTABanner onNavigate={onNavigate} />
            <CandidatosPresidenciales candidates={candidates} />
            <ExplorarCategoria onNavigate={onNavigate} />
            <ComparadorRapido onNavigate={onNavigate} />
            <EncuestaCiudadana onNavigate={() => onNavigate('encuesta')} />
            <ComoFunciona />
            <FormulaScore />
            <AnalisisTendencias />
        </div>
    );
}
