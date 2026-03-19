'use client';

import { useState, useEffect } from 'react';
import { Candidate, VoteStats, getRanking, getStats, getVoteStats, castVote } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import { useWebSocket } from '@/lib/websocket';
import { useSelection } from '@/lib/selection';
import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';
import RankingTable from '@/components/RankingTable';
import ShareModal from '@/components/ShareModal';
import { useRouter } from 'next/navigation';

type PositionTab = 'president' | 'senator' | 'deputy' | 'andean';

export default function SimularPage() {
    const [activePosition, setActivePosition] = useState<PositionTab>('president');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
    const [showShare, setShowShare] = useState(false);
    const { state: selState, selection, showDraftBanner, dismissDraftBanner, activateBuilding, editSelection, confirmSelection, hasPresident } = useSelection();
    const { lastMessage } = useWebSocket();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const ranked = await getRanking(activePosition);
                setCandidates(ranked);
                try { const vs = await getVoteStats(); setVoteStats(vs); } catch (e) { /* optional */ }
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        }
        fetchData();
    }, [activePosition]);

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === 'ranking_updated') {
            getRanking(activePosition).then(setCandidates).catch(() => { });
        }
    }, [lastMessage, activePosition]);

    const handleVote = async (candidateId: number, position: string) => {
        try {
            await castVote(candidateId, position);
            const ranked = await getRanking(activePosition);
            setCandidates(ranked);
        } catch (err) {
            console.error('Vote error:', err);
        }
    };

    const positionLabels: Record<PositionTab, string> = {
        president: 'Presidente',
        senator: 'Senadores',
        deputy: 'Diputados',
        andean: 'Parlamento Andino',
    };

    return (
        <>
            <NavHeader />
            <div className="simular-page">
                {/* Hero Section */}
                <section className="hero-centered-block">
                    {showDraftBanner && (
                        <div className="draft-recovery-banner">
                            <span>Tienes una selección en progreso.</span>
                            <button onClick={dismissDraftBanner}>Continuar editando →</button>
                        </div>
                    )}

                    <div className="cancha-stats-bar">
                        <span className="cancha-stat">✅ <strong>{voteStats?.total?.toLocaleString() ?? '0'}</strong> votos ciudadanos</span>
                        <span className="cancha-stat cancha-stat-green">↑ {voteStats?.last_hour ?? 0} última hora</span>
                        <span className="cancha-stat cancha-stat-live">● 24/7 en vivo</span>
                    </div>

                    <div className="hero-two-col">
                        {/* Left column */}
                        <div className="hero-left-col">
                            <h1 className="hero-headline">
                                <span className="hero-headline-line">Simula tu <span className="hero-headline-red">Elección.</span></span>
                                <span className="hero-headline-line">Arma tu equipo.</span>
                            </h1>
                            <p className="hero-desc">
                                Elige a tus candidatos para Presidente, Senado, Diputados y Parlamento Andino. Compón tu equipo ideal y compártelo.
                            </p>

                            {selState === 'empty' && !showDraftBanner && (
                                <button onClick={() => setActivePosition('president')} className="hero-cta-btn">
                                    🗳️ COMENZAR SIMULACIÓN
                                </button>
                            )}

                            {selState === 'confirmed' && (
                                <button onClick={editSelection} className="hero-cta-btn">
                                    ✏️ EDITAR SELECCIÓN
                                </button>
                            )}

                            {selState === 'draft' && hasPresident && !showDraftBanner && (
                                <button onClick={confirmSelection} className="hero-cta-btn">
                                    💾 GUARDAR SELECCIÓN
                                </button>
                            )}
                        </div>

                        {/* Right column: Diamond */}
                        <div className="hero-right-col">
                            <div className="hero-diamond">
                                <svg className="hero-diamond-lines" viewBox="0 0 300 300" fill="none">
                                    <line x1="150" y1="70" x2="60" y2="150" stroke="rgba(200,200,200,0.5)" strokeWidth="1.5" />
                                    <line x1="150" y1="70" x2="240" y2="150" stroke="rgba(200,200,200,0.5)" strokeWidth="1.5" />
                                    <line x1="60" y1="150" x2="150" y2="230" stroke="rgba(200,200,200,0.5)" strokeWidth="1.5" />
                                    <line x1="240" y1="150" x2="150" y2="230" stroke="rgba(200,200,200,0.5)" strokeWidth="1.5" />
                                </svg>

                                {/* Presidente */}
                                <div className={`hero-diamond-node hero-diamond-top ${activePosition === 'president' ? 'hero-diamond-node-active' : ''}`} onClick={() => setActivePosition('president')}>
                                    <div className={`hero-diamond-circle ${selection.president ? 'hero-diamond-filled' : ''}`} style={selection.president ? { borderColor: selection.president.party_color || '#c62828' } : {}}>
                                        {selection.president ? (
                                            <img src={getCandidatePhoto(selection.president.photo, selection.president.name, 64, selection.president.party_color)} onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(selection.president!.name, 64, selection.president!.party_color); }} alt={selection.president.name} />
                                        ) : (
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                        )}
                                    </div>
                                    <span className="hero-diamond-label">Presidente</span>
                                </div>

                                {/* Senado */}
                                <div className={`hero-diamond-node hero-diamond-left ${activePosition === 'senator' ? 'hero-diamond-node-active' : ''}`} onClick={() => setActivePosition('senator')}>
                                    <div className={`hero-diamond-circle hero-diamond-circle-sm ${selection.senators.length > 0 ? 'hero-diamond-filled' : ''}`} style={selection.senators.length > 0 ? { borderColor: selection.senators[0].party_color || '#2563eb' } : {}}>
                                        {selection.senators.length > 0 ? (
                                            <img src={getCandidatePhoto(selection.senators[0].photo, selection.senators[0].name, 48, selection.senators[0].party_color)} onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(selection.senators[0].name, 48, selection.senators[0].party_color); }} alt={selection.senators[0].name} />
                                        ) : (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                        )}
                                        {selection.senators.length > 1 && (
                                            <span className="hero-diamond-count">+{selection.senators.length - 1}</span>
                                        )}
                                    </div>
                                    <span className="hero-diamond-label">Senado{selection.senators.length > 0 ? ` (${selection.senators.length})` : ''}</span>
                                </div>

                                {/* Parl. Andino */}
                                <div className={`hero-diamond-node hero-diamond-right ${activePosition === 'andean' ? 'hero-diamond-node-active' : ''}`} onClick={() => setActivePosition('andean')}>
                                    <div className={`hero-diamond-circle hero-diamond-circle-sm ${selection.andean.length > 0 ? 'hero-diamond-filled' : ''}`} style={selection.andean.length > 0 ? { borderColor: selection.andean[0].party_color || '#7c3aed' } : {}}>
                                        {selection.andean.length > 0 ? (
                                            <img src={getCandidatePhoto(selection.andean[0].photo, selection.andean[0].name, 48, selection.andean[0].party_color)} onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(selection.andean[0].name, 48, selection.andean[0].party_color); }} alt={selection.andean[0].name} />
                                        ) : (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="#94a3b8"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z" /></svg>
                                        )}
                                        {selection.andean.length > 1 && (
                                            <span className="hero-diamond-count">+{selection.andean.length - 1}</span>
                                        )}
                                    </div>
                                    <span className="hero-diamond-label">Parl. Andino{selection.andean.length > 0 ? ` (${selection.andean.length})` : ''}</span>
                                </div>

                                {/* Diputados */}
                                <div className={`hero-diamond-node hero-diamond-bottom ${activePosition === 'deputy' ? 'hero-diamond-node-active' : ''}`} onClick={() => setActivePosition('deputy')}>
                                    <div className={`hero-diamond-circle hero-diamond-circle-sm ${selection.deputies.length > 0 ? 'hero-diamond-filled' : ''}`} style={selection.deputies.length > 0 ? { borderColor: selection.deputies[0].party_color || '#16a34a' } : {}}>
                                        {selection.deputies.length > 0 ? (
                                            <img src={getCandidatePhoto(selection.deputies[0].photo, selection.deputies[0].name, 48, selection.deputies[0].party_color)} onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(selection.deputies[0].name, 48, selection.deputies[0].party_color); }} alt={selection.deputies[0].name} />
                                        ) : (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                        )}
                                        {selection.deputies.length > 1 && (
                                            <span className="hero-diamond-count">+{selection.deputies.length - 1}</span>
                                        )}
                                    </div>
                                    <span className="hero-diamond-label">Diputados{selection.deputies.length > 0 ? ` (${selection.deputies.length})` : ''}</span>
                                </div>
                            </div>

                            {/* Action bar */}
                            <div className="cancha-action-bar cancha-action-bar-visible">
                                <button onClick={() => router.push('/?tab=comparar')} className="cancha-action-btn cancha-action-compare">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" /></svg>
                                    <span>Comparar</span>
                                </button>
                                <button onClick={() => setShowShare(true)} className="cancha-action-btn cancha-action-share">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                    <span>Compartir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Position selector tabs */}
                <div className="simular-position-tabs">
                    <div className="simular-tabs-inner">
                        {(['president', 'senator', 'deputy', 'andean'] as PositionTab[]).map(pos => (
                            <button
                                key={pos}
                                className={`simular-tab ${activePosition === pos ? 'simular-tab-active' : ''}`}
                                onClick={() => setActivePosition(pos)}
                            >
                                {positionLabels[pos]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Candidate ranking for selected position */}
                <div className="simular-ranking-section">
                    <div className="simular-ranking-inner">
                        <h2 className="simular-ranking-title">
                            Candidatos: {positionLabels[activePosition]}
                        </h2>
                        <p className="simular-ranking-desc">
                            Selecciona un candidato para agregarlo a tu equipo electoral.
                        </p>
                        <RankingTable
                            candidates={candidates}
                            position={activePosition}
                            onVote={handleVote}
                        />
                    </div>
                </div>
            </div>

            {showShare && <ShareModal onClose={() => setShowShare(false)} />}

            <SiteFooter />
        </>
    );
}
