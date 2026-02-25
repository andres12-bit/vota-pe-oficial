'use client';

import { useState, useEffect, Suspense } from 'react';
import { Candidate, search } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SearchResults {
    candidates: Candidate[];
    proposals: { id: number; candidate_id: number; candidate_name: string; title: string; description: string; category: string }[];
    events: { id: number; candidate_id: number; candidate_name: string; event_type: string; title: string; description: string }[];
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg)' }}>
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
        positive: 'var(--vp-green)', negative: 'var(--vp-gold)', corruption: 'var(--vp-red)', achievement: 'var(--vp-blue)',
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--vp-bg)' }}>
            <header className="sticky top-0 z-50 px-4 py-3 flex items-center gap-4" style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid var(--vp-border)', backdropFilter: 'blur(20px)' }}>
                <Link href="/" className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>← VOTA.PE</Link>
                <span className="text-sm font-bold tracking-wider" style={{ color: 'var(--vp-text)' }}>BÚSQUEDA GLOBAL</span>
            </header>

            <main className="internal-page-wrapper">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Buscar candidato, partido, propuesta, denuncia..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-lg text-sm"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)', outline: 'none' }}
                            autoFocus
                        />
                        <button type="submit" className="px-6 py-3 rounded-lg font-bold text-sm"
                            style={{ background: 'var(--vp-red)', color: 'white', boxShadow: '0 0 12px var(--vp-red-glow)' }}>
                            🔍 Buscar
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {['educación', 'corrupción', 'salud', 'seguridad', 'economía'].map(tag => (
                            <button key={tag} type="button" onClick={() => { setQuery(tag); }}
                                className="text-[10px] px-2 py-1 rounded-full transition-colors hover:bg-white/10"
                                style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-text-dim)' }}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </form>

                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                    </div>
                )}

                {results && !loading && (
                    <div className="flex flex-col gap-8">
                        {/* Candidates */}
                        {results.candidates.length > 0 && (
                            <section>
                                <h3 className="text-xs font-bold tracking-[2px] uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>
                                    Candidatos ({results.candidates.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {results.candidates.map(c => (
                                        <Link href={`/candidate/${c.id}`} key={c.id}>
                                            <div className="panel-glow-subtle flex items-center gap-3 transition-colors hover:bg-white/5">
                                                <img
                                                    src={getAvatarUrl(c.name, 48, c.party_color)}
                                                    alt={c.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-full shrink-0 object-cover"
                                                    style={{ border: '2px solid var(--vp-border)' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate">{c.name}</div>
                                                    <div className="text-[10px]" style={{ color: c.party_color }}>{c.party_abbreviation} — {c.position}</div>
                                                    <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>{c.region}</div>
                                                </div>
                                                <span className="score-badge">{Number(c.final_score).toFixed(1)}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Proposals */}
                        {results.proposals.length > 0 && (
                            <section>
                                <h3 className="text-xs font-bold tracking-[2px] uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>
                                    Propuestas ({results.proposals.length})
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {results.proposals.map(p => (
                                        <Link href={`/candidate/${p.candidate_id}`} key={p.id}>
                                            <div className="panel-glow-subtle transition-colors hover:bg-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                                        {p.category}
                                                    </span>
                                                    <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>{p.candidate_name}</span>
                                                </div>
                                                <div className="text-sm font-semibold">{p.title}</div>
                                                <div className="text-xs mt-1" style={{ color: 'var(--vp-text-dim)' }}>{p.description}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Events */}
                        {results.events.length > 0 && (
                            <section>
                                <h3 className="text-xs font-bold tracking-[2px] uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>
                                    Eventos ({results.events.length})
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {results.events.map(e => (
                                        <Link href={`/candidate/${e.candidate_id}`} key={e.id}>
                                            <div className="panel-glow-subtle transition-colors hover:bg-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                                                        style={{ background: `${typeColors[e.event_type]}22`, color: typeColors[e.event_type] }}>
                                                        {e.event_type.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>{e.candidate_name}</span>
                                                </div>
                                                <div className="text-sm font-semibold">{e.title}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* No results */}
                        {results.candidates.length === 0 && results.proposals.length === 0 && results.events.length === 0 && (
                            <div className="panel-glow p-8 text-center">
                                <span className="text-3xl">🔍</span>
                                <p className="text-sm mt-3" style={{ color: 'var(--vp-text-dim)' }}>No se encontraron resultados para &quot;{query}&quot;</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
