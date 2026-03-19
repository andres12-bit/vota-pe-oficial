import type { Metadata } from 'next';

const SITE_URL = 'https://pulsoelectoral.pe';

export const metadata: Metadata = {
    title: 'Blog Electoral — Noticias y Análisis de las Elecciones Perú 2026 | PulsoElectoral.pe',
    description: 'Noticias electorales, análisis de encuestas, comparativa de planes de gobierno y perfiles de candidatos. Información actualizada sobre las elecciones generales del Perú 2026 basada en fuentes oficiales del JNE.',
    keywords: 'blog electoral perú, noticias elecciones 2026, análisis encuestas presidenciales, planes de gobierno 2026, candidatos perú 2026, debate presidencial, bicameralidad perú, voto electrónico',
    alternates: { canonical: `${SITE_URL}/blog` },
    openGraph: {
        title: 'Blog Electoral — Noticias Electorales Perú 2026',
        description: 'Análisis, tendencias y noticias sobre las elecciones generales 2026. Información basada en fuentes oficiales del JNE.',
        url: `${SITE_URL}/blog`,
        siteName: 'PulsoElectoral.pe',
        type: 'website',
        locale: 'es_PE',
        images: [{ url: '/images/og-pulsoelectoral.png', width: 1200, height: 630, alt: 'Blog Electoral — PulsoElectoral.pe' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog Electoral — PulsoElectoral.pe',
        description: 'Noticias, análisis y tendencias electorales en Perú 2026.',
        images: ['/images/og-pulsoelectoral.png'],
    },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
