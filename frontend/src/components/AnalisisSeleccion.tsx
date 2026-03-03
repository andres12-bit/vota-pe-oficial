'use client';

import { useSelection } from '@/lib/selection';
import { Candidate } from '@/lib/api';

function getPositionLabel(pos: string): string {
    const labels: Record<string, string> = {
        president: 'Presidente',
        senator: 'Senado',
        deputy: 'Diputados',
        andean: 'Parlamento Andino',
    };
    return labels[pos] || pos;
}

function computeRiskLevel(score: number): { label: string; color: string } {
    if (score >= 70) return { label: 'Bajo', color: 'var(--vp-green)' };
    if (score >= 45) return { label: 'Medio', color: '#ffc107' };
    return { label: 'Alto', color: 'var(--vp-red)' };
}

function computeConsistency(candidates: Candidate[]): string {
    if (candidates.length <= 1) return 'N/A';
    const scores = candidates.map(c => Number(c.final_score || 0));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 8) return 'Alta';
    if (stdDev < 15) return 'Media';
    return 'Baja';
}

function analyzeCandidate(c: Candidate) {
    const score = Number(c.final_score || 0);
    const momentum = Number(c.momentum_score || 0);
    const intelligence = Number(c.intelligence_score || 0);
    const stars = Number(c.stars_rating || 0);
    const strengths: string[] = [];
    const risks: string[] = [];

    if (score >= 60) strengths.push('Puntuación general alta');
    if (intelligence >= 60) strengths.push('Alta puntuación de inteligencia política');
    if (momentum >= 50) strengths.push('Tendencia positiva en momentum');
    if (stars >= 4) strengths.push('Alta valoración ciudadana');

    if (score < 40) risks.push('Puntuación general baja');
    if (intelligence < 40) risks.push('Puntuación de inteligencia limitada');
    if (momentum < 30) risks.push('Tendencia negativa en momentum');
    if (stars <= 2) risks.push('Baja valoración ciudadana');

    if (strengths.length === 0) strengths.push('Perfil en evaluación');
    return { strengths, risks };
}

