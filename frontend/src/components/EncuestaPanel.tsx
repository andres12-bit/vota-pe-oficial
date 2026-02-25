'use client';

import { useState, useEffect } from 'react';
import { EncuestaPoll, getEncuestas, voteEncuesta } from '@/lib/api';

// Generate a simple fingerprint for anti-duplicate voting
function getFingerprint(): string {
    if (typeof window === 'undefined') return 'server';
    const stored = localStorage.getItem('vp_encuesta_fp');
    if (stored) return stored;
    const fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('vp_encuesta_fp', fp);
    return fp;
}

// Color palette for poll options
const OPTION_COLORS = [
    'var(--vp-red)',
    'var(--vp-blue)',
    'var(--vp-green)',
    'var(--vp-gold)',
    '#e040fb',   // purple
    '#ff6d00',   // orange
    '#00bcd4',   // cyan
    '#8bc34a',   // light green
];

export default function EncuestaPanel() {
    const [polls, setPolls] = useState<EncuestaPoll[]>([]);
    const [loading, setLoading] = useState(true);
    const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());
    const [votingId, setVotingId] = useState<number | null>(null);

    // Load voted polls from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vp_voted_polls');
            if (stored) setVotedPolls(new Set(JSON.parse(stored)));
        }
    }, []);

    // Fetch all polls
    useEffect(() => {
        async function fetchPolls() {
            try {
                const data = await getEncuestas();
                setPolls(data);
            } catch (err) {
                console.error('Error loading encuestas:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPolls();
    }, []);

    const handleVote = async (pollId: number, optionIndex: number) => {
        if (votedPolls.has(pollId)) return;
        setVotingId(pollId);

        try {
            const result = await voteEncuesta(pollId, optionIndex, getFingerprint());

            if (result.success || result.already_voted) {
                // Update local state
                const newVoted = new Set(votedPolls);
                newVoted.add(pollId);
                setVotedPolls(newVoted);
                localStorage.setItem('vp_voted_polls', JSON.stringify([...newVoted]));

                // Update poll results
                if (result.vote_counts) {
                    setPolls(prev => prev.map(p =>
                        p.id === pollId
                            ? { ...p, vote_counts: result.vote_counts, total_votes: result.total_votes }
                            : p
                    ));
                }
            }
        } catch (err) {
            console.error('Vote error:', err);
        } finally {
            setVotingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-black tracking-wider uppercase text-glow-red"
                    style={{ color: 'var(--vp-red)' }}>
                    🗳️ Encuestas Ciudadanas
                </h2>
                <p className="text-sm mt-2" style={{ color: 'var(--vp-text-dim)' }}>
                    Tu opinión importa. Vota en las encuestas y mira los resultados en tiempo real.
                </p>
            </div>

            {/* Poll Cards */}
            {polls.map(poll => {
                const hasVoted = votedPolls.has(poll.id);
                const isVoting = votingId === poll.id;
                const totalVotes = Object.values(poll.vote_counts || {}).reduce((a, b) => a + b, 0) || 1;

                return (
                    <div key={poll.id} className="panel-glow" style={{ transition: 'all 0.3s ease' }}>
                        {/* Poll Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{poll.emoji}</span>
                                <div>
                                    <h3 className="text-base font-bold" style={{ color: 'var(--vp-text)' }}>
                                        {poll.question}
                                    </h3>
                                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                                        {poll.category}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <div className="text-xl font-black" style={{ color: 'var(--vp-text)' }}>
                                    {totalVotes.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold tracking-wider uppercase"
                                    style={{ color: 'var(--vp-text-dim)' }}>
                                    votos
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-3">
                            {poll.options.map((option, idx) => {
                                const count = poll.vote_counts?.[idx] || 0;
                                const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                                const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                                const isWinner = hasVoted && count === Math.max(...Object.values(poll.vote_counts || {}));

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !hasVoted && handleVote(poll.id, idx)}
                                        disabled={hasVoted || isVoting}
                                        className="relative w-full text-left rounded-xl overflow-hidden transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${hasVoted && isWinner ? color : 'rgba(255,255,255,0.08)'}`,
                                            cursor: hasVoted ? 'default' : 'pointer',
                                            padding: '0.85rem 1.25rem',
                                            opacity: isVoting ? 0.6 : 1,
                                        }}
                                        onMouseEnter={e => {
                                            if (!hasVoted) (e.currentTarget.style.background = 'rgba(255,255,255,0.07)');
                                        }}
                                        onMouseLeave={e => {
                                            if (!hasVoted) (e.currentTarget.style.background = 'rgba(255,255,255,0.03)');
                                        }}
                                    >
                                        {/* Progress bar background */}
                                        {hasVoted && (
                                            <div
                                                className="absolute inset-0 rounded-xl"
                                                style={{
                                                    width: `${percentage}%`,
                                                    background: `${color}15`,
                                                    transition: 'width 1s ease-out',
                                                }}
                                            />
                                        )}

                                        {/* Content */}
                                        <div className="relative flex items-center justify-between gap-3 z-[1]">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Color dot */}
                                                <div className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ background: color, boxShadow: isWinner ? `0 0 8px ${color}` : 'none' }} />
                                                <span className="text-sm font-semibold truncate"
                                                    style={{ color: isWinner ? color : 'var(--vp-text)' }}>
                                                    {option}
                                                </span>
                                            </div>

                                            {hasVoted && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-sm font-black"
                                                        style={{ color: isWinner ? color : 'var(--vp-text-dim)' }}>
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                    <span className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>
                                                        ({count.toLocaleString()})
                                                    </span>
                                                </div>
                                            )}

                                            {!hasVoted && (
                                                <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0"
                                                    style={{ background: `${color}20`, color }}>
                                                    VOTAR
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        {hasVoted && (
                            <div className="mt-4 pt-3 flex items-center gap-2"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-green-400 text-xs">✅</span>
                                <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                                    Ya votaste en esta encuesta — resultados actualizados en tiempo real
                                </span>
                            </div>
                        )}

                        {!hasVoted && (
                            <div className="mt-4 pt-3"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                                    👆 Selecciona una opción para ver los resultados
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
