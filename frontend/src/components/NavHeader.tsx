'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

const TABS: { id: TabType; label: string }[] = [
    { id: 'encuesta', label: 'ENCUESTA' },
    { id: 'votar', label: 'VOTAR' },
    { id: 'planchas', label: 'PLANCHAS' },
    { id: 'deputy', label: 'DIPUTADOS' },
    { id: 'president', label: 'PRESIDENTE(A)' },
    { id: 'senator', label: 'SENADORES' },
    { id: 'andean', label: 'PARL. ANDINO' },
];

interface NavHeaderProps {
    activeTab?: TabType;
    onTabChange?: (tab: TabType) => void;
    totalVotes?: number;
}

export default function NavHeader({ activeTab, onTabChange, totalVotes }: NavHeaderProps) {
    const { isConnected } = useWebSocket();
    const { user, isLoggedIn, setShowLogin, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();

    const handleTabClick = (tabId: TabType) => {
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            router.push(`/?tab=${tabId}`);
        }
    };

    return (
        <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid var(--vp-border)', backdropFilter: 'blur(20px)' }}>
            <div className="navbar-3col">
                {/* Column 1: Logo */}
                <div className="navbar-left">
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/logo.svg"
                            alt="VOTA.PE"
                            width={40}
                            height={40}
                            className="rounded-full"
                            style={{ boxShadow: '0 0 16px var(--vp-red-glow)' }}
                        />
                        <div className="hidden sm:flex flex-col leading-tight">
                            <span className="text-sm font-extrabold tracking-wider">VOTA<span style={{ color: 'var(--vp-red)' }}>.PE</span></span>
                        </div>
                    </Link>
                </div>

                {/* Column 2: Centered Navigation Links */}
                <nav className="navbar-center">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Column 3: User + LIVE */}
                <div className="navbar-right">
                    {isLoggedIn && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:bg-white/10"
                                style={{ border: '1px solid var(--vp-border)' }}
                            >
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                                    style={{ background: 'var(--vp-red)', color: '#fff' }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-semibold hidden sm:inline" style={{ color: 'var(--vp-text)' }}>
                                    {user.alias || user.name.split(' ')[0]}
                                </span>
                                {user.verified && <span className="text-[10px]" title="Verificado">✅</span>}
                            </button>
                            {/* User dropdown */}
                            {showMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 z-50 animate-fade-in"
                                    style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                    <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--vp-border)' }}>
                                        <div className="text-xs font-bold" style={{ color: 'var(--vp-text)' }}>{user.name}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--vp-text-dim)' }}>{user.email || user.phone || user.alias}</div>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setShowMenu(false); }}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                                        style={{ color: 'var(--vp-red)' }}
                                    >
                                        🚪 Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all hover:brightness-110"
                            style={{ background: 'linear-gradient(135deg, var(--vp-red), #ff6090)', color: '#fff', boxShadow: '0 0 12px var(--vp-red-glow)' }}
                        >
                            👤 INGRESAR
                        </button>
                    )}

                    {/* LIVE indicator */}
                    <div className="live-badge" style={{ background: isConnected ? 'rgba(0,230,118,0.15)' : 'rgba(136,136,170,0.15)' }}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'pulse-glow' : ''}`} style={{ background: isConnected ? 'var(--vp-green)' : 'var(--vp-text-dim)' }} />
                        <span style={{ color: isConnected ? 'var(--vp-green)' : 'var(--vp-text-dim)' }}>▶ LIVE</span>
                    </div>
                </div>
            </div>

            {/* Mobile Compact Vote Counter */}
            {totalVotes !== undefined && (
                <div className="lg:hidden flex items-center justify-center gap-3 py-1.5" style={{ borderTop: '1px solid var(--vp-border)' }}>
                    <span className="text-[9px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--vp-text-dim)' }}>VOTOS</span>
                    <span className="text-sm font-black text-glow-red" style={{ color: 'var(--vp-red)' }}>
                        {totalVotes.toLocaleString('es-PE')}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--vp-green)' }}>▲ +12.4%</span>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--vp-green)' }} />
                </div>
            )}
        </header>
    );
}

