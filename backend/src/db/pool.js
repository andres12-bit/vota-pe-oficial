/**
 * VOTA.PE — Database Pool (Dual Mode)
 * 
 * MODE 1: If DATABASE_URL is set → connects to real PostgreSQL
 * MODE 2: If DATABASE_URL is absent → uses in-memory DB with seed data
 * 
 * Both modes expose the same pg.Pool interface: query(), connect(), end()
 */
require('dotenv').config();

// ==================== POSTGRESQL MODE ====================
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pgPool.on('error', (err) => {
    console.error('[PG] Unexpected pool error:', err.message);
  });

  pgPool.query('SELECT NOW()')
    .then(() => console.log('[PG] ✅ Connected to PostgreSQL via DATABASE_URL'))
    .catch(err => console.error('[PG] ❌ Connection failed:', err.message));

  module.exports = pgPool;
  return; // Stop executing — don't load in-memory DB below
}

// ==================== IN-MEMORY MODE ====================
console.log('[MEM-DB] 🧠 No DATABASE_URL set — using in-memory database');

// ==================== DATA STORE ====================
const store = {
  parties: [],
  candidates: [],
  candidate_proposals: [],
  candidate_events: [],
  candidate_vice_presidents: [],
  candidate_plan_gobierno: [],
  votes: [],
  users: [],
  party_scores: [],
};

let nextId = { parties: 1, candidates: 1, proposals: 1, events: 1, votes: 1, users: 1, vps: 1, plan: 1 };

// ==================== SEED DATA ====================
const PARTIES_SEED = [
  { name: 'Ahora Nación', abbreviation: 'AN', color: '#E53935' },
  { name: 'Alianza Electoral Venceremos', abbreviation: 'AEV', color: '#43A047' },
  { name: 'Alianza para el Progreso', abbreviation: 'APP', color: '#1565C0' },
  { name: 'Avanza País', abbreviation: 'AVP', color: '#0D47A1' },
  { name: 'Fe en el Perú', abbreviation: 'FEP', color: '#FF8F00' },
  { name: 'Fuerza Popular', abbreviation: 'FP', color: '#FF6600' },
  { name: 'Fuerza y Libertad', abbreviation: 'FYL', color: '#1976D2' },
  { name: 'Juntos por el Perú', abbreviation: 'JPP', color: '#E65100' },
  { name: 'Libertad Popular', abbreviation: 'LP', color: '#5D4037' },
  { name: 'Partido Aprista Peruano', abbreviation: 'PAP', color: '#D32F2F' },
  { name: 'Partido Cívico Obras', abbreviation: 'PCO', color: '#6D4C41' },
  { name: 'PTE-Perú', abbreviation: 'PTE', color: '#00838F' },
  { name: 'Partido del Buen Gobierno', abbreviation: 'PBG', color: '#EF6C00' },
  { name: 'Partido Demócrata Unido Perú', abbreviation: 'PDUP', color: '#2E7D32' },
  { name: 'Partido Demócrata Verde', abbreviation: 'PDV', color: '#388E3C' },
  { name: 'Partido Democrático Federal', abbreviation: 'PDF', color: '#7B1FA2' },
  { name: 'Somos Perú', abbreviation: 'SP', color: '#C62828' },
  { name: 'Frente de la Esperanza 2021', abbreviation: 'FE21', color: '#004D40' },
  { name: 'Partido Morado', abbreviation: 'PM', color: '#7B1FA2' },
  { name: 'País para Todos', abbreviation: 'PPT', color: '#F9A825' },
  { name: 'Partido Patriótico del Perú', abbreviation: 'PPP', color: '#BF360C' },
  { name: 'Cooperación Popular', abbreviation: 'CP', color: '#AD1457' },
  { name: 'Integridad Democrática', abbreviation: 'ID', color: '#00695C' },
  { name: 'Perú Libre', abbreviation: 'PL', color: '#B71C1C' },
  { name: 'Perú Acción', abbreviation: 'PA', color: '#01579B' },
  { name: 'Perú Primero', abbreviation: 'PP', color: '#311B92' },
  { name: 'PRIN', abbreviation: 'PRIN', color: '#880E4F' },
  { name: 'Partido SICREO', abbreviation: 'SIC', color: '#4E342E' },
  { name: 'Perú Moderno', abbreviation: 'PMOD', color: '#0277BD' },
  { name: 'Podemos Perú', abbreviation: 'POD', color: '#F44336' },
  { name: 'Primero la Gente', abbreviation: 'PLG', color: '#00897B' },
  { name: 'Progresemos', abbreviation: 'PROG', color: '#558B2F' },
  { name: 'Renovación Popular', abbreviation: 'RP', color: '#1A237E' },
  { name: 'Salvemos al Perú', abbreviation: 'SAP', color: '#4A148C' },
  { name: 'Un Camino Diferente', abbreviation: 'UCD', color: '#E91E63' },
  { name: 'Unidad Nacional', abbreviation: 'UN', color: '#37474F' },
];

