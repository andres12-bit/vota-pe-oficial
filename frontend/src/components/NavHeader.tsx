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
    const [countdown, setCountdown] = useState({ months: 0, days: 0, hours: 0, minutes: 0 });
    const explorarRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const ELECTION_DATE = new Date('2026-04-12T07:00:00-05:00');
    useEffect(() => {
        function updateCountdown() {
            const now = new Date();
            const diff = Math.max(0, ELECTION_DATE.getTime() - now.getTime());
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setCountdown({ months: 0, days, hours, minutes });
        }
        updateCountdown();
        const timer = setInterval(updateCountdown, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleTabClick = (tabId: TabType) => {
        setShowExplorar(false);
        setShowMobileMenu(false);
        if (onTabChange) {
            onTabChange(tabId);
            const url = tabId === 'votar' ? '/' : `/?tab=${tabId}`;
            window.history.replaceState(null, '', url);
        } else {
            router.push(`/?tab=${tabId}`);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (explorarRef.current && !explorarRef.current.contains(e.target as Node)) {
                setShowExplorar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = () => {
            if (window.innerWidth >= 769) setShowMobileMenu(false);
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-50 vp-header-premium">
                <div className="vp-header-accent" />

                {/* ═══ MOBILE: countdown bar ═══ */}
                <div className="mobile-countdown-bar">
                    <span className="mobile-cd-label">Faltan:</span>
                    <div className="mobile-cd-boxes">
                        <div className="mobile-cd-box">
                            <span className="mobile-cd-num">{String(countdown.days).padStart(2, '0')}</span>
                            <span className="mobile-cd-unit">Días</span>
                        </div>
                        <div className="mobile-cd-box">
                            <span className="mobile-cd-num">{String(countdown.hours).padStart(2, '0')}</span>
                            <span className="mobile-cd-unit">Horas</span>
                        </div>
                        <div className="mobile-cd-box">
                            <span className="mobile-cd-num">{String(countdown.minutes).padStart(2, '0')}</span>
                            <span className="mobile-cd-unit">Minutos</span>
                        </div>
                    </div>
                </div>

                {/* ═══ TOP ROW: Logo + Countdown (desktop) ═══ */}
                <div className="navbar-top-row">
                    <div className="navbar-left">
                        <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }} onClick={() => onTabChange?.('votar')}>
                            <div className="logo-desktop" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src="/images/peru-map-icon.png" alt="" style={{ height: '52px', width: 'auto' }} />
                                <div style={{ lineHeight: 1.15 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#1B2A4A', letterSpacing: '-0.5px' }}>Pulso</span>
                                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#c62828', letterSpacing: '-0.5px' }}>Electoral</span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#c62828', marginLeft: '1px' }}>.pe</span>
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#c62828', marginTop: '2px' }}>
                                        12 de abril de 2026
                                    </div>
                                </div>
                            </div>
                            <div className="logo-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src="/images/peru-map-icon.png" alt="" style={{ height: '34px', width: 'auto' }} />
                                <div style={{ lineHeight: 1.15 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#1B2A4A' }}>Pulso</span>
                                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#c62828' }}>Electoral</span>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#c62828', marginLeft: '1px' }}>.pe</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop countdown */}
                    <div className="navbar-countdown-desktop">
                        <span className="navbar-countdown-label">FALTAN:</span>
                        <div className="navbar-countdown-boxes">
                            <div className="navbar-cd-box">
                                <span className="navbar-cd-num">{String(countdown.days).padStart(2, '0')}</span>
                                <span className="navbar-cd-unit">DÍAS</span>
                            </div>
                            <div className="navbar-cd-box">
                                <span className="navbar-cd-num">{String(countdown.hours).padStart(2, '0')}</span>
                                <span className="navbar-cd-unit">HORAS</span>
                            </div>
                            <div className="navbar-cd-box">
                                <span className="navbar-cd-num">{String(countdown.minutes).padStart(2, '0')}</span>
                                <span className="navbar-cd-unit">MINUTOS</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile: hamburger only */}
                    <div className="navbar-right-mobile">
                        <button
                            className={`mobile-icon-btn mobile-hamburger ${showMobileMenu ? 'mobile-icon-active' : ''}`}
                            onClick={() => { setShowMobileMenu(!showMobileMenu); setShowMobileSearch(false); }}
                            aria-label="Menú"
                        >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round">
                                {showMobileMenu ? (
                                    <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                ) : (
                                    <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ═══ BOTTOM ROW: Navy Navigation Bar (desktop) ═══ */}
                <nav className="navbar-nav-row">
                    <div className="navbar-nav-inner">
                        {/* EXPLORAR CANDIDATOS — always yellow button */}
                        <div className="relative" ref={explorarRef}>
                            <button
                                onClick={() => setShowExplorar(!showExplorar)}
                                className="navbar-explorar-btn"
                            >
                                Explorar Candidatos
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

                        {/* ENCUESTA — yellow underline when active */}
                        <button
                            onClick={() => handleTabClick('encuesta')}
                            className={`navbar-nav-link ${activeTab === 'encuesta' ? 'navbar-nav-link-active' : ''}`}
                        >
                            Encuesta
                        </button>

                        {/* PLANCHAS */}
                        <button
                            onClick={() => handleTabClick('planchas')}
                            className={`navbar-nav-link ${activeTab === 'planchas' ? 'navbar-nav-link-active' : ''}`}
                        >
                            Planchas
                        </button>

                        {/* RADAR */}
                        <button
                            onClick={() => router.push('/radar')}
                            className="navbar-nav-link"
                        >
                            Radar Electoral
                        </button>

                        {/* Right side */}
                        <div className="navbar-nav-right">
                            {isLoggedIn && user ? (
                                <div className="relative">
                                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="navbar-mi-cuenta-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B2A4A"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                        MI CUENTA
                                    </button>
                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 z-50 animate-fade-in"
                                            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                                            <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                                <div className="text-xs font-bold" style={{ color: '#1a1a2e' }}>{user.name}</div>
                                                <div className="text-[10px]" style={{ color: 'rgba(0,0,0,0.5)' }}>{user.email || user.phone || user.alias}</div>
                                            </div>
                                            <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold" style={{ color: '#ef5350' }}>
                                                🚪 Cerrar sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => setShowLogin(true)} className="navbar-mi-cuenta-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#1B2A4A"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                    MI CUENTA
                                </button>
                            )}

                            {/* EN VIVO — yellow text with blinking green dot */}
                            <div className="navbar-envivo">
                                <div className={`navbar-envivo-dot ${isConnected ? 'navbar-envivo-dot-active' : ''}`} />
                                <span>EN VIVO</span>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Mobile search dropdown */}
            {showMobileSearch && (
                <div className="mobile-search-dropdown animate-fade-in">
                    <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem('mobileSearch') as HTMLInputElement)?.value?.trim(); if (q) { window.location.href = `/search?q=${encodeURIComponent(q)}`; setShowMobileSearch(false); } }} className="mobile-search-form">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--vp-text-dim)' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        <input type="text" name="mobileSearch" placeholder="Buscar candidatos, partidos..." className="mobile-search-input" autoFocus />
                        <button type="button" onClick={() => setShowMobileSearch(false)} className="mobile-search-close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Mobile dropdown menu */}
            {showMobileMenu && (
                <div className="mobile-menu-dropdown animate-fade-in">
                    {/* Repeat header in dropdown */}
                    <div className="mobile-menu-header">
                        {/* Countdown bar */}
                        <div className="mobile-countdown-bar" style={{ width: '100%' }}>
                            <span className="mobile-cd-label">Faltan:</span>
                            <div className="mobile-cd-boxes">
                                <div className="mobile-cd-box"><span className="mobile-cd-num">{String(countdown.days).padStart(2, '0')}</span><span className="mobile-cd-unit">Días</span></div>
                                <div className="mobile-cd-box"><span className="mobile-cd-num">{String(countdown.hours).padStart(2, '0')}</span><span className="mobile-cd-unit">Horas</span></div>
                                <div className="mobile-cd-box"><span className="mobile-cd-num">{String(countdown.minutes).padStart(2, '0')}</span><span className="mobile-cd-unit">Minutos</span></div>
                            </div>
                        </div>
                        {/* Logo + close */}
                        <div className="mobile-menu-logo-row">
                            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => { setShowMobileMenu(false); onTabChange?.('votar'); }}>
                                <img src="/images/peru-map-icon.png" alt="" style={{ height: 32, width: 'auto' }} />
                                <div style={{ lineHeight: 1.1 }}>
                                    <span style={{ fontSize: 15, fontWeight: 900, color: '#1B2A4A' }}>Pulso</span>
                                    <span style={{ fontSize: 15, fontWeight: 900, color: '#c62828' }}>Electoral</span>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#c62828', marginLeft: 2 }}>.pe</span>
                                </div>
                            </Link>
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                style={{ background: '#f9a825', border: 'none', borderRadius: 6, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="mobile-menu-items">
                        <button
                            onClick={() => { setShowExplorar(!showExplorar); }}
                            className="mobile-menu-explorar"
                        >
                            Explorar Candidatos
                            <span style={{ transform: showExplorar ? 'rotate(180deg)' : 'none', display: 'inline-block', marginLeft: 6, fontSize: 10, transition: '0.2s' }}>▾</span>
                        </button>

                        {showExplorar && (
                            <div className="mobile-menu-sub">
                                {EXPLORAR_ITEMS.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabClick(item.id)}
                                        className={`mobile-menu-sub-item ${activeTab === item.id ? 'active' : ''}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button onClick={() => handleTabClick('encuesta')} className={`mobile-menu-link ${activeTab === 'encuesta' ? 'mobile-menu-link-active' : ''}`}>
                            Encuestas
                        </button>
                        <button onClick={() => handleTabClick('planchas')} className={`mobile-menu-link ${activeTab === 'planchas' ? 'mobile-menu-link-active' : ''}`}>
                            Planchas
                        </button>
                        <button onClick={() => { router.push('/radar'); setShowMobileMenu(false); }} className="mobile-menu-link">
                            Radar Electoral
                        </button>

                        <div className="mobile-menu-divider" />

                        {isLoggedIn && user ? (
                            <>
                                <div className="mobile-menu-link" style={{ cursor: 'default', fontWeight: 700 }}>{user.name}</div>
                                <button onClick={() => { logout(); setShowMobileMenu(false); }} className="mobile-menu-link" style={{ color: '#c62828' }}>
                                    Cerrar sesión
                                </button>
                            </>
                        ) : (
                            <button onClick={() => { setShowLogin(true); setShowMobileMenu(false); }} className="mobile-menu-link" style={{ fontWeight: 700 }}>
                                MI CUENTA
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
