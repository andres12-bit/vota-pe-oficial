'use client';

import React, { useMemo } from 'react';
import { Candidate } from '@/lib/api';
import { getCandidatePhoto, getAvatarUrl, getPhotoFallback } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
    position: string;
}

const POSITION_META: Record<string, { title: string; subtitle: string; gradient: string; accentDark: string; accent: string }> = {
    president: {
        title: 'Presidenciales',
        subtitle: '1 presidente + 2 vicepresidentes',
        gradient: 'linear-gradient(135deg, #c62828, #e53935)',
        accentDark: '#b71c1c',
        accent: '#c62828',
    },
    senator: {
        title: 'Senado',
        subtitle: '60 escaños nacionales',
        gradient: 'linear-gradient(135deg, #1565c0, #1e88e5)',
        accentDark: '#0d47a1',
        accent: '#1565c0',
    },
    deputy: {
        title: 'Diputados',
        subtitle: '130 escaños regionales',
        gradient: 'linear-gradient(135deg, #2e7d32, #43a047)',
        accentDark: '#1b5e20',
        accent: '#2e7d32',
    },
    andean: {
        title: 'Parl. Andino',
        subtitle: '5 representantes',
        gradient: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
        accentDark: '#4a148c',
        accent: '#6a1b9a',
    },
};

