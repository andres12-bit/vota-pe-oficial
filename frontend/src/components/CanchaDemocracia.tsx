'use client';

import { Candidate } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatars';
import PeruMapSVG from './PeruMapSVG';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
    onVote: (id: number, position: string) => void;
}

// Position layout on the football field — spread wider to avoid glow overlap
const POSITIONS = [
    { label: 'SENADORES', top: '18%', left: '20%' },
    { label: 'SENADORES', top: '18%', left: '80%' },
    { label: 'DIPUTADOS', top: '48%', left: '12%' },
    { label: 'PRESIDENTE', top: '48%', left: '50%' },
    { label: 'DIPUTADOS', top: '48%', left: '88%' },
    { label: 'PARL. ANDINO', top: '82%', left: '25%' },
    { label: 'PARL. ANDINO', top: '82%', left: '75%' },
];

export default function CanchaDemocracia({ candidates, onVote }: Props) {
    // Get top candidates for each position node
    const getNodeCandidate = (index: number): Candidate | null => {
        if (!candidates.length) return null;
        return candidates[index % candidates.length] || null;
    };

    return (
        <div className="panel-glow p-4">
            <h2 className="text-center text-sm font-bold tracking-[3px] uppercase mb-4" style={{ color: 'var(--vp-text-dim)' }}>
                CANCHA DE LA DEMOCRACIA
            </h2>

            {/* Field */}
            <div className="cancha-field relative" style={{ minHeight: '500px', aspectRatio: '4/5' }}>
                {/* Peru SVG map — behind nodes, above field */}
                <PeruMapSVG />

                {/* Goal areas */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[12%] border border-white/20 border-t-0 rounded-b-lg" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[12%] border border-white/20 border-b-0 rounded-t-lg" />

                {/* PERÚ HEAT MAP label */}
                <div className="absolute top-2 right-3 text-[10px] font-bold tracking-wider" style={{ color: 'var(--vp-text-dim)' }}>
                    PERÚ HEAT MAP
                </div>

                {/* Position Nodes */}
                {POSITIONS.map((pos, index) => {
                    const candidate = getNodeCandidate(index);
                    return (
                        <div
                            key={index}
                            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                            style={{ top: pos.top, left: pos.left, zIndex: 3 }}
                        >
                            {candidate ? (
                                <Link href={`/candidate/${candidate.id}`}>
                                    <div className="candidate-node pulse-glow">
                                        <img
                                            src={getAvatarUrl(candidate.name, 56, candidate.party_color)}
                                            alt={candidate.name}
                                            width={56}
                                            height={56}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                </Link>
                            ) : (
                                <div className="candidate-node">
                                    <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>?</span>
                                </div>
                            )}
                            <span className="text-[9px] font-bold tracking-wider text-center whitespace-nowrap" style={{ color: 'var(--vp-field-line)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                {pos.label}
                            </span>
                            {candidate && (
                                <span className="text-[8px] font-semibold text-center max-w-[80px] truncate" style={{ color: 'var(--vp-text)' }}>
                                    {candidate.name.split(' ').slice(-1)[0]}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Center circle label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ zIndex: 1 }}>
                    <div className="text-[8px] font-bold tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        VOTA.PE
                    </div>
                </div>
            </div>
        </div>
    );
}
