'use client';

import { useState, useEffect, useMemo } from 'react';
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
    '#c62828',   // red
    '#1565c0',   // blue
    '#2e7d32',   // green
    '#ca8a04',   // gold
    '#7c3aed',   // purple
    '#ff6d00',   // orange
    '#0891b2',   // cyan
    '#16a34a',   // light green
];

export default function EncuestaPanel() {
    const [polls, setPolls] = useState<EncuestaPoll[]>([]);
    const [loading, setLoading] = useState(true);
    const [votedOptions, setVotedOptions] = useState<Record<number, number>>({});
    const [votingId, setVotingId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vp_voted_options');
            if (stored) {
                try { setVotedOptions(JSON.parse(stored)); } catch { /* ignore */ }
            }
        }
    }, []);

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
        if (votedOptions[pollId] === optionIndex) return;
        setVotingId(pollId);
        try {
            const result = await voteEncuesta(pollId, optionIndex, getFingerprint());
            if (result.success) {
                const updated = { ...votedOptions, [pollId]: optionIndex };
                setVotedOptions(updated);
                localStorage.setItem('vp_voted_options', JSON.stringify(updated));
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

    // Analytics
    const analytics = useMemo(() => {
        const totalVotes = polls.reduce((s, p) => {
            const votes = Object.values(p.vote_counts || {}).reduce((a, b) => a + b, 0);
            return s + votes;
        }, 0);
        const totalOptions = polls.reduce((s, p) => s + (p.options?.length || 0), 0);

        // Category counts
        const categories: Record<string, number> = {};
        polls.forEach(p => {
            const cat = (p.category || 'General').toUpperCase();
            categories[cat] = (categories[cat] || 0) + 1;
        });

        // My participation
        const myParticipation = Object.keys(votedOptions).length;
        const participationPct = polls.length > 0 ? (myParticipation / polls.length) * 100 : 0;

        // Most voted poll
        let maxPollVotes = 0;
        let mostVotedPoll: EncuestaPoll | null = null as EncuestaPoll | null;
        polls.forEach(p => {
            const v = Object.values(p.vote_counts || {}).reduce((a, b) => a + b, 0);
            if (v > maxPollVotes) { maxPollVotes = v; mostVotedPoll = p; }
        });

        return { totalVotes, totalOptions, categories, myParticipation, participationPct, maxPollVotes, mostVotedPoll };
    }, [polls, votedOptions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <div className="enc-page">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                    🗳️ <span style={{ color: 'var(--vp-red)' }}>ENCUESTAS</span> CIUDADANAS
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                    Tu opinión importa. Vota y cambia tu voto cuando quieras — solo cuenta 1 voto por persona.
                </p>
            </div>

            {/* ═══════════ ANALYTICS DASHBOARD ═══════════ */}
            <div className="enc-dashboard">
                {/* KPI Row */}
                <div className="enc-kpi-row">
                    <div className="enc-kpi">
                        <span className="enc-kpi-icon">📊</span>
                        <span className="enc-kpi-val" style={{ color: 'var(--vp-red)' }}>{polls.length}</span>
                        <span className="enc-kpi-lbl">Encuestas Activas</span>
                    </div>
                    <div className="enc-kpi">
                        <span className="enc-kpi-icon">🗳️</span>
                        <span className="enc-kpi-val" style={{ color: '#2563eb' }}>{analytics.totalVotes.toLocaleString()}</span>
                        <span className="enc-kpi-lbl">Votos Totales</span>
                    </div>
                    <div className="enc-kpi">
                        <span className="enc-kpi-icon">📋</span>
                        <span className="enc-kpi-val" style={{ color: '#16a34a' }}>{analytics.totalOptions}</span>
                        <span className="enc-kpi-lbl">Opciones</span>
                    </div>
                    <div className="enc-kpi">
                        <span className="enc-kpi-icon">👤</span>
                        <span className="enc-kpi-val" style={{ color: '#7c3aed' }}>{analytics.myParticipation}/{polls.length}</span>
                        <span className="enc-kpi-lbl">Tu Participación</span>
                    </div>
                </div>

                {/* Two columns: Participation Gauge + Category Breakdown */}
                <div className="enc-dash-cols">
                    {/* Participation */}
                    <div className="enc-dash-card">
                        <h3 className="enc-dash-title">📈 Tu Nivel de Participación</h3>
                        <div className="enc-gauge-wrap">
                            <div className="enc-gauge-track">
                                <div className="enc-gauge-fill" style={{ width: `${analytics.participationPct}%`, background: analytics.participationPct >= 80 ? '#16a34a' : analytics.participationPct >= 50 ? '#ca8a04' : '#dc2626' }} />
                            </div>
                            <div className="enc-gauge-labels">
                                <span>{analytics.participationPct.toFixed(0)}% completado</span>
                                <span>{analytics.myParticipation} de {polls.length} encuestas</span>
                            </div>
                        </div>
                        {analytics.mostVotedPoll && (
                            <div className="enc-most-voted">
                                <span className="enc-mv-badge">🔥</span>
                                <div className="enc-mv-info">
                                    <span className="enc-mv-label">Encuesta más votada</span>
                                    <span className="enc-mv-name">{analytics.mostVotedPoll.question}</span>
                                    <span className="enc-mv-count">{analytics.maxPollVotes.toLocaleString()} votos</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Categories + Header Stats */}
                    <div className="enc-dash-card">
                        <h3 className="enc-dash-title">🏷️ Categorías</h3>
                        <div className="enc-cat-list">
                            {Object.entries(analytics.categories).map(([cat, count], i) => {
                                const catColors = ['#c62828', '#1565c0', '#2e7d32', '#7c3aed', '#ca8a04', '#0891b2'];
                                const color = catColors[i % catColors.length];
                                return (
                                    <div key={cat} className="enc-cat-row">
                                        <span className="enc-cat-dot" style={{ background: color }} />
                                        <span className="enc-cat-name">{cat}</span>
                                        <div className="enc-cat-bar-wrap">
                                            <div className="enc-cat-bar" style={{ width: `${(count / polls.length) * 100}%`, background: color }} />
                                        </div>
                                        <span className="enc-cat-count" style={{ color }}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="enc-live-indicator">
                            <span className="enc-live-dot" />
                            <span>Actualización en tiempo real</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ POLL CARDS ═══════════ */}
            <div className="enc-polls-grid">
                {polls.map(poll => {
                    const hasVoted = votedOptions[poll.id] !== undefined;
                    const myVote = votedOptions[poll.id];
                    const isVoting = votingId === poll.id;
                    const totalVotes = Object.values(poll.vote_counts || {}).reduce((a, b) => a + b, 0) || 1;

                    // Find leader
                    const counts = poll.vote_counts || {};
                    const maxCount = Math.max(...Object.values(counts), 0);
                    const leaderIdx = Object.entries(counts).find(([, v]) => v === maxCount)?.[0];
                    const leaderName = leaderIdx !== undefined ? poll.options[Number(leaderIdx)] : null;
                    const leaderPct = totalVotes > 0 ? (maxCount / totalVotes) * 100 : 0;

                    // Competition: margin between 1st and 2nd
                    const sortedCounts = Object.values(counts).sort((a, b) => b - a);
                    const margin = sortedCounts.length >= 2 ? (sortedCounts[0] - sortedCounts[1]) / totalVotes * 100 : 100;
                    const competitiveness = margin < 5 ? 'Muy reñida' : margin < 15 ? 'Competitiva' : 'Dominante';
                    const compColor = margin < 5 ? '#dc2626' : margin < 15 ? '#ca8a04' : '#16a34a';

                    return (
                        <div key={poll.id} className="enc-poll-card">
                            {/* Card Header */}
                            <div className="enc-poll-header">
                                <div className="enc-poll-meta">
                                    <span className="enc-poll-emoji">{poll.emoji}</span>
                                    <div>
                                        <h3 className="enc-poll-question">{poll.question}</h3>
                                        <div className="enc-poll-tags">
                                            <span className="enc-poll-cat-tag">{poll.category}</span>
                                            <span className="enc-poll-comp-tag" style={{ background: `${compColor}15`, color: compColor }}>
                                                {competitiveness}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="enc-poll-votes-col">
                                    <span className="enc-poll-votes-num">{totalVotes.toLocaleString()}</span>
                                    <span className="enc-poll-votes-lbl">VOTOS</span>
                                </div>
                            </div>

                            {/* Leader Indicator */}
                            {hasVoted && leaderName && (
                                <div className="enc-leader-strip">
                                    <span className="enc-leader-icon">👑</span>
                                    <span className="enc-leader-name">{leaderName}</span>
                                    <span className="enc-leader-pct" style={{ color: OPTION_COLORS[Number(leaderIdx) % OPTION_COLORS.length] }}>
                                        {leaderPct.toFixed(1)}%
                                    </span>
                                    <span className="enc-leader-margin">margen: {margin.toFixed(1)}%</span>
                                </div>
                            )}

                            {/* Options */}
                            <div className="enc-poll-options">
                                {poll.options.map((option, idx) => {
                                    const count = poll.vote_counts?.[idx] || 0;
                                    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                                    const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                                    const isMyVote = myVote === idx;
                                    const isLeader = hasVoted && count === maxCount && count > 0;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleVote(poll.id, idx)}
                                            disabled={isVoting || isMyVote}
                                            className="enc-option-btn"
                                            style={{
                                                borderColor: isMyVote ? color : isLeader ? `${color}66` : 'rgba(0,0,0,0.06)',
                                                background: isMyVote ? `${color}08` : '#fff',
                                                opacity: isVoting ? 0.6 : 1,
                                            }}
                                        >
                                            {/* Bar fill */}
                                            {hasVoted && (
                                                <div className="enc-option-fill" style={{ width: `${percentage}%`, background: `${color}12` }} />
                                            )}

                                            {/* Content */}
                                            <div className="enc-option-content">
                                                <div className="enc-option-left">
                                                    {isMyVote ? (
                                                        <span className="enc-option-check" style={{ background: color }}>✓</span>
                                                    ) : (
                                                        <span className="enc-option-dot" style={{ background: color }} />
                                                    )}
                                                    <span className="enc-option-name" style={{ color: isMyVote || isLeader ? color : 'var(--vp-text)' }}>
                                                        {option}
                                                    </span>
                                                </div>

                                                {hasVoted ? (
                                                    <div className="enc-option-stats">
                                                        <span className="enc-option-pct" style={{ color: isLeader ? color : 'var(--vp-text-dim)' }}>
                                                            {percentage.toFixed(1)}%
                                                        </span>
                                                        <span className="enc-option-count">({count.toLocaleString()})</span>
                                                    </div>
                                                ) : (
                                                    <span className="enc-option-vote-tag" style={{ background: `${color}15`, color }}>
                                                        VOTAR
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="enc-poll-footer">
                                {hasVoted ? (
                                    <>
                                        <div className="enc-poll-foot-left">
                                            <span className="enc-foot-check">✅</span>
                                            <span>Voto registrado — puedes cambiar tu preferencia</span>
                                        </div>
                                        <span className="enc-foot-badge">1 voto por IP</span>
                                    </>
                                ) : (
                                    <span className="enc-foot-hint">👆 Selecciona una opción para ver los resultados en vivo</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
