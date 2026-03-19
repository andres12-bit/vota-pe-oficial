'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Candidate, getRanking } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto, getPhotoFallback } from '@/lib/avatars';

interface CongressCandidate extends Candidate {
    is_current_congressman?: boolean;
    congress_bancada?: string;
    congress_proyectos?: number;
    congress_asistencia?: number;
    congress_comisiones?: string[];
    congress_cambio_bancada?: boolean;
    congress_bancada_original?: string;
    congress_destacado?: string;
}

const BANCADA_COLORS: Record<string, string> = {
    'Fuerza Popular': '#ff6f00',
    'Renovación Popular': '#1565c0',
    'Alianza para el Progreso': '#00838f',
    'Podemos Perú': '#6a1b9a',
    'Perú Libre': '#c62828',
    'Bloque Magisterial': '#2e7d32',
    'Bancada Socialista': '#b71c1c',
    'Juntos por el Perú': '#d32f2f',
    'Avanza País': '#0277bd',
    'Perú Democrático': '#e65100',
    'Cooperación Popular': '#4527a0',
    'No agrupado': '#607d8b',
};

function getBancadaColor(bancada: string): string {
    return BANCADA_COLORS[bancada] || '#607d8b';
}

const positionLabels: Record<string, string> = {
    president: 'Presidente',
    senator: 'Senador',
    deputy: 'Diputado',
    andean: 'Parl. Andino',
};

