'use client';

import { Candidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import { useSelection } from '@/lib/selection';
import PeruMapSVG from './PeruMapSVG';
import ShareModal from './ShareModal';
import AnalisisSeleccion from './AnalisisSeleccion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Props {
    candidates: Candidate[];
    onVote: (id: number, position: string) => void;
}

// Desktop positions — spread wider
const POSITIONS_DESKTOP = [
    { label: 'SENADORES', top: '18%', left: '20%', posKey: 'senator', delay: 200 },
    { label: 'SENADORES', top: '18%', left: '80%', posKey: 'senator', delay: 350 },
    { label: 'DIPUTADOS', top: '48%', left: '12%', posKey: 'deputy', delay: 500 },
    { label: 'PRESIDENTE', top: '48%', left: '50%', posKey: 'president', delay: 0 },
    { label: 'DIPUTADOS', top: '48%', left: '88%', posKey: 'deputy', delay: 650 },
    { label: 'PARL. ANDINO', top: '82%', left: '25%', posKey: 'andean', delay: 800 },
    { label: 'PARL. ANDINO', top: '82%', left: '75%', posKey: 'andean', delay: 950 },
];

// Mobile positions — tighter, avoids edge overflow
const POSITIONS_MOBILE = [
    { label: 'SENADORES', top: '15%', left: '22%', posKey: 'senator', delay: 200 },
    { label: 'SENADORES', top: '15%', left: '78%', posKey: 'senator', delay: 350 },
    { label: 'DIPUTADOS', top: '45%', left: '15%', posKey: 'deputy', delay: 500 },
    { label: 'PRESIDENTE', top: '45%', left: '50%', posKey: 'president', delay: 0 },
    { label: 'DIPUTADOS', top: '45%', left: '85%', posKey: 'deputy', delay: 650 },
    { label: 'P. ANDINO', top: '78%', left: '28%', posKey: 'andean', delay: 800 },
    { label: 'P. ANDINO', top: '78%', left: '72%', posKey: 'andean', delay: 950 },
];

