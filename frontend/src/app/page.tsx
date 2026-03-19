'use client';

import { useState, useEffect, Suspense, Component, ReactNode } from 'react';
import { Candidate, VoteStats, getGlobalRankingAndMomentum, getRanking, getStats, getVoteStats, castVote } from '@/lib/api';
import { getAvatarUrl, getCandidatePhoto } from '@/lib/avatars';
import { useWebSocket } from '@/lib/websocket';
import { useSelection } from '@/lib/selection';
import LiveMomentum from '@/components/LiveMomentum';
import PositionInsights from '@/components/PositionInsights';
import CascadaConsenso from '@/components/CascadaConsenso';
import RankingTable from '@/components/RankingTable';
import VoteCounter from '@/components/VoteCounter';
import EncuestaPanel from '@/components/EncuestaPanel';
import PlanchasPanel from '@/components/PlanchasPanel';
import NavHeader from '@/components/NavHeader';
import ExploraCandidatos from '@/components/ExploraCandidatos';
import EvaluacionPlanchas from '@/components/EvaluacionPlanchas';
import MetodologiaSection from '@/components/MetodologiaSection';
import MemoriaElectoral from '@/components/MemoriaElectoral';
import HomepageSections from '@/components/HomepageSections';
import SiteFooter from '@/components/SiteFooter';
import SelectionCart from '@/components/SelectionCart';
import PostSelectionBar from '@/components/PostSelectionBar';
import ShareModal from '@/components/ShareModal';
import AnalisisSeleccion from '@/components/AnalisisSeleccion';
import CompareCandidates from '@/components/CompareCandidates';
import { useRouter, useSearchParams } from 'next/navigation';

// Error Boundary to prevent PlanchasPanel crashes from killing the whole page
class PlanchasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('PlanchasPanel crash caught:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg mb-2">⚠️</p>
            <p className="text-sm mb-3" style={{ color: 'var(--vp-text-dim)' }}>Error cargando planchas.</p>
            <button onClick={() => { this.setState({ hasError: false }); }} className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--vp-red)' }}>
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean' | 'comparar' | 'memoria';
const VALID_TABS: TabType[] = ['votar', 'encuesta', 'planchas', 'president', 'senator', 'deputy', 'andean', 'comparar', 'memoria'];

// TABS array is now in NavHeader component

function HomeContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const initialTab = (tabFromUrl && VALID_TABS.includes(tabFromUrl)) ? tabFromUrl : 'votar';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [momentumList, setMomentumList] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const { state: selState, selection, showDraftBanner, dismissDraftBanner, activateBuilding, editSelection, confirmSelection, hasPresident } = useSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { lastMessage } = useWebSocket();
  const router = useRouter();

  // Sync tab with URL changes (when user clicks back/forward)
  useEffect(() => {
    const newTab = searchParams.get('tab') as TabType | null;
    if (newTab && VALID_TABS.includes(newTab) && newTab !== activeTab) {
      setActiveTab(newTab);
    } else if (!newTab && activeTab !== 'votar') {
      setActiveTab('votar');
    }
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getGlobalRankingAndMomentum();
        setMomentumList(data.top_momentum || []);

        if (activeTab === 'votar') {
          const presidents = await getRanking('president');
          setCandidates(presidents);
        } else if (activeTab !== 'encuesta' && activeTab !== 'planchas') {
          const ranked = await getRanking(activeTab);
          setCandidates(ranked);
        }

        const stats = await getStats();
        setTotalVotes(stats.total_votes);
        try { const vs = await getVoteStats(); setVoteStats(vs); } catch (e) { /* optional */ }
      } catch (err) {
        console.error('Error fetching data:', err);
        const position = activeTab === 'votar' ? 'president' : activeTab;
        setCandidates(getDemoByPosition(position));
        setMomentumList(getDemoByPosition('president').slice(0, 5));
      }
    }
    fetchData();
  }, [activeTab]);

  // Handle WebSocket messages — real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'vote_cast') {
      setTotalVotes(prev => prev + 1);
    }

    if (lastMessage.type === 'ranking_updated') {
      const position = activeTab === 'votar' ? 'president' : activeTab;
      getRanking(position).then(setCandidates).catch(() => { });
      getGlobalRankingAndMomentum().then(d => setMomentumList(d.top_momentum || [])).catch(() => { });
    }

    if (lastMessage.type === 'ranking_snapshot') {
      const data = lastMessage.data as { top_momentum: Candidate[]; total_votes: number };
      if (data.top_momentum) setMomentumList(data.top_momentum as Candidate[]);
      if (data.total_votes) setTotalVotes(data.total_votes);
    }
  }, [lastMessage, activeTab]);

  const handleVote = async (candidateId: number, position: string) => {
    try {
      const result = await castVote(candidateId, position);
      if (result.success) {
        setTotalVotes(prev => prev + 1);
        const ranked = await getRanking(position);
        setCandidates(ranked);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      {/* Shared Navigation Header */}
      <NavHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ═══ SEARCH HERO — integrated on homepage ═══ */}
      <div className="search-hero">
        <div className="search-hero-inner">
          <h2 className="search-hero-title" style={{ fontSize: 30, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            Búsqueda Electoral
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#c62828', background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.15)', padding: '4px 10px', borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c62828', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
              EN VIVO
            </span>
          </h2>
          <p className="search-hero-subtitle">
            Busca candidatos, propuestas y eventos de todas las organizaciones políticas
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('homeSearch') as HTMLInputElement)?.value?.trim();
              if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
            }}
            className="search-form"
          >
            <div className="search-input-wrap">
              <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                name="homeSearch"
                placeholder="Buscar candidato, partido, propuesta, denuncia..."
                className="search-input"
              />
              <button type="submit" className="search-submit-btn">
                Buscar
              </button>
            </div>
          </form>

          <div className="search-tags">
            {[
              { label: 'Educación', icon: '📚' },
              { label: 'Corrupción', icon: '⚖️' },
              { label: 'Salud', icon: '🏥' },
              { label: 'Seguridad', icon: '🛡️' },
              { label: 'Economía', icon: '💰' },
              { label: 'Infraestructura', icon: '🏗️' },
            ].map(tag => (
              <a
                key={tag.label}
                href={`/search?q=${encodeURIComponent(tag.label.toLowerCase())}`}
                className="search-tag"
              >
                <span>{tag.icon}</span>
                {tag.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="dashboard-wrapper">
        {activeTab === 'encuesta' ? (
          /* ENCUESTA VIEW — Under Construction */
          <div className="w-full px-2">
            <div style={{ maxWidth: 700, margin: '60px auto', textAlign: 'center', padding: '60px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(188,29,25,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.5px' }}>Módulo en Construcción</h2>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 24px' }}>
                Estamos trabajando en el módulo de <strong style={{ color: '#bc1d19' }}>Encuestas</strong> para brindarte las últimas tendencias electorales con datos verificados y análisis en tiempo real.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(188,29,25,0.08)', border: '1px solid rgba(188,29,25,0.2)', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#bc1d19' }}>
                ⏳ Próximamente disponible
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 20 }}>Mientras tanto, explora los candidatos y planchas electorales.</p>
            </div>
          </div>
        ) : activeTab === 'comparar' ? (
          /* COMPARAR CANDIDATOS VIEW */
          <div className="w-full px-2">
            <CompareCandidates />
          </div>
        ) : activeTab === 'planchas' ? (
          /* PLANCHAS VIEW */
          <PlanchasErrorBoundary>
            <PlanchasPanel />
          </PlanchasErrorBoundary>
        ) : activeTab === 'memoria' ? (
          /* MEMORIA ELECTORAL VIEW */
          <div className="w-full px-2">
            <MemoriaElectoral />
          </div>
        ) : activeTab === 'votar' ? (
          /* HOME VIEW */
          <>
            <div>
              {/* ===== PREMIUM HOMEPAGE SECTIONS ===== */}
              <HomepageSections
                candidates={candidates.map(c => ({
                  id: c.id,
                  name: c.name,
                  party: c.party_name,
                  photo: c.photo,
                  score: c.final_score || 0,
                  party_color: c.party_color,
                  party_abbreviation: c.party_abbreviation,
                  integrity_score: c.integrity_score,
                  experience_score: c.experience_score,
                  plan_score: c.plan_score,
                  region: c.region,
                }))}
                onNavigate={(tab: string) => setActiveTab(tab as any)}
              />
            </div>
          </>
        ) : (
          /* RANKING TABLE VIEW — Two column: Insights sidebar + Table */
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', overflow: 'hidden' }}>
              <aside className="desktop-only" style={{ width: 300, flexShrink: 0, position: 'sticky', top: '1rem' }}>
                <PositionInsights candidates={candidates} position={activeTab} />
              </aside>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <RankingTable
                  candidates={candidates}
                  position={activeTab}
                  onVote={handleVote}
                />
              </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      {/* Compare Modal */}
      {showCompare && (
        <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false); }}>
          <div className="share-modal animate-fade-in" style={{ width: 440 }}>
            <div className="share-modal-header">
              <h3>⚖️ Comparar selecciones</h3>
              <button onClick={() => setShowCompare(false)} className="share-modal-close">✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>⚖️</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--vp-text)', marginBottom: 8 }}>Comparar selecciones</p>
              <p style={{ fontSize: 12, color: 'var(--vp-text-dim)', lineHeight: 1.6 }}>Esta funcionalidad estará disponible próximamente. Podrás comparar tu selección con la de otros usuarios.</p>
            </div>
            <button onClick={() => setShowCompare(false)} style={{
              width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              color: '#fff', background: 'var(--vp-red)', border: 'none', cursor: 'pointer'
            }}>Entendido</button>
          </div>
        </div>
      )}

      {/* Analysis Panel */}
      {showAnalysis && (
        <div className="share-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAnalysis(false); }}
          style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '40px 16px' }}>
          <div className="animate-fade-in" style={{
            background: '#ffffff', borderRadius: 16, padding: '24px 28px', width: 640, maxWidth: '95vw',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid var(--vp-border)', position: 'relative'
          }}>
            <button onClick={() => setShowAnalysis(false)} className="share-modal-close"
              style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
            <AnalisisSeleccion />
          </div>
        </div>
      )}

      {/* Footer — always visible on all pages */}
      <SiteFooter />


    </div>
  );
}

