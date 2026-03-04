/**
 * VOTA.PE — Party Page Layout with Dynamic SEO
 */
import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE_URL = 'https://votape-web.onrender.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const res = await fetch(`${API_BASE}/api/parties/${id}`, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const party = data.party || data;

        const title = `${party.name} — Plancha Electoral | VOTA.PE`;
        const description = `Análisis completo de ${party.name} (${party.abbreviation}). Score: ${party.party_full_score}. Candidatos para Presidente, Senado, Diputados y Parlamento Andino. Elecciones Perú 2026.`;

        return {
            title,
            description,
            alternates: { canonical: `${SITE_URL}/party/${id}` },
            openGraph: {
                title,
                description,
                url: `${SITE_URL}/party/${id}`,
                siteName: 'VOTA.PE',
                type: 'article',
                locale: 'es_PE',
                images: party.logo ? [{ url: party.logo, width: 200, height: 200, alt: party.name }] : [],
            },
            twitter: {
                card: 'summary',
                title,
                description,
            },
        };
    } catch {
        return {
            title: 'Plancha Electoral | VOTA.PE',
            description: 'Plancha electoral completa — VOTA.PE Inteligencia Electoral en Tiempo Real',
        };
    }
}

export default function PartyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
