/**
 * PulsoElectoral.pe — Radar Electoral Layout with SEO
 */
import type { Metadata } from 'next';

const SITE_URL = 'https://pulsoelectoral.pe';

export const metadata: Metadata = {
    title: 'Radar Electoral — Análisis Profundo de Candidatos y Partidos | PulsoElectoral.pe',
    description: 'Centro de inteligencia electoral del Perú 2026. Índice de calidad de planchas, rankings por integridad, experiencia y educación. Alertas electorales y métricas de género, edad y profesionalismo de candidatos.',
    keywords: 'radar electoral perú, análisis candidatos 2026, ranking partidos políticos, integridad candidatos, experiencia política, planchas presidenciales, alertas electorales, paridad de género, JNE datos',
    alternates: { canonical: `${SITE_URL}/radar` },
    openGraph: {
        title: 'Radar Electoral — Inteligencia Electoral Perú 2026',
        description: 'Análisis profundo: índice de calidad de planchas, rankings de partidos, alertas electorales y métricas completas de todos los candidatos.',
        url: `${SITE_URL}/radar`,
        siteName: 'PulsoElectoral.pe',
        type: 'website',
        locale: 'es_PE',
        images: [{ url: '/images/og-pulsoelectoral.png', width: 1200, height: 630, alt: 'Radar Electoral — PulsoElectoral.pe' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Radar Electoral — PulsoElectoral.pe',
        description: 'Centro de inteligencia electoral: rankings, alertas y métricas de todos los candidatos y partidos.',
        images: ['/images/og-pulsoelectoral.png'],
    },
};

export default function RadarLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
