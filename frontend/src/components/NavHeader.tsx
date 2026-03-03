'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

const EXPLORAR_ITEMS: { id: TabType; label: string }[] = [
    { id: 'president', label: 'Presidente' },
    { id: 'senator', label: 'Senado' },
    { id: 'deputy', label: 'Diputados' },
    { id: 'andean', label: 'Parl. Andino' },
];

// Clean SVG icons for mobile menu
const NAV_ICONS: Record<string, React.ReactNode> = {
    president: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
    senator: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>,
    deputy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    andean: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    encuesta: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
    planchas: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

interface NavHeaderProps {
    activeTab?: TabType;
    onTabChange?: (tab: TabType) => void;
}

export default function NavHeader({ activeTab, onTabChange }: NavHeaderProps) {
    const { isConnected } = useWebSocket();
    const { user, isLoggedIn, setShowLogin, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showExplorar, setShowExplorar] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const explorarRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleTabClick = (tabId: TabType) => {
        setShowExplorar(false);
        setShowMobileMenu(false);
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            router.push(`/?tab=${tabId}`);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (explorarRef.current && !explorarRef.current.contains(e.target as Node)) {
                setShowExplorar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handler = () => {
            if (window.innerWidth >= 769) setShowMobileMenu(false);
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const isExplorarActive = ['president', 'senator', 'deputy', 'andean'].includes(activeTab || '');

    return (
        <>
            <header className="sticky top-0 z-50 vp-header-premium">
                {/* Top gradient accent bar */}
                <div className="vp-header-accent" />
                <div className="navbar-3col">
                    {/* Logo */}
                    <div className="navbar-left">
                        <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }} onClick={() => onTabChange?.('votar')}>
                            <img
                                src="/images/logo-votape-transparent.png"
                                alt="VOTA.PE"
                                style={{ height: '100px', width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(198,40,40,0.15))' }}
                                className="logo-desktop"
                            />
                            <img
                                src="/images/logo-votape-transparent.png"
                                alt="VOTA.PE"
                                style={{ height: '55px', width: 'auto' }}
                                className="logo-mobile"
                            />
                        </Link>
                    </div>

                    {/* Center: Nav items (desktop only) */}
                    <nav className="navbar-center">
                        {/* EXPLORAR CANDIDATOS dropdown */}
                        <div className="relative" ref={explorarRef}>
                            <button
                                onClick={() => setShowExplorar(!showExplorar)}
                                className={`vp-nav-item ${isExplorarActive ? 'vp-nav-active' : ''}`}
                            >
                                EXPLORAR CANDIDATOS
                                <span className="explorar-chevron" style={{ transform: showExplorar ? 'rotate(180deg)' : 'none', marginLeft: 4, fontSize: 10 }}>▾</span>
                            </button>

                            {showExplorar && (
                                <div className="explorar-dropdown animate-fade-in">
                                    {EXPLORAR_ITEMS.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleTabClick(item.id)}
                                            className={`explorar-dropdown-item ${activeTab === item.id ? 'active' : ''}`}
                                        >
                                            <span className="explorar-dropdown-icon">{NAV_ICONS[item.id]}</span>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ENCUESTA */}
                        <button
                            onClick={() => handleTabClick('encuesta')}
                            className={`vp-nav-item ${activeTab === 'encuesta' ? 'vp-nav-active' : ''}`}
                        >
                            ENCUESTA
                        </button>

                        {/* PLANCHAS */}
                        <button
                            onClick={() => handleTabClick('planchas')}
                            className={`vp-nav-item ${activeTab === 'planchas' ? 'vp-nav-active' : ''}`}
                        >
                            PLANCHAS
                        </button>
                    </nav>

                    {/* Right: Login + LIVE (desktop) */}
                    <div className="navbar-right navbar-right-desktop">
                        {isLoggedIn && user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="vp-user-btn"
                                >
                                    <div className="vp-user-avatar">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="vp-user-name">
                                        {user.alias || user.name.split(' ')[0]}
                                    </span>
                                    {user.verified && <span style={{ fontSize: 10 }} title="Verificado">✅</span>}
                                </button>
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 z-50 animate-fade-in"
                                        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                                        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div className="text-xs font-bold" style={{ color: '#fff' }}>{user.name}</div>
                                            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.email || user.phone || user.alias}</div>
                                        </div>
                                        <button
                                            onClick={() => { logout(); setShowUserMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
                                            style={{ color: '#ef5350' }}
                                        >
                                            🚪 Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="vp-login-btn"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                MI CUENTA
                            </button>
                        )}

                        {/* LIVE indicator */}
                        <div className="vp-live-badge">
                            <div className={`vp-live-dot ${isConnected ? 'vp-live-connected' : ''}`} />
                            <span>LIVE</span>
                        </div>
                    </div>

                    {/* Right: Mobile icons (search + hamburger) */}
                    <div className="navbar-right-mobile">
                        <button
                            className={`mobile-icon-btn ${showMobileSearch ? 'mobile-icon-active' : ''}`}
                            onClick={() => { setShowMobileSearch(!showMobileSearch); setShowMobileMenu(false); }}
                            aria-label="Buscar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                        <button
                            className={`mobile-icon-btn mobile-hamburger ${showMobileMenu ? 'mobile-icon-active' : ''}`}
                            onClick={() => { setShowMobileMenu(!showMobileMenu); setShowMobileSearch(false); }}
                            aria-label="Menú"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {showMobileMenu ? (
                                    <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                ) : (
                                    <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile search bar dropdown */}
            {showMobileSearch && (
                <div className="mobile-search-dropdown animate-fade-in">
                    <form
                        onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem('mobileSearch') as HTMLInputElement)?.value?.trim(); if (q) { window.location.href = `/search?q=${encodeURIComponent(q)}`; setShowMobileSearch(false); } }}
                        className="mobile-search-form"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--vp-text-dim)' }}>
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            name="mobileSearch"
                            placeholder="Buscar candidatos, partidos..."
                            className="mobile-search-input"
                            autoFocus
                        />
                        <button type="button" onClick={() => setShowMobileSearch(false)} className="mobile-search-close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Mobile slide-out navigation */}
            {showMobileMenu && (
                <div className="mobile-nav-overlay animate-fade-in" onClick={() => setShowMobileMenu(false)}>
                    <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--vp-text-dim)' }}>Menú</span>
                            <button onClick={() => setShowMobileMenu(false)} className="mobile-icon-btn" style={{ width: 32, height: 32 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="mobile-nav-section">
                            <div className="mobile-nav-label">Explorar Candidatos</div>
                            {EXPLORAR_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabClick(item.id)}
                                    className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                                >
                                    <span className="mobile-nav-icon">{NAV_ICONS[item.id]}</span> {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="mobile-nav-divider" />
                        <button onClick={() => handleTabClick('encuesta')} className={`mobile-nav-item ${activeTab === 'encuesta' ? 'active' : ''}`}>
                            <span className="mobile-nav-icon">{NAV_ICONS.encuesta}</span> Encuesta
                        </button>
                        <button onClick={() => handleTabClick('planchas')} className={`mobile-nav-item ${activeTab === 'planchas' ? 'active' : ''}`}>
                            <span className="mobile-nav-icon">{NAV_ICONS.planchas}</span> Planchas
                        </button>
                        <div className="mobile-nav-divider" />

                        {/* LIVE status */}
                        <div className="mobile-nav-item" style={{ cursor: 'default' }}>
                            <div className={`vp-live-dot ${isConnected ? 'vp-live-connected' : ''}`} style={{ width: 8, height: 8 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
                        </div>
                        <div className="mobile-nav-divider" />

                        {/* Account */}
                        {isLoggedIn && user ? (
                            <div className="mobile-nav-section">
                                <div className="mobile-nav-user">
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, background: 'var(--vp-red)', color: '#fff' }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--vp-text)' }}>{user.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--vp-text-dim)' }}>{user.email || user.phone || user.alias}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { logout(); setShowMobileMenu(false); }}
                                    className="mobile-nav-item"
                                    style={{ color: 'var(--vp-red)' }}
                                >
                                    <span className="mobile-nav-icon">{NAV_ICONS.logout}</span> Cerrar sesión
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setShowLogin(true); setShowMobileMenu(false); }}
                                className="mobile-nav-login-btn"
                            >
                                {NAV_ICONS.user}
                                Mi Cuenta
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
