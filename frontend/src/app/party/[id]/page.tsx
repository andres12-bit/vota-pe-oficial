'use client';

import { useState, useEffect } from 'react';
import { Candidate, Party, getPartyFullTicket } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';
import { use } from 'react';
import NavHeader from '@/components/NavHeader';

interface VicePresident {
    id: number;
    candidate_id: number;
    name: string;
    position_label: string;
    photo: string | null;
    biography: string;
    sort_order: number;
}

function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span key={i} className={`text-xs ${i <= Math.round(rating) ? 'star-filled' : 'star-empty'}`}>★</span>
        );
    }
    return <span>{stars}</span>;
}

const positionLabels: Record<string, string> = {
    president: '🏛️ Presidente',
    senators: '👔 Senadores',
    deputies: '📋 Diputados',
    andean: '🌎 Parlamento Andino',
};

export default function PartyPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [party, setParty] = useState<Party | null>(null);
    const [ticket, setTicket] = useState<Record<string, Candidate[]>>({});
    const [vicePresidents, setVicePresidents] = useState<Record<string, VicePresident[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getPartyFullTicket(parseInt(resolvedParams.id));
                setParty(data.party as unknown as Party);
                setTicket(data.ticket);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setVicePresidents((data as any).vice_presidents || {});
            } catch (err) {
                console.error('Error loading party:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [resolvedParams.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg)' }}>
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    if (!party) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vp-bg)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--vp-red)' }}>Partido no encontrado</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--vp-bg)' }}>
            {/* Full Navigation Header */}
            <NavHeader />

            <main className="internal-page-wrapper">
                {/* Party Header */}
                <div className="panel-glow mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black"
                            style={{ background: party.color || 'var(--vp-red)', boxShadow: `0 0 20px ${party.color}44` }}>
                            {party.abbreviation?.slice(0, 3)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-black" style={{ color: 'var(--vp-text)' }}>{party.name}</h1>
                            <div className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                                Ranking #{party.ranking_position || '-'}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-glow-red" style={{ color: 'var(--vp-red)' }}>
                                {Number(party.party_full_score || 0).toFixed(1)}
                            </div>
                            <div className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>SCORE</div>
                        </div>
                    </div>
                </div>

                {/* Fórmula Presidencial (Presidente + VPs) */}
                {ticket.president && ticket.president.length > 0 && (
                    <div className="panel-glow mb-8">
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-5 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                            <span>🏛️ Fórmula Presidencial</span>
                        </h3>

                        {/* President Card */}
                        {ticket.president.map(candidate => {
                            const candidateVPs = vicePresidents[String(candidate.id)] || [];
                            return (
                                <div key={candidate.id} className="mb-6">
                                    <Link href={`/candidate/${candidate.id}`}>
                                        <div className="panel-glow-subtle flex items-center gap-4 transition-colors hover:bg-white/5 mb-4" style={{ border: `1px solid ${party.color}33`, background: `${party.color}08` }}>
                                            <img
                                                src={getAvatarUrl(candidate.name, 56, party.color)}
                                                alt={candidate.name}
                                                width={56}
                                                height={56}
                                                className="w-14 h-14 rounded-full shrink-0 object-cover"
                                                style={{ border: `3px solid ${party.color}`, boxShadow: `0 0 15px ${party.color}33` }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-bold truncate" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                                <div className="text-[11px] font-bold tracking-wider uppercase" style={{ color: party.color }}>
                                                    Presidente(a) de la República
                                                </div>
                                                <StarRating rating={Number(candidate.stars_rating)} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="score-badge">{Number(candidate.final_score).toFixed(1)}</span>
                                                <div className="text-[9px] mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                                                    IQ: {Number(candidate.intelligence_score).toFixed(0)}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Vice Presidents */}
                                    {candidateVPs.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4 pl-4" style={{ borderLeft: `2px solid ${party.color}33` }}>
                                            {candidateVPs.map(vp => (
                                                <div key={vp.id} className="panel-glow-subtle flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <img
                                                        src={getAvatarUrl(vp.name, 44, party.color)}
                                                        alt={vp.name}
                                                        width={44}
                                                        height={44}
                                                        className="w-11 h-11 rounded-full shrink-0 object-cover"
                                                        style={{ border: '2px solid var(--vp-border)' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{vp.name}</div>
                                                        <div className="text-[10px] font-medium" style={{ color: 'var(--vp-text-dim)' }}>
                                                            {vp.position_label}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Other Ticket Sections (Senators, Deputies, Andean) */}
                {Object.entries(ticket).filter(([position]) => position !== 'president').map(([position, candidates]) => (
                    candidates.length > 0 && (
                        <div key={position} className="panel-glow mb-8">
                            <h3 className="text-sm font-bold tracking-wider uppercase mb-5 flex items-center gap-2" style={{ color: 'var(--vp-text)' }}>
                                <span>{positionLabels[position] || position}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                    {candidates.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1.5rem]">
                                {candidates.map(candidate => (
                                    <Link href={`/candidate/${candidate.id}`} key={candidate.id}>
                                        <div className="panel-glow-subtle flex items-center gap-4 transition-colors hover:bg-white/5">
                                            <img
                                                src={getAvatarUrl(candidate.name, 48, party.color)}
                                                alt={candidate.name}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-full shrink-0 object-cover"
                                                style={{ border: '2px solid var(--vp-border)' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--vp-text)' }}>{candidate.name}</div>
                                                <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>{candidate.region}</div>
                                                <StarRating rating={Number(candidate.stars_rating)} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="score-badge">{Number(candidate.final_score).toFixed(1)}</span>
                                                <div className="text-[9px] mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                                                    IQ: {Number(candidate.intelligence_score).toFixed(0)}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </main>
        </div>
    );
}