export default function CanchaDemocracia({ candidates, onVote }: Props) {
    const [isMobile, setIsMobile] = useState(false);
    const {
        state, selection, activateBuilding, editSelection, qualityStars,
        showDraftBanner, dismissDraftBanner,
        justConfirmed, clearJustConfirmed,
    } = useSelection();
    const [showConfirmMsg, setShowConfirmMsg] = useState(false);
    const [animatingNodes, setAnimatingNodes] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showCompare, setShowCompare] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Trigger save animation when justConfirmed flips to true
    useEffect(() => {
        if (justConfirmed) {
            setAnimatingNodes(true);
            setShowConfirmMsg(true);
            // Clear animation flag after all nodes have appeared
            const timer1 = setTimeout(() => setAnimatingNodes(false), 1200);
            // Clear confirmation message after 4 seconds
            const timer2 = setTimeout(() => setShowConfirmMsg(false), 4000);
            // Clear justConfirmed flag
            clearJustConfirmed();
            return () => { clearTimeout(timer1); clearTimeout(timer2); };
        }
    }, [justConfirmed, clearJustConfirmed]);

    const POSITIONS = isMobile ? POSITIONS_MOBILE : POSITIONS_DESKTOP;
    const imgSize = isMobile ? 42 : 56;

    const isConfirmed = state === 'confirmed';

    // Get candidate for each position node
    const hasSelection = selection.president || selection.senators.length > 0 || selection.deputies.length > 0 || selection.andean.length > 0;
    const useSelectionData = hasSelection && (state === 'confirmed' || state === 'draft' || state === 'editing' || animatingNodes);

    const getNodeCandidate = (index: number, posKey: string): Candidate | null => {
        if (useSelectionData) {
            // Use user's selection
            if (posKey === 'president') return selection.president;
            if (posKey === 'senator') {
                const senatorIndex = POSITIONS.slice(0, index + 1).filter(p => p.posKey === 'senator').length - 1;
                return selection.senators[senatorIndex] || null;
            }
            if (posKey === 'deputy') {
                const deputyIndex = POSITIONS.slice(0, index + 1).filter(p => p.posKey === 'deputy').length - 1;
                return selection.deputies[deputyIndex] || null;
            }
            if (posKey === 'andean') {
                const andeanIndex = POSITIONS.slice(0, index + 1).filter(p => p.posKey === 'andean').length - 1;
                return selection.andean[andeanIndex] || null;
            }
            return null;
        }
        // Default: show API candidates
        if (!candidates.length) return null;
        return candidates[index % candidates.length] || null;
    };

    return (
        <div className="panel-glow p-3 sm:p-4" style={{ overflow: 'hidden' }}>
            <div className="text-center mb-4 sm:mb-5">
                {/* Confirmation message overlay */}
                {showConfirmMsg && (
                    <div className="cancha-confirm-msg animate-fade-in">
                        <div className="cancha-confirm-title">Tu selección electoral ha sido creada</div>
                        <div className="cancha-confirm-sub">Puedes editarla en cualquier momento.</div>
                    </div>
                )}

                {/* Draft recovery banner */}
                {showDraftBanner && (
                    <div className="draft-recovery-banner animate-fade-in">
                        <span>Tienes una selección en progreso.</span>
                        <button onClick={dismissDraftBanner} className="draft-recovery-btn">
                            Continuar editando →
                        </button>
                    </div>
                )}

                <h2 className="text-base sm:text-lg font-extrabold tracking-wide" style={{ color: 'var(--vp-text)' }}>
                    Elige mejor. Decide informado
                </h2>
                <p className="text-[11px] sm:text-xs mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    Analiza candidatos y comprende la calidad de tu elección
                </p>

                {/* "Genera tu selección" button — only when state is empty */}
                {state === 'empty' && !showDraftBanner && (
                    <button onClick={activateBuilding} className="genera-seleccion-btn mt-3">
                        👉 Genera tu selección
                    </button>
                )}

                {/* "Editar selección" button — when confirmed */}
                {isConfirmed && (
                    <button onClick={editSelection} className="genera-seleccion-btn mt-3">
                        ✏️ Editar selección
                    </button>
                )}
            </div>

            {/* Field */}
            <div className="cancha-field relative" style={{ minHeight: isMobile ? '420px' : '500px', aspectRatio: isMobile ? '3/4' : '4/5' }}>
                {/* Peru SVG map — behind nodes, above field */}
                <PeruMapSVG />

                {/* Goal areas */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[12%] border border-white/20 border-t-0 rounded-b-lg" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[12%] border border-white/20 border-b-0 rounded-t-lg" />

                {/* PERÚ label */}
                <div className="absolute top-2 right-3 text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>
                    PERÚ
                </div>

                {/* Position Nodes */}
                {POSITIONS.map((pos, index) => {
                    const candidate = getNodeCandidate(index, pos.posKey);
                    const isAnimating = animatingNodes && candidate;
                    return (
                        <div
                            key={index}
                            className={`absolute flex flex-col items-center gap-0.5 sm:gap-1 -translate-x-1/2 -translate-y-1/2 ${isAnimating ? 'cancha-node-appear' : ''}`}
                            style={{
                                top: pos.top,
                                left: pos.left,
                                zIndex: 3,
                                animationDelay: isAnimating ? `${pos.delay}ms` : undefined,
                            }}
                        >
                            {candidate ? (
                                <Link href={`/candidate/${candidate.id}`}>
                                    <div className={`candidate-node pulse-glow ${isConfirmed ? 'candidate-node-saved' : ''}`}>
                                        <img
                                            src={getCandidatePhoto(candidate.photo, candidate.name, imgSize, candidate.party_color)}
                                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, imgSize, candidate.party_color); }}
                                            alt={candidate.name}
                                            width={imgSize}
                                            height={imgSize}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                </Link>
                            ) : (
                                <div className="candidate-node">
                                    <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>?</span>
                                </div>
                            )}
                            <span className="text-[8px] sm:text-[9px] font-bold tracking-wider text-center whitespace-nowrap" style={{ color: 'var(--vp-field-line)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                {pos.label}
                            </span>
                            {candidate && (
                                <span className="text-[7px] sm:text-[8px] font-semibold text-center max-w-[70px] sm:max-w-[80px] truncate" style={{ color: 'var(--vp-text)' }}>
                                    {candidate.name.split(' ').slice(-1)[0]}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Center circle label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ zIndex: 1 }}>
                    <div className="text-[7px] sm:text-[8px] font-bold tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        VOTA.PE
                    </div>
                </div>
            </div>

            {/* ── POST-SELECTION ACTIONS: Compartir, Comparar, Ver análisis ── */}
            {/* Placed right below the cancha field (below P. Andino icons) */}
            {isConfirmed && (
                <div className="cancha-post-actions animate-fade-in">
                    <button onClick={() => setShowShare(true)} className="cancha-post-btn cancha-post-share">
                        📤 Compartir
                    </button>
                    <button onClick={() => setShowCompare(true)} className="cancha-post-btn cancha-post-compare">
                        ⚖️ Comparar
                    </button>
                    <button onClick={() => setShowAnalysis(true)} className="cancha-post-btn cancha-post-analysis">
                        📊 Ver análisis completo
                    </button>
                </div>
            )}

            {/* Election Quality Result — show when confirmed OR when candidates available */}
            {(isConfirmed || candidates.length > 0) && (
                <div className="election-quality-card">
                    <div className="election-quality-title">
                        Calidad promedio de tu elección
                    </div>
                    <div className="election-quality-stars">
                        {isConfirmed ? (
                            <>{'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}</>
                        ) : (
                            (() => {
                                const avgStars = candidates.length > 0
                                    ? candidates.reduce((sum, c) => sum + Number(c.stars_rating || 0), 0) / candidates.length
                                    : 0;
                                const full = Math.floor(avgStars);
                                const half = avgStars - full >= 0.5 ? 1 : 0;
                                const empty = 5 - full - half;
                                return <>{'★'.repeat(full)}{half ? '★' : ''}{'☆'.repeat(empty)}</>;
                            })()
                        )}
                    </div>
                    <p className="election-quality-description">
                        Basado en trayectoria, formación y antecedentes verificados. Esta evaluación se calcula automáticamente según información pública y valoración ciudadana.
                    </p>
                </div>
            )}

            {/* Share Modal */}
            {showShare && <ShareModal onClose={() => setShowShare(false)} />}

            {/* Compare Modal */}
            {showCompare && (
                <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false); }}>
                    <div className="share-modal animate-fade-in" style={{ width: 440 }}>
                        <div className="share-modal-header">
                            <h3>⚖️ Comparar selecciones</h3>
                            <button onClick={() => setShowCompare(false)} className="share-modal-close">✕</button>
                        </div>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>⚖️</span>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--vp-text)', marginBottom: 8 }}>Comparar selecciones</p>
                            <p style={{ fontSize: 12, color: 'var(--vp-text-dim)', lineHeight: 1.6 }}>Esta funcionalidad estará disponible próximamente. Podrás comparar tu selección con la de otros usuarios.</p>
                        </div>
                        <button onClick={() => setShowCompare(false)} style={{
                            width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            color: '#fff', background: 'var(--vp-red)', border: 'none', cursor: 'pointer'
                        }}>Entendido</button>
                    </div>
                </div>
            )}

            {/* Analysis Panel */}
            {showAnalysis && (
                <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAnalysis(false); }}
                    style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '40px 16px' }}>
                    <div className="animate-fade-in" style={{
                        background: '#fff', borderRadius: 16, padding: '24px 28px', width: 640, maxWidth: '95vw',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: '1px solid var(--vp-border)', position: 'relative'
                    }}>
                        <button onClick={() => setShowAnalysis(false)} className="share-modal-close"
                            style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
                        <AnalisisSeleccion />
                    </div>
                </div>
            )}
        </div>
    );
}
