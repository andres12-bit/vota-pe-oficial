import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PulsoElectoral.pe — Inteligencia Electoral en Tiempo Real",
  description: "Plataforma de inteligencia electoral del Perú. Analiza candidatos, partidos, rankings, encuestas y planes de gobierno. Datos del JNE. Elecciones 2026.",
  keywords: "elecciones perú 2026, candidatos, votación, ranking político, encuesta, JNE, intención de voto, partidos políticos perú, pulso electoral",
  metadataBase: new URL('https://pulsoelectoral.pe'),
  alternates: { canonical: '/' },
  openGraph: {
    title: "PulsoElectoral.pe — Inteligencia Electoral en Tiempo Real",
    description: "Plataforma de inteligencia electoral del Perú. Analiza candidatos, partidos y encuestas. Elecciones 2026.",
    url: 'https://pulsoelectoral.pe',
    siteName: 'PulsoElectoral.pe',
    type: 'website',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PulsoElectoral.pe — Inteligencia Electoral en Tiempo Real",
    description: "Analiza candidatos, partidos y encuestas electorales del Perú 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PulsoElectoral.pe",
              "url": "https://pulsoelectoral.pe",
              "description": "Plataforma de inteligencia electoral del Perú. Elecciones 2026.",
              "inLanguage": "es",
              "publisher": {
                "@type": "Organization",
                "name": "PulsoElectoral.pe",
                "url": "https://pulsoelectoral.pe"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://pulsoelectoral.pe/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />

        {/* ═══ LOADING OVERLAY — shows immediately, fades out on load ═══ */}
        <div id="loading-overlay" style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          transition: 'opacity 0.5s ease, visibility 0.5s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'pulse-logo 1.8s ease-in-out infinite' }}>
            <img src="/images/peru-map-icon.png" alt="" width={64} height={64} style={{ width: 64, height: 'auto' }} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#1B2A4A', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>Pulso</span>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#c62828', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>Electoral</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#c62828', marginLeft: 2, fontFamily: 'Inter, sans-serif' }}>.pe</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c62828', marginTop: 3, fontFamily: 'Inter, sans-serif' }}>
                12 de abril de 2026
              </div>
            </div>
          </div>
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="loading-spinner" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5a6a8a', letterSpacing: '0.3px', fontFamily: 'Inter, sans-serif' }}>
              Cargando datos electorales...
            </span>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse-logo {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.85; }
          }
          @keyframes spin-loader {
            to { transform: rotate(360deg); }
          }
          .loading-spinner {
            width: 20px; height: 20px;
            border: 3px solid #e0e0e0;
            border-top-color: #c62828;
            border-radius: 50%;
            animation: spin-loader 0.8s linear infinite;
          }
          #loading-overlay.hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}} />

        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            function hideOverlay() {
              var el = document.getElementById('loading-overlay');
              if (el) {
                el.classList.add('hidden');
                setTimeout(function() { el.remove(); }, 600);
              }
            }
            if (document.readyState === 'complete') {
              setTimeout(hideOverlay, 300);
            } else {
              window.addEventListener('load', function() {
                setTimeout(hideOverlay, 300);
              });
            }
            // Fallback: force hide after 5 seconds
            setTimeout(hideOverlay, 5000);
          })();
        `}} />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

