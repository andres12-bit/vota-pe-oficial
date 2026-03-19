/**
 * PulsoElectoral.pe — Search Page Layout with SEO
 */
import type { Metadata } from 'next';

const SITE_URL = 'https://pulsoelectoral.pe';

export const metadata: Metadata = {
    title: 'Buscar Candidatos, Partidos y Propuestas | PulsoElectoral.pe',
    description: 'Busca candidatos presidenciales, senadores, diputados y parlamentarios andinos. Encuentra propuestas, denuncias y eventos de todas las organizaciones políticas del Perú 2026.',
    keywords: 'buscar candidatos perú 2026, propuestas electorales, partidos políticos perú, denuncias candidatos, buscar senadores, buscar diputados',
    alternates: { canonical: `${SITE_URL}/search` },
    openGraph: {
        title: 'Buscar Candidatos y Propuestas — PulsoElectoral.pe',
        description: 'Motor de búsqueda electoral: candidatos, partidos, propuestas y eventos de las elecciones Perú 2026.',
        url: `${SITE_URL}/search`,
        siteName: 'PulsoElectoral.pe',
        type: 'website',
        locale: 'es_PE',
        images: [{ url: '/images/og-pulsoelectoral.png', width: 1200, height: 630, alt: 'Buscar — PulsoElectoral.pe' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Buscar Candidatos — PulsoElectoral.pe',
        description: 'Encuentra candidatos, propuestas y denuncias de las elecciones Perú 2026.',
        images: ['/images/og-pulsoelectoral.png'],
    },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