// Demo data for when API is not available
function getDemoCandidates(): Candidate[] {
  return getDemoByPosition('president');
}

const REGIONS = [
  'Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cajamarca',
  'Junín', 'Cusco', 'Puno', 'Lambayeque', 'Áncash',
  'Loreto', 'Ica', 'San Martín', 'Huánuco', 'Ucayali',
  'Ayacucho', 'Tacna', 'Madre de Dios', 'Amazonas', 'Tumbes',
  'Apurímac', 'Huancavelica', 'Moquegua', 'Pasco', 'Callao'
];

const PARTY_DATA = [
  { id: 1, name: 'Ahora Nación', abbr: 'AN', color: '#E53935' },
  { id: 2, name: 'Alianza Electoral Venceremos', abbr: 'AEV', color: '#43A047' },
  { id: 3, name: 'Alianza para el Progreso', abbr: 'APP', color: '#1565C0' },
  { id: 4, name: 'Avanza País', abbr: 'AVP', color: '#0D47A1' },
  { id: 5, name: 'Fe en el Perú', abbr: 'FEP', color: '#FF8F00' },
  { id: 6, name: 'Fuerza Popular', abbr: 'FP', color: '#FF6600' },
  { id: 7, name: 'Fuerza y Libertad', abbr: 'FYL', color: '#1976D2' },
  { id: 8, name: 'Juntos por el Perú', abbr: 'JPP', color: '#E65100' },
  { id: 9, name: 'Libertad Popular', abbr: 'LP', color: '#5D4037' },
  { id: 10, name: 'Partido Aprista Peruano', abbr: 'PAP', color: '#D32F2F' },
  { id: 11, name: 'Partido Cívico Obras', abbr: 'PCO', color: '#6D4C41' },
  { id: 12, name: 'PTE-Perú', abbr: 'PTE', color: '#00838F' },
  { id: 13, name: 'Partido del Buen Gobierno', abbr: 'PBG', color: '#EF6C00' },
  { id: 14, name: 'Partido Demócrata Unido Perú', abbr: 'PDUP', color: '#2E7D32' },
  { id: 15, name: 'Partido Demócrata Verde', abbr: 'PDV', color: '#388E3C' },
  { id: 16, name: 'Partido Democrático Federal', abbr: 'PDF', color: '#7B1FA2' },
  { id: 17, name: 'Somos Perú', abbr: 'SP', color: '#C62828' },
  { id: 18, name: 'Frente de la Esperanza 2021', abbr: 'FE21', color: '#004D40' },
  { id: 19, name: 'Partido Morado', abbr: 'PM', color: '#7B1FA2' },
  { id: 20, name: 'País para Todos', abbr: 'PPT', color: '#F9A825' },
  { id: 21, name: 'Partido Patriótico del Perú', abbr: 'PPP', color: '#BF360C' },
  { id: 22, name: 'Cooperación Popular', abbr: 'CP', color: '#AD1457' },
  { id: 23, name: 'Integridad Democrática', abbr: 'ID', color: '#00695C' },
  { id: 24, name: 'Perú Libre', abbr: 'PL', color: '#B71C1C' },
  { id: 25, name: 'Perú Acción', abbr: 'PA', color: '#01579B' },
  { id: 26, name: 'Perú Primero', abbr: 'PP', color: '#311B92' },
  { id: 27, name: 'PRIN', abbr: 'PRIN', color: '#880E4F' },
  { id: 28, name: 'Partido SICREO', abbr: 'SIC', color: '#4E342E' },
  { id: 29, name: 'Perú Moderno', abbr: 'PMOD', color: '#0277BD' },
  { id: 30, name: 'Podemos Perú', abbr: 'POD', color: '#F44336' },
  { id: 31, name: 'Primero la Gente', abbr: 'PLG', color: '#00897B' },
  { id: 32, name: 'Progresemos', abbr: 'PROG', color: '#558B2F' },
  { id: 33, name: 'Renovación Popular', abbr: 'RP', color: '#1A237E' },
  { id: 34, name: 'Salvemos al Perú', abbr: 'SAP', color: '#4A148C' },
  { id: 35, name: 'Un Camino Diferente', abbr: 'UCD', color: '#E91E63' },
  { id: 36, name: 'Unidad Nacional', abbr: 'UN', color: '#37474F' },
];