const PRESIDENTIAL_SEED = [
  { name: 'Pablo Alfonso López Chau Nava', party: 'Ahora Nación', region: 'Lima', bio: 'Rector de la Universidad Nacional de Ingeniería. Doctor en Economía por la UNAM.', stars: 3.5 },
  { name: 'Ronald Darwin Atencio Sotomayor', party: 'Alianza Electoral Venceremos', region: 'Huánuco', bio: 'Abogado egresado de la USMP. Representante de la Alianza Electoral Venceremos.', stars: 2.4 },
  { name: 'César Acuña Peralta', party: 'Alianza para el Progreso', region: 'Cajamarca', bio: 'Fundador de la Universidad César Vallejo. Ex Gobernador Regional de La Libertad.', stars: 2.8 },
  { name: 'José Daniel Williams Zapata', party: 'Avanza País', region: 'Lima', bio: 'Congresista 2021-2025. Licenciado en Ciencias Militares. Maestría en Defensa Nacional.', stars: 3.0 },
  { name: 'Álvaro Gonzalo Paz de la Barra Freigeiro', party: 'Fe en el Perú', region: 'Lima', bio: 'Ex Alcalde de La Molina. Ex presidente de AMPE. Abogado por la USMP.', stars: 2.6 },
  { name: 'Keiko Sofía Fujimori Higuchi', party: 'Fuerza Popular', region: 'Lima', bio: 'Presidenta de Fuerza Popular. Ex congresista. MBA de Columbia University. Tres veces candidata presidencial.', stars: 3.2 },
  { name: 'Fiorella Giannina Molinelli Aristondo', party: 'Fuerza y Libertad', region: 'Lima', bio: 'Ex Presidenta de EsSalud. Ex Ministra del MIDIS. Economista PUCP.', stars: 3.6 },
  { name: 'Roberto Helbert Sánchez Palomino', party: 'Juntos por el Perú', region: 'Lima', bio: 'Congresista y ex Ministro de Comercio Exterior y Turismo. Psicólogo UNMSM.', stars: 2.9 },
  { name: 'Rafael Jorge Belaúnde Llosa', party: 'Libertad Popular', region: 'Lima', bio: 'Ex Ministro de Energía y Minas. Economista de la Universidad de Lima.', stars: 3.3 },
  { name: 'Pitter Enrique Valderrama Peña', party: 'Partido Aprista Peruano', region: 'Lima', bio: 'Bachiller en Derecho por la USMP. Analista legal y militante del APRA.', stars: 2.2 },
  { name: 'Ricardo Pablo Belmont Cassinelli', party: 'Partido Cívico Obras', region: 'Lima', bio: 'Comunicador, empresario y político. Ex Alcalde de Lima (1990-1995).', stars: 2.5 },
  { name: 'Napoleón Becerra García', party: 'PTE-Perú', region: 'Cajamarca', bio: 'Líder del PTE-Perú. Político de base cajamarquina.', stars: 2.0 },
  { name: 'Jorge Nieto Montesinos', party: 'Partido del Buen Gobierno', region: 'Lima', bio: 'Ex Ministro de Defensa y de Cultura. Sociólogo y analista político.', stars: 3.4 },
  { name: 'Charlie Carrasco Salazar', party: 'Partido Demócrata Unido Perú', region: 'Lima', bio: 'Representante del Partido Demócrata Unido Perú. Político emergente.', stars: 2.1 },
  { name: 'Alex Gonzales Castillo', party: 'Partido Demócrata Verde', region: 'Lima', bio: 'Candidato del Partido Demócrata Verde. Defensor del ambientalismo.', stars: 2.3 },
  { name: 'Armando Joaquín Masse Fernández', party: 'Partido Democrático Federal', region: 'Lima', bio: 'Representante del Partido Democrático Federal. Propone un estado federal.', stars: 2.0 },
  { name: 'George Patrick Forsyth Sommer', party: 'Somos Perú', region: 'Lima', bio: 'Ex futbolista profesional y ex Alcalde de La Victoria.', stars: 3.3 },
  { name: 'Luis Fernando Olivera Vega', party: 'Frente de la Esperanza 2021', region: 'Lima', bio: 'Líder del FE21. Ex parlamentario y político de larga trayectoria.', stars: 2.7 },
  { name: 'Mesías Antonio Guevara Amasifuén', party: 'Partido Morado', region: 'San Martín', bio: 'Candidato del Partido Morado. Representante de la Amazonía peruana.', stars: 2.8 },
  { name: 'Carlos Gonsalo Alvarez Loayza', party: 'País para Todos', region: 'Lima', bio: 'Representante de País para Todos. Empresario y político.', stars: 2.1 },
  { name: 'Herbert Caller Gutiérrez', party: 'Partido Patriótico del Perú', region: 'Lima', bio: 'Líder del Partido Patriótico del Perú. Político nacionalista.', stars: 2.4 },
  { name: 'Yonhy Lescano Ancieta', party: 'Cooperación Popular', region: 'Puno', bio: 'Abogado. Congresista por múltiples periodos. Ex candidato presidencial 2021.', stars: 3.0 },
  { name: 'Wolfgang Mario Grozo Costa', party: 'Integridad Democrática', region: 'Lima', bio: 'Líder de Integridad Democrática. Comprometido con la transparencia.', stars: 2.3 },
  { name: 'Vladimir Roy Cerrón Rojas', party: 'Perú Libre', region: 'Junín', bio: 'Médico cirujano. Fundador de Perú Libre. Ex Gobernador Regional de Junín.', stars: 1.8 },
  { name: 'Francisco Ernesto Diez-Canseco Távara', party: 'Perú Acción', region: 'Lima', bio: 'Representante de Perú Acción. Político con experiencia legislativa.', stars: 2.5 },
  { name: 'Mario Enrique Vizcarra Cornejo', party: 'Perú Primero', region: 'Lima', bio: 'Líder de Perú Primero. Promueve modernización del Estado.', stars: 2.2 },
  { name: 'Walter Gilmer Chirinos Purizaga', party: 'PRIN', region: 'Lima', bio: 'Representante del partido PRIN. Político independiente.', stars: 2.0 },
  { name: 'Alfonso Carlos Espa y Garcés-Alvear', party: 'Partido SICREO', region: 'Lima', bio: 'Fundador de SICREO. Propone un sistema de crédito social.', stars: 1.9 },
  { name: 'Carlos Ernesto Jaico Carranza', party: 'Perú Moderno', region: 'Lima', bio: 'Líder de Perú Moderno. Promueve modernización tecnológica.', stars: 2.3 },
  { name: 'José León Luna Gálvez', party: 'Podemos Perú', region: 'Ayacucho', bio: 'Empresario. Fundador de U. Telesup. Congresista y líder de Podemos Perú.', stars: 2.5 },
  { name: 'María Soledad Pérez Tello de Rodríguez', party: 'Primero la Gente', region: 'Lima', bio: 'Ex Ministra de Justicia y Derechos Humanos. Abogada y defensora de derechos.', stars: 3.7 },
  { name: 'Paul Davis Jaimes Blanco', party: 'Progresemos', region: 'Lima', bio: 'Representante de Progresemos. Visión de desarrollo progresista.', stars: 2.1 },
  { name: 'Rafael Bernardo López Aliaga Cazorla', party: 'Renovación Popular', region: 'Lima', bio: 'Empresario y actual Alcalde de Lima Metropolitana. Fundador de Renovación Popular.', stars: 2.8 },
  { name: 'Antonio Ortiz Villano', party: 'Salvemos al Perú', region: 'Lima', bio: 'Representante de Salvemos al Perú. Comprometido con la justicia social.', stars: 2.0 },
  { name: 'Rosario del Pilar Fernández Bazán', party: 'Un Camino Diferente', region: 'Lambayeque', bio: 'Ex Ministra de Justicia. Ex congresista y política de larga trayectoria.', stars: 3.1 },
  { name: 'Roberto Enrique Chiabra León', party: 'Unidad Nacional', region: 'Lima', bio: 'General EP en retiro. Ex congresista. Candidato por Unidad Nacional.', stars: 3.2 },
];

const PROPOSALS = [
  { cat: 'Educación', title: 'Universalización de educación digital', desc: 'Dotar a todas las escuelas públicas de conectividad y tablets.' },
  { cat: 'Salud', title: 'Hospital en cada provincia', desc: 'Construir hospitales de nivel II en todas las provincias.' },
  { cat: 'Seguridad Ciudadana', title: 'Reforma policial integral', desc: 'Modernizar la PNP con tecnología y mejores salarios.' },
  { cat: 'Economía', title: 'Reducción del IGV al 15%', desc: 'Bajar el impuesto general a las ventas para dinamizar el consumo.' },
  { cat: 'Anticorrupción', title: 'Muerte civil para corruptos', desc: 'Inhabilitación perpetua de función pública para condenados por corrupción.' },
  { cat: 'Empleo', title: 'Programa Primer Empleo Joven', desc: 'Subsidiar el 50% del salario del primer empleo para jóvenes.' },
  { cat: 'Infraestructura', title: 'Tren de cercanías Lima-Regiones', desc: 'Conectar Lima con Ica, Junín y La Libertad mediante tren.' },
  { cat: 'Medio Ambiente', title: 'Perú carbono neutral al 2040', desc: 'Transición a energías renovables y reforestación masiva.' },
  { cat: 'Tecnología', title: 'Perú Digital 2030', desc: 'Gobierno electrónico al 100%, conectividad 5G nacional.' },
  { cat: 'Salud', title: 'Seguro universal de salud', desc: 'Cobertura universal de salud para todos los peruanos.' },
];

// ==================== NAME GENERATORS ====================
const FIRST_NAMES_M = [
  'Carlos', 'José', 'Luis', 'Miguel', 'Juan', 'Pedro', 'Jorge', 'Fernando', 'Roberto', 'Ricardo',
  'Andrés', 'Eduardo', 'Manuel', 'Francisco', 'Alberto', 'Raúl', 'Sergio', 'Daniel', 'Alejandro', 'Víctor',
  'Óscar', 'Enrique', 'Mario', 'Hugo', 'César', 'Gustavo', 'Javier', 'Antonio', 'Ernesto', 'Arturo',
  'Héctor', 'Pablo', 'Germán', 'Iván', 'Marcos', 'Adrián', 'Diego', 'Gabriel', 'Walter', 'Edwin',
  'Wilmer', 'Freddy', 'Segundo', 'Santos', 'Ángel', 'Flavio', 'Mesías', 'Abel', 'Adriel', 'Teófilo',
];
const FIRST_NAMES_F = [
  'María', 'Ana', 'Carmen', 'Patricia', 'Rosa', 'Claudia', 'Lucía', 'Silvia', 'Gloria', 'Teresa',
  'Gladys', 'Isabel', 'Elena', 'Martha', 'Rocío', 'Pilar', 'Nelly', 'Luz', 'Beatriz', 'Sonia',
  'Mónica', 'Janet', 'Yolanda', 'Norma', 'Susana', 'Dina', 'Flor', 'Milagros', 'Karina', 'Emperatriz',
];
const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Gonzales', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ruiz',
  'Jiménez', 'Medina', 'Castro', 'Vargas', 'Ramos', 'Herrera', 'Chávez', 'Silva', 'Mendoza', 'Quispe',
  'Rojas', 'Huamán', 'Espinoza', 'Vásquez', 'Fernández', 'Córdova', 'Paredes', 'Villanueva', 'Cevallos', 'Palomino',
  'Cárdenas', 'Aguilar', 'Carrasco', 'Valdivia', 'Mamani', 'Condori', 'Ccama', 'Apaza', 'Cusi', 'Ticona',
];
const REGIONS = [
  'Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cajamarca',
  'Junín', 'Cusco', 'Puno', 'Lambayeque', 'Áncash',
  'Loreto', 'Ica', 'San Martín', 'Huánuco', 'Ucayali',
  'Ayacucho', 'Tacna', 'Madre de Dios', 'Amazonas', 'Tumbes',
  'Apurímac', 'Huancavelica', 'Moquegua', 'Pasco', 'Callao'
];

// Seeded random for reproducible results
let seed = 42;
function seededRandom() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function pick(arr) { return arr[Math.floor(seededRandom() * arr.length)]; }
function generateName(index) {
  const isFemale = index % 3 === 0;
  const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last1 = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
  const last2 = LAST_NAMES[(index * 13 + 11) % LAST_NAMES.length];
  return `${first} ${last1} ${last2}`;
}

