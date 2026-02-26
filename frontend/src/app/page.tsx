'use client';

import { useState, useEffect } from 'react';
import { Candidate, getGlobalRankingAndMomentum, getRanking, getStats, castVote } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import CanchaDemocracia from '@/components/CanchaDemocracia';
import LiveMomentum from '@/components/LiveMomentum';
import CascadaConsenso from '@/components/CascadaConsenso';
import RankingTable from '@/components/RankingTable';
import MobileTabBar from '@/components/MobileTabBar';
import VoteCounter from '@/components/VoteCounter';
import EncuestaPanel from '@/components/EncuestaPanel';
import PlanchasPanel from '@/components/PlanchasPanel';
import NavHeader from '@/components/NavHeader';
import { useRouter } from 'next/navigation';

type TabType = 'votar' | 'encuesta' | 'planchas' | 'president' | 'senator' | 'deputy' | 'andean';

// TABS array is now in NavHeader component

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('votar');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [momentumList, setMomentumList] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(1245882);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { lastMessage } = useWebSocket();
  const router = useRouter();

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
        setTotalVotes(stats.total_votes + 1245882);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Use position-specific demo data if API fails
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

    // Auto-refresh rankings when server recalculates
    if (lastMessage.type === 'ranking_updated') {
      const position = activeTab === 'votar' ? 'president' : activeTab;
      getRanking(position).then(setCandidates).catch(() => { });
      getGlobalRankingAndMomentum().then(d => setMomentumList(d.top_momentum || [])).catch(() => { });
    }

    // Periodic snapshot — update momentum and totals
    if (lastMessage.type === 'ranking_snapshot') {
      const data = lastMessage.data as { top_momentum: Candidate[]; total_votes: number };
      if (data.top_momentum) setMomentumList(data.top_momentum as Candidate[]);
      if (data.total_votes) setTotalVotes(data.total_votes + 1245882);
    }
  }, [lastMessage, activeTab]);

  const handleVote = async (candidateId: number, position: string) => {
    try {
      const result = await castVote(candidateId, position);
      if (result.success) {
        setTotalVotes(prev => prev + 1);
        // Refresh ranking
        const ranked = await getRanking(position);
        setCandidates(ranked);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--vp-bg)' }}>
      {/* Shared Navigation Header */}
      <NavHeader activeTab={activeTab} onTabChange={setActiveTab} totalVotes={totalVotes} />

      {/* Main Content */}
      <main className="dashboard-wrapper">
        {activeTab === 'encuesta' ? (
          /* ENCUESTA VIEW */
          <div className="max-w-[900px] mx-auto w-full px-2">
            <EncuestaPanel />
          </div>
        ) : activeTab === 'planchas' ? (
          /* PLANCHAS VIEW */
          <PlanchasPanel />
        ) : activeTab === 'votar' ? (
          /* CANCHA VIEW */
          <div className="cancha-layout grid grid-cols-1 lg:grid-cols-[17.5fr_65fr_17.5fr] gap-[2.5rem]">
            {/* Left Panel - Live Momentum */}
            <aside className="desktop-only sidebar-card">
              <LiveMomentum candidates={momentumList} />
            </aside>

            {/* Center - Cancha de la Democracia */}
            <div className="flex flex-col gap-4">
              <CanchaDemocracia candidates={candidates} onVote={handleVote} />
            </div>

            {/* Right Panel - Cascada de Consenso */}
            <aside className="desktop-only sidebar-card">
              <VoteCounter total={totalVotes} />
              <div className="mt-3">
                <CascadaConsenso />
              </div>
            </aside>
          </div>
        ) : (
          /* RANKING TABLE VIEW — centered layout */
          <div className="ranking-layout">
            <aside className="desktop-only sidebar-card ranking-sidebar">
              <LiveMomentum candidates={momentumList} />
            </aside>
            <div className="ranking-main">
              <RankingTable
                candidates={candidates}
                position={activeTab}
                onVote={handleVote}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
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