const PRESIDENTIAL_NAMES = [
  { name: 'Pablo Alfonso López Chau Nava', party: 0, region: 'Lima' },
  { name: 'Ronald Darwin Atencio Sotomayor', party: 1, region: 'Huánuco' },
  { name: 'César Acuña Peralta', party: 2, region: 'Cajamarca' },
  { name: 'José Daniel Williams Zapata', party: 3, region: 'Lima' },
  { name: 'Álvaro Gonzalo Paz de la Barra Freigeiro', party: 4, region: 'Lima' },
  { name: 'Keiko Sofía Fujimori Higuchi', party: 5, region: 'Lima' },
  { name: 'Fiorella Giannina Molinelli Aristondo', party: 6, region: 'Lima' },
  { name: 'Roberto Helbert Sánchez Palomino', party: 7, region: 'Lima' },
  { name: 'Rafael Jorge Belaúnde Llosa', party: 8, region: 'Lima' },
  { name: 'Pitter Enrique Valderrama Peña', party: 9, region: 'Lima' },
  { name: 'Ricardo Pablo Belmont Cassinelli', party: 10, region: 'Lima' },
  { name: 'Napoleón Becerra García', party: 11, region: 'Cajamarca' },
  { name: 'Jorge Nieto Montesinos', party: 12, region: 'Lima' },
  { name: 'Charlie Carrasco Salazar', party: 13, region: 'Lima' },
  { name: 'Alex Gonzales Castillo', party: 14, region: 'Lima' },
  { name: 'Armando Joaquín Masse Fernández', party: 15, region: 'Lima' },
  { name: 'George Patrick Forsyth Sommer', party: 16, region: 'Lima' },
  { name: 'Luis Fernando Olivera Vega', party: 17, region: 'Lima' },
  { name: 'Mesías Antonio Guevara Amasifuén', party: 18, region: 'San Martín' },
  { name: 'Carlos Gonsalo Alvarez Loayza', party: 19, region: 'Lima' },
  { name: 'Herbert Caller Gutiérrez', party: 20, region: 'Lima' },
  { name: 'Yonhy Lescano Ancieta', party: 21, region: 'Puno' },
  { name: 'Wolfgang Mario Grozo Costa', party: 22, region: 'Lima' },
  { name: 'Vladimir Roy Cerrón Rojas', party: 23, region: 'Junín' },
  { name: 'Francisco Ernesto Diez-Canseco Távara', party: 24, region: 'Lima' },
  { name: 'Mario Enrique Vizcarra Cornejo', party: 25, region: 'Lima' },
  { name: 'Walter Gilmer Chirinos Purizaga', party: 26, region: 'Lima' },
  { name: 'Alfonso Carlos Espa y Garcés-Alvear', party: 27, region: 'Lima' },
  { name: 'Carlos Ernesto Jaico Carranza', party: 28, region: 'Lima' },
  { name: 'José León Luna Gálvez', party: 29, region: 'Ayacucho' },
  { name: 'María Soledad Pérez Tello de Rodríguez', party: 30, region: 'Lima' },
  { name: 'Paul Davis Jaimes Blanco', party: 31, region: 'Lima' },
  { name: 'Rafael Bernardo López Aliaga Cazorla', party: 32, region: 'Lima' },
  { name: 'Antonio Ortiz Villano', party: 33, region: 'Lima' },
  { name: 'Rosario del Pilar Fernández Bazán', party: 34, region: 'Lambayeque' },
  { name: 'Roberto Enrique Chiabra León', party: 35, region: 'Lima' },
];

