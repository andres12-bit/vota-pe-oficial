'use client';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

interface Props {
    onNavigate: (tab: TabType) => void;
}

const CATEGORIES = [
    {
        id: 'president' as TabType, label: 'Presidente',
        description: 'Candidatos a la Presidencia de la República',
        color: '#c62828',
        svg: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
    },
    {
        id: 'senator' as TabType, label: 'Senado',
        description: 'Candidatos al Senado de la República',
        color: '#1565c0',
        svg: '<path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>',
    },
    {
        id: 'deputy' as TabType, label: 'Diputados',
        description: 'Candidatos a la Cámara de Diputados',
        color: '#2e7d32',
        svg: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    },
    {
        id: 'andean' as TabType, label: 'Parl. Andino',
        description: 'Candidatos al Parlamento Andino',
        color: '#6a1b9a',
        svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>',
    },
];

export default function ExploraCandidatos({ onNavigate }: Props) {
    return (
        <section className="explora-section">
            <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-wide section-title" style={{ color: 'var(--vp-text)' }}>
                    Explora candidatos
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    Acceso rápido a los candidatos con mayor aceptación
                </p>
            </div>
            <div className="explora-grid">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onNavigate(cat.id)}
                        className="explora-card"
                    >
                        <div className="explora-card-icon" style={{ background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}11)` }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill={cat.color} dangerouslySetInnerHTML={{ __html: cat.svg }} />
                        </div>
                        <h3 className="explora-card-title">{cat.label}</h3>
                        <p className="explora-card-desc">{cat.description}</p>
                        <span className="explora-card-arrow">→</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
