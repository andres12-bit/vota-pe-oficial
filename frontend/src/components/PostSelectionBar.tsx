'use client';

import { useState } from 'react';
import { useSelection } from '@/lib/selection';
import ShareModal from './ShareModal';
import AnalisisSeleccion from './AnalisisSeleccion';

export default function PostSelectionBar() {
    const { state } = useSelection();
    const [showShare, setShowShare] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showCompare, setShowCompare] = useState(false);

    if (state !== 'confirmed') return null;

    return (
        <>
            {/* Action Buttons */}
            <div className="post-selection-bar">
                <button onClick={() => setShowShare(true)} className="post-sel-btn post-sel-btn-share">
                    📤 Compartir
                </button>
                <button onClick={() => setShowCompare(true)} className="post-sel-btn post-sel-btn-compare">
                    ⚖️ Comparar
                </button>
                <button onClick={() => setShowAnalysis(!showAnalysis)} className="post-sel-btn post-sel-btn-analysis">
                    📊 {showAnalysis ? 'Ocultar análisis' : 'Ver análisis completo'}
                </button>
            </div>

            {/* Share Modal */}
            {showShare && <ShareModal onClose={() => setShowShare(false)} />}

            {/* Compare Placeholder */}
            {showCompare && (
                <div className="compare-placeholder animate-fade-in">
                    <div className="compare-placeholder-inner">
                        <span className="compare-placeholder-icon">⚖️</span>
                        <h3>Comparar selecciones</h3>
                        <p>Esta funcionalidad estará disponible próximamente. Podrás comparar tu selección con la de otros usuarios.</p>
                        <button onClick={() => setShowCompare(false)} className="compare-placeholder-btn">Entendido</button>
                    </div>
                </div>
            )}

            {/* Analysis Panel */}
            {showAnalysis && <AnalisisSeleccion />}
        </>
    );
}
