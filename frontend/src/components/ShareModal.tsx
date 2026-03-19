'use client';

import { useSelection } from '@/lib/selection';
import { getCandidatePhoto, getAvatarUrl } from '@/lib/avatars';

interface Props {
    onClose: () => void;
}

function scoreLabel(score: number): string {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    if (score >= 20) return 'Bajo';
    return 'Muy bajo';
}

function riskLabel(score: number): string {
    if (score >= 60) return '⚠️ Alto riesgo';
    if (score >= 40) return '⚠ Riesgo moderado';
    return '✅ Bajo riesgo';
}

export default function ShareModal({ onClose }: Props) {
    const { selection, qualityStars, qualityScore } = useSelection();

    const presidentName = selection.president?.name || 'Sin presidente';
    const totalSelected = (selection.president ? 1 : 0) +
        selection.senators.length + selection.deputies.length + selection.andean.length;

    // Build comprehensive share text with FULL analysis
    const lines: string[] = [
        '🗳️ MI SELECCIÓN ELECTORAL — PulsoElectoral.pe',
        '📅 Elecciones Generales 2026 — 12 de abril',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
    ];

    if (selection.president) {
        const p = selection.president;
        lines.push(`🏛️ PRESIDENTE: ${p.name}`);
        lines.push(`   📌 Partido: ${p.party_name} (${p.party_abbreviation})`);
        lines.push(`   ⭐ Score Final: ${Number(p.final_score || 0).toFixed(1)} pts — ${scoreLabel(p.final_score || 0)}`);
        lines.push(`   ✅ Integridad: ${Number(p.integrity_score || 0).toFixed(0)}% — ${scoreLabel(p.integrity_score || 0)}`);
        lines.push(`   📊 Experiencia: ${Number(p.experience_score || 0).toFixed(0)}% — ${scoreLabel(p.experience_score || 0)}`);
        lines.push(`   📋 Plan de Gobierno: ${Number(p.plan_score || 0).toFixed(0)}% — ${scoreLabel(p.plan_score || 0)}`);
        lines.push(`   🎓 Formación: ${Number(p.intelligence_score || 0).toFixed(0)}%`);
        lines.push(`   ${riskLabel(p.risk_score || 0)}: ${Number(p.risk_score || 0).toFixed(0)}%`);
        lines.push('');
        lines.push('   ¿Por qué este candidato?');
        const reasons: string[] = [];
        if ((p.integrity_score || 0) >= 70) reasons.push('Alta integridad comprobada');
        if ((p.experience_score || 0) >= 60) reasons.push('Amplia experiencia política');
        if ((p.plan_score || 0) >= 60) reasons.push('Plan de gobierno sólido y viable');
        if ((p.intelligence_score || 0) >= 60) reasons.push('Formación académica destacada');
        if (reasons.length === 0) reasons.push('En proceso de evaluación');
        reasons.forEach(r => lines.push(`   • ${r}`));
        lines.push('');
    }

    if (selection.senators.length > 0) {
        lines.push(`📋 SENADO (${selection.senators.length} seleccionado${selection.senators.length > 1 ? 's' : ''}):`);
        selection.senators.forEach(s => {
            lines.push(`   • ${s.name} — ${s.party_abbreviation}`);
            lines.push(`     Score: ${Number(s.final_score || 0).toFixed(1)} | Integridad: ${Number(s.integrity_score || 0).toFixed(0)}% | Plan: ${Number(s.plan_score || 0).toFixed(0)}%`);
        });
        lines.push('');
    }

    if (selection.deputies.length > 0) {
        lines.push(`📜 DIPUTADOS (${selection.deputies.length}):`);
        selection.deputies.forEach(d => {
            lines.push(`   • ${d.name} — ${d.party_abbreviation}`);
            lines.push(`     Score: ${Number(d.final_score || 0).toFixed(1)} | Integridad: ${Number(d.integrity_score || 0).toFixed(0)}% | Plan: ${Number(d.plan_score || 0).toFixed(0)}%`);
        });
        lines.push('');
    }

    if (selection.andean.length > 0) {
        lines.push(`🌍 PARLAMENTO ANDINO (${selection.andean.length}):`);
        selection.andean.forEach(a => {
            lines.push(`   • ${a.name} — ${a.party_abbreviation}`);
            lines.push(`     Score: ${Number(a.final_score || 0).toFixed(1)} | Integridad: ${Number(a.integrity_score || 0).toFixed(0)}%`);
        });
        lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`⭐ Calidad de mi selección: ${'★'.repeat(qualityStars)}${'☆'.repeat(5 - qualityStars)} (${qualityScore}/100 pts)`);
    lines.push(`📊 ${totalSelected} candidato(s) seleccionado(s)`);
    lines.push('');
    lines.push('📊 Los scores se basan en: Experiencia (25%), Formación (20%), Plan de Gobierno (20%), Transparencia (20%) y Liderazgo (15%). Fuente: JNE, RENIEC, Contraloría.');
    lines.push('');
    lines.push('🔗 Crea tu propia selección en https://PulsoElectoral.pe');

    const shareText = lines.join('\n');
    const encodedText = encodeURIComponent(shareText);
    const siteUrl = encodeURIComponent('https://PulsoElectoral.pe');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            alert('¡Información copiada al portapapeles!');
        } catch {
            const ta = document.createElement('textarea');
            ta.value = shareText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('¡Información copiada!');
        }
    };

    const heroPhoto = selection.president
        ? getCandidatePhoto(selection.president.photo, selection.president.name, 96, selection.president.party_color)
        : null;

    return (
        <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="share-modal animate-fade-in" style={{ maxWidth: 520, width: '95vw' }}>
                <div className="share-modal-header">
                    <h3>📤 Compartir mi selección</h3>
                    <button onClick={onClose} className="share-modal-close">✕</button>
                </div>

                {/* Enhanced Preview with Full Analysis */}
                <div className="share-preview" style={{ padding: '16px 20px', maxHeight: '50vh', overflowY: 'auto' }}>
                    {/* President hero */}
                    {selection.president && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                            {heroPhoto && (
                                <img
                                    src={heroPhoto}
                                    alt={selection.president.name}
                                    onError={(e) => {
                                        if (selection.president) {
                                            (e.target as HTMLImageElement).src = getAvatarUrl(selection.president.name, 96, selection.president.party_color);
                                        }
                                    }}
                                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${selection.president.party_color || '#c62828'}` }}
                                />
                            )}
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#1B2A4A' }}>🏛️ {selection.president.name}</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                    {selection.president.party_name} · {selection.president.party_abbreviation}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: selection.president.party_color || '#c62828', marginTop: 4 }}>
                                    {Number(selection.president.final_score || 0).toFixed(1)} pts
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analysis breakdown for president */}
                    {selection.president && (
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#1B2A4A', marginBottom: 6 }}>📊 ANÁLISIS DEL CANDIDATO</div>
                            {[
                                { label: 'Integridad', val: selection.president.integrity_score || 0, color: '#16a34a' },
                                { label: 'Experiencia', val: selection.president.experience_score || 0, color: '#ca8a04' },
                                { label: 'Plan de Gob.', val: selection.president.plan_score || 0, color: '#7c3aed' },
                                { label: 'Formación', val: selection.president.intelligence_score || 0, color: '#1565c0' },
                            ].map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', minWidth: 70, textAlign: 'right' }}>{d.label}</span>
                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                                        <div style={{ width: `${d.val}%`, height: '100%', borderRadius: 3, background: d.color, transition: 'width 0.5s' }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: d.color, minWidth: 28, textAlign: 'right' }}>{d.val.toFixed(0)}%</span>
                                </div>
                            ))}
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
                                Evaluación basada en: JNE, RENIEC, Contraloría. Fórmula: Experiencia (25%), Formación (20%), Plan (20%), Transparencia (20%), Liderazgo (15%).
                            </div>
                        </div>
                    )}

                    {/* Other positions summary */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {selection.senators.length > 0 && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#eff6ff', color: '#1565c0', fontWeight: 600 }}>
                                📋 {selection.senators.length} Senador{selection.senators.length > 1 ? 'es' : ''}
                            </span>
                        )}
                        {selection.deputies.length > 0 && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>
                                📜 {selection.deputies.length} Diputado{selection.deputies.length > 1 ? 's' : ''}
                            </span>
                        )}
                        {selection.andean.length > 0 && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#faf5ff', color: '#7c3aed', fontWeight: 600 }}>
                                🌍 {selection.andean.length} Parl. And.
                            </span>
                        )}
                    </div>

                    <div className="share-preview-stars" style={{ fontSize: 18 }}>
                        {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                        <span style={{ fontSize: 12, marginLeft: 6, color: '#6b7280' }}>{qualityScore}/100 pts</span>
                    </div>
                </div>

                <div className="share-options">
                    <a
                        href={`https://api.whatsapp.com/send?text=${encodedText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-whatsapp"
                    >
                        <span className="share-option-icon">💬</span>
                        <span>WhatsApp</span>
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🗳️ Mi selección electoral\n\n🏛️ ${presidentName}\n⭐ Score: ${Number(selection.president?.final_score || 0).toFixed(1)} pts\n✅ Integridad: ${Number(selection.president?.integrity_score || 0).toFixed(0)}%\n📋 Plan: ${Number(selection.president?.plan_score || 0).toFixed(0)}%\n\n📊 ${totalSelected} candidato(s)\n\n🔗 Crea tu selección:`)}&url=${siteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-twitter"
                    >
                        <span className="share-option-icon">𝕏</span>
                        <span>X (Twitter)</span>
                    </a>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodeURIComponent(`Mi selección electoral — ${presidentName} (Score: ${Number(selection.president?.final_score || 0).toFixed(1)}, Integridad: ${Number(selection.president?.integrity_score || 0).toFixed(0)}%) — PulsoElectoral.pe`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-facebook"
                    >
                        <span className="share-option-icon">📘</span>
                        <span>Facebook</span>
                    </a>
                    <button onClick={handleCopy} className="share-option share-copy">
                        <span className="share-option-icon">🔗</span>
                        <span>Copiar análisis completo</span>
                    </button>
                    <a
                        href={`mailto:?subject=Mi%20selecci%C3%B3n%20electoral%20—%20PulsoElectoral.pe&body=${encodedText}`}
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
