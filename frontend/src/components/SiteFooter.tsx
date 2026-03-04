'use client';

import { useState } from 'react';
import Link from 'next/link';

type InfoSection = 'plataforma' | 'como-funciona' | 'transparencia' | 'proyecto' | 'sobre' | 'contacto' | 'terminos' | null;

const INFO_CONTENT: Record<string, { title: string; icon: string; paragraphs: string[] }> = {
    plataforma: {
        title: 'Plataforma',
        icon: '🌐',
        paragraphs: [
            'VOTA.PE es una plataforma digital independiente diseñada para recoger, visualizar y analizar la opinión ciudadana en tiempo real mediante herramientas tecnológicas accesibles, transparentes y verificables.',
            'El sistema permite a los ciudadanos expresar su posición frente a temas de interés público a través de encuestas abiertas y mediciones continuas de intención ciudadana, generando indicadores dinámicos que reflejan tendencias sociales y percepciones colectivas.',
            'La plataforma opera bajo principios de neutralidad política, participación abierta y transparencia metodológica, asegurando que los resultados representen únicamente la interacción de los usuarios registrados dentro del sistema.',
            'VOTA.PE no promueve candidatos, organizaciones ni ideologías. Su finalidad es ofrecer un espacio digital donde la ciudadanía pueda participar activamente en la construcción de información pública basada en datos.',
        ],
    },
    'como-funciona': {
        title: 'Cómo funciona',
        icon: '⚙️',
        paragraphs: [
            'El funcionamiento de VOTA.PE se basa en la participación directa de los ciudadanos mediante un proceso simple:',
            'Primero, el usuario accede a la plataforma y se registra aceptando los términos de uso y las políticas de participación.',
            'Luego, puede participar en encuestas activas o expresar su intención ciudadana dentro de los espacios habilitados. Cada interacción queda registrada dentro del sistema bajo parámetros técnicos que evitan duplicidades y garantizan integridad de datos.',
            'Las encuestas en vivo muestran resultados acumulados únicamente de las participaciones realizadas durante su periodo activo.',
            'La intención ciudadana en tiempo real funciona como un indicador dinámico que se actualiza constantemente conforme ingresan nuevas participaciones, permitiendo observar variaciones y tendencias de opinión de manera inmediata.',
            'Los resultados se presentan de forma visual y estadística para facilitar su comprensión pública.',
        ],
    },
    transparencia: {
        title: 'Transparencia',
        icon: '🔍',
        paragraphs: [
            'VOTA.PE aplica principios de transparencia en la recolección, procesamiento y publicación de información generada dentro de la plataforma.',
            'Los resultados visibles corresponden exclusivamente a la participación registrada en el sistema y no constituyen estudios estadísticos tradicionales ni encuestas electorales oficiales.',
            'La plataforma publica de manera abierta sus criterios de funcionamiento, reglas de participación y lógica general de cálculo para garantizar claridad frente a los usuarios.',
            'No se alteran resultados manualmente ni se manipulan tendencias. Los indicadores se actualizan automáticamente según la interacción real de los participantes.',
            'Asimismo, VOTA.PE protege la privacidad de los usuarios, evitando la exposición pública de datos personales y utilizando únicamente información necesaria para el funcionamiento del sistema.',
        ],
    },
    proyecto: {
        title: 'Proyecto',
        icon: '🚀',
        paragraphs: [
            'VOTA.PE nace como un proyecto tecnológico orientado a modernizar la participación ciudadana mediante herramientas digitales accesibles y en constante evolución.',
            'El proyecto busca reducir la distancia entre la opinión pública y los espacios tradicionales de medición social, permitiendo que la ciudadanía pueda expresarse de forma continua y no únicamente durante procesos electorales.',
            'A través del uso de tecnología web y análisis de datos, el proyecto plantea un modelo participativo basado en interacción directa, transparencia operativa y acceso público a la información generada.',
            'El desarrollo del proyecto contempla mejoras progresivas, incorporación de nuevas funcionalidades y expansión hacia distintos espacios de participación social y ciudadana.',
        ],
    },
    sobre: {
        title: 'Sobre VOTA.PE',
        icon: '🏛️',
        paragraphs: [
            'VOTA.PE es una iniciativa digital independiente creada con el objetivo de fomentar la participación ciudadana mediante herramientas tecnológicas abiertas.',
            'La plataforma busca convertirse en un espacio de referencia para observar tendencias sociales y percepciones colectivas desde una perspectiva participativa y digital.',
            'El equipo detrás del proyecto está enfocado en el desarrollo de soluciones tecnológicas orientadas a la transparencia informativa, el acceso democrático a la participación y la innovación en mecanismos de interacción ciudadana.',
            'VOTA.PE actúa como un medio tecnológico de visualización de opinión pública generada por usuarios y no como una entidad política, encuestadora tradicional ni organismo electoral.',
        ],
    },
    contacto: {
        title: 'Contacto',
        icon: '✉️',
        paragraphs: [
            'Los usuarios pueden comunicarse con el equipo de VOTA.PE para consultas, soporte técnico, observaciones o solicitudes de información mediante los canales oficiales habilitados en la plataforma.',
            'Las comunicaciones serán atendidas dentro de los plazos operativos establecidos, priorizando solicitudes relacionadas con funcionamiento del sistema, reportes técnicos o dudas sobre el uso de la plataforma.',
        ],
    },
    terminos: {
        title: 'Términos de uso',
        icon: '📋',
        paragraphs: [
            'El acceso y uso de VOTA.PE implica la aceptación plena de los términos y condiciones establecidos por la plataforma.',
            'Los usuarios se comprometen a utilizar el sistema de manera responsable, evitando conductas que busquen manipular resultados, duplicar participaciones o afectar el funcionamiento del servicio.',
            'La plataforma se reserva el derecho de limitar, suspender o cancelar accesos que incumplan las normas de participación o generen riesgos para la integridad del sistema.',
            'Los resultados publicados representan únicamente la interacción de los usuarios dentro de VOTA.PE y no constituyen resultados oficiales, estudios científicos ni predicciones electorales.',
            'VOTA.PE podrá actualizar sus términos de uso cuando resulte necesario para mejorar el servicio o adaptarse a cambios tecnológicos y normativos, publicando siempre las versiones vigentes dentro del sitio web.',
        ],
    },
};

