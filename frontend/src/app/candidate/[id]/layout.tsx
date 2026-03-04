/**
 * VOTA.PE — Candidate Page Layout with Dynamic SEO
 */
import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE_URL = 'https://votape-web.onrender.com';

const positionLabels: Record<string, string> = {
    president: 'Candidato(a) Presidencial',
    senator: 'Candidato(a) al Senado',
    deputy: 'Candidato(a) a Diputado',
    andean: 'Candidato(a) al Parlamento Andino',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const res = await fetch(`${API_BASE}/api/candidates/${id}`, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error('Not found');
        const candidate = await res.json();

        const title = `${candidate.name} — ${positionLabels[candidate.position] || candidate.position} | VOTA.PE`;
        const description = `Perfil electoral de ${candidate.name}. ${candidate.party_name || ''}. Score: ${candidate.final_score}. Inteligencia: ${candidate.intelligence_score}. ${candidate.biography?.substring(0, 120) || ''}`;

        return {
            title,
            description,
            alternates: { canonical: `${SITE_URL}/candidate/${id}` },
            openGraph: {
                title,
                description,
                url: `${SITE_URL}/candidate/${id}`,
                siteName: 'VOTA.PE',
                type: 'profile',
                locale: 'es_PE',
                images: candidate.photo ? [{ url: candidate.photo, width: 200, height: 200, alt: candidate.name }] : [],
            },
            twitter: {
                card: 'summary',
                title,
                description,
                images: candidate.photo ? [candidate.photo] : [],
            },
            other: {
                'article:section': 'Política',
                'og:locale': 'es_PE',
            },
        };
    } catch {
        return {
            title: 'Candidato | VOTA.PE',
            description: 'Perfil electoral del candidato — VOTA.PE Inteligencia Electoral en Tiempo Real',
        };
    }
}

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
