'use client';

import { useSelection } from '@/lib/selection';

interface Props {
    onClose: () => void;
}

export default function ShareModal({ onClose }: Props) {
    const { selection, qualityStars, qualityScore } = useSelection();

    const presidentName = selection.president?.name || 'Sin presidente';
    const totalSelected = (selection.president ? 1 : 0) +
        selection.senators.length + selection.deputies.length + selection.andean.length;

    const shareText = `🗳️ Mi selección electoral en VOTA.PE\n\n🏛️ Presidente: ${presidentName}\n⭐ Calidad: ${'★'.repeat(qualityStars)}${'☆'.repeat(5 - qualityStars)} (${qualityScore}/100)\n📊 ${totalSelected} candidato(s) seleccionado(s)\n\nCrea tu propia selección en vota.pe`;

    const encodedText = encodeURIComponent(shareText);
    const siteUrl = encodeURIComponent('https://vota.pe');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText + '\n\nhttps://vota.pe');
            alert('¡Enlace copiado!');
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = shareText + '\n\nhttps://vota.pe';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('¡Enlace copiado!');
        }
    };

    return (
        <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="share-modal animate-fade-in">
                <div className="share-modal-header">
                    <h3>📤 Compartir mi selección</h3>
                    <button onClick={onClose} className="share-modal-close">✕</button>
                </div>

                <div className="share-preview">
                    <div className="share-preview-title">🏛️ {presidentName}</div>
                    <div className="share-preview-stars">
                        {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                    </div>
                    <div className="share-preview-count">{totalSelected} candidato(s)</div>
                </div>

                <div className="share-options">
                    <a
                        href={`https://api.whatsapp.com/send?text=${encodedText}%0A%0Ahttps://vota.pe`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-whatsapp"
                    >
                        <span className="share-option-icon">💬</span>
                        <span>WhatsApp</span>
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${siteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-twitter"
                    >
                        <span className="share-option-icon">𝕏</span>
                        <span>X (Twitter)</span>
                    </a>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodedText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-facebook"
                    >
                        <span className="share-option-icon">📘</span>
                        <span>Facebook</span>
                    </a>
                    <button onClick={handleCopy} className="share-option share-copy">
                        <span className="share-option-icon">🔗</span>
                        <span>Copiar enlace</span>
                    </button>
                    <a
                        href={`mailto:?subject=Mi%20selecci%C3%B3n%20electoral%20en%20VOTA.PE&body=${encodedText}%0A%0Ahttps://vota.pe`}
                        className="share-option share-email"
                    >
                        <span className="share-option-icon">✉️</span>
                        <span>Correo</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
