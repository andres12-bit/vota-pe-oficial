'use client';

import Link from 'next/link';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

export default function LegalPage() {
    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            <NavHeader />
            <main className="internal-page-wrapper" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

                {/* Aviso Legal */}
                <div className="panel-glow" style={{ marginBottom: '24px' }}>
                    <h1 className="text-xl font-black mb-6" style={{ color: 'var(--vp-red)' }}>
                        ⚖️ Aviso Legal
                    </h1>

                    <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                        <p>
                            VOTA.PE es una plataforma digital independiente de información electoral. <strong>No pertenece ni está afiliada al Jurado Nacional de Elecciones (JNE), ONPE, RENIEC, ni a ningún partido político o candidato.</strong>
                        </p>
                        <p>
                            La información de candidatos, partidos y planes de gobierno proviene de fuentes públicas oficiales, principalmente del <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--vp-blue)', textDecoration: 'underline' }}>Jurado Nacional de Elecciones (JNE)</a>, y es mostrada con fines informativos y educativos.
                        </p>
                        <p>
                            VOTA.PE <strong>no promueve, financia ni respalda</strong> a ningún candidato o agrupación política.
                        </p>
                        <p>
                            La sección de intención de voto es un mecanismo digital de participación ciudadana abierto, <strong>no constituye encuesta electoral científica</strong> y no reemplaza estudios realizados por empresas registradas ante el JNE.
                        </p>
                        <p>
                            El uso de la plataforma implica la aceptación de estos términos.
                        </p>
                    </div>
                </div>

                {/* Descargo Electoral */}
                <div className="panel-glow" style={{ marginBottom: '24px' }}>
                    <h2 className="text-lg font-black mb-5" style={{ color: 'var(--vp-gold)' }}>
                        ⚠️ Descargo de Responsabilidad Electoral
                    </h2>

                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--vp-text-dim)' }}>
                        La funcionalidad de intención de voto de VOTA.PE es una herramienta digital interactiva que permite a los usuarios expresar su preferencia política de manera libre y voluntaria.
                    </p>

                    <p className="text-sm font-semibold mb-3" style={{ color: 'var(--vp-text)' }}>
                        Los resultados mostrados:
                    </p>

                    <div className="space-y-2 mb-4" style={{ paddingLeft: '8px' }}>
                        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                            <span className="text-base shrink-0">✖️</span>
                            <span className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>No representan una encuesta científica.</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                            <span className="text-base shrink-0">✖️</span>
                            <span className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>No utilizan muestreo probabilístico.</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                            <span className="text-base shrink-0">✖️</span>
                            <span className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>No son proyección oficial de resultados electorales.</span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                            <span className="text-base shrink-0">✖️</span>
                            <span className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>No deben interpretarse como tendencia electoral oficial.</span>
                        </div>
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                        Los resultados reflejan <strong>únicamente la participación de usuarios de la plataforma</strong> y pueden variar en el tiempo.
                    </p>
                </div>

                {/* Metodología */}
                <div className="panel-glow" style={{ marginBottom: '24px' }}>
                    <h2 className="text-lg font-black mb-5" style={{ color: 'var(--vp-blue)' }}>
                        📊 Metodología de Puntuación
                    </h2>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--vp-text-dim)' }}>
                        El &quot;Score Final&quot; de cada candidato se calcula con la siguiente fórmula:
                    </p>
                    <div className="p-3 rounded-lg text-xs font-mono mb-3" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--vp-text)', border: '1px solid var(--vp-border)' }}>
                        score = (hoja_de_vida × 0.30) + (plan_de_gobierno × 0.30) + (intención_ciudadana × 0.25) + (integridad × 0.15)
                    </div>
                    <ul className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--vp-text-dim)' }}>
                        <li>• <strong>Hoja de Vida (30%)</strong>: Evaluación de educación, experiencia laboral, experiencia política, transparencia financiera y limpieza judicial del candidato (datos del JNE)</li>
                        <li>• <strong>Plan de Gobierno (30%)</strong>: Cobertura dimensional, especificidad, metas cuantificables, indicadores y coherencia del plan presentado al JNE</li>
                        <li>• <strong>Intención Ciudadana (25%)</strong>: Participación de usuarios en la plataforma, normalizada por posición</li>
                        <li>• <strong>Integridad (15%)</strong>: Indicador de transparencia y limpieza del candidato</li>
                    </ul>
                </div>

                {/* Privacidad */}
                <div className="panel-glow" style={{ marginBottom: '24px' }}>
                    <h2 className="text-lg font-black mb-5" style={{ color: 'var(--vp-green)' }}>
                        🔒 Privacidad
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                        VOTA.PE recopila datos mínimos necesarios: dirección IP y huella digital del navegador para
                        prevenir fraude en votación. No se recopilan datos personales identificables. No se comparten
                        datos con terceros.
                    </p>
                </div>

                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.15)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--vp-text-dim)' }}>Última actualización</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--vp-text)' }}>Marzo 2026</p>
                </div>

                <div className="text-center">
                    <Link href="/" className="text-sm font-semibold px-6 py-3 rounded-xl inline-block transition-all hover:scale-105"
                        style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                        ← Volver al inicio
                    </Link>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
