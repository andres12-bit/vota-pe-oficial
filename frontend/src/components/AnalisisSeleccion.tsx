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

function computeDiversity(candidates: Candidate[]): string {
    if (candidates.length <= 1) return 'N/A';
    const parties = new Set(candidates.map(c => c.party_id));
    const ratio = parties.size / candidates.length;
    if (ratio >= 0.8) return 'Alta';
    if (ratio >= 0.5) return 'Media';
    return 'Baja';
}

function analyzeCandidate(c: Candidate) {
    const score = Number(c.final_score || 0);
    const momentum = Number(c.momentum_score || 0);
    const intelligence = Number(c.intelligence_score || 0);
    const integrity = Number(c.integrity_score || 0);
    const risk = Number(c.risk_score || 0);
    const stars = Number(c.stars_rating || 0);
    const hasEducation = c.education && c.education.length > 10;
    const hasExperience = c.experience && c.experience.length > 10;
    const strengths: string[] = [];
    const risks: string[] = [];

    if (hasEducation) strengths.push('Formación académica verificada');
    else risks.push('Sin educación superior registrada');

    if (hasExperience) strengths.push('Experiencia profesional documentada');
    else risks.push('Experiencia laboral limitada');

    if (score >= 60) strengths.push('Puntuación general alta');
    if (intelligence >= 60) strengths.push('Alta inteligencia política');
    if (momentum >= 50) strengths.push('Tendencia positiva');
    if (integrity >= 80) strengths.push('Alta integridad verificada');
    if (stars >= 4) strengths.push('Alta valoración ciudadana');

    if (score < 40) risks.push('Puntuación general baja');
    if (risk >= 40) risks.push('Nivel de riesgo significativo');
    if (momentum < 20) risks.push('Tendencia negativa en momentum');
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
    const diversity = computeDiversity(allCandidates);

    // ── Positive factors (education-aware) ──
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    const withEducation = allCandidates.filter(c => c.education && c.education.length > 10).length;
    const eduPct = Math.round((withEducation / allCandidates.length) * 100);
    if (eduPct >= 50) positiveFactors.push(`${eduPct}% de candidatos con educación superior verificada`);

    const withExperience = allCandidates.filter(c => c.experience && c.experience.length > 10).length;
    if (withExperience > allCandidates.length / 2) positiveFactors.push('Alta experiencia en gestión pública');

    const highScoreCount = allCandidates.filter(c => Number(c.final_score || 0) >= 50).length;
    const highScorePct = Math.round((highScoreCount / allCandidates.length) * 100);
    if (highScorePct >= 60) positiveFactors.push(`${highScorePct}% con puntuación superior a 50 puntos`);

    const highIntegrity = allCandidates.filter(c => Number(c.integrity_score || 0) >= 70).length;
    if (highIntegrity > allCandidates.length / 2) positiveFactors.push('Bajo número de antecedentes judiciales');

    const highMomentum = allCandidates.filter(c => Number(c.momentum_score || 0) >= 50).length;
    if (highMomentum > 0) positiveFactors.push(`${highMomentum} candidato(s) con tendencia positiva`);

    if (consistency === 'Alta') positiveFactors.push('Alta consistencia profesional entre cargos');
    if (diversity === 'Alta') positiveFactors.push('Alta diversidad de perfiles seleccionados');

    // Negative factors
    const lowScoreCount = allCandidates.filter(c => Number(c.final_score || 0) < 35).length;
    if (lowScoreCount > 0) negativeFactors.push(`${lowScoreCount} candidato(s) con experiencia pública limitada`);

    const noEducation = allCandidates.filter(c => !c.education || c.education.length < 10).length;
    if (noEducation > 0) negativeFactors.push(`${noEducation} candidato(s) sin educación superior registrada`);

    const highRisk = allCandidates.filter(c => Number(c.risk_score || 0) >= 40).length;
    if (highRisk > 0) negativeFactors.push(`Presencia de antecedentes verificados en ${highRisk} perfil(es)`);

    const lowMomentum = allCandidates.filter(c => Number(c.momentum_score || 0) < 20).length;
    if (lowMomentum > 0) negativeFactors.push(`${lowMomentum} candidato(s) con tendencia negativa`);

    if (consistency === 'Baja') negativeFactors.push('Baja consistencia profesional entre cargos');
    if (diversity === 'Baja') negativeFactors.push('Baja renovación generacional en la plancha');

    if (positiveFactors.length === 0) positiveFactors.push('Selección en evaluación — explora más candidatos');
    if (negativeFactors.length === 0) negativeFactors.push('Sin factores negativos significativos detectados');

    // Impact text based on quality
    let impactText = '';
    if (qualityStars >= 5) {
        impactText = 'Tu selección presenta alta coherencia profesional y bajo riesgo institucional según los datos disponibles.';
    } else if (qualityStars >= 4) {
        impactText = 'Tu selección prioriza experiencia profesional sobre renovación política, lo que genera alta estabilidad pero menor diversidad política.';
    } else if (qualityStars === 3) {
        impactText = 'Tu selección muestra un equilibrio entre experiencia y renovación, con un nivel de riesgo moderado. Evaluar perfiles con mayor trayectoria podría mejorar el balance general.';
    } else {
        impactText = 'Tu puntuación es menor principalmente por alto número de candidatos sin experiencia pública previa, presencia de antecedentes verificados y baja consistencia profesional entre cargos.';
    }

    // Suggestions for low scores
    let suggestionText = '';
    if (qualityStars <= 2) {
        suggestionText = 'Explorar candidatos con mayor experiencia legislativa podría mejorar la evaluación.';
    }

    // Group by position
    const positionGroups = [
        { key: 'president', label: '🏛️ Presidente', candidates: selection.president ? [selection.president] : [] },
        { key: 'senator', label: '📋 Senado (promedio)', candidates: selection.senators },
        { key: 'deputy', label: '📜 Diputados', candidates: selection.deputies },
        { key: 'andean', label: '🌐 Parlamento Andino', candidates: selection.andean },
    ].filter(g => g.candidates.length > 0);

    return (
        <div className="analysis-panel animate-fade-in" style={{ border: 'none', padding: 0 }}>
            <h3 className="analysis-title">📊 Análisis completo de tu selección</h3>

            {/* A. Evaluación General */}
            <div className="analysis-section">
                <h4 className="analysis-section-title">A. Evaluación General</h4>
                <div className="analysis-metrics">
                    <div className="analysis-metric">
                        <span className="analysis-metric-label">Calidad de selección</span>
                        <span className="analysis-metric-value">
                            {'★'.repeat(qualityStars)}{'☆'.repeat(5 - qualityStars)}
                            <span className="analysis-metric-num"> {(qualityScore / 20).toFixed(1)} / 5</span>
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
                        <span className="analysis-metric-label">Diversidad de experiencia</span>
                        <span className="analysis-metric-value">{diversity}</span>
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
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--vp-green)', marginRight: 6 }}>Fortalezas:</span>
                                            {strengths.map((s, i) => <span key={i} className="analysis-tag analysis-tag-pos">• {s}</span>)}
                                        </div>
                                    )}
                                    {cRisks.length > 0 && (
                                        <div className="analysis-cargo-risks">
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginRight: 6 }}>Riesgos:</span>
                                            {cRisks.map((r, i) => <span key={i} className="analysis-tag analysis-tag-neg">• {r}</span>)}
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

                {/* Suggestion for low scores */}
                {suggestionText && (
                    <div style={{
                        marginTop: 12, padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(100,181,246,0.06)', border: '1px solid rgba(100,181,246,0.15)',
                        fontSize: 12, color: '#1976d2', lineHeight: 1.6
                    }}>
                        💡 <strong>Sugerencia neutral:</strong> {suggestionText}
                    </div>
                )}
            </div>
        </div>
    );
}
