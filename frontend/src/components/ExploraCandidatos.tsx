'use client';

import { useState, useEffect } from 'react';
import { getRanking, Candidate } from '@/lib/api';
import { getCandidatePhoto, getAvatarUrl } from '@/lib/avatars';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

interface Props {
    onNavigate: (tab: TabType) => void;
}

const CATEGORIES = [
    {
        id: 'president' as TabType,
        label: 'Presidente',
        description: 'Candidatos a la Presidencia',
        color: '#c62828',
        gradient: 'linear-gradient(135deg, #c62828 0%, #e53935 50%, #ff5252 100%)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        ),
        apiKey: 'president',
    },
    {
        id: 'senator' as TabType,
        label: 'Senado',
        description: 'Candidatos al Senado',
        color: '#1565c0',
        gradient: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 50%, #42a5f5 100%)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" />
            </svg>
        ),
        apiKey: 'senator',
    },
    {
        id: 'deputy' as TabType,
        label: 'Diputados',
        description: 'Cámara de Diputados',
        color: '#2e7d32',
        gradient: 'linear-gradient(135deg, #2e7d32 0%, #43a047 50%, #66bb6a 100%)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
        apiKey: 'deputy',
    },
    {
        id: 'andean' as TabType,
        label: 'Parl. Andino',
        description: 'Parlamento Andino',
        color: '#6a1b9a',
        gradient: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 50%, #ab47bc 100%)',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
        ),
        apiKey: 'andean',
    },
];

export default function ExploraCandidatos({ onNavigate }: Props) {
    const [topCandidates, setTopCandidates] = useState<Record<string, Candidate[]>>({});
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        async function fetchTop() {
            const results: Record<string, Candidate[]> = {};
            const countMap: Record<string, number> = {};
            for (const cat of CATEGORIES) {
                try {
                    const data = await getRanking(cat.apiKey);
                    results[cat.apiKey] = data.slice(0, 3);
                    countMap[cat.apiKey] = data.length;
                } catch {
                    results[cat.apiKey] = [];
                    countMap[cat.apiKey] = 0;
                }
            }
            setTopCandidates(results);
            setCounts(countMap);
        }
        fetchTop();
    }, []);

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
                {CATEGORIES.map(cat => {
                    const top3 = topCandidates[cat.apiKey] || [];
                    const count = counts[cat.apiKey] || 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onNavigate(cat.id)}
                            className="explora-card-v2"
                        >
                            {/* Gradient header stripe */}
                            <div className="explora-card-header" style={{ background: cat.gradient }}>
                                <span className="explora-card-icon-v2">{cat.icon}</span>
                                <div>
                                    <h3 className="explora-card-title-v2">{cat.label}</h3>
                                    <span className="explora-card-count">{count > 0 ? `${count} candidatos` : cat.description}</span>
                                </div>
                                <span className="explora-card-chevron">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                </span>
                            </div>

                            {/* Top 3 candidates preview */}
                            <div className="explora-card-body">
                                {top3.length > 0 ? (
                                    <div className="explora-top3">
                                        {top3.map((c, i) => (
                                            <div key={c.id} className="explora-top3-item">
                                                <span className="explora-top3-rank" style={{ color: cat.color }}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                                </span>
                                                <img
                                                    src={getCandidatePhoto(c.photo, c.name, 28, c.party_color)}
                                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 28, c.party_color); }}
                                                    alt={c.name}
                                                    className="explora-top3-photo"
                                                    style={{ borderColor: cat.color }}
                                                />
                                                <span className="explora-top3-name">{c.name.split(' ').slice(-2).join(' ')}</span>
                                                <span className="explora-top3-score" style={{ color: cat.color }}>{Number(c.final_score).toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="explora-card-loading">
                                        <div className="explora-loading-dots">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
