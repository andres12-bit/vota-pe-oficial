'use client';

import NavHeader from '@/components/NavHeader';
import SiteFooter from '@/components/SiteFooter';
import Link from 'next/link';

export default function RadarPage() {
    return (
        <>
            <NavHeader />
            <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
                <div style={{ maxWidth: 700, textAlign: 'center', padding: '60px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(188,29,25,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.5px' }}>Módulo en Construcción</h1>
                    <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 24px' }}>
                        Estamos trabajando en el <strong style={{ color: '#bc1d19' }}>Radar Electoral</strong> para ofrecerte análisis profundo de datos políticos, rankings de partidos, alertas electorales y métricas comparativas.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(188,29,25,0.08)', border: '1px solid rgba(188,29,25,0.2)', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#bc1d19', marginBottom: 24 }}>
                        ⏳ Próximamente disponible
                    </div>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Mientras tanto, explora los candidatos y planchas electorales.</p>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#bc1d19', color: '#fff', padding: '10px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, transition: 'opacity 0.2s' }}>
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
            <SiteFooter />
        </>
    );
}
