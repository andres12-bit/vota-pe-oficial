'use client';

import { useState, useEffect, useCallback } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';

interface SystemStatus {
    status: string;
    candidates: number;
    parties: number;
    total_votes: number;
    total_events: number;
    ws_clients: number;
    uptime: number;
    memory: { heapUsed: number; heapTotal: number; rss: number };
}

interface AdminCandidate {
    id: number;
    name: string;
    party_name: string;
    party_abbreviation: string;
    position: string;
    region: string;
    final_score: number;
    intelligence_score: number;
    momentum_score: number;
    integrity_score: number;
    risk_score: number;
    vote_count: number;
    is_active: boolean;
    stars_rating: number;
}

interface AdminEvent {
    id: number;
    candidate_id: number;
    candidate_name?: string;
    party_name?: string;
    event_type: string;
    title: string;
    description: string;
    impact_score: number;
    is_validated: boolean;
    created_at: string;
}

interface FraudStats {
    total_votes: number;
    unique_ips: number;
    unique_fingerprints: number;
    suspicious_voters: { voter_ip: string; vote_count: number }[];
    blocked_ips: number;
    blocked_fingerprints: number;
}

type AdminTab = 'dashboard' | 'candidates' | 'events' | 'votes' | 'fraud' | 'system';

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'pulsoelectoral-admin-2026', ...options?.headers },
    });
    return res.json();
}

