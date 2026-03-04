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
                        ⚖️ Aviso Legal y Términos de Uso
                    </h1>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            1. Naturaleza de la Plataforma
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                            VOTA.PE es una <strong>plataforma informativa de carácter no oficial</strong> que recopila y presenta datos
                            públicos sobre candidatos y partidos políticos del Perú. No es un organismo electoral ni está
                            afiliado al Jurado Nacional de Elecciones (JNE), la ONPE ni el RENIEC.
                        </p>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            2. Fuente de Datos
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                            La información de candidatos, hojas de vida, planes de gobierno y datos partidarios proviene del
                            portal <strong>Voto Informado</strong> del Jurado Nacional de Elecciones (
                            <a href="https://votoinformado.jne.gob.pe" target="_blank" rel="noopener noreferrer"
                                style={{ color: 'var(--vp-blue)', textDecoration: 'underline' }}>
                                votoinformado.jne.gob.pe
                            </a>). Los datos son de acceso público y se presentan con fines informativos.
                        </p>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            3. Descargo de Responsabilidad Electoral
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                            <strong>VOTA.PE no realiza encuestas electorales oficiales.</strong> Los &quot;votos&quot;, &quot;scores&quot; y &quot;rankings&quot;
                            que se muestran en la plataforma son <strong>indicadores de intención basados en la participación
                                de los usuarios</strong> de la web y no representan proyecciones electorales ni intención de voto
                            a nivel nacional. No deben interpretarse como encuestas ni usarse como referencia para
                            predicciones electorales.
                        </p>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            4. Metodología de Puntuación
                        </h2>
                        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--vp-text-dim)' }}>
                            El &quot;Score Final&quot; de cada candidato se calcula con la siguiente fórmula:
                        </p>
                        <div className="p-3 rounded-lg text-xs font-mono mb-2" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--vp-text)', border: '1px solid var(--vp-border)' }}>
                            score = (votos × 0.40) + (inteligencia × 0.25) + (momentum × 0.20) + (integridad × 0.15)
                        </div>
                        <ul className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--vp-text-dim)' }}>
                            <li>• <strong>Votos (40%)</strong>: Participación de usuarios en la plataforma</li>
                            <li>• <strong>Inteligencia (25%)</strong>: Análisis de perfil e historial del candidato</li>
                            <li>• <strong>Momentum (20%)</strong>: Velocidad de actividad reciente</li>
                            <li>• <strong>Integridad (15%)</strong>: Indicador de transparencia</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            5. Política de Uso
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                            Al usar VOTA.PE, el usuario acepta que: (a) la información se proporciona &quot;tal cual&quot; sin garantías
                            de exactitud; (b) los votos emitidos son indicadores de preferencia digital, no votos electorales
                            reales; (c) no se permite el uso de bots, scripts automatizados o cualquier mecanismo de
                            manipulación de votos; (d) VOTA.PE se reserva el derecho de invalidar votos sospechosos.
                        </p>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                        <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text)' }}>
                            6. Privacidad
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--vp-text-dim)' }}>
                            VOTA.PE recopila datos mínimos necesarios: dirección IP y huella digital del navegador para
                            prevenir fraude en votación. No se recopilan datos personales identificables. No se comparten
                            datos con terceros.
                        </p>
                    </section>

                    <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.15)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--vp-text-dim)' }}>Última actualización</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--vp-text)' }}>Marzo 2026</p>
                    </div>
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