export default function SiteFooter() {
    const [activeSection, setActiveSection] = useState<InfoSection>(null);

    const openSection = (section: InfoSection) => (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveSection(section);
    };

    const info = activeSection ? INFO_CONTENT[activeSection] : null;

    return (
        <>
            <footer className="premium-footer">
                <div className="premium-footer-inner">
                    {/* Top section */}
                    <div className="premium-footer-top">
                        {/* Brand */}
                        <div className="premium-footer-brand">
                            <div className="premium-footer-logo">
                                <img src="/images/logo-votape-transparent.png" alt="VOTA.PE" style={{ height: '48px', objectFit: 'contain', filter: 'brightness(10)' }} />
                            </div>
                            <p className="premium-footer-tagline">
                                Plataforma ciudadana de evaluación electoral
                            </p>
                            <p className="premium-footer-sub">Elecciones Generales 2026</p>
                            {/* Social icons */}
                            <div className="premium-footer-social">
                                <a href="#" className="premium-footer-social-icon" title="Twitter">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                                <a href="#" className="premium-footer-social-icon" title="Facebook">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                                <a href="#" className="premium-footer-social-icon" title="Instagram">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="premium-footer-links">
                            <div className="premium-footer-col">
                                <h4 className="premium-footer-col-title">Plataforma</h4>
                                <ul>
                                    <li><a href="#" onClick={openSection('plataforma')}>¿Qué es VOTA.PE?</a></li>
                                    <li><a href="#" onClick={openSection('como-funciona')}>Cómo funciona</a></li>
                                    <li><a href="#" onClick={openSection('transparencia')}>Transparencia</a></li>
                                </ul>
                            </div>
                            <div className="premium-footer-col">
                                <h4 className="premium-footer-col-title">Proyecto</h4>
                                <ul>
                                    <li><a href="#" onClick={openSection('proyecto')}>El proyecto</a></li>
                                    <li><a href="#" onClick={openSection('sobre')}>Sobre VOTA.PE</a></li>
                                    <li><a href="#" onClick={openSection('contacto')}>Contacto</a></li>
                                    <li><a href="#" onClick={openSection('terminos')}>Términos de uso</a></li>
                                </ul>
                            </div>
                            <div className="premium-footer-col">
                                <h4 className="premium-footer-col-title">Legal</h4>
                                <ul>
                                    <li><Link href="/legal">Aviso legal</Link></li>
                                    <li><Link href="/legal">Política de privacidad</Link></li>
                                    <li><Link href="/legal">Metodología</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="premium-footer-divider" />

                    {/* Bottom bar */}
                    <div className="premium-footer-bottom">
                        <p>© 2026 VOTA.PE — Proyecto ciudadano independiente.</p>
                        <p className="premium-footer-disclaimer">
                            Datos de candidatos: <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>JNE Voto Informado</a> • No afiliado a partidos ni organismos electorales • <Link href="/legal" style={{ textDecoration: 'underline' }}>Aviso legal</Link>
                        </p>
                        <p style={{ fontSize: '10px', opacity: 0.4, marginTop: '4px' }}>Última actualización de datos: Marzo 2026</p>
                    </div>
                </div>
            </footer>

            {/* ═══════════ Information Modal ═══════════ */}
            {activeSection && info && (
                <div className="modal-overlay" onClick={() => setActiveSection(null)}>
                    <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setActiveSection(null)}>✕</button>

                        <div className="info-modal-layout">
                            <nav className="info-modal-nav">
                                {Object.entries(INFO_CONTENT).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveSection(key as InfoSection)}
                                        className={`info-nav-item ${activeSection === key ? 'active' : ''}`}
                                    >
                                        <span className="info-nav-icon">{val.icon}</span>
                                        <span className="info-nav-label">{val.title}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="info-modal-body">
                                <h2 className="info-modal-title">
                                    <span className="info-title-icon">{info.icon}</span>
                                    {info.title}
                                </h2>

                                <div className="info-modal-text">
                                    {info.paragraphs.map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>

                                {activeSection === 'contacto' && (
                                    <div className="info-contact-cards">
                                        <div className="info-contact-card">
                                            <span className="info-contact-icon">📧</span>
                                            <div>
                                                <strong>Correo electrónico oficial</strong>
                                                <span>contacto@vota.pe</span>
                                            </div>
                                        </div>
                                        <div className="info-contact-card">
                                            <span className="info-contact-icon">🛠️</span>
                                            <div>
                                                <strong>Soporte técnico</strong>
                                                <span>soporte@vota.pe</span>
                                            </div>
                                        </div>
                                        <div className="info-contact-card">
                                            <span className="info-contact-icon">ℹ️</span>
                                            <div>
                                                <strong>Consultas generales</strong>
                                                <span>info@vota.pe</span>
                                            </div>
                                        </div>
                                        <p className="info-contact-note">
                                            Toda comunicación deberá realizarse respetando las normas de uso y convivencia digital establecidas por la plataforma.
                                        </p>
                                    </div>
                                )}

                                <div className="text-center mt-6">
                                    <button onClick={() => setActiveSection(null)} className="modal-entendido-btn">
                                        ✓ Entendido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
