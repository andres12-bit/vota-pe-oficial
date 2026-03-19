'use client';

import { useState, useEffect, Suspense } from 'react';
import { Candidate, search } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';

interface SearchResults {
    candidates: Candidate[];
    proposals: { id: number; candidate_id: number; candidate_name: string; title: string; description: string; category: string }[];
    events: { id: number; candidate_id: number; candidate_name: string; event_type: string; title: string; description: string }[];
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length < 2) return;

        setLoading(true);
        try {
            const data = await search(query);
            setResults(data as unknown as SearchResults);
        } catch (err) {
            console.error('Search error:', err);
        }
        setLoading(false);
    };

    // Auto-search from URL params
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && q.trim().length >= 2) {
            setQuery(q);
            setLoading(true);
            search(q).then(data => setResults(data as unknown as SearchResults))
                .catch(err => console.error('Search error:', err))
                .finally(() => setLoading(false));
        }
    }, [searchParams]);

    const typeColors: Record<string, string> = {
        positive: '#16a34a', negative: '#eab308', corruption: '#dc2626', achievement: '#2563eb',
    };

    const typeIcons: Record<string, string> = {
        positive: '✅', negative: '⚠️', corruption: '🚨', achievement: '🏆',
    };

    const categoryIcons: Record<string, string> = {
        educación: '📚', salud: '🏥', seguridad: '🛡️', economía: '💰',
        corrupción: '⚖️', infraestructura: '🏗️', medio_ambiente: '🌿',
        tecnología: '💻', social: '👥', empleo: '💼',
    };

    const quickTags = [
        { label: 'Educación', icon: '📚' },
        { label: 'Corrupción', icon: '⚖️' },
        { label: 'Salud', icon: '🏥' },
        { label: 'Seguridad', icon: '🛡️' },
        { label: 'Economía', icon: '💰' },
        { label: 'Infraestructura', icon: '🏗️' },
    ];

    const totalResults = results
        ? results.candidates.length + results.proposals.length + results.events.length
        : 0;

    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            <NavHeader />

            {/* ═══ SEARCH HERO ═══ */}
            <div className="search-hero">
                <div className="search-hero-inner">
                    <span className="search-hero-badge">🔍 Motor de Búsqueda Electoral</span>
                    <h1 className="search-hero-title">Búsqueda Electoral</h1>
                    <p className="search-hero-subtitle">
                        Busca candidatos, propuestas y eventos de todas las organizaciones políticas
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-wrap">
                            <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar candidato, partido, propuesta, denuncia..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="search-input"
                                autoFocus
                            />
                            <button type="submit" className="search-submit-btn">
                                Buscar
                            </button>
                        </div>
                    </form>

                    {/* Quick Tags */}
                    <div className="search-tags">
                        {quickTags.map(tag => (
                            <button
                                key={tag.label}
                                type="button"
                                onClick={() => { setQuery(tag.label.toLowerCase()); }}
                                className="search-tag"
                            >
                                <span>{tag.icon}</span>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="internal-page-wrapper">

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    </div>
                )}

                {results && !loading && (
                    <div className="flex flex-col gap-6">

                        {/* Results Summary */}
                        {totalResults > 0 && (
                            <div className="search-results-summary">
                                <span className="search-results-count">{totalResults}</span> resultado{totalResults !== 1 ? 's' : ''} para &quot;{query}&quot;
                                <div className="search-results-breakdown">
                                    {results.candidates.length > 0 && (
                                        <span className="search-res-pill" style={{ background: 'rgba(198,40,40,0.08)', color: '#c62828' }}>
                                            👤 {results.candidates.length} candidato{results.candidates.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {results.proposals.length > 0 && (
                                        <span className="search-res-pill" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                                            📋 {results.proposals.length} propuesta{results.proposals.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {results.events.length > 0 && (
                                        <span className="search-res-pill" style={{ background: 'rgba(234,179,8,0.08)', color: '#b45309' }}>
                                            📰 {results.events.length} evento{results.events.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══ CANDIDATES ═══ */}
                        {results.candidates.length > 0 && (
                            <section>
                                <h3 className="search-section-title">
                                    <span className="search-section-icon">👤</span>
                                    Candidatos
                                    <span className="search-section-count">{results.candidates.length}</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {results.candidates.map(c => (
                                        <Link href={`/candidate/${c.id}`} key={c.id}>
                                            <div className="search-candidate-card">
                                                <img
                                                    src={getCandidatePhoto(c.photo, c.name, 56, c.party_color)}
                                                    onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 56, c.party_color); } }}
                                                    alt={c.name}
                                                    width={56}
                                                    height={56}
                                                    className="search-candidate-photo"
                                                    style={{ borderColor: c.party_color || 'var(--vp-border)' }}
                                                />
                                                <div className="search-candidate-info">
                                                    <div className="search-candidate-name">{c.name}</div>
                                                    <div className="search-candidate-party" style={{ color: c.party_color }}>
                                                        {c.party_abbreviation}
                                                        <span className="search-candidate-pos">
                                                            {c.position === 'president' ? 'Presidente' : c.position === 'senator' ? 'Senador' : c.position === 'deputy' ? 'Diputado' : 'P. Andino'}
                                                        </span>
                                                    </div>
                                                    {c.region && (
                                                        <div className="search-candidate-region">📍 {c.region}</div>
                                                    )}
                                                </div>
                                                <div className="search-candidate-score-wrap">
                                                    <span className="score-badge">{Number(c.final_score).toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ═══ PROPOSALS ═══ */}
                        {results.proposals.length > 0 && (
                            <section>
                                <h3 className="search-section-title">
                                    <span className="search-section-icon">📋</span>
                                    Propuestas
                                    <span className="search-section-count">{results.proposals.length}</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {results.proposals.map(p => (
                                        <Link href={`/candidate/${p.candidate_id}`} key={p.id}>
                                            <div className="search-proposal-card">
                                                <div className="search-proposal-header">
                                                    <span className="search-proposal-category">
                                                        {categoryIcons[p.category?.toLowerCase()] || '📄'} {p.category}
                                                    </span>
                                                    <span className="search-proposal-author">
                                                        {p.candidate_name}
                                                    </span>
                                                </div>
                                                <div className="search-proposal-title">{p.title}</div>
                                                {p.description && (
                                                    <div className="search-proposal-desc">{p.description}</div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ═══ EVENTS ═══ */}
                        {results.events.length > 0 && (
                            <section>
                                <h3 className="search-section-title">
                                    <span className="search-section-icon">📰</span>
                                    Eventos
                                    <span className="search-section-count">{results.events.length}</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {results.events.map(e => (
                                        <Link href={`/candidate/${e.candidate_id}`} key={e.id}>
                                            <div className="search-event-card">
                                                <div className="search-event-badge" style={{
                                                    background: `${typeColors[e.event_type] || '#6b7280'}12`,
                                                    color: typeColors[e.event_type] || '#6b7280',
                                                    borderColor: `${typeColors[e.event_type] || '#6b7280'}30`,
                                                }}>
                                                    {typeIcons[e.event_type] || '📌'} {e.event_type.toUpperCase()}
                                                </div>
                                                <div className="search-event-info">
                                                    <div className="search-event-title">{e.title}</div>
                                                    <div className="search-event-author">{e.candidate_name}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ═══ NO RESULTS ═══ */}
                        {results.candidates.length === 0 && results.proposals.length === 0 && results.events.length === 0 && (
                            <div className="search-empty">
                                <div className="search-empty-icon">🔍</div>
                                <h3 className="search-empty-title">Sin resultados</h3>
                                <p className="search-empty-desc">No se encontraron resultados para &quot;{query}&quot;</p>
                                <div className="search-empty-suggestions">
                                    <p>Intenta con:</p>
                                    <div className="search-empty-tags">
                                        {quickTags.slice(0, 4).map(tag => (
                                            <button
                                                key={tag.label}
                                                onClick={() => setQuery(tag.label.toLowerCase())}
                                                className="search-tag"
                                            >
                                                {tag.icon} {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Initial state - no search yet */}
                {!results && !loading && (
                    <div className="search-initial">
                        <div className="search-initial-icon">🗳️</div>
                        <h3 className="search-initial-title">Explora el panorama electoral</h3>
                        <p className="search-initial-desc">
                            Usa la barra de búsqueda para encontrar candidatos, propuestas o eventos electorales
                        </p>
                        <div className="search-initial-grid">
                            <div className="search-initial-card">
                                <span className="search-init-emoji">👤</span>
                                <span className="search-init-label">Candidatos</span>
                                <span className="search-init-sub">Busca por nombre o partido</span>
                            </div>
                            <div className="search-initial-card">
                                <span className="search-init-emoji">📋</span>
                                <span className="search-init-label">Propuestas</span>
                                <span className="search-init-sub">Busca por tema o categoría</span>
                            </div>
                            <div className="search-initial-card">
                                <span className="search-init-emoji">📰</span>
                                <span className="search-init-label">Eventos</span>
                                <span className="search-init-sub">Denuncias y logros</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <SiteFooter />
        </div>
    );
}
