import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Simular Elección — Arma tu equipo electoral | PulsoElectoral.pe',
    description: 'Simula las elecciones Perú 2026. Elige a tus candidatos para Presidente, Senado, Diputados y Parlamento Andino. Compara y comparte tu selección electoral.',
    openGraph: {
        title: 'Simular Elección — PulsoElectoral.pe',
        description: 'Arma tu equipo electoral ideal para las elecciones 2026.',
        url: 'https://pulsoelectoral.pe/simular',
        siteName: 'PulsoElectoral.pe',
        type: 'website',
        locale: 'es_PE',
        images: [{ url: '/images/og-pulsoelectoral.png', width: 1200, height: 630 }],
    },
};

export default function SimularLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
