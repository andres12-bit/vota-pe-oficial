'use client';

import { useSelection } from '@/lib/selection';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';

const POSITION_LABELS: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senado',
    deputy: 'Diputados',
    andean: 'Parl. Andino',
};

const POSITION_ICONS: Record<string, string> = {
    president: '🏛️',
    senator: '👔',
    deputy: '📋',
    andean: '🌎',
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

    // Don't render if not visible or empty state
    if (!cartVisible || state === 'empty') return null;

    // ── CONFIRMED STATE: compact view ──
    if (state === 'confirmed') {
        return (
            <div className="selection-cart selection-cart-saved animate-fade-in">
                <div className="cart-header-saved">
                    <span className="cart-saved-check">✔</span>
                    <span className="cart-saved-title">Tu selección actual</span>
                    <span className="cart-saved-count">{totalSelected}</span>
                </div>

                {/* Quality stars */}
                <div className="cart-quality">
                    <div className="cart-quality-label">Calidad de tu elección</div>
                    <div className="cart-quality-stars">
                        {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                    </div>
                </div>

                {/* Mini preview */}
                <div className="cart-mini-preview">
                    {selection.president && (
                        <div className="cart-mini-item">
                            <span className="cart-mini-icon">🏛️</span>
                            <span className="cart-mini-name">{selection.president.name.split(' ').slice(-2).join(' ')}</span>
                        </div>
                    )}
                    {selection.senators.length > 0 && (
                        <div className="cart-mini-item">
                            <span className="cart-mini-icon">👔</span>
                            <span className="cart-mini-name">{selection.senators.length} senador(es)</span>
                        </div>
                    )}
                    {selection.deputies.length > 0 && (
                        <div className="cart-mini-item">
                            <span className="cart-mini-icon">📋</span>
                            <span className="cart-mini-name">{selection.deputies.length} diputado(s)</span>
                        </div>
                    )}
                    {selection.andean.length > 0 && (
                        <div className="cart-mini-item">
                            <span className="cart-mini-icon">🌎</span>
                            <span className="cart-mini-name">{selection.andean.length} parl. andino</span>
                        </div>
                    )}
                </div>

                <button onClick={editSelection} className="cart-edit-btn">
                    ✏️ Editar selección
                </button>
            </div>
        );
    }

    // ── DRAFT / EDITING STATE: full cart ──
    const isEditing = state === 'editing';
    const canSave = hasPresident;

    return (
        <div className="selection-cart animate-fade-in">
            {/* Header */}
            <div className="cart-header">
                <h3 className="cart-title">
                    {isEditing ? '✏️ Editando selección' : '🗳️ Tu selección'}
                </h3>
                <span className="cart-status">
                    {state === 'draft' && !hasPresident && 'en progreso'}
                    {state === 'draft' && hasPresident && '✔ mínima completa'}
                    {state === 'editing' && 'editando'}
                </span>
            </div>

            {/* Slots */}
            <div className="cart-slots">
                {/* President slot */}
                <CartSlot
                    position="president"
                    label={POSITION_LABELS.president}
                    icon={POSITION_ICONS.president}
                    candidate={selection.president}
                    onRemove={isEditing ? undefined : () => removeCandidate('president', selection.president?.id || 0)}
                    isProtected={isEditing}
                />

                {/* Senators */}
                <CartGroup
                    position="senator"
                    label={POSITION_LABELS.senator}
                    icon={POSITION_ICONS.senator}
                    candidates={selection.senators}
                    onRemove={(id) => removeCandidate('senator', id)}
                />

                {/* Deputies */}
                <CartGroup
                    position="deputy"
                    label={POSITION_LABELS.deputy}
                    icon={POSITION_ICONS.deputy}
                    candidates={selection.deputies}
                    onRemove={(id) => removeCandidate('deputy', id)}
                />

                {/* Andean */}
                <CartGroup
                    position="andean"
                    label={POSITION_LABELS.andean}
                    icon={POSITION_ICONS.andean}
                    candidates={selection.andean}
                    onRemove={(id) => removeCandidate('andean', id)}
                />
            </div>

            {/* Hint text */}
            {state === 'draft' && !hasPresident && (
                <p className="cart-hint">
                    Selecciona un <strong>Presidente</strong> para poder guardar.
                </p>
            )}

            {/* Save / Save Changes button */}
            {canSave && (
                <button onClick={confirmSelection} className="cart-save-btn">
                    {isEditing ? '💾 Guardar cambios' : '💾 Guardar selección'}
                </button>
            )}

            {/* Close / minimize */}
            <button onClick={() => setCartVisible(false)} className="cart-minimize-btn">
                Minimizar ▾
            </button>
        </div>
    );
}

// ── Single candidate slot (president) ──
function CartSlot({
    label,
    icon,
    candidate,
    onRemove,
    isProtected,
}: {
    position: string;
    label: string;
    icon: string;
    candidate: import('@/lib/api').Candidate | null;
    onRemove?: () => void;
    isProtected?: boolean;
}) {
    return (
        <div className="cart-slot">
            <div className="cart-slot-header">
                <span className="cart-slot-icon">{icon}</span>
                <span className="cart-slot-label">{label}</span>
            </div>
            {candidate ? (
                <div className="cart-slot-candidate">
                    <Link href={`/candidate/${candidate.id}`} className="cart-slot-info">
                        <img
                            src={getAvatarUrl(candidate.name, 28, candidate.party_color)}
                            alt={candidate.name}
                            width={28}
                            height={28}
                            className="cart-slot-avatar"
                        />
                        <div className="cart-slot-details">
                            <span className="cart-slot-name">{candidate.name.split(' ').slice(-2).join(' ')}</span>
                            <span className="cart-slot-party">{candidate.party_abbreviation}</span>
                        </div>
                    </Link>
                    {!isProtected && onRemove && (
                        <button onClick={onRemove} className="cart-slot-remove" title="Quitar">✕</button>
                    )}
                    {isProtected && (
                        <span className="cart-slot-lock" title="Cambia pero no elimines">🔒</span>
                    )}
                </div>
            ) : (
                <div className="cart-slot-empty">—</div>
            )}
        </div>
    );
}

// ── Group of candidates (senators, deputies, andean) ──
function CartGroup({
    position,
    label,
    icon,
    candidates,
    onRemove,
}: {
    position: string;
    label: string;
    icon: string;
    candidates: import('@/lib/api').Candidate[];
    onRemove: (id: number) => void;
}) {
    return (
        <div className="cart-slot">
            <div className="cart-slot-header">
                <span className="cart-slot-icon">{icon}</span>
                <span className="cart-slot-label">{label}</span>
                {candidates.length > 0 && (
                    <span className="cart-slot-count">{candidates.length}</span>
                )}
            </div>
            {candidates.length === 0 ? (
                <div className="cart-slot-empty">—</div>
            ) : (
                <div className="cart-group-list">
                    {candidates.map(c => (
                        <div key={c.id} className="cart-slot-candidate cart-slot-candidate-sm">
                            <Link href={`/candidate/${c.id}`} className="cart-slot-info">
                                <img
                                    src={getAvatarUrl(c.name, 22, c.party_color)}
                                    alt={c.name}
                                    width={22}
                                    height={22}
                                    className="cart-slot-avatar"
                                />
                                <span className="cart-slot-name">{c.name.split(' ').slice(-2).join(' ')}</span>
                            </Link>
                            <button onClick={() => onRemove(c.id)} className="cart-slot-remove" title="Quitar">✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
