'use client';

import { useState, useEffect } from 'react';
import { Candidate, getCandidates } from '@/lib/api';
import { getCandidatePhoto, getAvatarUrl } from '@/lib/avatars';

const CATEGORIES = [
    { key: 'Presidente', apiKey: 'president', label: '🏛️ Presidente' },
    { key: 'Senadores', apiKey: 'senator', label: '📋 Senadores' },
    { key: 'Diputados', apiKey: 'deputy', label: '📜 Diputados' },
    { key: 'Parlamento Andino', apiKey: 'andean', label: '🌍 Parl. Andino' },
];

const SCORE_DIMENSIONS = [
    { key: 'final_score', label: 'Score Final', color: '#c62828', decimals: 1 },
    { key: 'integrity_score', label: 'Integridad', color: '#16a34a', decimals: 0 },
    { key: 'experience_score', label: 'Experiencia', color: '#ca8a04', decimals: 0 },
    { key: 'plan_score', label: 'Plan de Gobierno', color: '#7c3aed', decimals: 0 },
    { key: 'intelligence_score', label: 'Formación', color: '#1565c0', decimals: 0 },
    { key: 'hoja_score', label: 'Hoja de Vida', color: '#0891b2', decimals: 0 },
    { key: 'momentum_score', label: 'Momentum', color: '#d84315', decimals: 0 },
    { key: 'risk_score', label: 'Riesgo', color: '#dc2626', decimals: 0 },
];

