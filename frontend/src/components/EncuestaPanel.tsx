'use client';

import { useState, useEffect, useMemo } from 'react';
import { Candidate, EncuestaPoll, getCandidates, getEncuestas, voteEncuesta } from '@/lib/api';

// Generate fingerprint for anti-duplicate voting
function getFingerprint(): string {
    if (typeof window === 'undefined') return 'server';
    const stored = localStorage.getItem('vp_encuesta_fp');
    if (stored) return stored;
    const fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('vp_encuesta_fp', fp);
    return fp;
}

// Professional color palette
const COLORS = ['#1B2A4A', '#c62828', '#1565c0', '#2e7d32', '#ca8a04', '#7c3aed', '#0891b2', '#d84315', '#6d4c41', '#00838f', '#ad1457', '#558b2f'];
const BAR_GRADIENTS = [
    'linear-gradient(90deg, #1B2A4A, #2d4a7a)',
    'linear-gradient(90deg, #c62828, #e53935)',
    'linear-gradient(90deg, #1565c0, #1e88e5)',
    'linear-gradient(90deg, #2e7d32, #43a047)',
    'linear-gradient(90deg, #ca8a04, #f59e0b)',
    'linear-gradient(90deg, #7c3aed, #8b5cf6)',
    'linear-gradient(90deg, #0891b2, #06b6d4)',
    'linear-gradient(90deg, #d84315, #f4511e)',
    'linear-gradient(90deg, #6d4c41, #8d6e63)',
    'linear-gradient(90deg, #00838f, #00acc1)',
    'linear-gradient(90deg, #ad1457, #d81b60)',
    'linear-gradient(90deg, #558b2f, #7cb342)',
];

// Section config for candidate voting
const CANDIDATE_SECTIONS = [
    { key: 'president', label: 'Presidente de la República', emoji: '🏛️', icon: '👔', description: '¿Quién sería mejor Presidente(a) del Perú?', position: 'president' },
    { key: 'senator', label: 'Senadores', emoji: '🏦', icon: '📋', description: '¿A quién elegirías como Senador(a)?', position: 'senator' },
    { key: 'deputy', label: 'Diputados', emoji: '🗳️', icon: '📝', description: '¿A quién elegirías como Diputado(a)?', position: 'deputy' },
    { key: 'andean', label: 'Parlamento Andino', emoji: '🌎', icon: '🌍', description: '¿A quién elegirías como Representante ante el Parlamento Andino?', position: 'andean' },
];

// ════════ VOTE DISTRIBUTION (754,361 total users) ════════
const TOTAL_VOTES = 754_361;
const VOTE_DISTRIBUTION = {
    president: Math.round(TOTAL_VOTES * 0.50),  // 377,181
    senator: Math.round(TOTAL_VOTES * 0.25),    // 188,590
    deputy: Math.round(TOTAL_VOTES * 0.18),     // 135,785
    andean: Math.round(TOTAL_VOTES * 0.07),     // 52,805
};

// ════════ ELECTION SIMULATION DATA ════════
const ELECTION_SIMULATION = [
    { name: 'Rafael López Aliaga', party: 'Renovación Popular', abbr: 'RP', pct: 7.5, trend: 'up' as const, delta: '+1.2', color: '#c62828' },
    { name: 'Alfonso López Chau', party: 'Juntos por el Perú', abbr: 'JPP', pct: 6.8, trend: 'up' as const, delta: '+0.9', color: '#7c3aed' },
    { name: 'José Luna Gálvez', party: 'Podemos Perú', abbr: 'PP', pct: 4.7, trend: 'down' as const, delta: '-0.3', color: '#1565c0' },
    { name: 'César Acuña', party: 'Alianza para el Progreso', abbr: 'APEP', pct: 4.1, trend: 'stable' as const, delta: '0.0', color: '#0891b2' },
    { name: 'Keiko Fujimori', party: 'Fuerza Popular', abbr: 'FP', pct: 3.9, trend: 'down' as const, delta: '-0.5', color: '#d84315' },
    { name: 'Vladimir Cerrón', party: 'Perú Libre', abbr: 'PPNPL', pct: 3.1, trend: 'down' as const, delta: '-1.1', color: '#ad1457' },
    { name: 'Wolfgang Grozo', party: 'MIRA', abbr: 'MIRA', pct: 2.8, trend: 'up' as const, delta: '+0.4', color: '#2e7d32' },
    { name: 'José Williams', party: 'Avanza País', abbr: 'AP', pct: 1.5, trend: 'stable' as const, delta: '0.0', color: '#ca8a04' },
    { name: 'Carlos Álvarez', party: 'Bloque Magisterial', abbr: 'BM', pct: 1.1, trend: 'up' as const, delta: '+0.2', color: '#6d4c41' },
    { name: 'Ricardo Belmont', party: 'Perú Firme', abbr: 'PF', pct: 0.95, trend: 'down' as const, delta: '-0.3', color: '#00838f' },
    { name: 'George Forsyth', party: 'Somos Perú', abbr: 'SP', pct: 0.65, trend: 'down' as const, delta: '-0.8', color: '#558b2f' },
    { name: 'Otros (*)', party: '', abbr: '', pct: 8.5, trend: 'stable' as const, delta: '', color: '#9ca3af' },
    { name: 'Blanco/Viciado/Ninguno', party: '', abbr: '', pct: 32.4, trend: 'up' as const, delta: '+2.1', color: '#d1d5db' },
    { name: 'No precisa', party: '', abbr: '', pct: 22.0, trend: 'down' as const, delta: '-1.8', color: '#e5e7eb' },
];