export default function MemoriaElectoral() {
    const [allCandidates, setAllCandidates] = useState<CongressCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPosition, setFilterPosition] = useState<string>('all');
    const [filterBancada, setFilterBancada] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchAll() {
            try {
                const [presidents, senators, deputies, andean] = await Promise.all([
                    getRanking('president'),
                    getRanking('senator'),
                    getRanking('deputy'),
                    getRanking('andean'),
                ]);
                const all = [...presidents, ...senators, ...deputies, ...andean] as CongressCandidate[];
                const congress = all.filter(c => c.is_current_congressman);
                setAllCandidates(congress);
            } catch (err) {
                console.error('Error fetching candidates:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const bancadas = useMemo(() => {
        const set = new Set<string>();
        allCandidates.forEach(c => { if (c.congress_bancada) set.add(c.congress_bancada); });
        return Array.from(set).sort();
    }, [allCandidates]);

    const filtered = useMemo(() => {
        let list = allCandidates;
        if (filterPosition !== 'all') list = list.filter(c => c.position === filterPosition);
        if (filterBancada !== 'all') list = list.filter(c => c.congress_bancada === filterBancada);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q) || c.congress_bancada?.toLowerCase().includes(q));
        }
        return list;
    }, [allCandidates, filterPosition, filterBancada, searchQuery]);

    // Group by bancada for summary
    const bancadaStats = useMemo(() => {
        const stats: Record<string, number> = {};
        allCandidates.forEach(c => {
            const b = c.congress_bancada || 'Sin bancada';
            stats[b] = (stats[b] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [allCandidates]);

    const positionStats = useMemo(() => {
        const stats: Record<string, number> = {};
        allCandidates.forEach(c => {
            stats[c.position] = (stats[c.position] || 0) + 1;
        });
        return stats;
    }, [allCandidates]);

    const avgProyectos = useMemo(() => {
        const vals = allCandidates.filter(c => (c as any).congress_proyectos).map(c => (c as any).congress_proyectos as number);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    }, [allCandidates]);

    const avgAsistencia = useMemo(() => {
        const vals = allCandidates.filter(c => (c as any).congress_asistencia).map(c => (c as any).congress_asistencia as number);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    }, [allCandidates]);

    const cambiosCount = useMemo(() => {
        return allCandidates.filter(c => (c as any).congress_cambio_bancada).length;
    }, [allCandidates]);

    if (loading) {
        return (
            <div style={{ maxWidth: 1100, margin: '60px auto', textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#607d8b' }}>Cargando Memoria Electoral...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
            {/* ═══ HERO HEADER ═══ */}
            <div style={{
                background: 'linear-gradient(135deg, #1B2A4A 0%, #2c3e6b 50%, #1B2A4A 100%)',
                borderRadius: 20, padding: '40px 32px', marginBottom: 28,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.05,
                    backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 36 }}>🏛️</span>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                                Memoria Electoral
                            </h1>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontWeight: 500 }}>
                                Congresistas actuales (2021-2026) que buscan reelección
                            </p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#f9a825' }}>{allCandidates.length}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Congresistas</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{positionStats.senator || 0}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Senado</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{positionStats.deputy || 0}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diputados</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{bancadaStats.length}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bancadas</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{avgProyectos}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prom. Proyectos</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: avgAsistencia >= 80 ? '#66bb6a' : '#ff8f00' }}>{avgAsistencia}%</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prom. Asistencia</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.15)',
                            flex: '1 1 120px', textAlign: 'center', minWidth: 100,
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#ff5252' }}>{cambiosCount}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cambios Bancada</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ BANCADA BREAKDOWN ═══ */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
                border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1B2A4A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📊 Congresistas por Bancada
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bancadaStats.map(([bancada, count]) => {
                        const pct = (count / allCandidates.length) * 100;
                        const color = getBancadaColor(bancada);
                        return (
                            <div key={bancada} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 140, fontSize: 11, fontWeight: 600, color: '#455a64', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {bancada}
                                </div>
                                <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 10, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 10,
                                        width: `${pct}%`, minWidth: 24,
                                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                                        transition: 'width 0.6s ease',
                                    }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{count}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar congresista..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, fontSize: 12,
                            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none',
                        }}
                    />
                </div>
                <select
                    value={filterPosition}
                    onChange={e => setFilterPosition(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none' }}
                >
                    <option value="all">Todas las posiciones</option>
                    <option value="president">Presidente</option>
                    <option value="senator">Senado</option>
                    <option value="deputy">Diputados</option>
                    <option value="andean">Parl. Andino</option>
                </select>
                <select
                    value={filterBancada}
                    onChange={e => setFilterBancada(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#1B2A4A', outline: 'none' }}
                >
                    <option value="all">Todas las bancadas</option>
                    {bancadas.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '10px 16px', borderRadius: 10, background: '#f9a825', color: '#1B2A4A' }}>
                    {filtered.length} congresistas
                </span>
            </div>

            {/* ═══ CONGRESS MEMBERS GRID ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {filtered.map(candidate => {
                    const score = Number(candidate.final_score);
                    const bancadaColor = getBancadaColor(candidate.congress_bancada || '');
                    const proyectos = (candidate as any).congress_proyectos || 0;
                    const asistencia = (candidate as any).congress_asistencia || 0;
                    const comisiones = (candidate as any).congress_comisiones || [];
                    const cambioBancada = (candidate as any).congress_cambio_bancada;
                    const bancadaOriginal = (candidate as any).congress_bancada_original;
                    const destacado = (candidate as any).congress_destacado;
                    
                    return (
                        <Link key={candidate.id} href={`/candidate/${candidate.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#fff', borderRadius: 14, overflow: 'hidden',
                                border: '1px solid rgba(0,0,0,0.06)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                            >
                                {/* Bancada color strip */}
                                <div style={{ height: 4, background: `linear-gradient(90deg, ${bancadaColor}, ${bancadaColor}88)` }} />
                                
                                {/* Top: Photo + Name + Bancada */}
                                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <img
                                        src={getCandidatePhoto(candidate.photo, candidate.name, 52, candidate.party_color)}
                                        onError={(e) => { const fb = getPhotoFallback((e.target as HTMLImageElement).src); if (fb && !(e.target as HTMLImageElement).dataset.retried) { (e.target as HTMLImageElement).dataset.retried = '1'; (e.target as HTMLImageElement).src = fb; } else { (e.target as HTMLImageElement).src = getAvatarUrl(candidate.name, 52, candidate.party_color); } }}
                                        alt={candidate.name}
                                        width={52} height={52}
                                        style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${bancadaColor}`, flexShrink: 0 }}
                                        loading="lazy"
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {candidate.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                                background: `${bancadaColor}15`, color: bancadaColor,
                                            }}>
                                                {candidate.congress_bancada}
                                            </span>
                                            {cambioBancada && (
                                                <span style={{ fontSize: 9, fontWeight: 600, color: '#ff8f00', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                                    ↔ {bancadaOriginal}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#90a4ae', marginTop: 2 }}>
                                            <span style={{ fontWeight: 700, color: candidate.party_color }}>{candidate.party_abbreviation}</span>
                                            {' · '}
                                            Postula: {positionLabels[candidate.position] || candidate.position}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Proyectos</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: proyectos >= 40 ? '#2e7d32' : proyectos >= 20 ? '#e65100' : '#c62828' }}>
                                            {proyectos}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Asistencia</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: asistencia >= 85 ? '#2e7d32' : asistencia >= 75 ? '#e65100' : '#c62828' }}>
                                            {asistencia}%
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '8px 0', textAlign: 'center' }}>
                                        <div style={{ fontSize: 8, fontWeight: 700, color: '#90a4ae', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Score</div>
                                        <div style={{
                                            fontSize: 16, fontWeight: 800,
                                            color: score >= 85 ? '#2e7d32' : score >= 70 ? '#e65100' : '#c62828',
                                        }}>
                                            {score.toFixed(1)}
                                        </div>
                                    </div>
                                </div>

                                {/* Committees */}
                                {comisiones.length > 0 && (
                                    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#90a4ae' }}>Comisiones:</span>
                                        {comisiones.map((c: string) => (
                                            <span key={c} style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#f5f5f5', color: '#607d8b' }}>{c}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Highlight */}
                                {destacado && (
                                    <div style={{ padding: '6px 16px 12px', fontSize: 10, color: '#78909c', lineHeight: 1.4, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                                        💡 {destacado}
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#90a4ae' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No se encontraron congresistas con esos filtros</div>
                </div>
            )}

            {/* ═══ DATA SOURCE NOTE ═══ */}
            <div style={{
                marginTop: 32, padding: '16px 20px', borderRadius: 12, textAlign: 'center',
                background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.04)',
            }}>
                <p style={{ fontSize: 11, color: '#90a4ae', lineHeight: 1.5, margin: 0 }}>
                    📊 Datos de desempeño legislativo basados en registros del Congreso de la República del Perú (2021-2026).
                    Las estadísticas incluyen proyectos de ley presentados, asistencia a sesiones del pleno y participación en comisiones.
                </p>
            </div>
        </div>
    );
}
