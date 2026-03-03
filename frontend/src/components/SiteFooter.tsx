'use client';

import { useState } from 'react';

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
            <footer className="site-footer">
                <div className="footer-inner">
                    {/* Logo & tagline */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/images/logo-votape-transparent.png" alt="VOTA.PE" style={{ height: '70px', objectFit: 'contain' }} />
                        </div>
                        <p className="footer-tagline">
                            Plataforma ciudadana de evaluación electoral — Elecciones Generales 2026
                        </p>
                    </div>

                    {/* Links columns */}
                    <div className="footer-links-grid">
                        <div className="footer-links-col">
                            <h4 className="footer-col-title">Plataforma</h4>
                            <ul>
                                <li><a href="#" onClick={openSection('plataforma')}>¿Qué es VOTA.PE?</a></li>
                                <li><a href="#" onClick={openSection('como-funciona')}>Cómo funciona</a></li>
                                <li><a href="#" onClick={openSection('transparencia')}>Transparencia</a></li>
                            </ul>
                        </div>
                        <div className="footer-links-col">
                            <h4 className="footer-col-title">Proyecto</h4>
                            <ul>
                                <li><a href="#" onClick={openSection('proyecto')}>El proyecto</a></li>
                                <li><a href="#" onClick={openSection('sobre')}>Sobre VOTA.PE</a></li>
                                <li><a href="#" onClick={openSection('contacto')}>Contacto</a></li>
                                <li><a href="#" onClick={openSection('terminos')}>Términos de uso</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="footer-bottom">
                    <p>© 2026 VOTA.PE — Proyecto ciudadano independiente. No afiliado a ningún partido político.</p>
                </div>
            </footer>

            {/* ═══════════ Information Modal ═══════════ */}
            {activeSection && info && (
                <div className="modal-overlay" onClick={() => setActiveSection(null)}>
                    <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setActiveSection(null)}>✕</button>

                        {/* Sidebar navigation */}
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

                            {/* Main content */}
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

                                {/* Contact-specific cards */}
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
