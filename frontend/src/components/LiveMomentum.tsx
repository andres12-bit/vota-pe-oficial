'use client';

import { Candidate } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
}

export default function LiveMomentum({ candidates }: Props) {
    const topCandidates = candidates.slice(0, 5);

    return (
        <div className="panel-glow p-4">
            <h3 className="text-xs font-bold tracking-[2px] uppercase mb-4 flex items-center gap-2">
                <span style={{ color: 'var(--vp-green)' }}>LIVE</span>
                <span style={{ color: 'var(--vp-text)' }}>MOMENTUM</span>
                <span className="w-2 h-2 rounded-full ml-auto animate-pulse" style={{ background: 'var(--vp-green)' }} />
            </h3>

            <div className="flex flex-col gap-3">
                {topCandidates.map((candidate, i) => (
                    <Link href={`/candidate/${candidate.id}`} key={candidate.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/5">
                            {/* Avatar */}
                            <img
                                src={getAvatarUrl(candidate.name, 40, candidate.party_color)}
                                alt={candidate.name}
                                width={40}
                                height={40}
                                className="candidate-avatar"
                                loading="lazy"
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate" style={{ color: 'var(--vp-text)' }}>
                                    {candidate.name.split(' ').slice(-2).join(' ')}
                                </div>
                                <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                    {candidate.party_abbreviation}
                                </div>
                                {/* Momentum Bar */}
                                <div className="mt-1 w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="momentum-bar" style={{ width: `${Math.min(100, candidate.momentum_score)}%` }} />
                                </div>
                            </div>

                            {/* Score */}
                            <div className="text-right shrink-0">
                                <div className="text-sm font-bold" style={{ color: 'var(--vp-red)' }}>
                                    {Number(candidate.momentum_score).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Tendencias Nacionales */}
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--vp-border)' }}>
                <h4 className="text-xs font-bold tracking-[2px] uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>
                    TENDENCIAS NACIONALES
                </h4>
                <div className="flex flex-col gap-2">
                    {topCandidates.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                            <img
                                src={getAvatarUrl(c.name, 24, c.party_color)}
                                alt={c.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full shrink-0"
                                style={{ border: '1px solid var(--vp-border)' }}
                                loading="lazy"
                            />
                            <div className="flex-1">
                                <div className="h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, c.final_score * 1.2)}%`, background: `linear-gradient(90deg, ${c.party_color}, var(--vp-red))` }} />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: 'var(--vp-text-dim)' }}>
                                {Number(c.final_score).toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
                {/* Mini chart placeholder */}
                <div className="mt-3 h-16 rounded-lg flex items-end gap-[2px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 rounded-t"
                            style={{
                                height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 25}%`,
                                background: `linear-gradient(to top, var(--vp-red), transparent)`,
                                opacity: 0.3 + (i / 24) * 0.7
                            }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