export default function PositionInsights({ candidates, position }: Props) {
    const meta = POSITION_META[position] || POSITION_META.president;

    const stats = useMemo(() => {
        if (!candidates.length) return null;

        const total = candidates.length;
        const totalVotes = candidates.reduce((s, c) => s + (c.vote_count || 0), 0);
        const avgScore = candidates.reduce((s, c) => s + (c.final_score || 0), 0) / total;
        const avgIntegrity = candidates.reduce((s, c) => s + (c.integrity_score || 0), 0) / total;
        const avgPlan = candidates.reduce((s, c) => s + (c.plan_score || 0), 0) / total;

        const top3 = [...candidates].sort((a, b) => (b.final_score || 0) - (a.final_score || 0)).slice(0, 3);

        // Party distribution
        const pMap = new Map<string, { abbr: string; name: string; color: string; count: number; avgScore: number; scores: number[] }>();
        candidates.forEach(c => {
            const k = c.party_abbreviation || 'IND';
            const e = pMap.get(k);
            if (e) { e.count++; e.scores.push(c.final_score || 0); e.avgScore = e.scores.reduce((a, b) => a + b, 0) / e.scores.length; }
            else pMap.set(k, { abbr: k, name: c.party_name || k, color: c.party_color || '#666', count: 1, avgScore: c.final_score || 0, scores: [c.final_score || 0] });
        });
        const topParties = [...pMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
        const maxP = Math.max(...topParties.map(p => p.count), 1);

        return { total, totalVotes, avgScore, avgIntegrity, avgPlan, top3, topParties, maxP };
    }, [candidates, position]);

    if (!stats) return null;

    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
        <div className="pi-container">
            {/* ── Gradient Header ── */}
            <div className="pi-header" style={{ background: meta.gradient }}>
                <div className="pi-header-glow" />
                <div className="pi-header-content">
                    <span className="pi-header-label">Candidatos</span>
                    <h2 className="pi-header-title">{meta.title}</h2>
                    <span className="pi-header-sub">{meta.subtitle}</span>
                </div>
                <div className="pi-header-count">
                    <span className="pi-header-count-num">{stats.total}</span>
                    <span className="pi-header-count-label">total</span>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="pi-stats">
                <div className="pi-stat">
                    <div className="pi-stat-ring" style={{ background: `conic-gradient(${meta.accent} ${(stats.avgScore / 100) * 360}deg, #f1f5f9 0deg)` }}>
                        <span>{stats.avgScore.toFixed(0)}</span>
                    </div>
                    <span className="pi-stat-lbl">Score</span>
                </div>
                <div className="pi-stat">
                    <div className="pi-stat-ring" style={{ background: `conic-gradient(${stats.avgIntegrity >= 70 ? '#2e7d32' : stats.avgIntegrity >= 50 ? '#e65100' : '#c62828'} ${(stats.avgIntegrity / 100) * 360}deg, #f1f5f9 0deg)` }}>
                        <span>{stats.avgIntegrity.toFixed(0)}</span>
                    </div>
                    <span className="pi-stat-lbl">Integridad</span>
                </div>
                <div className="pi-stat">
                    <div className="pi-stat-ring" style={{ background: `conic-gradient(${stats.avgPlan >= 60 ? '#2e7d32' : stats.avgPlan >= 30 ? '#e65100' : '#c62828'} ${(stats.avgPlan / 100) * 360}deg, #f1f5f9 0deg)` }}>
                        <span>{stats.avgPlan.toFixed(0)}</span>
                    </div>
                    <span className="pi-stat-lbl">Plan Gob.</span>
                </div>
                <div className="pi-stat">
                    <div className="pi-stat-ring pi-stat-ring-votes" style={{ background: `conic-gradient(${meta.accent} 270deg, #f1f5f9 0deg)` }}>
                        <span style={{ fontSize: 10 }}>{stats.totalVotes >= 1000 ? (stats.totalVotes / 1000).toFixed(0) + 'K' : stats.totalVotes}</span>
                    </div>
                    <span className="pi-stat-lbl">Votos</span>
                </div>
            </div>

            {/* ── Top 3 Podium ── */}
            <div className="pi-podium">
                <div className="pi-podium-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={meta.accent} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Top 3
                </div>
                {stats.top3.map((c, i) => (
                    <Link href={`/candidate/${c.id}`} key={c.id} className="pi-podium-card">
                        <div className="pi-podium-medal" style={{ background: medalColors[i], boxShadow: `0 0 10px ${medalColors[i]}66` }}>
                            {i + 1}
                        </div>
                        <img
                            src={getCandidatePhoto(c.photo, c.name, 48, c.party_color)}
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const retryCount = parseInt(img.dataset.retry || '0');
                                if (retryCount === 0) {
                                    const fb = getPhotoFallback(img.src);
                                    if (fb) { img.dataset.retry = '1'; img.src = fb; return; }
                                }
                                if (retryCount <= 1 && c.photo) {
                                    img.dataset.retry = '2';
                                    setTimeout(() => { img.src = c.photo + '?t=' + Date.now(); }, 500);
                                    return;
                                }
                                img.src = getAvatarUrl(c.name, 48, c.party_color);
                            }}
                            alt={c.name}
                            width={48}
                            height={48}
                            className="pi-podium-photo"
                            style={{ borderColor: c.party_color || meta.accent }}
                            referrerPolicy="no-referrer"
                        />
                        <div className="pi-podium-info">
                            <span className="pi-podium-name">{c.name}</span>
                            <span className="pi-podium-party" style={{ color: c.party_color }}>{c.party_abbreviation}</span>
                        </div>
                        <span className="pi-podium-score" style={{ color: meta.accentDark }}>{Number(c.final_score).toFixed(1)}</span>
                    </Link>
                ))}
            </div>

            {/* ── Partidos ── */}
            <div className="pi-parties">
                <div className="pi-podium-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={meta.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Partidos
                </div>
                <span className="pi-parties-subtitle">Distribución por partido político</span>
                {stats.topParties.map(p => (
                    <div key={p.abbr} className="pi-party-row">
                        <span className="pi-party-dot" style={{ background: p.color }} />
                        <span className="pi-party-abbr">{p.abbr}</span>
                        <div className="pi-party-bar-wrap">
                            <div className="pi-party-bar" style={{ width: `${(p.count / stats.maxP) * 100}%`, background: p.color }} />
                        </div>
                        <span className="pi-party-count">{p.count}</span>
                    </div>
                ))}
            </div>

            {/* ── Live Pulse ── */}
            <div className="pi-pulse">
                <div className="pi-pulse-dot" style={{ background: meta.accent }} />
                <span>Datos actualizados en vivo</span>
            </div>
        </div>
    );
}
