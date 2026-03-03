'use client';

import { useState } from 'react';

export default function MetodologiaSection() {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <section className="metodologia-section">
                <div className="text-center mb-5">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-wide" style={{ color: 'var(--vp-text)' }}>
                        ¿Cómo funciona la evaluación?
                    </h2>
                    <p style={{ color: 'var(--vp-text-dim)', fontSize: 13, maxWidth: 600, margin: '8px auto 0', lineHeight: 1.6 }}>
                        Cada candidato y plancha es evaluado con datos oficiales del JNE, generando un puntaje transparente y verificable.
                    </p>
                </div>

                <div className="metodologia-icons-grid">
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #1565c022, #1565c011)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1565c0"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Trayectoria</h4>
                        <p className="metodologia-icon-desc">
                            Evaluamos la experiencia laboral, cargos públicos previos y años de actividad política declarados en su hoja de vida ante el JNE.
                        </p>
                    </div>
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #6a1b9a22, #6a1b9a11)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#6a1b9a"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Formación</h4>
                        <p className="metodologia-icon-desc">
                            Verificamos los estudios declarados: grados académicos, instituciones, posgrados y especializaciones registradas oficialmente.
                        </p>
                    </div>
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #2e7d3222, #2e7d3211)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Antecedentes</h4>
                        <p className="metodologia-icon-desc">
                            Cruzamos información de sentencias, declaraciones juradas, procesos judiciales y denuncias de fuentes públicas oficiales.
                        </p>
                    </div>
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #e6511522, #e6511511)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#e65115"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Plan de Gobierno</h4>
                        <p className="metodologia-icon-desc">
                            Analizamos la calidad, viabilidad y consistencia de las propuestas presentadas en los planes de gobierno inscritos ante el JNE.
                        </p>
                    </div>
                </div>

                {/* Score formula */}
                <div className="metodologia-formula">
                    <h4 className="metodologia-formula-title">Fórmula del Score Final</h4>
                    <div className="metodologia-formula-row">
                        <div className="metodologia-formula-item">
                            <span className="metodologia-formula-pct">30%</span>
                            <span className="metodologia-formula-label">Trayectoria</span>
                        </div>
                        <span className="metodologia-formula-op">+</span>
                        <div className="metodologia-formula-item">
                            <span className="metodologia-formula-pct">25%</span>
                            <span className="metodologia-formula-label">Formación</span>
                        </div>
                        <span className="metodologia-formula-op">+</span>
                        <div className="metodologia-formula-item">
                            <span className="metodologia-formula-pct">25%</span>
                            <span className="metodologia-formula-label">Antecedentes</span>
                        </div>
                        <span className="metodologia-formula-op">+</span>
                        <div className="metodologia-formula-item">
                            <span className="metodologia-formula-pct">20%</span>
                            <span className="metodologia-formula-label">Plan Gob.</span>
                        </div>
                        <span className="metodologia-formula-op">=</span>
                        <div className="metodologia-formula-item metodologia-formula-result">
                            <span className="metodologia-formula-pct">100</span>
                            <span className="metodologia-formula-label">Score</span>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <button
                        onClick={() => setShowModal(true)}
                        className="metodologia-btn"
                    >
                        Ver metodología completa
                    </button>
                </div>
            </section>

            {/* Metodología Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content metodologia-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>

                        <h2 className="modal-title">
                            Cómo se calcula la evaluación electoral
                        </h2>

                        {/* Block 1 */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Qué analiza el sistema</h3>
                            <div className="modal-three-cols">
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#1565c0"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg></span>
                                    <h4>Trayectoria</h4>
                                    <p>Experiencia laboral y política registrada públicamente. Incluye cargos previos, años de servicio y sector de actividad.</p>
                                </div>
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#6a1b9a"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg></span>
                                    <h4>Formación</h4>
                                    <p>Estudios declarados y verificados contra registros oficiales. Se valora el nivel académico y la pertinencia de los estudios.</p>
                                </div>
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg></span>
                                    <h4>Antecedentes</h4>
                                    <p>Denuncias, sanciones, procesos judiciales e información pública relevante extraída de fuentes oficiales.</p>
                                </div>
                            </div>
                        </div>

                        {/* Block 2 */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Cómo se genera la puntuación</h3>
                            <p className="modal-block-text">
                                Cada candidato recibe una valoración de 0 a 100 basada en información pública verificable del JNE y participación ciudadana.
                                La evaluación de una plancha corresponde al promedio ponderado de todos sus integrantes: presidente, senadores, diputados y parlamentarios andinos.
                            </p>
                        </div>

                        {/* Block 3 */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Participación ciudadana</h3>
                            <ul className="modal-checklist">
                                <li>✔ Un usuario = un voto activo</li>
                                <li>✔ El voto puede modificarse en cualquier momento</li>
                                <li>✔ Nunca se duplica la votación</li>
                                <li>✔ Los cambios actualizan resultados en tiempo real</li>
                                <li>✔ Los datos provienen directamente del portal Voto Informado del JNE</li>
                            </ul>
                        </div>

                        {/* Block 4 */}
                        <div className="modal-block modal-block-highlight">
                            <h3 className="modal-block-title">Transparencia</h3>
                            <p className="modal-block-text">
                                <strong>VOTA.pe no promueve candidatos ni partidos políticos.</strong><br />
                                La plataforma muestra tendencias y evaluaciones generadas por datos públicos y participación ciudadana.
                                Toda la información de candidatos proviene de las hojas de vida presentadas ante el Jurado Nacional de Elecciones (JNE).
                            </p>
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="modal-entendido-btn"
                            >
                                👉 Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
