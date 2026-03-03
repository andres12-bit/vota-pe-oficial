'use client';

import { useSelection } from '@/lib/selection';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const POSITION_LABELS: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senado',
    deputy: 'Diputados',
    andean: 'P. Andino',
};

const MAX_PER_POSITION: Record<string, number> = {
    president: 1,
    senator: 2,
    deputy: 2,
    andean: 2,
};

const POSITION_DOTS: Record<string, string> = {
    president: '#c62828',
    senator: '#1565c0',
    deputy: '#2e7d32',
    andean: '#6a1b9a',
};

export default function SelectionCart() {
    const {
        state,
        selection,
        removeCandidate,
        confirmSelection,
        editSelection,
        cartVisible,
        setCartVisible,
        qualityStars,
        hasPresident,
        totalSelected,
    } = useSelection();

    const [minimized, setMinimized] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Don't render if empty state and no candidates
    if (state === 'empty') return null;

    const getNames = (candidates: import('@/lib/api').Candidate[]) =>
        candidates.map(c => c.name.split(' ').slice(-1)[0]).join(', ');

    const isConfirmed = state === 'confirmed';
    const isEditing = state === 'editing';
    const isDraft = state === 'draft';
    const canSave = hasPresident;
    const showDetailed = isDraft || isEditing;

    // ── MINIMIZED PILL at bottom-right ──
    if (minimized) {
        return (
            <div className="rcart-pill animate-fade-in" onClick={() => setMinimized(false)}>
                <span className="rcart-pill-icon">🗳️</span>
                <span className="rcart-pill-text">Tu Selección ({totalSelected})</span>
                <span className="rcart-pill-chevron">▴</span>
            </div>
        );
    }

    return (
        <div className="rcart animate-fade-in">
            {/* ── RED HEADER with minimize toggle ── */}
            <div className="rcart-header" onClick={() => setMinimized(true)} style={{ cursor: 'pointer' }}>
                <span className="rcart-header-icon">{isEditing ? '✏️' : '🗳️'}</span>
                <span className="rcart-header-title">
                    {isEditing ? 'Editando selección' : 'Tu Selección'}
                </span>
                {isConfirmed && (
                    <span className="rcart-header-badge">{totalSelected}</span>
                )}
                {isDraft && (
                    <span className="rcart-header-badge">{hasPresident ? '✔ lista' : 'en progreso'}</span>
                )}
                {isEditing && (
                    <span className="rcart-header-badge">editando</span>
                )}
                <span className="rcart-header-arrow">▾</span>
            </div>

            {/* ── BODY ── */}
            <div className="rcart-body">
                {/* ─── CONFIRMED: compact summary rows ─── */}
                {isConfirmed && (
                    <>
                        {selection.president && (
                            <div className="rcart-row">
                                <span className="rcart-dot" style={{ background: POSITION_DOTS.president }} />
                                <span className="rcart-row-label">Presidente:</span>
                                <span className="rcart-row-value">{selection.president.name.split(' ').slice(-2).join(' ')}</span>
                            </div>
                        )}
                        {selection.senators.length > 0 && (
                            <div className="rcart-row">
                                <span className="rcart-dot" style={{ background: POSITION_DOTS.senator }} />
                                <span className="rcart-row-label">Senado:</span>
                                <span className="rcart-row-value">{getNames(selection.senators)}</span>
                            </div>
                        )}
                        {selection.deputies.length > 0 && (
                            <div className="rcart-row">
                                <span className="rcart-dot" style={{ background: POSITION_DOTS.deputy }} />
                                <span className="rcart-row-label">Diputados:</span>
                                <span className="rcart-row-value">{getNames(selection.deputies)}</span>
                            </div>
                        )}
                        {selection.andean.length > 0 && (
                            <div className="rcart-row">
                                <span className="rcart-dot" style={{ background: POSITION_DOTS.andean }} />
                                <span className="rcart-row-label">P. Andino:</span>
                                <span className="rcart-row-value">{getNames(selection.andean)}</span>
                            </div>
                        )}
                        <div className="rcart-quality">
                            <span className="rcart-quality-stars">
                                {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                            </span>
                            <span className="rcart-quality-text">Calidad de tu elección</span>
                        </div>
                        <button onClick={editSelection} className="rcart-action-btn rcart-action-compare">
                            ✏️ Editar selección
                        </button>
                    </>
                )}

                {/* ─── DRAFT / EDITING: detailed candidate slots ─── */}
                {showDetailed && (
                    <>
                        <CartSlotRed
                            position="president"
                            label={POSITION_LABELS.president}
                            dotColor={POSITION_DOTS.president}
                            candidate={selection.president}
                            onRemove={() => removeCandidate('president', selection.president?.id || 0)}
                            maxCount={MAX_PER_POSITION.president}
                            currentCount={selection.president ? 1 : 0}
                        />
                        <CartGroupRed
                            position="senator"
                            label={POSITION_LABELS.senator}
                            dotColor={POSITION_DOTS.senator}
                            candidates={selection.senators}
                            onRemove={(id) => removeCandidate('senator', id)}
                            maxCount={MAX_PER_POSITION.senator}
                        />
                        <CartGroupRed
                            position="deputy"
                            label={POSITION_LABELS.deputy}
                            dotColor={POSITION_DOTS.deputy}
                            candidates={selection.deputies}
                            onRemove={(id) => removeCandidate('deputy', id)}
                            maxCount={MAX_PER_POSITION.deputy}
                        />
                        <CartGroupRed
                            position="andean"
                            label={POSITION_LABELS.andean}
                            dotColor={POSITION_DOTS.andean}
                            candidates={selection.andean}
                            onRemove={(id) => removeCandidate('andean', id)}
                            maxCount={MAX_PER_POSITION.andean}
                        />

                        {isDraft && !hasPresident && (
                            <p className="rcart-hint">
                                Selecciona un <strong>Presidente</strong> para poder guardar.
                            </p>
                        )}

                        {canSave && (
                            <button onClick={confirmSelection} className="rcart-save-btn">
                                {isEditing ? '💾 Guardar cambios' : '💾 Guardar selección'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Single candidate slot ──
function CartSlotRed({
    label,
    dotColor,
    candidate,
    onRemove,
    maxCount,
    currentCount,
}: {
    position: string;
    label: string;
    dotColor: string;
    candidate: import('@/lib/api').Candidate | null;
    onRemove?: () => void;
    maxCount: number;
    currentCount: number;
}) {
    const isFull = currentCount >= maxCount;
    return (
        <div className="rcart-slot">
            <div className="rcart-slot-header">
                <span className="rcart-dot" style={{ background: dotColor }} />
                <span className="rcart-slot-label">{label}</span>
                {isFull && <span className="rcart-slot-complete">✓ Completo</span>}
            </div>
            {candidate ? (
                <div className="rcart-slot-candidate">
                    <Link href={`/candidate/${candidate.id}`} className="rcart-slot-info">
                        <img
                            src={getCandidatePhoto(candidate.photo, candidate.name, 32, candidate.party_color)}
                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 32, candidate.party_color); }}
                            alt={candidate.name}
                            width={32}
                            height={32}
                            className="rcart-slot-avatar"
                        />
                        <div className="rcart-slot-details">
                            <span className="rcart-slot-name">{candidate.name.split(' ').slice(-2).join(' ')}</span>
                            <span className="rcart-slot-party">{candidate.party_abbreviation}</span>
                        </div>
                    </Link>
                    {onRemove && (
                        <button onClick={onRemove} className="rcart-slot-remove" title="Quitar">✕</button>
                    )}
                </div>
            ) : (
                <div className="rcart-slot-empty">—</div>
            )}
        </div>
    );
}

// ── Group of candidates ──
function CartGroupRed({
    label,
    dotColor,
    candidates,
    onRemove,
    maxCount,
}: {
    position: string;
    label: string;
    dotColor: string;
    candidates: import('@/lib/api').Candidate[];
    onRemove: (id: number) => void;
    maxCount: number;
}) {
    const isFull = candidates.length >= maxCount;
    return (
        <div className="rcart-slot">
            <div className="rcart-slot-header">
                <span className="rcart-dot" style={{ background: dotColor }} />
                <span className="rcart-slot-label">{label}</span>
                <span className="rcart-slot-max">(máx. {maxCount})</span>
                {candidates.length > 0 && (
                    <span className="rcart-slot-count">{candidates.length}</span>
                )}
                {isFull && <span className="rcart-slot-complete">✓ Completo</span>}
            </div>
            {candidates.length === 0 ? (
                <div className="rcart-slot-empty">—</div>
            ) : (
                <div className="rcart-group-list">
                    {candidates.map(c => (
                        <div key={c.id} className="rcart-slot-candidate rcart-slot-candidate-sm">
                            <Link href={`/candidate/${c.id}`} className="rcart-slot-info">
                                <img
                                    src={getCandidatePhoto(c.photo, c.name, 26, c.party_color)}
                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 26, c.party_color); }}
                                    alt={c.name}
                                    width={26}
                                    height={26}
                                    className="rcart-slot-avatar"
                                />
                                <span className="rcart-slot-name">{c.name.split(' ').slice(-2).join(' ')}</span>
                            </Link>
                            <button onClick={() => onRemove(c.id)} className="rcart-slot-remove" title="Quitar">✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