export default function AnalisisSeleccion() {
    const { selection, qualityStars, qualityScore } = useSelection();

    const allCandidates: Candidate[] = [];
    if (selection.president) allCandidates.push(selection.president);
    allCandidates.push(...selection.senators, ...selection.deputies, ...selection.andean);

    if (allCandidates.length === 0) return null;

    const avgScore = allCandidates.reduce((s, c) => s + Number(c.final_score || 0), 0) / allCandidates.length;
    const risk = computeRiskLevel(avgScore);
    const consistency = computeConsistency(allCandidates);

    // Positive and negative factors
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    const highScoreCount = allCandidates.filter(c => Number(c.final_score || 0) >= 50).length;
    const highScorePct = Math.round((highScoreCount / allCandidates.length) * 100);
    if (highScorePct >= 60) positiveFactors.push(`${highScorePct}% de candidatos con puntuación superior a 50`);

    const highIntelCount = allCandidates.filter(c => Number(c.intelligence_score || 0) >= 50).length;
    if (highIntelCount > allCandidates.length / 2) positiveFactors.push('Alta inteligencia política promedio');

    const highMomentum = allCandidates.filter(c => Number(c.momentum_score || 0) >= 50).length;
    if (highMomentum > 0) positiveFactors.push(`${highMomentum} candidato(s) con tendencia positiva`);

    const highStarsCount = allCandidates.filter(c => Number(c.stars_rating || 0) >= 4).length;
    if (highStarsCount > 0) positiveFactors.push(`${highStarsCount} candidato(s) con alta valoración ciudadana`);

    if (consistency === 'Alta') positiveFactors.push('Alta consistencia profesional entre cargos');

    const lowScoreCount = allCandidates.filter(c => Number(c.final_score || 0) < 35).length;
    if (lowScoreCount > 0) negativeFactors.push(`${lowScoreCount} candidato(s) con puntuación baja`);

    const lowIntel = allCandidates.filter(c => Number(c.intelligence_score || 0) < 35).length;
    if (lowIntel > 0) negativeFactors.push(`Inteligencia política limitada en ${lowIntel} perfil(es)`);

    const lowMomentum = allCandidates.filter(c => Number(c.momentum_score || 0) < 30).length;
    if (lowMomentum > 0) negativeFactors.push(`${lowMomentum} candidato(s) con tendencia negativa`);

    if (consistency === 'Baja') negativeFactors.push('Baja consistencia entre los perfiles seleccionados');

    if (positiveFactors.length === 0) positiveFactors.push('Selección en evaluación — explora más candidatos');
    if (negativeFactors.length === 0) negativeFactors.push('Sin factores negativos significativos detectados');

    // Impact text
    let impactText = '';
    if (qualityStars >= 4) {
        impactText = 'Tu selección presenta alta coherencia profesional y bajo riesgo institucional según los datos disponibles.';
    } else if (qualityStars === 3) {
        impactText = 'Tu selección muestra un equilibrio entre experiencia y renovación, con un nivel de riesgo moderado.';
    } else {
        impactText = 'Tu puntuación es menor principalmente por perfiles con experiencia limitada o tendencias negativas. Explorar candidatos con mayor trayectoria podría mejorar la evaluación.';
    }

    // Group by position
    const positionGroups = [
        { key: 'president', label: 'Presidente', candidates: selection.president ? [selection.president] : [] },
        { key: 'senator', label: 'Senado', candidates: selection.senators },
        { key: 'deputy', label: 'Diputados', candidates: selection.deputies },
        { key: 'andean', label: 'Parlamento Andino', candidates: selection.andean },
    ].filter(g => g.candidates.length > 0);

    return (
        <div className="analysis-panel animate-fade-in">
            <h3 className="analysis-title">📊 Análisis completo de tu selección</h3>

            {/* A. Evaluación General */}
            <div className="analysis-section">
                <h4 className="analysis-section-title">A. Evaluación General</h4>
                <div className="analysis-metrics">
                    <div className="analysis-metric">
                        <span className="analysis-metric-label">Calidad de selección</span>
                        <span className="analysis-metric-value">
                            {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                            <span className="analysis-metric-num"> {qualityScore}</span>
                        </span>
                    </div>
                    <div className="analysis-metric">
                        <span className="analysis-metric-label">Nivel de riesgo</span>
                        <span className="analysis-metric-value" style={{ color: risk.color }}>{risk.label}</span>
                    </div>
                    <div className="analysis-metric">
                        <span className="analysis-metric-label">Consistencia profesional</span>
                        <span className="analysis-metric-value">{consistency}</span>
                    </div>
                    <div className="analysis-metric">
                        <span className="analysis-metric-label">Candidatos seleccionados</span>
                        <span className="analysis-metric-value">{allCandidates.length}</span>
                    </div>
                </div>
            </div>

            {/* B. Factores */}
            <div className="analysis-section">
                <h4 className="analysis-section-title">B. ¿Por qué tu puntuación es así?</h4>

                <div className="analysis-factors">
                    <div className="analysis-factors-group analysis-factors-positive">
                        <div className="analysis-factors-header">✅ Factores positivos</div>
                        {positiveFactors.map((f, i) => (
                            <div key={i} className="analysis-factor-item">✔ {f}</div>
                        ))}
                    </div>

                    <div className="analysis-factors-group analysis-factors-negative">
                        <div className="analysis-factors-header">⚠️ Factores que reducen puntuación</div>
                        {negativeFactors.map((f, i) => (
                            <div key={i} className="analysis-factor-item">⚠ {f}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* C. Análisis por Cargo */}
            <div className="analysis-section">
                <h4 className="analysis-section-title">C. Análisis por cargo</h4>
                {positionGroups.map(group => (
                    <div key={group.key} className="analysis-cargo">
                        <div className="analysis-cargo-header">{group.label}</div>
                        {group.candidates.map(c => {
                            const { strengths, risks: cRisks } = analyzeCandidate(c);
                            return (
                                <div key={c.id} className="analysis-cargo-candidate">
                                    <div className="analysis-cargo-name">
                                        {c.name.split(' ').slice(-2).join(' ')}
                                        <span className="analysis-cargo-party"> — {c.party_abbreviation}</span>
                                    </div>
                                    {strengths.length > 0 && (
                                        <div className="analysis-cargo-strengths">
                                            {strengths.map((s, i) => <span key={i} className="analysis-tag analysis-tag-pos">✔ {s}</span>)}
                                        </div>
                                    )}
                                    {cRisks.length > 0 && (
                                        <div className="analysis-cargo-risks">
                                            {cRisks.map((r, i) => <span key={i} className="analysis-tag analysis-tag-neg">⚠ {r}</span>)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* D. Impacto Global */}
            <div className="analysis-section analysis-impact">
                <h4 className="analysis-section-title">D. Impacto global de tu elección</h4>
                <p className="analysis-impact-text">{impactText}</p>
            </div>
        </div>
    );
}