const FIRST_NAMES = ['Carlos', 'José', 'Luis', 'Miguel', 'Juan', 'Pedro', 'Jorge', 'Fernando', 'Roberto', 'Ricardo', 'María', 'Ana', 'Carmen', 'Patricia', 'Rosa', 'Claudia', 'Lucía', 'Silvia', 'Gloria', 'Teresa', 'Eduardo', 'Manuel', 'Francisco', 'Alberto', 'Raúl', 'Sergio', 'Daniel', 'Alejandro', 'Gladys', 'Isabel', 'Elena', 'Martha', 'Rocío', 'Pilar', 'Nelly', 'Luz', 'Víctor', 'Óscar', 'Enrique', 'Mario'];
const LAST_NAMES = ['García', 'Rodríguez', 'Martínez', 'López', 'Gonzales', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ruiz', 'Quispe', 'Huamán', 'Mendoza', 'Espinoza', 'Vásquez', 'Córdova', 'Paredes', 'Villanueva', 'Mamani', 'Condori', 'Rojas', 'Vargas', 'Castro', 'Silva', 'Herrera', 'Chávez', 'Puma', 'Apaza', 'Ticona', 'Cahuana'];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDemoByPosition(position: string): Candidate[] {
  if (position === 'president') {
    return PRESIDENTIAL_NAMES.map((p, i) => {
      const party = PARTY_DATA[p.party];
      return {
        id: i + 1,
        name: p.name,
        photo: null,
        party_id: party.id,
        position: 'president',
        region: p.region,
        biography: null,
        education: null,
        experience: null,
        birth_date: null,
        dni: null,
        intelligence_score: 35 + Math.floor(seededRandom(i * 7 + 1) * 50),
        momentum_score: 10 + Math.floor(seededRandom(i * 7 + 2) * 70),
        integrity_score: 20 + Math.floor(seededRandom(i * 7 + 3) * 70),
        risk_score: 10 + Math.floor(seededRandom(i * 7 + 4) * 50),
        stars_rating: parseFloat((1.5 + seededRandom(i * 7 + 5) * 3.5).toFixed(1)),
        final_score: parseFloat((30 + seededRandom(i * 7 + 6) * 45).toFixed(2)),
        experience_score: parseFloat((25 + seededRandom(i * 7 + 13) * 65).toFixed(2)),
        hoja_score: parseFloat((30 + seededRandom(i * 7 + 11) * 60).toFixed(2)),
        plan_score: parseFloat((20 + seededRandom(i * 7 + 12) * 70).toFixed(2)),
        vote_count: 5000 + Math.floor(seededRandom(i * 7) * 45000),
        party_name: party.name,
        party_abbreviation: party.abbr,
        party_color: party.color,
        rank: i + 1,
      };
    }).sort((a, b) => b.final_score - a.final_score);
  }

  // Generate candidates for other positions
  const candidates: Candidate[] = [];
  let id = 100;
  const perRegion = position === 'senator' ? 6 : position === 'deputy' ? 26 : 4;

  for (const region of REGIONS) {
    for (let i = 0; i < perRegion; i++) {
      const seed = id * 13 + i * 7;
      const party = PARTY_DATA[Math.floor(seededRandom(seed) * PARTY_DATA.length)];
      const fname = FIRST_NAMES[Math.floor(seededRandom(seed + 1) * FIRST_NAMES.length)];
      const lname1 = LAST_NAMES[Math.floor(seededRandom(seed + 2) * LAST_NAMES.length)];
      const lname2 = LAST_NAMES[Math.floor(seededRandom(seed + 3) * LAST_NAMES.length)];

      candidates.push({
        id: id++,
        name: `${fname} ${lname1} ${lname2}`,
        photo: null,
        party_id: party.id,
        position,
        region,
        biography: null,
        education: null,
        experience: null,
        birth_date: null,
        dni: null,
        intelligence_score: 20 + Math.floor(seededRandom(seed + 4) * 60),
        momentum_score: 5 + Math.floor(seededRandom(seed + 5) * 55),
        integrity_score: 15 + Math.floor(seededRandom(seed + 6) * 70),
        risk_score: 5 + Math.floor(seededRandom(seed + 7) * 50),
        stars_rating: parseFloat((1.5 + seededRandom(seed + 8) * 3.5).toFixed(1)),
        final_score: parseFloat((15 + seededRandom(seed + 9) * 55).toFixed(2)),
        experience_score: parseFloat((20 + seededRandom(seed + 13) * 60).toFixed(2)),
        hoja_score: parseFloat((15 + seededRandom(seed + 11) * 65).toFixed(2)),
        plan_score: parseFloat((10 + seededRandom(seed + 12) * 70).toFixed(2)),
        vote_count: 100 + Math.floor(seededRandom(seed + 10) * (position === 'senator' ? 5000 : 3000)),
        party_name: party.name,
        party_abbreviation: party.abbr,
        party_color: party.color,
        rank: 0,
      });
    }
  }

  return candidates.sort((a, b) => b.final_score - a.final_score).map((c, i) => ({ ...c, rank: i + 1 }));
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--vp-red)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