// ==================== VP & PLAN DE GOBIERNO DATA ====================
const VP_DATA = {
  'Ahora Nación': { edu: 'Doctor en Economía por la UNAM. Maestría en Economía. Licenciado en Economía por la UNMSM.', exp: 'Rector de la UNI. Docente universitario 35+ años.', birth: '06/09/1956', vps: [{ name: 'Rosa María Apaza Ccopa', label: 'Primera Vicepresidenta de la República', bio: 'Abogada. Especialista en derechos sociales.' }, { name: 'Luis Alberto Soto Ocampo', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero civil. Ex funcionario público regional.' }] },
  'Alianza Electoral Venceremos': { edu: 'Abogado por la USMP. Maestría en Derecho Constitucional.', exp: 'Representante de AEV. Asesor legal parlamentario.', birth: '14/03/1975', vps: [{ name: 'Carmen Luz Vargas Castillo', label: 'Primera Vicepresidenta de la República', bio: 'Educadora y líder comunitaria.' }, { name: 'Manuel Enrique Ríos Salazar', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero agrónomo.' }] },
  'Alianza para el Progreso': { edu: 'Doctor por la U. Complutense de Madrid. Ingeniero químico por la UNT.', exp: 'Fundador de la U. César Vallejo. Ex Gobernador Regional de La Libertad. Ex Alcalde de Trujillo.', birth: '11/08/1952', vps: [{ name: 'Jessica Milagros Tumi Rivas', label: 'Primera Vicepresidenta de la República', bio: 'Exviceministra de Desarrollo Social. Abogada PUCP.' }, { name: 'Alejandro Soto Reyes', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Abogado por la UNSAAC.' }] },
  'Avanza País': { edu: 'Licenciado en Ciencias Militares (Escuela Militar de Chorrillos). Maestría en Defensa Nacional (CAEN).', exp: 'Congresista 2021-2026. General de División EP (r). Comandante General del Ejército.', birth: '22/11/1956', vps: [{ name: 'Mirtha Esther Vásquez Chuquilín', label: 'Primera Vicepresidenta de la República', bio: 'Abogada. Ex Presidenta del Congreso.' }, { name: 'Carlos Alberto Neuhaus Tudela', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero. Pres. Comité Org. Panamericanos Lima 2019.' }] },
  'Fe en el Perú': { edu: 'Abogado por la USMP. Maestría en Gestión Pública.', exp: 'Ex Alcalde de La Molina. Ex presidente de AMPE.', birth: '10/04/1975', vps: [{ name: 'Ana Cecilia Gervasi Díaz', label: 'Primera Vicepresidenta de la República', bio: 'Diplomática. Ex Ministra de Relaciones Exteriores.' }, { name: 'Jorge Eduardo Mera Fernández', label: 'Segundo Vicepresidente de la República', bio: 'Economista. Especialista en comercio exterior.' }] },
  'Fuerza Popular': { edu: 'MBA de Columbia University. Bachiller en Administración por Boston University.', exp: 'Presidenta de Fuerza Popular. Congresista 2006-2011. Candidata presidencial 2011, 2016, 2021.', birth: '25/05/1975', vps: [{ name: 'Luis Alberto Galarreta Velarde', label: 'Primer Vicepresidente de la República', bio: 'Ex presidente del Congreso.' }, { name: 'Patricia Rosa Juárez Gallegos', label: 'Segunda Vicepresidenta de la República', bio: 'Congresista. Abogada constitucionalista.' }] },
  'Fuerza y Libertad': { edu: 'Economista PUCP. Doctorado USMP. Especialización en Políticas Públicas.', exp: 'Ex Presidenta de EsSalud. Ex Ministra del MIDIS.', birth: '08/12/1971', vps: [{ name: 'Rafael Santos Peña', label: 'Primer Vicepresidente de la República', bio: 'Médico cirujano. Exdirector de hospitales.' }, { name: 'Gisella Ortiz Perea', label: 'Segunda Vicepresidenta de la República', bio: 'Defensora de derechos humanos.' }] },
  'Juntos por el Perú': { edu: 'Psicólogo por la UNMSM. Estudios en gestión pública.', exp: 'Congresista. Ex Ministro de Comercio Exterior y Turismo.', birth: '15/06/1965', vps: [{ name: 'Sigrid Bazán Narro', label: 'Primera Vicepresidenta de la República', bio: 'Periodista y congresista.' }, { name: 'Hernando Guerra García', label: 'Segundo Vicepresidente de la República', bio: 'Abogado constitucionalista.' }] },
  'Libertad Popular': { edu: 'Economista por la U. de Lima. MBA por ESAN.', exp: 'Ex Ministro de Energía y Minas. Gerente general del sector privado.', birth: '30/01/1963', vps: [{ name: 'Mariana Costa Checa', label: 'Primera Vicepresidenta de la República', bio: 'CEO de Laboratoria. Emprendedora tecnológica.' }, { name: 'José Miguel Vivanco Hidalgo', label: 'Segundo Vicepresidente de la República', bio: 'Abogado DDHH. Ex HRW Americas.' }] },
  'Partido Aprista Peruano': { edu: 'Bachiller en Derecho por la USMP.', exp: 'Analista legal. Militante del APRA. Dirigente juvenil.', birth: '20/09/1988', vps: [{ name: 'Luciana León Romero', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista del APRA.' }, { name: 'Omar Quesada Martínez', label: 'Segundo Vicepresidente de la República', bio: 'Ex alcalde distrital. Tributarista.' }] },
  'Partido Cívico Obras': { edu: 'Comunicador social. Producción televisiva.', exp: 'Ex Alcalde de Lima (1990-1995). Pionero de TV independiente. Fundador de RBC.', birth: '24/03/1945', vps: [{ name: 'Martha Gladys Fernández Dávila', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria y comunicadora.' }, { name: 'Alexander Francisco Kouri Bumachar', label: 'Segundo Vicepresidente de la República', bio: 'Ex gobernador regional del Callao.' }] },
  'PTE-Perú': { edu: 'Estudios en Educación y Administración Pública.', exp: 'Líder del PTE-Perú. Dirigente político en Cajamarca.', birth: '18/07/1960', vps: [{ name: 'Rosa Elvira Gutarra Montalvo', label: 'Primera Vicepresidenta de la República', bio: 'Educadora rural.' }, { name: 'Pedro Salinas Quispe', label: 'Segundo Vicepresidente de la República', bio: 'Comerciante y dirigente comunal.' }] },
  'Partido del Buen Gobierno': { edu: 'Sociólogo PUCP. Maestría FLACSO México. Doctor en Ciencias Sociales.', exp: 'Ex Ministro de Defensa y de Cultura. Analista político.', birth: '05/11/1958', vps: [{ name: 'Marisol Espinoza Cruz', label: 'Primera Vicepresidenta de la República', bio: 'Ex Vicepresidenta de la República (2011-2016).' }, { name: 'Alberto Otárola Peñaranda', label: 'Segundo Vicepresidente de la República', bio: 'Ex Primer Ministro. Constitucionalista.' }] },
  'Partido Demócrata Unido Perú': { edu: 'Administración y Gestión Pública.', exp: 'Fundador del PDUP. Político emergente.', birth: '12/02/1980', vps: [{ name: 'Diana Rocío Palomares Cruz', label: 'Primera Vicepresidenta de la República', bio: 'Administradora. Gestora social.' }, { name: 'Julio César Mendizábal Orrillo', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero ambiental.' }] },
  'Partido Demócrata Verde': { edu: 'Ingeniero ambiental. Maestría en Gestión Ambiental.', exp: 'Defensor del medio ambiente y desarrollo sostenible.', birth: '03/05/1978', vps: [{ name: 'Paola Bustamante Suárez', label: 'Primera Vicepresidenta de la República', bio: 'Ingeniera industrial. Políticas ambientales.' }, { name: 'Robert Contreras Huaraca', label: 'Segundo Vicepresidente de la República', bio: 'Biólogo. Investigador biodiversidad.' }] },
  'Partido Democrático Federal': { edu: 'Ciencias Políticas y Derecho Constitucional.', exp: 'Fundador del PDF. Propone estado federal para Perú.', birth: '28/08/1972', vps: [{ name: 'Elizabeth Torres Fernández', label: 'Primera Vicepresidenta de la República', bio: 'Abogada constitucionalista.' }, { name: 'Andrés Medina Castañeda', label: 'Segundo Vicepresidente de la República', bio: 'Politólogo. Descentralización.' }] },
  'Somos Perú': { edu: 'Administrador de empresas. Gestión Municipal.', exp: 'Ex futbolista (Sporting Cristal, Alianza Lima). Ex Alcalde de La Victoria.', birth: '20/12/1983', vps: [{ name: 'Norma Yarrow Lumbreras', label: 'Primera Vicepresidenta de la República', bio: 'Congresista. Derechos de la mujer.' }, { name: 'Carlos Añaños Jerí', label: 'Segundo Vicepresidente de la República', bio: 'Empresario. Cofundador del Grupo AJE.' }] },
  'Frente de la Esperanza 2021': { edu: 'Abogado. Ciencias Políticas.', exp: 'Ex parlamentario. Político de larga trayectoria.', birth: '22/04/1957', vps: [{ name: 'María Cordero Jon Tay', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista. Empresaria.' }, { name: 'Luis López Vilela', label: 'Segundo Vicepresidente de la República', bio: 'Abogado y político piurano.' }] },
  'Partido Morado': { edu: 'Ingeniero forestal por la UNAS. Maestría en Gestión Ambiental.', exp: 'Candidato presidencial PM. Representante de la Amazonía.', birth: '17/10/1968', vps: [{ name: 'Susel Paredes Piqué', label: 'Primera Vicepresidenta de la República', bio: 'Congresista. Defensora de derechos civiles.' }, { name: 'Alberto de Belaúnde de Cárdenas', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Politólogo.' }] },
  'País para Todos': { edu: 'Administración de Empresas.', exp: 'Empresario y político.', birth: '09/01/1976', vps: [{ name: 'Gladys Tejeda Pucuhuayla', label: 'Primera Vicepresidenta de la República', bio: 'Atleta olímpica. Medallista panamericana.' }, { name: 'Walter Palma Ugarte', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero civil. ONG desarrollo local.' }] },
  'Partido Patriótico del Perú': { edu: 'Abogado. Ciencias Militares y Defensa Nacional.', exp: 'Líder del PPP. Político nacionalista.', birth: '14/06/1962', vps: [{ name: 'Maritza Sánchez Ramos', label: 'Primera Vicepresidenta de la República', bio: 'Educadora. Dirigente social.' }, { name: 'Hugo Meza Villanueva', label: 'Segundo Vicepresidente de la República', bio: 'Militar retirado.' }] },
  'Cooperación Popular': { edu: 'Abogado U. Nacional del Altiplano. Maestría en Derecho Constitucional.', exp: 'Congresista múltiples períodos. Ex candidato presidencial 2021.', birth: '17/02/1959', vps: [{ name: 'Nidia Vílchez Yucra', label: 'Primera Vicepresidenta de la República', bio: 'Ex Ministra de la Mujer. Ex congresista.' }, { name: 'Erasmo Reyna Alcántara', label: 'Segundo Vicepresidente de la República', bio: 'Abogado penalista. Profesor de Derecho.' }] },
  'Integridad Democrática': { edu: 'Administración y Ciencias Políticas.', exp: 'Líder de ID. Comprometido con la transparencia institucional.', birth: '25/07/1974', vps: [{ name: 'Mirella Huaccha Espinoza', label: 'Primera Vicepresidenta de la República', bio: 'Contadora. Gestora de programas sociales.' }, { name: 'Fernando Cáceres Llica', label: 'Segundo Vicepresidente de la República', bio: 'Ingeniero industrial. Ex funcionario regional.' }] },
  'Perú Libre': { edu: 'Médico cirujano UNCP. Especialización en Neurocirugía. Maestría en Gestión de Salud.', exp: 'Fundador de Perú Libre. Ex Gobernador Regional de Junín.', birth: '10/08/1970', vps: [{ name: 'Waldemar José Cerrón Rojas', label: 'Primer Vicepresidente de la República', bio: 'Congresista. Cirujano dentista.' }, { name: 'Bermúdez Geraldine Rojas Navarro', label: 'Segunda Vicepresidenta de la República', bio: 'Abogada. Presidenta juventud PL.' }] },
  'Perú Acción': { edu: 'Ciencias Políticas y Derecho Internacional.', exp: 'Representante de Perú Acción. Experiencia legislativa.', birth: '08/04/1965', vps: [{ name: 'Elvira de la Puente García', label: 'Primera Vicepresidenta de la República', bio: 'Abogada y diplomática.' }, { name: 'Raúl Ferrero Costa', label: 'Segundo Vicepresidente de la República', bio: 'Constitucionalista. Profesor PUCP.' }] },
  'Perú Primero': { edu: 'Ingeniero de sistemas. Maestría en TI.', exp: 'Líder de PP. Modernización tecnológica del Estado.', birth: '19/09/1977', vps: [{ name: 'Claudia Rebaza Linares', label: 'Primera Vicepresidenta de la República', bio: 'Ingeniera de sistemas. CTO startup.' }, { name: 'Marcos Palacios Durand', label: 'Segundo Vicepresidente de la República', bio: 'Economista digital.' }] },
  'PRIN': { edu: 'Administración y Gestión Empresarial.', exp: 'Representante del PRIN. Empresario.', birth: '02/12/1970', vps: [{ name: 'Sonia Medina Calvo', label: 'Primera Vicepresidenta de la República', bio: 'Ex procuradora antidrogas.' }, { name: 'Jorge Paredes Terry', label: 'Segundo Vicepresidente de la República', bio: 'Analista político. Periodista.' }] },
  'Partido SICREO': { edu: 'Filosofía y Ciencias Sociales.', exp: 'Fundador de SICREO. Propone crédito social.', birth: '16/05/1968', vps: [{ name: 'Marcela Gutiérrez Baca', label: 'Primera Vicepresidenta de la República', bio: 'Filósofa y educadora.' }, { name: 'Ricardo Flores Abad', label: 'Segundo Vicepresidente de la República', bio: 'Sociólogo. Investigador social.' }] },
  'Perú Moderno': { edu: 'Ingeniero industrial. Maestría en Innovación.', exp: 'Líder de PM. Transformación digital del Perú.', birth: '07/03/1979', vps: [{ name: 'Martín Benavides Abanto', label: 'Primer Vicepresidente de la República', bio: 'Ex Ministro de Educación.' }, { name: 'Fabiola Muñoz Dodero', label: 'Segunda Vicepresidenta de la República', bio: 'Ex Ministra del Ambiente.' }] },
  'Podemos Perú': { edu: 'Administrador. Gestión Educativa.', exp: 'Empresario. Fundador de U. Telesup. Congresista. Líder de Podemos Perú.', birth: '26/10/1961', vps: [{ name: 'María Cristina Retamozo Lozano', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria. Emprendimiento femenino.' }, { name: 'Esdras Medina Minaya', label: 'Segundo Vicepresidente de la República', bio: 'Congresista. Pastor y líder comunitario.' }] },
  'Primero la Gente': { edu: 'Abogada PUCP. Maestría en Política Jurisdiccional. Diplomada en DDHH.', exp: 'Ex Ministra de Justicia y DDHH. Defensora de derechos civiles.', birth: '01/07/1969', vps: [{ name: 'Salvador Heresi Chicoma', label: 'Primer Vicepresidente de la República', bio: 'Ex Ministro de Justicia.' }, { name: 'Indira Huilca Flores', label: 'Segunda Vicepresidenta de la República', bio: 'Ex congresista. Derechos laborales.' }] },
  'Progresemos': { edu: 'Ciencias Políticas y Comunicación Social.', exp: 'Representante de Progresemos. Desarrollo progresista.', birth: '14/11/1982', vps: [{ name: 'Karelim López Rabelo', label: 'Primera Vicepresidenta de la República', bio: 'Empresaria y lobista.' }, { name: 'Óscar Ugarte Ubilluz', label: 'Segundo Vicepresidente de la República', bio: 'Médico. Ex Ministro de Salud.' }] },
  'Renovación Popular': { edu: 'Ingeniero mecánico electricista UNI. MBA U. de Piura.', exp: 'Empresario. Alcalde de Lima Metropolitana. Fundador de RP.', birth: '07/09/1961', vps: [{ name: 'Neldy Mendoza Flores', label: 'Primera Vicepresidenta de la República', bio: 'Congresista por Arequipa.' }, { name: 'Carlos Anderson Ramírez', label: 'Segundo Vicepresidente de la República', bio: 'Ex congresista. Economista.' }] },
  'Salvemos al Perú': { edu: 'Derecho y Ciencias Sociales.', exp: 'Representante de SAP. Justicia social.', birth: '23/06/1964', vps: [{ name: 'María Elena Foronda Farro', label: 'Primera Vicepresidenta de la República', bio: 'Ex congresista. Activista ambiental.' }, { name: 'José Villena Petrosino', label: 'Segundo Vicepresidente de la República', bio: 'Empresario y dirigente social.' }] },
  'Un Camino Diferente': { edu: 'Abogada USMP. Maestría en Derecho Penal.', exp: 'Ex Ministra de Justicia. Ex congresista. Fiscala suprema adjunta.', birth: '29/12/1958', vps: [{ name: 'Gladys Echaíz Ramos', label: 'Primera Vicepresidenta de la República', bio: 'Ex Fiscal de la Nación.' }, { name: 'Samuel Abad Yupanqui', label: 'Segundo Vicepresidente de la República', bio: 'Constitucionalista. Profesor PUCP.' }] },
  'Unidad Nacional': { edu: 'Ciencias Militares (Esc. Militar Chorrillos). Maestría en Estrategia y Geopolítica.', exp: 'General EP (r). Ex congresista. Ex Ministro de Defensa.', birth: '04/10/1953', vps: [{ name: 'Lourdes Flores Nano', label: 'Primera Vicepresidenta de la República', bio: 'Abogada. Tres veces candidata presidencial.' }, { name: 'Pedro Cateriano Bellido', label: 'Segundo Vicepresidente de la República', bio: 'Ex Primer Ministro. Ex Ministro de Defensa.' }] },
};

const PLAN_TEMPLATE = [
  {
    dim: 'DIMENSIÓN SOCIAL', items: [
      { prob: 'Vivienda, Agua y Saneamiento', obj: 'Reducir el déficit de viviendas y ampliar la cobertura de agua potable y saneamiento.', goals: 'Meta 2026-2027: 200,000 viviendas. Meta 2028-2030: 500,000 conexiones de agua.', ind: 'Brecha anual de vivienda. Cobertura de agua potable (%).' },
      { prob: 'Salud', obj: 'Asegurar el acceso a servicios de salud y fortalecer la atención primaria.', goals: 'Meta 2026-2028: 2,000 centros renovados. Meta 2029-2031: Hospital de alta complejidad por región.', ind: 'Tasa de mortalidad infantil. Cobertura de atención primaria (%).' },
      { prob: 'Educación', obj: 'Mejorar la calidad educativa y cerrar brechas de acceso en zonas rurales.', goals: 'Meta 2026-2027: 100% conectividad en escuelas. Meta 2028-2030: +20% resultados PISA.', ind: 'Rendimiento pruebas estandarizadas. Tasa de deserción escolar.' },
    ]
  },
  {
    dim: 'DIMENSIÓN ECONÓMICA', items: [
      { prob: 'Empleo y Formalización', obj: 'Reducir la informalidad laboral y promover el empleo digno.', goals: 'Meta 2026-2028: Formalizar 1 millón de trabajadores. Reducir desempleo juvenil al 8%.', ind: 'Tasa de informalidad laboral (%). Tasa de desempleo juvenil (%).' },
      { prob: 'Competitividad e Infraestructura', obj: 'Impulsar inversión en infraestructura productiva y competitividad.', goals: 'Meta 2026-2031: S/. 100,000 millones en infraestructura. 5,000 km de carreteras.', ind: 'Índice de competitividad global. Inversión pública como % del PBI.' },
    ]
  },
  {
    dim: 'DIMENSIÓN AMBIENTAL', items: [
      { prob: 'Cambio Climático y Recursos Naturales', obj: 'Implementar estrategias de adaptación al cambio climático y proteger ecosistemas.', goals: 'Meta 2026-2031: Reducir deforestación en 50%. Ampliar áreas protegidas en 2M hectáreas.', ind: 'Hectáreas deforestadas/año. Emisiones de CO2 per cápita.' },
    ]
  },
  {
    dim: 'DIMENSIÓN INSTITUCIONAL', items: [
      { prob: 'Reforma del Estado y Anticorrupción', obj: 'Fortalecer instituciones democráticas y combatir la corrupción.', goals: 'Meta 2026-2028: Digitalizar 100% de trámites. Reducir percepción de corrupción 30%.', ind: 'Índice percepción de corrupción. Trámites digitalizados (%).' },
      { prob: 'Seguridad Ciudadana', obj: 'Reducir criminalidad y fortalecer la Policía Nacional.', goals: 'Meta 2026-2028: +30,000 efectivos. Meta 2029-2031: Reducir homicidios 40%.', ind: 'Tasa de homicidios por 100,000 hab. Percepción de seguridad (%).' },
    ]
  },
];

function seedVicePresidentsAndPlans() {
  const presidentCandidates = store.candidates.filter(c => c.position === 'president');
  presidentCandidates.forEach(cand => {
    const party = store.parties.find(p => p.id === cand.party_id);
    if (!party) return;
    const data = VP_DATA[party.name];
    if (!data) return;

    // Update candidate with education/experience/birth_date
    cand.education = data.edu;
    cand.experience = data.exp;
    cand.birth_date = data.birth;

    // Insert vice-presidents
    data.vps.forEach((vp, i) => {
      store.candidate_vice_presidents.push({
        id: nextId.vps++, candidate_id: cand.id,
        name: vp.name, position_label: vp.label, photo: null,
        biography: vp.bio, sort_order: i + 1,
        created_at: new Date().toISOString(),
      });
    });

    // Insert plan de gobierno
    let sortOrder = 1;
    PLAN_TEMPLATE.forEach(dim => {
      dim.items.forEach(item => {
        store.candidate_plan_gobierno.push({
          id: nextId.plan++, candidate_id: cand.id,
          dimension: dim.dim, problem: item.prob,
          objective: item.obj, goals: item.goals,
          indicator: item.ind, sort_order: sortOrder++,
          created_at: new Date().toISOString(),
        });
      });
    });
  });

  console.log(`[MEM-DB] Seeded ${store.candidate_vice_presidents.length} VPs, ${store.candidate_plan_gobierno.length} plan items for ${presidentCandidates.length} presidents`);
}

// ==================== INITIALIZE DATA ====================
function initializeData() {
  // Seed parties
  PARTIES_SEED.forEach(p => {
    const id = nextId.parties++;
    store.parties.push({
      id, name: p.name, abbreviation: p.abbreviation, logo: null, color: p.color,
      party_full_score: 0, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
    });
  });

  // Seed presidential candidates
  PRESIDENTIAL_SEED.forEach(c => {
    const party = store.parties.find(p => p.name === c.party);
    if (!party) return;
    const id = nextId.candidates++;
    const voteCount = Math.floor(seededRandom() * 5000) + 100;
    const intScore = 50;
    const momScore = Math.floor(seededRandom() * 30);
    const integScore = 100 - Math.floor(seededRandom() * 15);
    const riskScore = Math.floor(seededRandom() * 30);
    const voteNorm = Math.min(100, voteCount / 100);
    const finalScore = parseFloat(((voteNorm * 0.40) + (intScore * 0.25) + (momScore * 0.20) + (integScore * 0.15)).toFixed(2));

    store.candidates.push({
      id, name: c.name, photo: null, party_id: party.id, position: 'president',
      region: c.region, biography: c.bio, intelligence_score: intScore,
      momentum_score: momScore, integrity_score: integScore, risk_score: riskScore,
      stars_rating: c.stars, final_score: Math.min(100, finalScore), vote_count: voteCount,
      is_active: true, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
    });

    // Add 2 proposals per presidential candidate
    for (let j = 0; j < 2; j++) {
      const prop = PROPOSALS[(id + j) % PROPOSALS.length];
      store.candidate_proposals.push({
        id: nextId.proposals++, candidate_id: id,
        title: prop.title, description: prop.desc, category: prop.cat,
        created_at: new Date().toISOString(),
      });
    }
  });

  // ==================== SEED VP & PLAN DATA FOR PRESIDENTIAL CANDIDATES ====================
  seedVicePresidentsAndPlans();

  // ==================== GENERATE SENATORS (130 — 5 per region + extras) ====================
  const senatorsPerRegion = 5;
  for (let r = 0; r < REGIONS.length; r++) {
    for (let s = 0; s < senatorsPerRegion; s++) {
      const idx = r * senatorsPerRegion + s;
      const party = store.parties[idx % store.parties.length];
      const id = nextId.candidates++;
      const voteCount = Math.floor(seededRandom() * 2000) + 50;
      const momScore = Math.floor(seededRandom() * 25);
      const integScore = 100 - Math.floor(seededRandom() * 20);
      const riskScore = Math.floor(seededRandom() * 35);
      const voteNorm = Math.min(100, voteCount / 100);
      const finalScore = parseFloat(((voteNorm * 0.40) + (50 * 0.25) + (momScore * 0.20) + (integScore * 0.15)).toFixed(2));

      store.candidates.push({
        id, name: generateName(idx + 100), photo: null, party_id: party.id, position: 'senator',
        region: REGIONS[r], biography: `Candidato al Senado por ${REGIONS[r]}. Representante de ${party.name}.`,
        intelligence_score: 50, momentum_score: momScore, integrity_score: integScore,
        risk_score: riskScore, stars_rating: parseFloat((seededRandom() * 2 + 2).toFixed(1)),
        final_score: Math.min(100, finalScore), vote_count: voteCount,
        is_active: true, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
      });

      // 1 proposal per senator
      const prop = PROPOSALS[idx % PROPOSALS.length];
      store.candidate_proposals.push({
        id: nextId.proposals++, candidate_id: id,
        title: prop.title, description: prop.desc, category: prop.cat,
        created_at: new Date().toISOString(),
      });
    }
  }

  // ==================== GENERATE DEPUTIES (130 — 5 per region + extras) ====================
  for (let r = 0; r < REGIONS.length; r++) {
    for (let d = 0; d < senatorsPerRegion; d++) {
      const idx = r * senatorsPerRegion + d;
      const party = store.parties[(idx + 3) % store.parties.length]; // offset to vary party assignment
      const id = nextId.candidates++;
      const voteCount = Math.floor(seededRandom() * 1500) + 30;
      const momScore = Math.floor(seededRandom() * 20);
      const integScore = 100 - Math.floor(seededRandom() * 25);
      const riskScore = Math.floor(seededRandom() * 40);
      const voteNorm = Math.min(100, voteCount / 100);
      const finalScore = parseFloat(((voteNorm * 0.40) + (50 * 0.25) + (momScore * 0.20) + (integScore * 0.15)).toFixed(2));

      store.candidates.push({
        id, name: generateName(idx + 300), photo: null, party_id: party.id, position: 'deputy',
        region: REGIONS[r], biography: `Candidato a Diputado por ${REGIONS[r]}. Representante de ${party.name}.`,
        intelligence_score: 50, momentum_score: momScore, integrity_score: integScore,
        risk_score: riskScore, stars_rating: parseFloat((seededRandom() * 2 + 1.5).toFixed(1)),
        final_score: Math.min(100, finalScore), vote_count: voteCount,
        is_active: true, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
      });

      const prop = PROPOSALS[(idx + 5) % PROPOSALS.length];
      store.candidate_proposals.push({
        id: nextId.proposals++, candidate_id: id,
        title: prop.title, description: prop.desc, category: prop.cat,
        created_at: new Date().toISOString(),
      });
    }
  }

  // ==================== GENERATE ANDEAN PARLIAMENT (36 — 1 per party) ====================
  store.parties.forEach((party, pi) => {
    const id = nextId.candidates++;
    const voteCount = Math.floor(seededRandom() * 1000) + 20;
    const momScore = Math.floor(seededRandom() * 15);
    const integScore = 100 - Math.floor(seededRandom() * 20);
    const riskScore = Math.floor(seededRandom() * 30);
    const voteNorm = Math.min(100, voteCount / 100);
    const finalScore = parseFloat(((voteNorm * 0.40) + (50 * 0.25) + (momScore * 0.20) + (integScore * 0.15)).toFixed(2));

    store.candidates.push({
      id, name: generateName(pi + 500), photo: null, party_id: party.id, position: 'andean',
      region: REGIONS[pi % REGIONS.length],
      biography: `Candidato al Parlamento Andino. Representante de ${party.name}.`,
      intelligence_score: 50, momentum_score: momScore, integrity_score: integScore,
      risk_score: riskScore, stars_rating: parseFloat((seededRandom() * 2 + 2).toFixed(1)),
      final_score: Math.min(100, finalScore), vote_count: voteCount,
      is_active: true, updated_at: new Date().toISOString(), created_at: new Date().toISOString(),
    });
  });

  // ==================== CALCULATE PARTY SCORES ====================
  store.parties.forEach(party => {
    const partyCandidates = store.candidates.filter(c => c.party_id === party.id && c.is_active);
    if (partyCandidates.length > 0) {
      party.party_full_score = parseFloat((partyCandidates.reduce((s, c) => s + c.final_score, 0) / partyCandidates.length).toFixed(2));
    }
    store.party_scores.push({
      party_id: party.id, party_full_score: party.party_full_score,
      ranking_position: 0, last_updated: new Date().toISOString(),
    });
  });

  // Set party ranking positions
  store.party_scores.sort((a, b) => b.party_full_score - a.party_full_score);
  store.party_scores.forEach((ps, i) => { ps.ranking_position = i + 1; });

  console.log(`[MEM-DB] Loaded ${store.parties.length} parties, ${store.candidates.length} candidates, ${store.candidate_proposals.length} proposals`);
}

initializeData();

// ==================== SQL QUERY ENGINE ====================
// Parses simplified SQL queries and returns data from the in-memory store

function parseQuery(sql, params = []) {
  // Normalize SQL
  const q = sql.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  // Replace $1, $2 etc with actual values
  let resolved = q;
  params.forEach((p, i) => {
    resolved = resolved.replace(new RegExp(`\\$${i + 1}`, 'g'), typeof p === 'string' ? `'${p}'` : String(p));
  });

  // ==================== SELECT queries ====================
  if (q.startsWith('select')) {
    return handleSelect(resolved, q, params);
  }

  // ==================== INSERT queries ====================
  if (q.startsWith('insert')) {
    return handleInsert(q, params);
  }

  // ==================== UPDATE queries ====================
  if (q.startsWith('update')) {
    return handleUpdate(q, params);
  }

  // ==================== DELETE queries ====================
  if (q.startsWith('delete')) {
    return handleDelete(q, params);
  }

  // ==================== WITH (CTE) queries ====================
  if (q.startsWith('with')) {
    // Party ranking update — just recalculate
    store.party_scores.sort((a, b) => b.party_full_score - a.party_full_score);
    store.party_scores.forEach((ps, i) => { ps.ranking_position = i + 1; });
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

function handleSelect(resolved, q, params) {
  // COUNT queries
  if (resolved.includes('count(*)')) {
    if (resolved.includes('from candidates')) {
      let items = store.candidates;
      if (resolved.includes('is_active = true')) items = items.filter(c => c.is_active);
      if (resolved.includes("and position = ")) {
        const pos = params.find(p => ['president', 'senator', 'deputy', 'andean'].includes(p));
        if (pos) items = items.filter(c => c.position === pos);
      }
      return { rows: [{ cnt: items.length, count: items.length, total: items.length }] };
    }
    if (resolved.includes('from votes')) {
      let items = store.votes;
      if (params[0] && resolved.includes('candidate_id')) {
        const cid = parseInt(params[0]);
        items = items.filter(v => v.candidate_id === cid);
      }
      if (resolved.includes("1 hour") || resolved.includes("'1 hour'")) {
        const oneHourAgo = Date.now() - 3600000;
        items = items.filter(v => new Date(v.created_at).getTime() > oneHourAgo);
      }
      if (resolved.includes("6 hour")) {
        const ago = Date.now() - 6 * 3600000;
        items = items.filter(v => new Date(v.created_at).getTime() > ago);
      }
      if (resolved.includes("24 hour") && !resolved.includes("48 hour")) {
        const ago = Date.now() - 24 * 3600000;
        items = items.filter(v => new Date(v.created_at).getTime() > ago);
      }
      if (resolved.includes("48 hour") && resolved.includes("24 hour")) {
        const ago48 = Date.now() - 48 * 3600000;
        const ago24 = Date.now() - 24 * 3600000;
        items = items.filter(v => {
          const t = new Date(v.created_at).getTime();
          return t > ago48 && t <= ago24;
        });
      }
      return { rows: [{ cnt: items.length, count: items.length, total: items.length }] };
    }
    if (resolved.includes('from parties')) return { rows: [{ cnt: store.parties.length }] };
    if (resolved.includes('from candidate_events')) return { rows: [{ cnt: store.candidate_events.length }] };
    if (resolved.includes('from users')) return { rows: [{ cnt: store.users.length }] };
    return { rows: [{ cnt: 0 }] };
  }

  // SUM(vote_count) / AVG queries
  if (resolved.includes('avg(') || resolved.includes('sum(')) {
    let items = store.candidates;
    if (params[0]) items = items.filter(c => c.party_id === parseInt(params[0]) && c.is_active);
    const cnt = items.length;
    const total = items.reduce((s, c) => s + (c.final_score || 0), 0);
    const totalVotes = items.reduce((s, c) => s + (c.vote_count || 0), 0);
    const avgInt = cnt > 0 ? items.reduce((s, c) => s + (parseFloat(c.intelligence_score) || 0), 0) / cnt : 0;
    const avgMom = cnt > 0 ? items.reduce((s, c) => s + (parseFloat(c.momentum_score) || 0), 0) / cnt : 0;
    const avgInteg = cnt > 0 ? items.reduce((s, c) => s + (parseFloat(c.integrity_score) || 0), 0) / cnt : 0;
    if (resolved.includes('sum(vote_count)') || resolved.includes("sum(vote_count)")) {
      return { rows: [{ total: totalVotes }] };
    }
    return { rows: [{ avg_score: cnt > 0 ? total / cnt : 0, total_candidates: cnt, total_score: total, total_votes: totalVotes, avg_intelligence: avgInt, avg_momentum: avgMom, avg_integrity: avgInteg }] };
  }

  // Position type grouping
  if (resolved.includes('group by position_type')) {
    const groups = {};
    store.votes.forEach(v => { groups[v.position_type] = (groups[v.position_type] || 0) + 1; });
    return { rows: Object.entries(groups).map(([position_type, count]) => ({ position_type, count: String(count) })) };
  }

  // ==================== SEARCH (ILIKE/similarity) — MUST come BEFORE generic candidates handler ====================
  if (resolved.includes('ilike') || resolved.includes('similarity')) {
    const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%'));
    const searchTerm = searchParam ? searchParam.replace(/%/g, '').toLowerCase() : (params[0] || '').toLowerCase();
    const limit = parseInt(params[params.length - 1]) || 20;

    // Search candidates
    if (resolved.includes('from candidates')) {
      let results = store.candidates.filter(c => c.is_active && (
        c.name.toLowerCase().includes(searchTerm) ||
        (c.region && c.region.toLowerCase().includes(searchTerm))
      ));
      results = results.map(c => {
        const party = store.parties.find(p => p.id === c.party_id) || {};
        const nameMatch = c.name.toLowerCase().includes(searchTerm);
        return { ...c, party_name: party.name, party_abbreviation: party.abbreviation, party_color: party.color, relevance: nameMatch ? 0.8 : 0.3 };
      });
      results.sort((a, b) => b.relevance - a.relevance || b.final_score - a.final_score);
      return { rows: results.slice(0, limit) };
    }
    // Search proposals
    if (resolved.includes('from candidate_proposals')) {
      let results = store.candidate_proposals.filter(p =>
        p.title.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
      );
      results = results.map(p => {
        const c = store.candidates.find(cc => cc.id === p.candidate_id) || {};
        return { ...p, candidate_name: c.name, candidate_id: c.id };
      });
      return { rows: results.slice(0, limit) };
    }
    // Search events
    if (resolved.includes('from candidate_events')) {
      let results = store.candidate_events.filter(e =>
        e.title.toLowerCase().includes(searchTerm) ||
        e.description.toLowerCase().includes(searchTerm)
      );
      results = results.map(e => {
        const c = store.candidates.find(cc => cc.id === e.candidate_id) || {};
        return { ...e, candidate_name: c.name, candidate_id: c.id };
      });
      return { rows: results.slice(0, limit) };
    }
  }

  // Candidates list / single
  if (resolved.includes('from candidates')) {
    let items = [...store.candidates];
    let hasSingleIdFilter = false;

    // Filter active
    if (resolved.includes('is_active = true')) items = items.filter(c => c.is_active);

    // Filter by ID
    if (params.length > 0 && (resolved.includes('where c.id =') || resolved.includes('where id ='))) {
      const id = parseInt(params[0]);
      items = items.filter(c => c.id === id);
      hasSingleIdFilter = true;
    }

    // Filter by position (only if NOT a single-ID lookup)
    if (!hasSingleIdFilter) {
      const posParam = params.find(p => ['president', 'senator', 'deputy', 'andean'].includes(p));
      if (posParam && resolved.includes('position')) {
        items = items.filter(c => c.position === posParam);
      }
    }

    // Filter by party_id (only if NOT a single-ID lookup and query explicitly mentions party_id = $N)
    if (!hasSingleIdFilter && resolved.includes('party_id') && resolved.includes('where') && params.length > 0) {
      const pid = parseInt(params[0]);
      if (!isNaN(pid) && resolved.includes('party_id = $')) {
        items = items.filter(c => c.party_id === pid);
      }
    }

    // Join party data
    items = items.map(c => {
      const party = store.parties.find(p => p.id === c.party_id) || {};
      return { ...c, party_name: party.name, party_abbreviation: party.abbreviation, party_color: party.color, party_logo: party.logo };
    });

    // Sort — CASE WHEN position ordering (for party full-ticket)
    if (resolved.includes('case position')) {
      const posOrder = { president: 1, senator: 2, deputy: 3, andean: 4 };
      items.sort((a, b) => (posOrder[a.position] || 5) - (posOrder[b.position] || 5) || b.final_score - a.final_score);
    } else if (resolved.includes('order by c.final_score desc') || resolved.includes('order by final_score desc')) {
      items.sort((a, b) => b.final_score - a.final_score);
    }
    if (resolved.includes('order by c.momentum_score desc') || resolved.includes('order by momentum_score desc')) {
      items.sort((a, b) => b.momentum_score - a.momentum_score);
    }
    if (resolved.includes('order by c.id')) items.sort((a, b) => a.id - b.id);

    // Limit
    const limitMatch = resolved.match(/limit (\d+)/);
    if (limitMatch) items = items.slice(0, parseInt(limitMatch[1]));

    return { rows: items, rowCount: items.length };
  }

  // Proposals
  if (resolved.includes('from candidate_proposals')) {
    let items = [...store.candidate_proposals];
    if (params[0]) items = items.filter(p => p.candidate_id === parseInt(params[0]));
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: items };
  }

  // Vice Presidents
  if (resolved.includes('from candidate_vice_presidents')) {
    let items = [...store.candidate_vice_presidents];
    if (params[0]) items = items.filter(v => v.candidate_id === parseInt(params[0]));
    items.sort((a, b) => a.sort_order - b.sort_order);
    return { rows: items };
  }

  // Plan de Gobierno
  if (resolved.includes('from candidate_plan_gobierno')) {
    let items = [...store.candidate_plan_gobierno];
    if (params[0]) items = items.filter(p => p.candidate_id === parseInt(params[0]));
    items.sort((a, b) => a.sort_order - b.sort_order);
    return { rows: items };
  }

  // Events
  if (resolved.includes('from candidate_events')) {
    let items = [...store.candidate_events];
    if (params[0]) items = items.filter(e => e.candidate_id === parseInt(params[0]));
    if (resolved.includes('is_validated = true')) items = items.filter(e => e.is_validated);
    if (resolved.includes('is_validated = false')) items = items.filter(e => !e.is_validated);
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const limitMatch = resolved.match(/limit (\d+)/);
    if (limitMatch) items = items.slice(0, parseInt(limitMatch[1]));
    // Join candidate data if needed
    if (resolved.includes('candidate_name') || resolved.includes('c.name')) {
      items = items.map(e => {
        const c = store.candidates.find(cc => cc.id === e.candidate_id) || {};
        const p = store.parties.find(pp => pp.id === c.party_id) || {};
        return { ...e, candidate_name: c.name, party_name: p.name };
      });
    }
    return { rows: items };
  }

  // Parties — with party_scores JOIN and candidate_count
  if (resolved.includes('from parties')) {
    let items = [...store.parties];

    // Filter by ID
    if (params[0] && (resolved.includes('where p.id') || resolved.includes('where id'))) {
      items = items.filter(p => p.id === parseInt(params[0]));
    }

    // Join party_scores data
    items = items.map(p => {
      const ps = store.party_scores.find(s => s.party_id === p.id) || {};
      const candidateCount = store.candidates.filter(c => c.party_id === p.id && c.is_active).length;
      return { ...p, party_full_score: ps.party_full_score || p.party_full_score || 0, ranking_position: ps.ranking_position || 0, candidate_count: candidateCount };
    });

    // Sort by score
    if (resolved.includes('order by') && resolved.includes('party_full_score desc')) {
      items.sort((a, b) => b.party_full_score - a.party_full_score);
    }

    return { rows: items };
  }

  // Party scores
  if (resolved.includes('from party_scores')) {
    return { rows: [...store.party_scores] };
  }

  // Users
  if (resolved.includes('from users')) {
    return { rows: [...store.users] };
  }

  // Votes
  if (resolved.includes('from votes')) {
    let items = [...store.votes];
    return { rows: items, rowCount: items.length };
  }

  return { rows: [], rowCount: 0 };
}

function handleInsert(q, params) {
  if (q.includes('into votes')) {
    const vote = {
      id: nextId.votes++,
      candidate_id: parseInt(params[0]),
      position_type: params[1],
      voter_ip: params[2] || '',
      voter_fingerprint: params[3] || '',
      session_id: params[4] || '',
      created_at: new Date().toISOString(),
    };
    store.votes.push(vote);
    return { rows: [vote], rowCount: 1 };
  }

  if (q.includes('into candidate_events')) {
    const event = {
      id: nextId.events++,
      candidate_id: parseInt(params[0]),
      event_type: params[1],
      title: params[2],
      description: params[3] || '',
      impact_score: parseFloat(params[4]) || 0,
      is_validated: params[5] === true || params[5] === 'true' ? true : false,
      created_at: new Date().toISOString(),
    };
    store.candidate_events.push(event);
    return { rows: [event], rowCount: 1 };
  }

  if (q.includes('into party_scores')) {
    const existing = store.party_scores.find(ps => ps.party_id === parseInt(params[0]));
    if (existing) {
      existing.party_full_score = parseFloat(params[1]) || 0;
      existing.last_updated = new Date().toISOString();
      return { rows: [existing], rowCount: 1 };
    }
    const ps = { party_id: parseInt(params[0]), party_full_score: parseFloat(params[1]) || 0, ranking_position: 0, last_updated: new Date().toISOString() };
    store.party_scores.push(ps);
    return { rows: [ps], rowCount: 1 };
  }

  if (q.includes('into candidates')) {
    const c = {
      id: nextId.candidates++,
      name: params[0], photo: params[1], party_id: parseInt(params[2]),
      position: params[3], region: params[4] || '', biography: params[5] || '',
      intelligence_score: parseFloat(params[6]) || 50, momentum_score: parseFloat(params[7]) || 0,
      integrity_score: parseFloat(params[8]) || 100, risk_score: parseFloat(params[9]) || 25,
      stars_rating: parseFloat(params[10]) || 3.0,
      final_score: 0, vote_count: 0, is_active: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    store.candidates.push(c);
    return { rows: [c], rowCount: 1 };
  }

  if (q.includes('into parties')) {
    const p = {
      id: nextId.parties++,
      name: params[0], abbreviation: params[1], logo: params[2], color: params[3] || '#ff1744',
      party_full_score: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    store.parties.push(p);
    return { rows: [p], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

function handleUpdate(q, params) {
  if (q.includes('update candidates')) {
    let targetId;

    // Find the WHERE id = $N
    const whereMatch = q.match(/where id = \$(\d+)/);
    if (whereMatch) {
      targetId = parseInt(params[parseInt(whereMatch[1]) - 1]);
    }

    const candidate = store.candidates.find(c => c.id === targetId);
    if (!candidate) return { rows: [], rowCount: 0 };

    // Parse SET clauses
    if (q.includes('vote_count = vote_count + 1')) {
      candidate.vote_count = (candidate.vote_count || 0) + 1;
    }
    if (q.includes('final_score')) {
      const fsIdx = q.indexOf('final_score = $');
      if (fsIdx > -1) candidate.final_score = parseFloat(params[0]) || 0;
    }
    if (q.includes('momentum_score') && !q.includes('vote_count + 1')) {
      // Direct momentum update: UPDATE candidates SET momentum_score = $1 ... WHERE id = $2
      const msParam = params[0];
      if (msParam !== undefined) candidate.momentum_score = parseFloat(msParam) || 0;
    }
    if (q.includes('intelligence_score') && q.includes('set intelligence_score')) {
      const isParam = params[0];
      if (isParam !== undefined) candidate.intelligence_score = parseFloat(isParam) || 50;
    }
    if (q.includes('integrity_score') && q.includes('risk_score') && q.includes('set integrity_score')) {
      candidate.integrity_score = parseFloat(params[0]) || 50;
      candidate.risk_score = parseFloat(params[1]) || 25;
    }
    if (q.includes('is_active = not is_active')) {
      candidate.is_active = !candidate.is_active;
    }

    // COALESCE-heavy updates (from admin PUT)
    if (q.includes('coalesce')) {
      const fields = ['name', 'photo', 'party_id', 'position', 'region', 'biography', 'intelligence_score', 'momentum_score', 'integrity_score', 'risk_score', 'stars_rating', 'is_active'];
      // The last param is the id, other params correspond to fields
      for (let i = 0; i < Math.min(fields.length, params.length - 1); i++) {
        if (params[i] !== null && params[i] !== undefined) {
          const field = fields[i];
          const val = params[i];
          if (['party_id'].includes(field)) candidate[field] = parseInt(val);
          else if (['intelligence_score', 'momentum_score', 'integrity_score', 'risk_score', 'stars_rating'].includes(field)) candidate[field] = parseFloat(val);
          else if (field === 'is_active') candidate[field] = val;
          else candidate[field] = val;
        }
      }
    }

    // Intelligence initialization
    if (q.includes('intelligence_score = 50') && q.includes('integrity_score = 100') && q.includes('where intelligence_score is null')) {
      store.candidates.forEach(c => {
        if (!c.intelligence_score || c.intelligence_score === 0) {
          c.intelligence_score = 50;
          c.integrity_score = 100;
        }
      });
      return { rows: [], rowCount: store.candidates.length };
    }

    candidate.updated_at = new Date().toISOString();
    return { rows: [candidate], rowCount: 1 };
  }

  if (q.includes('update parties')) {
    const id = parseInt(params[params.length - 1]);
    const party = store.parties.find(p => p.id === id);
    if (!party) return { rows: [], rowCount: 0 };

    if (q.includes('party_full_score')) {
      party.party_full_score = parseFloat(params[0]) || 0;
    }
    if (q.includes('coalesce')) {
      if (params[0]) party.name = params[0];
      if (params[1]) party.abbreviation = params[1];
      if (params[2]) party.logo = params[2];
      if (params[3]) party.color = params[3];
    }
    party.updated_at = new Date().toISOString();
    return { rows: [party], rowCount: 1 };
  }

  if (q.includes('update party_scores')) {
    // Handled by CTE/WITH
    return { rows: [], rowCount: 0 };
  }

  if (q.includes('update candidate_events')) {
    const id = parseInt(params[params.length - 1]);
    const event = store.candidate_events.find(e => e.id === id);
    if (!event) return { rows: [], rowCount: 0 };
    if (q.includes('is_validated = true')) event.is_validated = true;
    if (q.includes('coalesce')) {
      if (params[0]) event.title = params[0];
      if (params[1]) event.description = params[1];
      if (params[2]) event.event_type = params[2];
      if (params[3] !== null && params[3] !== undefined) event.impact_score = parseFloat(params[3]);
    }
    return { rows: [event], rowCount: 1 };
  }

  if (q.includes('update users')) {
    const id = parseInt(params[params.length - 1] || params[0]);
    const user = store.users.find(u => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };
    if (q.includes('is_blocked = not is_blocked')) user.is_blocked = !user.is_blocked;
    return { rows: [user], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

function handleDelete(q, params) {
  if (q.includes('from candidates')) {
    const id = parseInt(params[0]);
    const idx = store.candidates.findIndex(c => c.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };
    const deleted = store.candidates.splice(idx, 1);
    return { rows: deleted, rowCount: 1 };
  }
  if (q.includes('from candidate_events')) {
    const id = parseInt(params[0]);
    const idx = store.candidate_events.findIndex(e => e.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };
    const deleted = store.candidate_events.splice(idx, 1);
    return { rows: deleted, rowCount: 1 };
  }
  if (q.includes('from parties')) {
    const id = parseInt(params[0]);
    const idx = store.parties.findIndex(p => p.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };
    const deleted = store.parties.splice(idx, 1);
    return { rows: deleted, rowCount: 1 };
  }
  if (q.includes('from votes')) {
    if (params[0]) {
      const before = store.votes.length;
      store.votes = store.votes.filter(v => v.voter_ip !== params[0]);
      return { rows: [], rowCount: before - store.votes.length };
    }
  }
  if (q.includes('from users')) {
    const id = parseInt(params[0]);
    const idx = store.users.findIndex(u => u.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };
    const deleted = store.users.splice(idx, 1);
    return { rows: deleted, rowCount: 1 };
  }
  return { rows: [], rowCount: 0 };
}

// ==================== POOL INTERFACE ====================
// Mimics pg.Pool so all existing routes work without changes

const pool = {
  query: async (sql, params = []) => {
    try {
      return parseQuery(sql, params);
    } catch (err) {
      console.error('[MEM-DB] Query error:', err.message, '\nSQL:', sql.substring(0, 100));
      return { rows: [], rowCount: 0 };
    }
  },

  connect: async () => ({
    query: async (sql, params = []) => pool.query(sql, params),
    release: () => { },
  }),

  end: async (callback) => {
    console.log('[MEM-DB] Pool closed');
    if (callback) callback();
  },

  on: (event, handler) => {
    // Ignore pool error events for in-memory
  },
};

module.exports = pool;