export default function AdminPage() {
    const [tab, setTab] = useState<AdminTab>('dashboard');
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
    const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
    const [fraudStats, setFraudStats] = useState<FraudStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');

    const showMsg = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [status, cands, events, fraud] = await Promise.all([
                adminFetch<SystemStatus>('/admin/system/status'),
                adminFetch<{ candidates: AdminCandidate[] }>('/admin/candidates'),
                adminFetch<{ events: AdminEvent[] }>('/admin/events/pending'),
                adminFetch<FraudStats>('/admin/fraud/stats'),
            ]);
            setSystemStatus(status);
            setCandidates(cands.candidates || []);
            setPendingEvents(events.events || []);
            setFraudStats(fraud);
        } catch (err) {
            console.error('Admin data fetch error:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Actions
    const toggleCandidate = async (id: number) => {
        await adminFetch(`/admin/candidates/${id}/toggle`, { method: 'POST' });
        showMsg('Candidato actualizado');
        loadData();
    };

    const validateEvent = async (id: number) => {
        await adminFetch(`/events/${id}/validate`, { method: 'POST' });
        showMsg('Evento validado — scores recalculados');
        loadData();
    };

    const rejectEvent = async (id: number) => {
        await adminFetch(`/events/${id}/reject`, { method: 'POST' });
        showMsg('Evento rechazado');
        loadData();
    };

    const recalculateAll = async () => {
        showMsg('Recalculando...');
        await adminFetch('/admin/recalculate/all', { method: 'POST' });
        showMsg('Recálculo completo');
        loadData();
    };

    const blockIp = async (ip: string) => {
        await adminFetch('/admin/fraud/block-ip', { method: 'POST', body: JSON.stringify({ ip }) });
        showMsg(`IP ${ip} bloqueada`);
        loadData();
    };

    const deleteCandidate = async (id: number) => {
        if (!confirm('¿Eliminar candidato permanentemente?')) return;
        await adminFetch(`/admin/candidates/${id}`, { method: 'DELETE' });
        showMsg('Candidato eliminado');
        loadData();
    };

    const toggleMaintenance = async (enabled: boolean) => {
        await adminFetch('/admin/system/maintenance', { method: 'POST', body: JSON.stringify({ enabled }) });
        showMsg(`Mantenimiento ${enabled ? 'activado' : 'desactivado'}`);
    };

    const TABS = [
        { id: 'dashboard' as AdminTab, label: '📊 Dashboard', },
        { id: 'candidates' as AdminTab, label: '👤 Candidatos' },
        { id: 'events' as AdminTab, label: '📋 Eventos' },
        { id: 'fraud' as AdminTab, label: '🛡️ Anti-Fraude' },
        { id: 'system' as AdminTab, label: '⚙️ Sistema' },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 px-4 py-3 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.98)', borderBottom: '1px solid var(--vp-border)', backdropFilter: 'blur(20px)' }}>
                <a href="/" className="text-sm" style={{ color: 'var(--vp-text-dim)' }}>← PulsoElectoral.pe</a>
                <span className="text-sm font-black tracking-wider" style={{ color: 'var(--vp-red)' }}>ADMIN CONTROL CENTER</span>
                <div className="ml-auto flex items-center gap-2">
                    {actionMsg && (
                        <span className="text-xs px-3 py-1 rounded-lg animate-fade-in" style={{ background: 'var(--vp-green)', color: '#000' }}>
                            {actionMsg}
                        </span>
                    )}
                    <button onClick={loadData} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-red)' }}>
                        🔄 Refresh
                    </button>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto flex">
                {/* Sidebar */}
                <aside className="w-56 shrink-0 p-4 flex flex-col gap-1" style={{ borderRight: '1px solid var(--vp-border)', minHeight: 'calc(100vh - 52px)' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? 'text-white' : ''}`}
                            style={{ background: tab === t.id ? 'var(--vp-red)' : 'transparent', color: tab === t.id ? 'white' : 'var(--vp-text-dim)' }}>
                            {t.label}
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <main className="flex-1 p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
                        </div>
                    ) : tab === 'dashboard' ? (
                        <DashboardView status={systemStatus} candidates={candidates} pending={pendingEvents.length} fraud={fraudStats} />
                    ) : tab === 'candidates' ? (
                        <CandidatesView candidates={candidates} onToggle={toggleCandidate} onDelete={deleteCandidate} onRecalculate={recalculateAll} />
                    ) : tab === 'events' ? (
                        <EventsView events={pendingEvents} onValidate={validateEvent} onReject={rejectEvent} />
                    ) : tab === 'fraud' ? (
                        <FraudView stats={fraudStats} onBlockIp={blockIp} />
                    ) : (
                        <SystemView status={systemStatus} onRecalculate={recalculateAll} onMaintenance={toggleMaintenance} />
                    )}
                </main>
            </div>
        </div>
    );
}

// ============ SUB-VIEWS ============

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="panel-glow p-4 text-center">
            <div className="text-2xl font-black" style={{ color: color || 'var(--vp-red)' }}>{value}</div>
            <div className="text-[10px] font-bold tracking-wider uppercase mt-1" style={{ color: 'var(--vp-text-dim)' }}>{label}</div>
        </div>
    );
}

function DashboardView({ status, candidates, pending, fraud }: { status: SystemStatus | null; candidates: AdminCandidate[]; pending: number; fraud: FraudStats | null }) {
    if (!status) return null;
    const active = candidates.filter(c => c.is_active).length;
    return (
        <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--vp-text)' }}>📊 Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Candidatos Activos" value={active} />
                <StatCard label="Votos Totales" value={status.total_votes.toLocaleString()} color="var(--vp-green)" />
                <StatCard label="Eventos Pendientes" value={pending} color="var(--vp-gold)" />
                <StatCard label="WS Clientes" value={status.ws_clients} color="var(--vp-blue)" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Partidos" value={status.parties} />
                <StatCard label="IPs Únicas" value={fraud?.unique_ips || 0} color="var(--vp-blue)" />
                <StatCard label="IPs Bloqueadas" value={fraud?.blocked_ips || 0} color="var(--vp-red)" />
            </div>
            {/* Top 5 candidates by score */}
            <div className="panel-glow p-4">
                <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>Top 5 Candidatos</h3>
                {candidates.sort((a, b) => b.final_score - a.final_score).slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span className="text-sm font-bold w-6" style={{ color: 'var(--vp-gold)' }}>#{i + 1}</span>
                        <div className="flex-1">
                            <span className="text-sm font-semibold">{c.name}</span>
                            <span className="text-xs ml-2" style={{ color: 'var(--vp-text-dim)' }}>{c.party_abbreviation}</span>
                        </div>
                        <span className="score-badge">{Number(c.final_score).toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CandidatesView({ candidates, onToggle, onDelete, onRecalculate }: { candidates: AdminCandidate[]; onToggle: (id: number) => void; onDelete: (id: number) => void; onRecalculate: () => void }) {
    const [filter, setFilter] = useState('');
    const filtered = candidates.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.party_abbreviation.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--vp-text)' }}>👤 Candidatos ({candidates.length})</h2>
                <button onClick={onRecalculate} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: 'var(--vp-red)', color: 'white' }}>
                    🔄 Recalcular Todo
                </button>
            </div>
            <input type="text" placeholder="Buscar candidato..." value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--vp-border)', color: 'var(--vp-text)', outline: 'none' }} />
            <div className="panel-glow overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--vp-border)' }}>
                            {['ID', 'Nombre', 'Partido', 'Cargo', 'Score', 'IQ', 'Mom.', 'Int.', 'Votos', 'Estado', 'Acciones'].map(h => (
                                <th key={h} className="px-3 py-2 text-left text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--vp-text-dim)' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--vp-text-dim)' }}>{c.id}</td>
                                <td className="px-3 py-2 font-semibold">{c.name}</td>
                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--vp-text-dim)' }}>{c.party_abbreviation}</td>
                                <td className="px-3 py-2 text-xs">{c.position}</td>
                                <td className="px-3 py-2"><span className="score-badge">{Number(c.final_score).toFixed(1)}</span></td>
                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--vp-blue)' }}>{Number(c.intelligence_score).toFixed(0)}</td>
                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--vp-gold)' }}>{Number(c.momentum_score).toFixed(0)}</td>
                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--vp-green)' }}>{Number(c.integrity_score).toFixed(0)}</td>
                                <td className="px-3 py-2 text-xs">{c.vote_count}</td>
                                <td className="px-3 py-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: c.is_active ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)', color: c.is_active ? 'var(--vp-green)' : 'var(--vp-red)' }}>
                                        {c.is_active ? 'ACTIVO' : 'OFF'}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                        <button onClick={() => onToggle(c.id)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-text)' }}>
                                            {c.is_active ? '⏸' : '▶'}
                                        </button>
                                        <button onClick={() => onDelete(c.id)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,23,68,0.3)', color: 'var(--vp-red)' }}>
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EventsView({ events, onValidate, onReject }: { events: AdminEvent[]; onValidate: (id: number) => void; onReject: (id: number) => void }) {
    const typeColors: Record<string, string> = {
        positive: 'var(--vp-green)', negative: 'var(--vp-gold)', corruption: 'var(--vp-red)', achievement: 'var(--vp-blue)',
    };
    return (
        <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--vp-text)' }}>📋 Eventos Pendientes ({events.length})</h2>
            {events.length === 0 ? (
                <div className="panel-glow p-8 text-center">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm mt-2" style={{ color: 'var(--vp-text-dim)' }}>No hay eventos pendientes de validación</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {events.map(e => (
                        <div key={e.id} className="panel-glow p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${typeColors[e.event_type]}22`, color: typeColors[e.event_type] }}>
                                            {e.event_type.toUpperCase()}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>{e.candidate_name} • {e.party_name}</span>
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>{e.title}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--vp-text-dim)' }}>{e.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span style={{ color: Number(e.impact_score) > 0 ? 'var(--vp-green)' : 'var(--vp-red)' }}>
                                            Impacto: {Number(e.impact_score) > 0 ? '+' : ''}{Number(e.impact_score).toFixed(1)}
                                        </span>
                                        <span style={{ color: 'var(--vp-text-dim)' }}>{new Date(e.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4 shrink-0">
                                    <button onClick={() => onValidate(e.id)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: 'var(--vp-green)', color: '#000' }}>✓ Validar</button>
                                    <button onClick={() => onReject(e.id)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: 'var(--vp-red)', color: 'white' }}>✕ Rechazar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FraudView({ stats, onBlockIp }: { stats: FraudStats | null; onBlockIp: (ip: string) => void }) {
    if (!stats) return null;
    return (
        <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--vp-text)' }}>🛡️ Anti-Fraude</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Votos Totales" value={stats.total_votes.toLocaleString()} />
                <StatCard label="IPs Únicas" value={stats.unique_ips} color="var(--vp-blue)" />
                <StatCard label="IPs Bloqueadas" value={stats.blocked_ips} color="var(--vp-red)" />
                <StatCard label="Fingerprints" value={stats.unique_fingerprints} color="var(--vp-green)" />
            </div>
            {stats.suspicious_voters.length > 0 && (
                <div className="panel-glow p-4">
                    <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-red)' }}>⚠️ Votantes Sospechosos</h3>
                    {stats.suspicious_voters.map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div>
                                <span className="text-sm font-mono">{v.voter_ip}</span>
                                <span className="text-xs ml-2" style={{ color: 'var(--vp-text-dim)' }}>{v.vote_count} votos en 24h</span>
                            </div>
                            <button onClick={() => onBlockIp(v.voter_ip)} className="text-xs px-3 py-1 rounded font-bold" style={{ background: 'var(--vp-red)', color: 'white' }}>
                                🚫 Bloquear
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {stats.suspicious_voters.length === 0 && (
                <div className="panel-glow p-8 text-center">
                    <span className="text-2xl">🛡️</span>
                    <p className="text-sm mt-2" style={{ color: 'var(--vp-text-dim)' }}>No se detectaron votantes sospechosos</p>
                </div>
            )}
        </div>
    );
}

function SystemView({ status, onRecalculate, onMaintenance }: { status: SystemStatus | null; onRecalculate: () => void; onMaintenance: (enabled: boolean) => void }) {
    if (!status) return null;
    const uptimeMin = Math.floor(status.uptime / 60);
    const memMB = Math.floor(status.memory.heapUsed / 1024 / 1024);

    return (
        <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--vp-text)' }}>⚙️ Control de Sistema</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Estado" value={status.status.toUpperCase()} color="var(--vp-green)" />
                <StatCard label="Uptime" value={`${uptimeMin}m`} color="var(--vp-blue)" />
                <StatCard label="Memoria" value={`${memMB} MB`} color="var(--vp-gold)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="panel-glow p-4">
                    <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>Acciones del Sistema</h3>
                    <div className="flex flex-col gap-2">
                        <button onClick={onRecalculate} className="w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5" style={{ background: 'var(--vp-red-dim)', color: 'var(--vp-text)' }}>
                            🔄 Recalcular Todos los Scores
                        </button>
                        <button onClick={() => onMaintenance(true)} className="w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5" style={{ background: 'rgba(255,215,64,0.1)', color: 'var(--vp-gold)' }}>
                            🚧 Activar Modo Mantenimiento
                        </button>
                        <button onClick={() => onMaintenance(false)} className="w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--vp-green)' }}>
                            ✅ Desactivar Modo Mantenimiento
                        </button>
                    </div>
                </div>
                <div className="panel-glow p-4">
                    <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--vp-text-dim)' }}>Información del Servidor</h3>
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>Candidatos</span><span>{status.candidates}</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>Partidos</span><span>{status.parties}</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>Votos</span><span>{status.total_votes}</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>Eventos</span><span>{status.total_events}</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>WS Clientes</span><span>{status.ws_clients}</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>Heap Total</span><span>{Math.floor(status.memory.heapTotal / 1024 / 1024)} MB</span></div>
                        <div className="flex justify-between"><span style={{ color: 'var(--vp-text-dim)' }}>RSS</span><span>{Math.floor(status.memory.rss / 1024 / 1024)} MB</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
