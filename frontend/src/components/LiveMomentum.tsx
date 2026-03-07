'use client';

import { useState, useEffect } from 'react';
import { Candidate } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import Link from 'next/link';

interface Props {
    candidates: Candidate[];
}

type PositionFilter = 'all' | 'president' | 'senator' | 'deputy' | 'andean';

const FILTERS: { id: PositionFilter; label: string; emoji: string }[] = [
    { id: 'all', label: 'Todos', emoji: '🌐' },
    { id: 'president', label: 'Pres.', emoji: '🏛️' },
    { id: 'senator', label: 'Sen.', emoji: '🏢' },
    { id: 'deputy', label: 'Dip.', emoji: '👥' },
    { id: 'andean', label: 'P.And.', emoji: '🌎' },
];

const POS_LABEL: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senador',
    deputy: 'Diputado',
    andean: 'P. Andino',
};

const SCORE_COLORS = {
    hv: { color: '#6366f1', gradient: 'linear-gradient(90deg, #6366f1, #818cf8)' },
    plan: { color: '#3b82f6', gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    experiencia: { color: '#f59e0b', gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    integridad: { color: '#10b981', gradient: 'linear-gradient(90deg, #10b981, #34d399)' },
};

/** Horizontal score bar replacing the old ScoreRing */
function ScoreBar({ value, color, gradient, label }: { value: number; color: string; gradient: string; label: string }) {
    return (
        <div className="ranking-score-bar-item" title={`${label}: ${value.toFixed(1)}`}>
            <div className="ranking-score-bar-track">
                <div
                    className="ranking-score-bar-fill"
                    style={{ width: `${Math.min(100, value)}%`, background: gradient }}
                />
            </div>
            <span className="ranking-score-bar-label" style={{ color }}>{label} {Math.round(value)}</span>
        </div>
    );
}

export default function LiveMomentum({ candidates }: Props) {
    const [filter, setFilter] = useState<PositionFilter>('all');
    const [showAll, setShowAll] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setRefreshCount(c => c + 1), 5000);
        return () => clearInterval(timer);
    }, []);

    const filtered = filter === 'all' ? candidates : candidates.filter(c => c.position === filter);
    const sorted = [...filtered].sort((a, b) => Number(b.final_score) - Number(a.final_score));
    const displayed = showAll ? sorted.slice(0, 20) : sorted.slice(0, 5);
    const totalVotes = sorted.reduce((s, c) => s + Number(c.vote_count || 0), 0) || 1;
    const hero = sorted[0];
    const rest = displayed.slice(1);

    return (
        <div className="panel-glow module-card ranking-nacional-panel" style={{ overflow: 'hidden' }}>
            {/* ===== HEADER ===== */}
            <div className="ranking-header">
                <div className="flex items-center gap-2.5">
                    <div className="ranking-header-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    </div>
                    <div>
                        <h3 className="ranking-header-title">
                            <span style={{ color: 'var(--vp-red)' }}>RANKING</span> NACIONAL{' '}
                            <span className="ranking-live-badge">LIVE</span>
                        </h3>
                    </div>
                </div>
                <div className="ranking-header-meta">
                    <span className="ranking-refresh-indicator">Actualiza cada <strong>5s</strong></span>
                    <span className="ranking-user-count">● {Math.max(15, filtered.length)} ▸</span>
                </div>
            </div>

            {/* ===== FILTER TABS ===== */}
            <div className="ranking-filters">
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => { setFilter(f.id); setShowAll(false); }}
                        className={`ranking-filter-btn ${filter === f.id ? 'active' : ''}`}
                    >
                        {f.emoji} {f.label}
                    </button>
                ))}
            </div>

            {/* ===== HERO CARD — #1 CANDIDATE ===== */}
            {hero && (
                <Link href={`/candidate/${hero.id}`} className="ranking-hero-card">
                    <div className="ranking-hero-rank">#1</div>
                    <div className="ranking-hero-avatar-wrap">
                        <img
                            src={getCandidatePhoto(hero.photo, hero.name, 64, hero.party_color)}
                            onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(hero.name, 64, hero.party_color); }}
                            alt={hero.name}
                            className="ranking-hero-avatar"
                            style={{ borderColor: hero.party_color || 'var(--vp-red)' }}
                            loading="lazy"
                        />
                    </div>
                    <div className="ranking-hero-info">
                        <div className="ranking-hero-name">{hero.name.split(' ').slice(-2).join(' ')}</div>
                        <div className="ranking-hero-meta">
                            <span className="ranking-party-badge" style={{ background: `${hero.party_color}25`, color: hero.party_color || 'var(--vp-text-dim)' }}>
                                {hero.party_abbreviation}
                            </span>
                            <span>{POS_LABEL[hero.position]}</span>
                        </div>
                        <div className="ranking-hero-bars">
                            <ScoreBar value={Number(hero.hoja_score || 0)} {...SCORE_COLORS.hv} label="HV" />
                            <ScoreBar value={Number(hero.plan_score || 0)} {...SCORE_COLORS.plan} label="PA" />
                            <ScoreBar value={Number(hero.intelligence_score || 0)} {...SCORE_COLORS.experiencia} label="EXP" />
                            <ScoreBar value={Number(hero.integrity_score || 0)} {...SCORE_COLORS.integridad} label="INT" />
                        </div>
                    </div>
                    <div className="ranking-hero-score">
                        <div className="ranking-hero-score-value">{Number(hero.final_score).toFixed(1)}</div>
                        <div className="ranking-hero-score-label">SCORE</div>
                        <div className="ranking-hero-score-max">100</div>
                    </div>
                </Link>
            )}

            {/* ===== CANDIDATE ROWS 2-5 ===== */}
            <div className="ranking-list">
                {rest.map((c, i) => {
                    const rank = i + 2;
                    const hvScore = Number(c.hoja_score || 0);
                    const planScore = Number(c.plan_score || 0);
                    const experienceScore = Number(c.intelligence_score || 0);
                    const integrityScore = Number(c.integrity_score || 0);

                    return (
                        <Link href={`/candidate/${c.id}`} key={c.id} className="ranking-row">
                            <div className="ranking-row-rank">{rank}</div>
                            <div className="ranking-row-avatar-wrap">
                                <img
                                    src={getCandidatePhoto(c.photo, c.name, 44, c.party_color)}
                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(c.name, 44, c.party_color); }}
                                    alt={c.name}
                                    className="ranking-row-avatar"
                                    style={{ borderColor: c.party_color || 'var(--vp-border)' }}
                                    loading="lazy"
                                />
                            </div>
                            <div className="ranking-row-info">
                                <div className="ranking-row-name">{c.name.split(' ').slice(-2).join(' ')}</div>
                                <div className="ranking-row-meta">
                                    <span className="ranking-party-badge" style={{ background: `${c.party_color}20`, color: c.party_color || 'var(--vp-text-dim)' }}>
                                        {c.party_abbreviation}
                                    </span>
                                    <span>{POS_LABEL[c.position]}</span>
                                </div>
                                <div className="ranking-row-bars">
                                    <div className="ranking-row-bar-group">
                                        <div className="ranking-row-bar-track">
                                            <div className="ranking-row-bar-fill" style={{ width: `${hvScore}%`, background: SCORE_COLORS.hv.gradient }} />
                                        </div>
                                        <span className="ranking-row-bar-labels">
                                            <span style={{ color: SCORE_COLORS.hv.color }}>HV</span>
                                            <span style={{ color: SCORE_COLORS.plan.color }}>P{Math.round(planScore)}</span>
                                            <span style={{ color: SCORE_COLORS.experiencia.color }}>E{Math.round(experienceScore)}</span>
                                            <span style={{ color: SCORE_COLORS.integridad.color }}>INT</span>
                                        </span>
                                    </div>
                                    <div className="ranking-row-bar-track">
                                        <div className="ranking-row-bar-fill" style={{
                                            width: `${Number(c.final_score)}%`,
                                            background: 'linear-gradient(90deg, #10b981, #3b82f6, #6366f1)',
                                        }} />
                                    </div>
                                    <div className="ranking-row-bar-labels">
                                        <span style={{ color: 'var(--vp-text-dim)' }}>HV {Math.round(hvScore)}</span>
                                        <span style={{ color: 'var(--vp-text)' }}>{Math.round(Number(c.final_score))}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ranking-row-score">
                                <div className="ranking-row-score-value">{Number(c.final_score).toFixed(1)}</div>
                                <div className="ranking-row-score-label">SCORE</div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Show more / less */}
            {sorted.length > 5 && (
                <button onClick={() => setShowAll(!showAll)} className="ranking-show-more">
                    {showAll ? '▲ Ver menos' : `▼ Ver más (${sorted.length} total)`}
                </button>
            )}

            {/* ===== FOOTER ===== */}
            <div className="ranking-footer">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                    <span>{filtered.length} candidatos · {totalVotes.toLocaleString()} votos</span>
                </div>
                <span>Datos JNE + PulsoElectoral.pe ©</span>
            </div>
        </div>
    );
}
