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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