export default function CompareCandidates() {
    const [category, setCategory] = useState('Presidente');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selected, setSelected] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            setSelected([]);
            setError('');
            setCandidates([]);
            try {
                const catObj = CATEGORIES.find(c => c.key === category);
                const apiPosition = catObj ? catObj.apiKey : category;
                const data = await getCandidates(apiPosition, 200);
                if (!data || data.length === 0) {
                    setError(`No se encontraron candidatos para ${category}`);
                    setCandidates([]);
                } else {
                    // Deduplicate by id
                    const seen = new Set<number>();
                    const unique = data.filter(c => {
                        if (seen.has(c.id)) return false;
                        seen.add(c.id);
                        return true;
                    });
                    setCandidates(unique.sort((a, b) => (b.final_score || 0) - (a.final_score || 0)));
                }
            } catch (err) {
                console.error('Error loading candidates:', err);
                setError('Error al cargar candidatos. Intenta de nuevo.');
                setCandidates([]);
            }
            setLoading(false);
        }
        load();
    }, [category]);

    const toggleCandidate = (c: Candidate) => {
        const alreadySelected = selected.find(s => s.id === c.id);
        if (alreadySelected) {
            setSelected(prev => prev.filter(s => s.id !== c.id));
        } else if (selected.length < 4) {
            setSelected(prev => [...prev, c]);
        }
    };

    const removeCandidate = (id: number) => {
        setSelected(prev => prev.filter(s => s.id !== id));
    };

    const clearAll = () => setSelected([]);

    const filtered = searchTerm
        ? candidates.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.party_abbreviation || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        : candidates;

    return (
        <div className="compare-module">
            {/* Header */}
            <div className="compare-header">
                <h1 className="compare-title">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" /></svg>
                    Comparar Candidatos
                </h1>
                <p className="compare-subtitle">
                    Selecciona entre 2 y 4 candidatos de la misma categoría para comparar sus perfiles lado a lado.
                </p>
            </div>

            {/* ── STEP 1: Choose category ── */}
            <div className="compare-step">
                <div className="compare-step-number">1</div>
                <span className="compare-step-label">Elige la categoría</span>
            </div>
            <div className="compare-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => { setCategory(cat.key); setSearchTerm(''); }}
                        className={`compare-cat-btn ${category === cat.key ? 'compare-cat-active' : ''}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* ── STEP 2: Select candidates ── */}
            <div className="compare-step">
                <div className="compare-step-number">2</div>
                <span className="compare-step-label">Selecciona candidatos (mín. 2, máx. 4)</span>
            </div>

            {/* Selected candidates pills */}
            {selected.length > 0 && (
                <div className="compare-selected-pills">
                    {selected.map(c => (
                        <div key={c.id} className="compare-pill" style={{ borderColor: c.party_color || '#c62828' }}>
                            <img
                                src={getCandidatePhoto(c.photo, c.name, 28, c.party_color)}
                                alt={c.name}
                                onError={e => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 28, c.party_color); }}
                                className="compare-pill-photo"
                            />
                            <span className="compare-pill-name">{c.name.split(' ').slice(-2).join(' ')}</span>
                            <button onClick={() => removeCandidate(c.id)} className="compare-pill-remove" title="Quitar">✕</button>
                        </div>
                    ))}
                    {selected.length > 0 && (
                        <button onClick={clearAll} className="compare-pill-clear">Limpiar todo</button>
                    )}
                </div>
            )}

            {/* Search + candidate list */}
            <div className="compare-selector">
                <div className="compare-search-bar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <input
                        type="text"
                        placeholder={`Buscar en ${category}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="compare-search-input"
                    />
                    <span className="compare-selection-count">
                        {selected.length}/4
                    </span>
                </div>

                {loading ? (
                    <div className="compare-loading">
                        <div className="compare-spinner" />
                        <span>Cargando candidatos de {category}...</span>
                    </div>
                ) : error ? (
                    <div className="compare-error">
                        <span>⚠️ {error}</span>
                    </div>
                ) : (
                    <div className="compare-candidates-list">
                        {filtered.length === 0 && (
                            <div className="compare-empty">No se encontraron candidatos con ese nombre</div>
                        )}
                        {filtered.map((c, idx) => {
                            const isSelected = !!selected.find(s => s.id === c.id);
                            const isDisabled = !isSelected && selected.length >= 4;
                            const photo = getCandidatePhoto(c.photo, c.name, 40, c.party_color);
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => toggleCandidate(c)}
                                    className={`compare-candidate-item ${isSelected ? 'compare-candidate-selected' : ''} ${isDisabled ? 'compare-candidate-disabled' : ''}`}
                                    disabled={isDisabled}
                                >
                                    <span className="compare-candidate-rank">#{idx + 1}</span>
                                    <img
                                        src={photo}
                                        alt={c.name}
                                        onError={e => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 40, c.party_color); }}
                                        className="compare-candidate-photo"
                                    />
                                    <div className="compare-candidate-info">
                                        <span className="compare-candidate-name">{c.name}</span>
                                        <span className="compare-candidate-party" style={{ color: c.party_color }}>
                                            {c.party_abbreviation || c.party_name}
                                        </span>
                                    </div>
                                    <span className="compare-candidate-score">{(c.final_score || 0).toFixed(1)}</span>
                                    <span className={`compare-candidate-check ${isSelected ? 'compare-check-active' : ''}`}>
                                        {isSelected ? '✓' : '+'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── STEP 3: Results ── */}
            {selected.length >= 2 && (
                <>
                    <div className="compare-step" style={{ marginTop: 28 }}>
                        <div className="compare-step-number">3</div>
                        <span className="compare-step-label">Resultado de la comparación</span>
                    </div>

                    <div className="compare-table-wrapper">
                        <h2 className="compare-results-title">
                            📊 {selected.map(c => c.name.split(' ').slice(-2).join(' ')).join(' vs ')}
                        </h2>

                        {/* Cards Row */}
                        <div className="compare-cards-row">
                            {selected.map(c => {
                                const photo = getCandidatePhoto(c.photo, c.name, 80, c.party_color);
                                const bestScore = Math.max(...selected.map(s => s.final_score || 0));
                                const isBest = (c.final_score || 0) === bestScore;
                                return (
                                    <div key={c.id} className={`compare-card ${isBest ? 'compare-card-best' : ''}`}>
                                        {isBest && <span className="compare-card-badge">⭐ Mejor</span>}
                                        <img
                                            src={photo}
                                            alt={c.name}
                                            onError={e => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 80, c.party_color); }}
                                            className="compare-card-photo"
                                            style={{ borderColor: c.party_color }}
                                        />
                                        <h3 className="compare-card-name">{c.name}</h3>
                                        <span className="compare-card-party" style={{ color: c.party_color }}>{c.party_abbreviation || c.party_name}</span>
                                        <span className="compare-card-score" style={{ color: c.party_color }}>{(c.final_score || 0).toFixed(1)} pts</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dimension Bars */}
                        <div className="compare-dimensions">
                            {SCORE_DIMENSIONS.map(dim => {
                                const values = selected.map(c => Number((c as any)[dim.key] || 0));
                                const maxVal = Math.max(...values);
                                return (
                                    <div key={dim.key} className="compare-dim-row">
                                        <div className="compare-dim-label">
                                            <span className="compare-dim-dot" style={{ background: dim.color }} />
                                            {dim.label}
                                        </div>
                                        <div className="compare-dim-bars">
                                            {selected.map((c, i) => {
                                                const val = values[i];
                                                const isMax = val === maxVal && val > 0;
                                                return (
                                                    <div key={c.id} className="compare-dim-bar-col">
                                                        <div className="compare-dim-bar-track">
                                                            <div
                                                                className="compare-dim-bar-fill"
                                                                style={{
                                                                    width: `${Math.min(val, 100)}%`,
                                                                    background: isMax ? dim.color : '#d1d5db',
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className={`compare-dim-val ${isMax ? 'compare-dim-val-best' : ''}`}
                                                            style={isMax ? { color: dim.color } : {}}
                                                        >
                                                            {val.toFixed(dim.decimals)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Summary */}
                        <div className="compare-summary">
                            <h3>📋 Resumen</h3>
                            <div className="compare-summary-grid">
                                {selected.map(c => {
                                    const strengths: string[] = [];
                                    if ((c.integrity_score || 0) >= 70) strengths.push('Alta integridad');
                                    if ((c.experience_score || 0) >= 60) strengths.push('Buena experiencia');
                                    if ((c.plan_score || 0) >= 60) strengths.push('Plan sólido');
                                    if ((c.intelligence_score || 0) >= 60) strengths.push('Buena formación');
                                    if (strengths.length === 0) strengths.push('En evaluación');

                                    return (
                                        <div key={c.id} className="compare-summary-card">
                                            <strong style={{ color: c.party_color }}>{c.name.split(' ').slice(-2).join(' ')}</strong>
                                            <div className="compare-summary-strengths">
                                                {strengths.map((s, i) => (
                                                    <span key={i} className="compare-summary-tag">✔ {s}</span>
                                                ))}
                                            </div>
                                            {(c.risk_score || 0) >= 40 && (
                                                <span className="compare-summary-risk">⚠ Riesgo elevado</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {selected.length === 1 && (
                <div className="compare-hint">
                    👆 Selecciona al menos <strong>1 candidato más</strong> para comparar
                </div>
            )}

            {selected.length === 0 && !loading && !error && candidates.length > 0 && (
                <div className="compare-hint">
                    👆 Haz clic en los candidatos de la lista para seleccionarlos
                </div>
            )}
        </div>
    );
}
