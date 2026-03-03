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
                </div>

                <div className="metodologia-icons-grid">
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #1565c022, #1565c011)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1565c0"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Trayectoria</h4>
                        <p className="metodologia-icon-desc">Experiencia laboral y política</p>
                    </div>
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #6a1b9a22, #6a1b9a11)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#6a1b9a"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Formación</h4>
                        <p className="metodologia-icon-desc">Estudios declarados y verificados</p>
                    </div>
                    <div className="metodologia-icon-card">
                        <div className="metodologia-icon-circle" style={{ background: 'linear-gradient(135deg, #2e7d3222, #2e7d3211)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                        </div>
                        <h4 className="metodologia-icon-title">Antecedentes verificados</h4>
                        <p className="metodologia-icon-desc">Información pública relevante</p>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <button
                        onClick={() => setShowModal(true)}
                        className="metodologia-btn"
                    >
                        Ver metodología
                    </button>
                </div>
            </section>

            {/* Metodología Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content metodologia-modal" onClick={e => e.stopPropagation()}>
                        {/* Close button */}
                        <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>

                        <h2 className="modal-title">
                            Cómo se calcula la evaluación electoral
                        </h2>

                        {/* Block 1: Qué analiza el sistema */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Qué analiza el sistema</h3>
                            <div className="modal-three-cols">
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#1565c0"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg></span>
                                    <h4>Trayectoria</h4>
                                    <p>Experiencia laboral y política registrada públicamente.</p>
                                </div>
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#6a1b9a"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" /></svg></span>
                                    <h4>Formación</h4>
                                    <p>Estudios declarados y verificados.</p>
                                </div>
                                <div className="modal-col-card">
                                    <span className="modal-col-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg></span>
                                    <h4>Antecedentes</h4>
                                    <p>Denuncias, sanciones e información pública relevante.</p>
                                </div>
                            </div>
                        </div>

                        {/* Block 2: Cómo se genera la puntuación */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Cómo se genera la puntuación</h3>
                            <p className="modal-block-text">
                                Cada candidato recibe una valoración basada en información pública verificable y participación ciudadana.
                                La evaluación de una plancha corresponde al promedio ponderado de todos sus integrantes.
                            </p>
                        </div>

                        {/* Block 3: Participación ciudadana */}
                        <div className="modal-block">
                            <h3 className="modal-block-title">Participación ciudadana</h3>
                            <ul className="modal-checklist">
                                <li>✔ Un usuario = un voto activo</li>
                                <li>✔ El voto puede modificarse</li>
                                <li>✔ Nunca se duplica la votación</li>
                                <li>✔ Los cambios actualizan resultados en tiempo real</li>
                            </ul>
                        </div>

                        {/* Block 4: Transparencia */}
                        <div className="modal-block modal-block-highlight">
                            <h3 className="modal-block-title">Transparencia</h3>
                            <p className="modal-block-text">
                                <strong>VOTA.pe no promueve candidatos ni partidos políticos.</strong><br />
                                La plataforma muestra tendencias y evaluaciones generadas por datos públicos y participación ciudadana.
                            </p>
                        </div>

                        {/* Block 5: Close button */}
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