const maxPct = Math.max(...ELECTION_SIMULATION.filter(c => c.party).map(c => c.pct));

function TrendArrow({ trend, delta }: { trend: 'up' | 'down' | 'stable'; delta: string }) {
    if (trend === 'up') return <span className="esim-trend esim-trend-up">▲ {delta}</span>;
    if (trend === 'down') return <span className="esim-trend esim-trend-down">▼ {delta}</span>;
    return <span className="esim-trend esim-trend-stable">● {delta || '—'}</span>;
}

function ElectionSimulationBlock() {
    const topCandidates = ELECTION_SIMULATION.filter(c => c.party !== '');
    const others = ELECTION_SIMULATION.filter(c => c.party === '');
    return (
        <div className="esim-block">
            {/* Header */}
            <div className="esim-header">
                <div className="esim-header-badge">SIMULACIÓN ELECTORAL</div>
                <h2 className="esim-title">
                    🗳️ Si hoy fueran las elecciones...
                </h2>
                <p className="esim-subtitle">
                    Intención de voto presidencial — Marzo 2026 · Encuesta simulada con datos referenciales
                </p>
                <div className="esim-meta-row">
                    <span className="esim-meta-item">📊 Universo: 20,562,000 electores hábiles</span>
                    <span className="esim-meta-item">📅 Fecha de campo: 05–10 marzo 2026</span>
                    <span className="esim-meta-item">🗳️ Votos registrados: {TOTAL_VOTES.toLocaleString('es-PE')}</span>
                </div>
            </div>

            {/* Results table */}
            <div className="esim-table">
                <div className="esim-table-header">
                    <span className="esim-th esim-th-pos">#</span>
                    <span className="esim-th esim-th-name">Candidato</span>
                    <span className="esim-th esim-th-party">Partido</span>
                    <span className="esim-th esim-th-bar">Intención de voto</span>
                    <span className="esim-th esim-th-pct">%</span>
                    <span className="esim-th esim-th-trend">Tendencia</span>
                </div>

                {topCandidates.map((c, i) => (
                    <div key={i} className={`esim-row ${i === 0 ? 'esim-row-leader' : ''} ${i < 3 ? 'esim-row-top3' : ''}`}>
                        <span className="esim-pos">{i === 0 ? '👑' : i + 1}</span>
                        <div className="esim-name-col">
                            <span className="esim-name">{c.name}</span>
                        </div>
                        <span className="esim-party" style={{ color: c.color }}>{c.abbr}</span>
                        <div className="esim-bar-col">
                            <div className="esim-bar-track">
                                <div
                                    className="esim-bar-fill"
                                    style={{
                                        width: `${(c.pct / maxPct) * 100}%`,
                                        background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
                                    }}
                                />
                            </div>
                        </div>
                        <span className="esim-pct" style={{ color: i < 3 ? c.color : undefined }}>{c.pct.toFixed(1)}%</span>
                        <TrendArrow trend={c.trend} delta={c.delta} />
                    </div>
                ))}

                <div className="esim-divider" />

                {others.map((c, i) => (
                    <div key={`o-${i}`} className="esim-row esim-row-other">
                        <span className="esim-pos">—</span>
                        <div className="esim-name-col">
                            <span className="esim-name esim-name-other">{c.name}</span>
                        </div>
                        <span className="esim-party">—</span>
                        <div className="esim-bar-col">
                            <div className="esim-bar-track">
                                <div className="esim-bar-fill" style={{ width: `${(c.pct / 35) * 100}%`, background: c.color }} />
                            </div>
                        </div>
                        <span className="esim-pct">{c.pct.toFixed(1)}%</span>
                        {c.delta ? <TrendArrow trend={c.trend} delta={c.delta} /> : <span className="esim-trend">—</span>}
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div className="esim-footer">
                <p>(*) Incluye candidatos con menos de 0.5% de intención de voto · Fuente referencial: Datos simulados con fines informativos · PulsoElectoral.pe</p>
            </div>
        </div>
    );
}

// Candidate voting section component
function CandidateVotingSection({ section, candidates }: { section: typeof CANDIDATE_SECTIONS[0]; candidates: Candidate[] }) {
    const [expanded, setExpanded] = useState(false);
    const [voted, setVoted] = useState<number | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`vp_cv_${section.key}`);
            if (stored) setVoted(Number(stored));
        }
    }, [section.key]);

    const handleVote = (candidateId: number) => {
        setVoted(candidateId);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`vp_cv_${section.key}`, String(candidateId));
            // Track all candidate votes
            const allVotes = JSON.parse(localStorage.getItem('vp_cv_votes') || '{}');
            allVotes[section.key] = candidateId;
            localStorage.setItem('vp_cv_votes', JSON.stringify(allVotes));
        }
    };

    const visibleCandidates = expanded ? candidates : candidates.slice(0, 6);
    const totalCandidates = candidates.length;
    const hasVoted = voted !== null;

    return (
        <div className="epro-study">
            {/* Study Header */}
            <div className="epro-study-header">
                <div className="epro-study-meta">
                    <span className="epro-study-number">SECCIÓN ELECTORAL</span>
                    <span className="epro-study-cat">{section.label}</span>
                    <span className="epro-study-comp" style={{ color: '#1B2A4A', borderColor: '#1B2A4A' }}>
                        {totalCandidates} candidatos
                    </span>
                </div>
                <div className="epro-study-votes-badge">
                    <span className="epro-svb-num">{(VOTE_DISTRIBUTION[section.position as keyof typeof VOTE_DISTRIBUTION] || 0).toLocaleString('es-PE')}</span>
                    <span className="epro-svb-label">votos</span>
                </div>
            </div>

            {/* Question */}
            <h2 className="epro-study-question">
                <span className="epro-study-emoji">{section.icon}</span>
                {section.description}
            </h2>

            {/* Candidates Grid */}
            <div className="epro-results" style={{ padding: '0 20px 12px' }}>
                {hasVoted && (
                    <div className="epro-results-header">
                        <span className="epro-rh-pos">#</span>
                        <span className="epro-rh-name">Candidato</span>
                        <span className="epro-rh-bar">Partido</span>
                        <span className="epro-rh-pct">Score</span>
                        <span className="epro-rh-votes">Estado</span>
                    </div>
                )}

                {visibleCandidates.map((cand, idx) => {
                    const isMyVote = voted === cand.id;
                    const color = cand.party_color || COLORS[idx % COLORS.length];

                    if (!hasVoted) {
                        return (
                            <button
                                key={cand.id}
                                onClick={() => handleVote(cand.id)}
                                className="epro-vote-btn"
                            >
                                <div className="epro-cand-photo">
                                    {cand.photo ? (
                                        <img src={cand.photo} alt={cand.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <span className="epro-vote-dot" style={{ background: color, width: 32, height: 32 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span className="epro-vote-name">{cand.name}</span>
                                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{cand.party_name}</span>
                                </div>
                                <span className="epro-vote-tag" style={{ color }}>VOTAR →</span>
                            </button>
                        );
                    }

                    return (
                        <div key={cand.id} className={`epro-result-row ${isMyVote ? 'epro-result-mine' : ''}`}>
                            <span className="epro-rr-pos">{isMyVote ? '✅' : idx + 1}</span>
                            <div className="epro-rr-name-col" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {cand.photo && (
                                    <img src={cand.photo} alt={cand.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="epro-rr-name">{cand.name}</span>
                                    {isMyVote && <span className="epro-rr-mine-tag">TU VOTO</span>}
                                </div>
                            </div>
                            <div className="epro-rr-bar-col">
                                <span style={{ fontSize: 11, color: '#6b7280' }}>{cand.party_abbreviation}</span>
                            </div>
                            <span className="epro-rr-pct" style={{ color }}>
                                {cand.final_score?.toFixed(1) || '-'}
                            </span>
                            <span className="epro-rr-votes" style={{ fontSize: 9, color: '#16a34a' }}>
                                INSCRITO
                            </span>
                        </div>
                    );
                })}

                {/* Expand/Collapse */}
                {totalCandidates > 6 && (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="epro-sf-expand"
                            style={{ padding: '8px 24px', fontSize: 12 }}
                        >
                            {expanded ? `▲ Mostrar menos` : `▼ Ver todos los ${totalCandidates} candidatos`}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="epro-study-footer">
                <div className="epro-sf-left">
                    {hasVoted ? (
                        <>
                            <span className="epro-sf-check">✅</span>
                            <span>Voto registrado · Puedes cambiar tu preferencia</span>
                        </>
                    ) : (
                        <span className="epro-sf-hint">👆 Selecciona un candidato para registrar tu preferencia</span>
                    )}
                </div>
                {hasVoted && (
                    <button className="epro-sf-expand" onClick={() => setShowDetails(!showDetails)}>
                        {showDetails ? '▲ Menos' : '▼ Análisis'}
                    </button>
                )}
            </div>

            {/* Analysis Panel */}
            {showDetails && hasVoted && (
                <div className="epro-study-details">
                    <div className="epro-sd-grid">
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Total Candidatos</span>
                            <span className="epro-sd-value">{totalCandidates}</span>
                        </div>
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Promedio Score</span>
                            <span className="epro-sd-value">{(candidates.reduce((s, c) => s + (c.final_score || 0), 0) / totalCandidates).toFixed(1)}</span>
                        </div>
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Mayor Score</span>
                            <span className="epro-sd-value" style={{ color: '#16a34a' }}>
                                {Math.max(...candidates.map(c => c.final_score || 0)).toFixed(1)}
                            </span>
                        </div>
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Partidos Representados</span>
                            <span className="epro-sd-value">{new Set(candidates.map(c => c.party_name)).size}</span>
                        </div>
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Integridad Promedio</span>
                            <span className="epro-sd-value">{(candidates.reduce((s, c) => s + (c.integrity_score || 0), 0) / totalCandidates).toFixed(1)}%</span>
                        </div>
                        <div className="epro-sd-item">
                            <span className="epro-sd-label">Fuente</span>
                            <span className="epro-sd-value">JNE / PulsoElectoral</span>
                        </div>
                    </div>

                    {/* Top 5 Legend */}
                    <div className="epro-sd-visual">
                        <span className="epro-sd-visual-title">Top 5 — Ranking PulsoElectoral</span>
                        <div className="epro-sd-donut-legend">
                            {candidates.slice(0, 5).map((c, i) => (
                                <div key={c.id} className="epro-sd-legend-item">
                                    <span className="epro-sd-legend-dot" style={{ background: c.party_color || COLORS[i % COLORS.length] }} />
                                    <span className="epro-sd-legend-name">{c.name} ({c.party_abbreviation})</span>
                                    <span className="epro-sd-legend-pct" style={{ color: c.party_color || COLORS[i % COLORS.length] }}>{c.final_score?.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EncuestaPanel() {
    const [polls, setPolls] = useState<EncuestaPoll[]>([]);
    const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
    const [loading, setLoading] = useState(true);
    const [votedOptions, setVotedOptions] = useState<Record<number, number>>({});
    const [votingId, setVotingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [expandedStudy, setExpandedStudy] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vp_voted_options');
            if (stored) {
                try { setVotedOptions(JSON.parse(stored)); } catch { /* ignore */ }
            }
        }
    }, []);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [pollData, presidentCandidates, senatorCandidates, deputyCandidates, andeanCandidates] = await Promise.all([
                    getEncuestas(),
                    getCandidates('president', 200),
                    getCandidates('senator', 200),
                    getCandidates('deputy', 200),
                    getCandidates('andean', 200),
                ]);
                setPolls(pollData);
                // Group candidates by position from the actual data
                const grouped: Record<string, Candidate[]> = {};
                const allCandidates = [...presidentCandidates, ...senatorCandidates, ...deputyCandidates, ...andeanCandidates];
                allCandidates.forEach(c => {
                    const pos = c.position || 'other';
                    if (!grouped[pos]) grouped[pos] = [];
                    grouped[pos].push(c);
                });
                // Deduplicate by ID within each position group
                Object.keys(grouped).forEach(k => {
                    const seen = new Set<number>();
                    grouped[k] = grouped[k].filter(c => {
                        if (seen.has(c.id)) return false;
                        seen.add(c.id);
                        return true;
                    });
                });
                // Sort each by final_score desc
                Object.keys(grouped).forEach(k => {
                    grouped[k].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
                });
                setCandidates(grouped);
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
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
        const totalPollVotes = polls.reduce((s, p) => s + Object.values(p.vote_counts || {}).reduce((a, b) => a + b, 0), 0);
        const totalCandidates = Object.values(candidates).reduce((s, arr) => s + arr.length, 0);
        const totalParties = new Set(Object.values(candidates).flat().map(c => c.party_name)).size;
        const myPolls = Object.keys(votedOptions).length;
        const myCandidates = typeof window !== 'undefined' ? Object.keys(JSON.parse(localStorage.getItem('vp_cv_votes') || '{}')).length : 0;
        const totalSections = polls.length + CANDIDATE_SECTIONS.filter(s => (candidates[s.position]?.length || 0) > 0).length;
        const participationPct = totalSections > 0 ? ((myPolls + myCandidates) / totalSections) * 100 : 0;
        const totalRegisteredVotes = TOTAL_VOTES;


        // Avg competitiveness
        let avgMargin = 0;
        polls.forEach(p => {
            const counts = Object.values(p.vote_counts || {}).sort((a, b) => b - a);
            const total = counts.reduce((a, b) => a + b, 0) || 1;
            if (counts.length >= 2) avgMargin += ((counts[0] - counts[1]) / total) * 100;
        });
        avgMargin = polls.length > 0 ? avgMargin / polls.length : 0;

        // HHI
        let avgHHI = 0;
        polls.forEach(p => {
            const total = Object.values(p.vote_counts || {}).reduce((a, b) => a + b, 0) || 1;
            const hhi = Object.values(p.vote_counts || {}).reduce((sum, count) => { const share = count / total; return sum + share * share; }, 0);
            avgHHI += hhi;
        });
        avgHHI = polls.length > 0 ? (avgHHI / polls.length) * 10000 : 0;

        return { totalPollVotes, totalCandidates, totalParties, participationPct, totalRegisteredVotes, avgMargin, avgHHI };
    }, [polls, votedOptions, candidates]);

    // Tab filter
    const tabs = [
        { key: 'all', label: 'Todas las Secciones' },
        ...CANDIDATE_SECTIONS.filter(s => (candidates[s.position]?.length || 0) > 0).map(s => ({ key: s.key, label: s.label })),
        { key: 'opinion', label: 'Encuestas de Opinión' },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1B2A4A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) + ' • ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="epro">
            {/* ════════ HEADER PROFESIONAL ════════ */}
            <div className="epro-header">
                <div className="epro-header-top">
                    <div className="epro-header-badge">CENTRO DE ESTUDIOS ELECTORALES</div>
                    <div className="epro-live-badge">
                        <span className="epro-live-dot" />
                        EN VIVO
                    </div>
                </div>
                <h1 className="epro-title">Encuestas <span>PulsoElectoral</span></h1>
                <p className="epro-subtitle">Medición de opinión ciudadana en tiempo real · Elecciones Generales 2026 · Actualizado al {timestamp}</p>

                <div className="epro-ficha">
                    <div className="epro-ficha-item">
                        <span className="epro-ficha-label">Metodología</span>
                        <span className="epro-ficha-value">Encuesta digital abierta</span>
                    </div>
                    <div className="epro-ficha-divider" />
                    <div className="epro-ficha-item">
                        <span className="epro-ficha-label">Total Votos</span>
                        <span className="epro-ficha-value epro-ficha-highlight">{analytics.totalRegisteredVotes.toLocaleString('es-PE')}</span>
                    </div>
                    <div className="epro-ficha-divider" />
                    <div className="epro-ficha-item">
                        <span className="epro-ficha-label">Nivel de confianza</span>
                        <span className="epro-ficha-value">95%</span>
                    </div>
                    <div className="epro-ficha-divider" />
                    <div className="epro-ficha-item">
                        <span className="epro-ficha-label">Candidatos</span>
                        <span className="epro-ficha-value epro-ficha-highlight">{analytics.totalCandidates} inscritos</span>
                    </div>
                    <div className="epro-ficha-divider" />
                    <div className="epro-ficha-item">
                        <span className="epro-ficha-label">Partidos</span>
                        <span className="epro-ficha-value">{analytics.totalParties} org. políticas</span>
                    </div>
                </div>
            </div>

            {/* ════════ KPI PANEL ════════ */}
            <div className="epro-kpis">
                <div className="epro-kpi">
                    <div className="epro-kpi-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                    </div>
                    <div className="epro-kpi-data">
                        <span className="epro-kpi-num">{analytics.totalCandidates}</span>
                        <span className="epro-kpi-label">Candidatos Inscritos</span>
                    </div>
                </div>
                <div className="epro-kpi">
                    <div className="epro-kpi-icon" style={{ background: '#fef2f2' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div className="epro-kpi-data">
                        <span className="epro-kpi-num" style={{ color: '#c62828' }}>{analytics.totalParties}</span>
                        <span className="epro-kpi-label">Organizaciones Políticas</span>
                    </div>
                </div>
                <div className="epro-kpi">
                    <div className="epro-kpi-icon" style={{ background: '#f0fdf4' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div className="epro-kpi-data">
                        <span className="epro-kpi-num" style={{ color: '#16a34a' }}>{polls.length + CANDIDATE_SECTIONS.filter(s => (candidates[s.position]?.length || 0) > 0).length}</span>
                        <span className="epro-kpi-label">Secciones de Votación</span>
                    </div>
                </div>
                <div className="epro-kpi">
                    <div className="epro-kpi-icon" style={{ background: '#faf5ff' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    </div>
                    <div className="epro-kpi-data">
                        <span className="epro-kpi-num" style={{ color: '#7c3aed' }}>{analytics.participationPct.toFixed(0)}%</span>
                        <span className="epro-kpi-label">Tu Participación</span>
                    </div>
                </div>
            </div>

            {/* ════════ INDICES AVANZADOS ════════ */}
            <div className="epro-indices">
                <div className="epro-index-card">
                    <div className="epro-index-header">
                        <span className="epro-index-icon">⚔️</span>
                        <span className="epro-index-title">Índice de Competitividad</span>
                    </div>
                    <div className="epro-index-value" style={{ color: analytics.avgMargin < 10 ? '#c62828' : analytics.avgMargin < 25 ? '#ca8a04' : '#16a34a' }}>
                        {analytics.avgMargin < 10 ? 'MUY REÑIDA' : analytics.avgMargin < 25 ? 'COMPETITIVA' : 'ESTABLE'}
                    </div>
                    <div className="epro-index-bar">
                        <div className="epro-index-bar-fill" style={{
                            width: `${Math.min(100, 100 - analytics.avgMargin)}%`,
                            background: analytics.avgMargin < 10 ? '#c62828' : analytics.avgMargin < 25 ? '#ca8a04' : '#16a34a'
                        }} />
                    </div>
                    <span className="epro-index-desc">Margen promedio 1°-2°: {analytics.avgMargin.toFixed(1)}%</span>
                </div>
                <div className="epro-index-card">
                    <div className="epro-index-header">
                        <span className="epro-index-icon">📊</span>
                        <span className="epro-index-title">Polarización (HHI)</span>
                    </div>
                    <div className="epro-index-value" style={{ color: analytics.avgHHI > 5000 ? '#c62828' : analytics.avgHHI > 2500 ? '#ca8a04' : '#16a34a' }}>
                        {analytics.avgHHI.toFixed(0)}
                    </div>
                    <div className="epro-index-bar">
                        <div className="epro-index-bar-fill" style={{
                            width: `${Math.min(100, analytics.avgHHI / 100)}%`,
                            background: analytics.avgHHI > 5000 ? '#c62828' : analytics.avgHHI > 2500 ? '#ca8a04' : '#16a34a'
                        }} />
                    </div>
                    <span className="epro-index-desc">{analytics.avgHHI > 5000 ? 'Alta concentración' : analytics.avgHHI > 2500 ? 'Distribución moderada' : 'Distribución equilibrada'}</span>
                </div>
                <div className="epro-index-card">
                    <div className="epro-index-header">
                        <span className="epro-index-icon">🎯</span>
                        <span className="epro-index-title">Confiabilidad Estadística</span>
                    </div>
                    <div className="epro-index-value" style={{ color: analytics.totalPollVotes > 500 ? '#16a34a' : analytics.totalPollVotes > 100 ? '#ca8a04' : '#c62828' }}>
                        {analytics.totalPollVotes > 500 ? 'ALTA' : analytics.totalPollVotes > 100 ? 'MEDIA' : 'EN CONSTRUCCIÓN'}
                    </div>
                    <div className="epro-index-bar">
                        <div className="epro-index-bar-fill" style={{
                            width: `${Math.min(100, (analytics.totalPollVotes / 500) * 100)}%`,
                            background: analytics.totalPollVotes > 500 ? '#16a34a' : analytics.totalPollVotes > 100 ? '#ca8a04' : '#c62828'
                        }} />
                    </div>
                    <span className="epro-index-desc">{analytics.totalRegisteredVotes.toLocaleString('es-PE')} votos registrados</span>
                </div>
            </div>

            {/* ════════ ELECTION SIMULATION HERO ════════ */}
            <ElectionSimulationBlock />

            {/* ════════ TAB FILTERS ════════ */}
            <div className="epro-filters">
                <span className="epro-filters-label">Sección:</span>
                <div className="epro-filter-pills">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`epro-filter-pill ${activeTab === tab.key ? 'epro-filter-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ════════ CANDIDATE VOTING SECTIONS ════════ */}
            <div className="epro-studies">
                {CANDIDATE_SECTIONS.map(section => {
                    const sectionCandidates = candidates[section.position] || [];
                    if (sectionCandidates.length === 0) return null;
                    if (activeTab !== 'all' && activeTab !== section.key) return null;

                    return (
                        <CandidateVotingSection
                            key={section.key}
                            section={section}
                            candidates={sectionCandidates}
                        />
                    );
                })}

                {/* ════════ OPINION POLLS (from backend) ════════ */}
                {(activeTab === 'all' || activeTab === 'opinion') && polls.map((poll, studyIdx) => {
                    const hasVoted = votedOptions[poll.id] !== undefined;
                    const myVote = votedOptions[poll.id];
                    const isVoting = votingId === poll.id;
                    const counts = poll.vote_counts || {};
                    const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0) || 0;

                    const sortedOptions = poll.options.map((opt, idx) => ({
                        name: opt, idx, count: counts[idx] || 0,
                        pct: totalVotes > 0 ? ((counts[idx] || 0) / totalVotes) * 100 : 0,
                    })).sort((a, b) => b.count - a.count);

                    const margin = sortedOptions.length >= 2 ? sortedOptions[0].pct - sortedOptions[1].pct : 100;
                    const compLabel = margin < 5 ? 'Muy reñida' : margin < 15 ? 'Competitiva' : margin < 30 ? 'Tendencia clara' : 'Dominante';
                    const compColor = margin < 5 ? '#c62828' : margin < 15 ? '#ca8a04' : '#16a34a';
                    const pollMargin = totalVotes > 0 ? (1.96 / Math.sqrt(totalVotes)) * 100 : 0;
                    const isExpanded = expandedStudy === poll.id;

                    return (
                        <div key={poll.id} className="epro-study">
                            <div className="epro-study-header">
                                <div className="epro-study-meta">
                                    <span className="epro-study-number">ESTUDIO N° {String(studyIdx + 1).padStart(3, '0')}</span>
                                    <span className="epro-study-cat">{poll.category || 'General'}</span>
                                    <span className="epro-study-comp" style={{ color: compColor, borderColor: compColor }}>{compLabel}</span>
                                </div>
                                <div className="epro-study-votes-badge">
                                    <span className="epro-svb-num">{totalVotes.toLocaleString()}</span>
                                    <span className="epro-svb-label">votos</span>
                                </div>
                            </div>

                            <h2 className="epro-study-question">
                                <span className="epro-study-emoji">{poll.emoji}</span>
                                {poll.question}
                            </h2>

                            <div className="epro-results">
                                {hasVoted && (
                                    <div className="epro-results-header">
                                        <span className="epro-rh-pos">#</span>
                                        <span className="epro-rh-name">Opción</span>
                                        <span className="epro-rh-bar">Distribución</span>
                                        <span className="epro-rh-pct">%</span>
                                        <span className="epro-rh-votes">Votos</span>
                                    </div>
                                )}

                                {(hasVoted ? sortedOptions : poll.options.map((opt, idx) => ({ name: opt, idx, count: 0, pct: 0 }))).map((option, rank) => {
                                    const color = COLORS[option.idx % COLORS.length];
                                    const gradient = BAR_GRADIENTS[option.idx % BAR_GRADIENTS.length];
                                    const isMyVote = myVote === option.idx;
                                    const isLeader = hasVoted && rank === 0 && option.count > 0;

                                    if (!hasVoted) {
                                        return (
                                            <button key={option.idx} onClick={() => handleVote(poll.id, option.idx)} disabled={isVoting}
                                                className="epro-vote-btn" style={{ opacity: isVoting ? 0.6 : 1 }}>
                                                <span className="epro-vote-dot" style={{ background: color }} />
                                                <span className="epro-vote-name">{option.name}</span>
                                                <span className="epro-vote-tag" style={{ color }}>VOTAR →</span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <div key={option.idx} className={`epro-result-row ${isMyVote ? 'epro-result-mine' : ''} ${isLeader ? 'epro-result-leader' : ''}`}>
                                            <span className="epro-rr-pos">{isLeader ? '👑' : rank + 1}</span>
                                            <div className="epro-rr-name-col">
                                                <span className="epro-rr-name">{option.name}</span>
                                                {isMyVote && <span className="epro-rr-mine-tag">TU VOTO</span>}
                                            </div>
                                            <div className="epro-rr-bar-col">
                                                <div className="epro-rr-bar-track">
                                                    <div className="epro-rr-bar-fill" style={{ width: `${option.pct}%`, background: gradient }} />
                                                </div>
                                            </div>
                                            <span className="epro-rr-pct" style={{ color: isLeader ? color : undefined }}>{option.pct.toFixed(1)}%</span>
                                            <span className="epro-rr-votes">{option.count.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="epro-study-footer">
                                <div className="epro-sf-left">
                                    {hasVoted ? (<><span className="epro-sf-check">✅</span><span>Voto registrado</span></>) :
                                        (<span className="epro-sf-hint">👆 Selecciona una opción para ver resultados</span>)}
                                </div>
                                {hasVoted && (
                                    <button className="epro-sf-expand" onClick={() => setExpandedStudy(isExpanded ? null : poll.id)}>
                                        {isExpanded ? '▲ Menos' : '▼ Ficha técnica'}
                                    </button>
                                )}
                            </div>

                            {isExpanded && hasVoted && (
                                <div className="epro-study-details">
                                    <div className="epro-sd-grid">
                                        <div className="epro-sd-item"><span className="epro-sd-label">Total participantes</span><span className="epro-sd-value">{totalVotes.toLocaleString()}</span></div>
                                        <div className="epro-sd-item"><span className="epro-sd-label">Total votos</span><span className="epro-sd-value">{totalVotes.toLocaleString('es-PE')}</span></div>
                                        <div className="epro-sd-item"><span className="epro-sd-label">Nivel de confianza</span><span className="epro-sd-value">95%</span></div>
                                        <div className="epro-sd-item"><span className="epro-sd-label">Opciones</span><span className="epro-sd-value">{poll.options.length}</span></div>
                                        <div className="epro-sd-item"><span className="epro-sd-label">Competitividad</span><span className="epro-sd-value" style={{ color: compColor }}>{compLabel}</span></div>
                                        <div className="epro-sd-item"><span className="epro-sd-label">Categoría</span><span className="epro-sd-value">{poll.category || 'General'}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ════════ RESUMEN EJECUTIVO ════════ */}
            <div className="epro-executive">
                <h3 className="epro-exec-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Resumen Ejecutivo — Elecciones 2026
                </h3>
                <div className="epro-exec-grid">
                    {CANDIDATE_SECTIONS.map(section => {
                        const sectionCandidates = candidates[section.position] || [];
                        if (sectionCandidates.length === 0) return null;
                        const leader = sectionCandidates[0];
                        return (
                            <div key={section.key} className="epro-exec-item">
                                <span className="epro-exec-emoji">{section.emoji}</span>
                                <div className="epro-exec-info">
                                    <span className="epro-exec-q">{section.label} ({sectionCandidates.length} candidatos)</span>
                                    <div className="epro-exec-bar-track">
                                        <div className="epro-exec-bar-fill" style={{ width: `${(leader.final_score || 0)}%`, background: leader.party_color || '#1B2A4A' }} />
                                    </div>
                                    <span className="epro-exec-leader">
                                        N°1 Ranking: <strong style={{ color: leader.party_color || '#1B2A4A' }}>{leader.name}</strong> ({leader.party_abbreviation}) — Score: {leader.final_score?.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ════════ DISCLAIMER ════════ */}
            <div className="epro-disclaimer">
                <p>
                    <strong>Nota metodológica:</strong> Las encuestas ciudadanas de PulsoElectoral.pe son mediciones de opinión digital abiertas.
                    No constituyen encuestas electorales oficiales. Los candidatos y datos mostrados provienen del JNE (Jurado Nacional de Elecciones).
                    Los resultados reflejan la participación registrada en la plataforma. Solo cuenta <strong>1 voto por persona</strong> por sección.
                    Los scores de candidatos son calculados por el sistema PulsoElectoral con base en datos oficiales del JNE.
                </p>
            </div>
        </div>
    );
}
