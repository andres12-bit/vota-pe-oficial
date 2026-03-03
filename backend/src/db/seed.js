/**
 * VOTA.PE — Complete Seed Data
 * 1000+ candidates based on JNE Voto Informado 2026
 * Source: https://votoinformado.jne.gob.pe/
 * 
 * Parties, presidential candidates, senators, deputies, andean parliament
 * Covering all 25 Peruvian regions
 */
const pool = require('./pool');

// ==================== PARTIES (Real JNE 2026 — 36 organizations) ====================
const PARTIES = [
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

// ==================== ALL 25 REGIONS ====================
const REGIONS = [
    'Lima', 'Arequipa', 'La Libertad', 'Piura', 'Cajamarca',
    'Junín', 'Cusco', 'Puno', 'Lambayeque', 'Áncash',
    'Loreto', 'Ica', 'San Martín', 'Huánuco', 'Ucayali',
    'Ayacucho', 'Tacna', 'Madre de Dios', 'Amazonas', 'Tumbes',
    'Apurímac', 'Huancavelica', 'Moquegua', 'Pasco', 'Callao'
];

// ==================== PRESIDENTIAL FORMULAS (JNE Voto Informado EG 2026) ====================
// Source: https://votoinformado.jne.gob.pe/presidente-vicepresidentes
// Each entry includes: Presidente, 1er Vicepresidente, 2do Vicepresidente
const PRESIDENTIAL_CANDIDATES = [
    {
        name: 'Pablo Alfonso Lopez Chau Nava', party: 'Ahora Nación', region: 'Lima', bio: 'Rector de la Universidad Nacional de Ingeniería. Doctor en Economía por la UNAM. Economista con más de 35 años en la academia.', stars: 3.5, photo: null,
        vp1: { name: 'Luis Alberto Villanueva Carbajal', bio: 'Primer Vicepresidente por Ahora Nación.' },
        vp2: { name: 'Ruth Zenaida Buendia Mestoquiari', bio: 'Segunda Vicepresidenta por Ahora Nación.' }
    },
    {
        name: 'Ronald Darwin Atencio Sotomayor', party: 'Alianza Electoral Venceremos', region: 'Huánuco', bio: 'Abogado egresado de la USMP. Representante de la Alianza Electoral Venceremos.', stars: 2.4, photo: null,
        vp1: { name: 'Elena Carmen Rivera Huaman', bio: 'Primera Vicepresidenta por Alianza Electoral Venceremos.' },
        vp2: { name: 'Alberto Eugenio Quintanilla Chacon', bio: 'Segundo Vicepresidente por Alianza Electoral Venceremos.' }
    },
    {
        name: 'César Acuña Peralta', party: 'Alianza para el Progreso', region: 'Cajamarca', bio: 'Fundador de la Universidad César Vallejo. Ex Gobernador Regional de La Libertad y ex Alcalde de Trujillo. Doctor por la U. Complutense de Madrid.', stars: 2.8, photo: null,
        vp1: { name: 'Jessica Milagros Tumi Rivas', bio: 'Primera Vicepresidenta por Alianza para el Progreso.' },
        vp2: { name: 'Alejandro Soto Reyes', bio: 'Segundo Vicepresidente por Alianza para el Progreso. Ex Presidente del Congreso.' }
    },
    {
        name: 'José Daniel Williams Zapata', party: 'Avanza País', region: 'Lima', bio: 'Congresista 2021-2025. Licenciado en Ciencias Militares (Escuela Militar de Chorrillos). Maestría en Defensa Nacional (CAEN).', stars: 3.0, photo: null,
        vp1: { name: 'Fernan Romano Altuve-Febres Lores', bio: 'Primer Vicepresidente por Avanza País. Abogado constitucionalista.' },
        vp2: { name: 'Adriana Josefina Tudela Gutierrez', bio: 'Segunda Vicepresidenta por Avanza País. Congresista.' }
    },
    {
        name: 'Álvaro Gonzalo Paz de la Barra Freigeiro', party: 'Fe en el Perú', region: 'Lima', bio: 'Ex Alcalde de La Molina. Ex presidente de AMPE. Abogado por la USMP con Maestría en Gestión Pública.', stars: 2.6, photo: null,
        vp1: { name: 'Yessika Roxsana Arteaga Narvaez', bio: 'Primera Vicepresidenta por Fe en el Perú.' },
        vp2: { name: 'Shellah Belen Palacios Rodriguez', bio: 'Segunda Vicepresidenta por Fe en el Perú.' }
    },
    {
        name: 'Keiko Sofía Fujimori Higuchi', party: 'Fuerza Popular', region: 'Lima', bio: 'Presidenta y fundadora de Fuerza Popular. Ex congresista. MBA de Columbia University. Tres veces candidata presidencial.', stars: 3.2, photo: null,
        vp1: { name: 'Luis Fernando Galarreta Velarde', bio: 'Primer Vicepresidente por Fuerza Popular. Ex Presidente del Congreso. Congresista.' },
        vp2: { name: 'Miguel Ángel Torres Morales', bio: 'Segundo Vicepresidente por Fuerza Popular. Congresista y abogado.' }
    },
    {
        name: 'Fiorella Giannina Molinelli Aristondo', party: 'Fuerza y Libertad', region: 'Lima', bio: 'Ex Presidenta Ejecutiva de EsSalud. Ex Ministra del MIDIS. Economista PUCP con doctorado de la USMP.', stars: 3.6, photo: null,
        vp1: { name: 'Gilbert Félix Violeta López', bio: 'Primer Vicepresidente por Fuerza y Libertad. Abogado y político.' },
        vp2: { name: 'María Luz Pariona Ore', bio: 'Segunda Vicepresidenta por Fuerza y Libertad.' }
    },
    {
        name: 'Roberto Helbert Sánchez Palomino', party: 'Juntos por el Perú', region: 'Lima', bio: 'Congresista y ex Ministro de Comercio Exterior y Turismo. Psicólogo de la UNMSM.', stars: 2.9, photo: null,
        vp1: { name: 'Analí Márquez Huanca', bio: 'Primera Vicepresidenta por Juntos por el Perú.' },
        vp2: { name: 'Brígida Curo Bustincio', bio: 'Segunda Vicepresidenta por Juntos por el Perú.' }
    },
    {
        name: 'Rafael Jorge Belaúnde Llosa', party: 'Libertad Popular', region: 'Lima', bio: 'Ex Ministro de Energía y Minas. Economista de la Universidad de Lima. Empresario y gerente general.', stars: 3.3, photo: null,
        vp1: { name: 'Pedro Álvaro Cateriano Bellido', bio: 'Primer Vicepresidente por Libertad Popular. Ex Presidente del Consejo de Ministros.' },
        vp2: { name: 'Tania Ulrika Porles Bazalar', bio: 'Segunda Vicepresidenta por Libertad Popular.' }
    },
    {
        name: 'Pitter Enrique Valderrama Peña', party: 'Partido Aprista Peruano', region: 'Lima', bio: 'Bachiller en Derecho por la USMP. Analista legal y militante del APRA.', stars: 2.2, photo: null,
        vp1: { name: 'Por confirmar — PAP VP1', bio: 'Primer Vicepresidente por el Partido Aprista Peruano. Datos pendientes en JNE.' },
        vp2: { name: 'Por confirmar — PAP VP2', bio: 'Segundo Vicepresidente por el Partido Aprista Peruano. Datos pendientes en JNE.' }
    },
    {
        name: 'Ricardo Pablo Belmont Cassinelli', party: 'Partido Cívico Obras', region: 'Lima', bio: 'Comunicador, empresario y político. Ex Alcalde de Lima (1990-1995). Fundador de Obras.', stars: 2.5, photo: null,
        vp1: { name: 'Daniel Hugo Barragán Coloma', bio: 'Primer Vicepresidente por Partido Cívico Obras.' },
        vp2: { name: 'Dina Irene Hancco Hancco', bio: 'Segunda Vicepresidenta por Partido Cívico Obras.' }
    },
    {
        name: 'Napoleón Becerra García', party: 'PTE-Perú', region: 'Cajamarca', bio: 'Líder del Partido de los Trabajadores y Emprendedores PTE-Perú. Político de base cajamarquina.', stars: 2.0, photo: null,
        vp1: { name: 'Winston Clemente Huamán Henríquez', bio: 'Primer Vicepresidente por PTE-Perú.' },
        vp2: { name: 'Nélida Juliana Cuayla Cuayla', bio: 'Segunda Vicepresidenta por PTE-Perú.' }
    },
    {
        name: 'Jorge Nieto Montesinos', party: 'Partido del Buen Gobierno', region: 'Lima', bio: 'Ex Ministro de Defensa y de Cultura. Sociólogo y analista político. Fundador del Partido del Buen Gobierno.', stars: 3.4, photo: null,
        vp1: { name: 'Susana Flor de María Matute Charún', bio: 'Primera Vicepresidenta por Partido del Buen Gobierno.' },
        vp2: { name: 'Carlos David Caballero León', bio: 'Segundo Vicepresidente por Partido del Buen Gobierno.' }
    },
    {
        name: 'Charlie Carrasco Salazar', party: 'Partido Demócrata Unido Perú', region: 'Lima', bio: 'Representante del Partido Demócrata Unido Perú. Político emergente.', stars: 2.1, photo: null,
        vp1: { name: 'Por confirmar — PDUP VP1', bio: 'Primer Vicepresidente por Partido Demócrata Unido Perú. Datos pendientes en JNE.' },
        vp2: { name: 'Por confirmar — PDUP VP2', bio: 'Segundo Vicepresidente por Partido Demócrata Unido Perú. Datos pendientes en JNE.' }
    },
    {
        name: 'Alex Gonzales Castillo', party: 'Partido Demócrata Verde', region: 'Lima', bio: 'Candidato del Partido Demócrata Verde. Defensor del ambientalismo y desarrollo sostenible.', stars: 2.3, photo: null,
        vp1: { name: 'Maritza del Carmen R. Sánchez Perales', bio: 'Primera Vicepresidenta por Partido Demócrata Verde.' },
        vp2: { name: 'Félix Medardo Murazzo Carrillo', bio: 'Segundo Vicepresidente por Partido Demócrata Verde.' }
    },
    {
        name: 'Armando Joaquín Masse Fernández', party: 'Partido Democrático Federal', region: 'Lima', bio: 'Representante del Partido Democrático Federal. Propone un estado federal para Perú.', stars: 2.0, photo: null,
        vp1: { name: 'Por confirmar — PDF VP1', bio: 'Primer Vicepresidente por Partido Democrático Federal.' },
        vp2: { name: 'Por confirmar — PDF VP2', bio: 'Segundo Vicepresidente por Partido Democrático Federal.' }
    },
    {
        name: 'George Patrick Forsyth Sommer', party: 'Somos Perú', region: 'Lima', bio: 'Ex futbolista profesional y ex Alcalde de La Victoria. Candidato presidencial por Somos Perú.', stars: 3.3, photo: null,
        vp1: { name: 'Johanna Gabriela Lozada Baldwin', bio: 'Primera Vicepresidenta por Somos Perú.' },
        vp2: { name: 'Herbe Olave Ugarte', bio: 'Segundo Vicepresidente por Somos Perú.' }
    },
    {
        name: 'Luis Fernando Olivera Vega', party: 'Frente de la Esperanza 2021', region: 'Lima', bio: 'Líder del Frente de la Esperanza 2021. Ex parlamentario y político de larga trayectoria.', stars: 2.7, photo: null,
        vp1: { name: 'Elizabeth María del Rosario León Chinchay', bio: 'Primera Vicepresidenta por Frente de la Esperanza 2021.' },
        vp2: { name: 'Carlos Ricardo Cuaresma Sánchez', bio: 'Segundo Vicepresidente por Frente de la Esperanza 2021.' }
    },
    {
        name: 'Mesías Antonio Guevara Amasifuén', party: 'Partido Morado', region: 'San Martín', bio: 'Candidato presidencial del Partido Morado. Representante de la Amazonía peruana.', stars: 2.8, photo: null,
        vp1: { name: 'Por confirmar — PM VP1', bio: 'Primer Vicepresidente por Partido Morado.' },
        vp2: { name: 'Por confirmar — PM VP2', bio: 'Segundo Vicepresidente por Partido Morado.' }
    },
    {
        name: 'Carlos Gonsalo Alvarez Loayza', party: 'País para Todos', region: 'Lima', bio: 'Representante del partido País para Todos. Empresario y político.', stars: 2.1, photo: null,
        vp1: { name: 'Por confirmar — PPT VP1', bio: 'Primer Vicepresidente por País para Todos.' },
        vp2: { name: 'Por confirmar — PPT VP2', bio: 'Segundo Vicepresidente por País para Todos.' }
    },
    {
        name: 'Herbert Caller Gutiérrez', party: 'Partido Patriótico del Perú', region: 'Lima', bio: 'Líder del Partido Patriótico del Perú. Político nacionalista.', stars: 2.4, photo: null,
        vp1: { name: 'Rossana Elena Montes Tello', bio: 'Primera Vicepresidenta por Partido Patriótico del Perú.' },
        vp2: { name: 'Jorge Aquiles Carcovich Cortelezzi', bio: 'Segundo Vicepresidente por Partido Patriótico del Perú.' }
    },
    {
        name: 'Yonhy Lescano Ancieta', party: 'Cooperación Popular', region: 'Puno', bio: 'Abogado y político. Congresista por múltiples periodos. Ex candidato presidencial 2021 por Acción Popular.', stars: 3.0, photo: null,
        vp1: { name: 'Por confirmar — CP VP1', bio: 'Primer Vicepresidente por Cooperación Popular.' },
        vp2: { name: 'Por confirmar — CP VP2', bio: 'Segundo Vicepresidente por Cooperación Popular.' }
    },
    {
        name: 'Wolfgang Mario Grozo Costa', party: 'Integridad Democrática', region: 'Lima', bio: 'Líder de Integridad Democrática. Político comprometido con la transparencia institucional.', stars: 2.3, photo: null,
        vp1: { name: 'Por confirmar — ID VP1', bio: 'Primer Vicepresidente por Integridad Democrática.' },
        vp2: { name: 'Por confirmar — ID VP2', bio: 'Segundo Vicepresidente por Integridad Democrática.' }
    },
    {
        name: 'Vladimir Roy Cerrón Rojas', party: 'Perú Libre', region: 'Junín', bio: 'Médico cirujano y político. Fundador de Perú Libre. Ex Gobernador Regional de Junín.', stars: 1.8, photo: null,
        vp1: { name: 'Por confirmar — PL VP1', bio: 'Primer Vicepresidente por Perú Libre.' },
        vp2: { name: 'Por confirmar — PL VP2', bio: 'Segundo Vicepresidente por Perú Libre.' }
    },
    {
        name: 'Francisco Ernesto Diez-Canseco Távara', party: 'Perú Acción', region: 'Lima', bio: 'Representante de Perú Acción. Político con experiencia legislativa.', stars: 2.5, photo: null,
        vp1: { name: 'Roberto Diego Koster Jáuregui', bio: 'Primer Vicepresidente por Perú Acción.' },
        vp2: { name: 'Clara Amelia Quispe Torres', bio: 'Segunda Vicepresidenta por Perú Acción.' }
    },
    {
        name: 'Mario Enrique Vizcarra Cornejo', party: 'Perú Primero', region: 'Lima', bio: 'Líder de Perú Primero. Promueve políticas de modernización del Estado.', stars: 2.2, photo: null,
        vp1: { name: 'Carlos Hernán Illanes Calderón', bio: 'Primer Vicepresidente por Perú Primero.' },
        vp2: { name: 'Judith Carla Mendoza Díaz', bio: 'Segunda Vicepresidenta por Perú Primero.' }
    },
    {
        name: 'Walter Gilmer Chirinos Purizaga', party: 'PRIN', region: 'Lima', bio: 'Representante del partido PRIN. Político y profesional independiente.', stars: 2.0, photo: null,
        vp1: { name: 'Julio Alberto Vega Ybañez', bio: 'Primer Vicepresidente por PRIN.' },
        vp2: { name: 'Mayra Lizeth Vargas Gil', bio: 'Segunda Vicepresidenta por PRIN.' }
    },
    {
        name: 'Alfonso Carlos Espa y Garcés-Alvear', party: 'Partido SICREO', region: 'Lima', bio: 'Fundador y líder de SICREO. Propone un sistema de crédito social.', stars: 1.9, photo: null,
        vp1: { name: 'Por confirmar — SIC VP1', bio: 'Primer Vicepresidente por Partido SICREO.' },
        vp2: { name: 'Por confirmar — SIC VP2', bio: 'Segundo Vicepresidente por Partido SICREO.' }
    },
    {
        name: 'Carlos Ernesto Jaico Carranza', party: 'Perú Moderno', region: 'Lima', bio: 'Líder de Perú Moderno. Promueve la modernización tecnológica del país.', stars: 2.3, photo: null,
        vp1: { name: 'Por confirmar — PMOD VP1', bio: 'Primer Vicepresidente por Perú Moderno.' },
        vp2: { name: 'Por confirmar — PMOD VP2', bio: 'Segundo Vicepresidente por Perú Moderno.' }
    },
    {
        name: 'José León Luna Gálvez', party: 'Podemos Perú', region: 'Ayacucho', bio: 'Empresario y político. Fundador de la Universidad Telesup. Congresista y líder de Podemos Perú.', stars: 2.5, photo: null,
        vp1: { name: 'Por confirmar — POD VP1', bio: 'Primer Vicepresidente por Podemos Perú.' },
        vp2: { name: 'Por confirmar — POD VP2', bio: 'Segundo Vicepresidente por Podemos Perú.' }
    },
    {
        name: 'María Soledad Pérez Tello de Rodríguez', party: 'Primero la Gente', region: 'Lima', bio: 'Ex Ministra de Justicia y Derechos Humanos. Abogada y defensora de derechos civiles.', stars: 3.7, photo: null,
        vp1: { name: 'Por confirmar — PLG VP1', bio: 'Primer Vicepresidente por Primero la Gente.' },
        vp2: { name: 'Por confirmar — PLG VP2', bio: 'Segundo Vicepresidente por Primero la Gente.' }
    },
    {
        name: 'Paul Davis Jaimes Blanco', party: 'Progresemos', region: 'Lima', bio: 'Representante de Progresemos. Político con visión de desarrollo progresista.', stars: 2.1, photo: null,
        vp1: { name: 'Por confirmar — PROG VP1', bio: 'Primer Vicepresidente por Progresemos.' },
        vp2: { name: 'Por confirmar — PROG VP2', bio: 'Segundo Vicepresidente por Progresemos.' }
    },
    {
        name: 'Rafael Bernardo López Aliaga Cazorla', party: 'Renovación Popular', region: 'Lima', bio: 'Empresario y actual Alcalde de Lima Metropolitana. Fundador de Renovación Popular.', stars: 2.8, photo: null,
        vp1: { name: 'Por confirmar — RP VP1', bio: 'Primer Vicepresidente por Renovación Popular.' },
        vp2: { name: 'Por confirmar — RP VP2', bio: 'Segundo Vicepresidente por Renovación Popular.' }
    },
    {
        name: 'Antonio Ortiz Villano', party: 'Salvemos al Perú', region: 'Lima', bio: 'Representante de Salvemos al Perú. Político de base comprometido con la justicia social.', stars: 2.0, photo: null,
        vp1: { name: 'Por confirmar — SAP VP1', bio: 'Primer Vicepresidente por Salvemos al Perú.' },
        vp2: { name: 'Por confirmar — SAP VP2', bio: 'Segundo Vicepresidente por Salvemos al Perú.' }
    },
    {
        name: 'Rosario del Pilar Fernández Bazán', party: 'Un Camino Diferente', region: 'Lambayeque', bio: 'Ex Ministra de Justicia. Ex congresista y política de larga trayectoria.', stars: 3.1, photo: null,
        vp1: { name: 'Por confirmar — UCD VP1', bio: 'Primer Vicepresidente por Un Camino Diferente.' },
        vp2: { name: 'Por confirmar — UCD VP2', bio: 'Segundo Vicepresidente por Un Camino Diferente.' }
    },
    {
        name: 'Roberto Enrique Chiabra León', party: 'Unidad Nacional', region: 'Lima', bio: 'General EP en retiro. Ex congresista. Candidato presidencial por Unidad Nacional.', stars: 3.2, photo: null,
        vp1: { name: 'Por confirmar — UN VP1', bio: 'Primer Vicepresidente por Unidad Nacional.' },
        vp2: { name: 'Por confirmar — UN VP2', bio: 'Segundo Vicepresidente por Unidad Nacional.' }
    },
];

// ==================== SENATOR NAME COMPONENTS (for generating 130 senators) ====================
const FIRST_NAMES_M = [
    'Carlos', 'José', 'Luis', 'Miguel', 'Juan', 'Pedro', 'Jorge', 'Fernando', 'Roberto', 'Ricardo',
    'Andrés', 'Eduardo', 'Manuel', 'Francisco', 'Alberto', 'Raúl', 'Sergio', 'Daniel', 'Alejandro', 'Víctor',
    'Óscar', 'Enrique', 'Mario', 'Hugo', 'César', 'Gustavo', 'Javier', 'Antonio', 'Ernesto', 'Arturo',
    'Héctor', 'Pablo', 'Germán', 'Iván', 'Marcos', 'Adrián', 'Diego', 'Gabriel', 'Adriel', 'Walter',
    'Wilmer', 'Edwin', 'Teófilo', 'Freddy', 'Segundo', 'Santos', 'Ángel', 'Flavio', 'Mesías', 'Abel',
];
const FIRST_NAMES_F = [
    'María', 'Ana', 'Carmen', 'Patricia', 'Rosa', 'Claudia', 'Lucía', 'Silvia', 'Gloria', 'Teresa',
    'Gladys', 'Isabel', 'Elena', 'Martha', 'Rocío', 'Pilar', 'Nelly', 'Luz', 'Beatriz', 'Sonia',
    'Mónica', 'Janet', 'Yolanda', 'Norma', 'Susana', 'Dina', 'Flor', 'Milagros', 'Karina', 'Emperatriz',
    'Rosario', 'Verónica', 'Cecilia', 'Doris', 'Elsa', 'Magaly', 'Luzmila', 'Jackeline', 'Nancy', 'Vilma',
];
const LAST_NAMES = [
    'García', 'Rodríguez', 'Martínez', 'López', 'Gonzales', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
    'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez', 'Ortiz', 'Ruiz',
    'Jiménez', 'Medina', 'Castro', 'Vargas', 'Ramos', 'Herrera', 'Chávez', 'Silva', 'Mendoza', 'Quispe',
    'Rojas', 'Huamán', 'Espinoza', 'Vásquez', 'Fernández', 'Córdova', 'Paredes', 'Villanueva', 'Cevallos', 'Palomino',
    'Cárdenas', 'Aguilar', 'Carrasco', 'Valdivia', 'Mamani', 'Condori', 'Ccama', 'Apaza', 'Cusi', 'Ticona',
    'Puma', 'Yupanqui', 'Huanca', 'Challco', 'Turpo', 'Nina', 'Coaquira', 'Chambi', 'Sucari', 'Hancco',
    'Cahuana', 'Layme', 'Pari', 'Choque', 'Limachi', 'Calcina', 'Catacora', 'Arapa', 'Lupaca', 'Pacompia',
    'Zevallos', 'Benites', 'Altamirano', 'Cabanillas', 'Olaya', 'Palacios', 'Hurtado', 'Tello', 'Bustamante', 'Alarcón',
];

// ==================== PROPOSAL CATEGORIES ====================
const PROPOSAL_CATEGORIES = [
    'Educación', 'Salud', 'Seguridad Ciudadana', 'Economía', 'Anticorrupción',
    'Empleo', 'Infraestructura', 'Medio Ambiente', 'Agricultura', 'Tecnología',
    'Justicia', 'Descentralización', 'Derechos Humanos', 'Turismo', 'Cultura',
];

const PROPOSALS_POOL = [
    { cat: 'Educación', title: 'Universalización de educación digital', desc: 'Dotar a todas las escuelas públicas de conectividad y tablets para estudiantes.' },
    { cat: 'Educación', title: 'Incremento salarial a docentes', desc: 'Aumentar el sueldo base de maestros en 40% durante el quinquenio.' },
    { cat: 'Educación', title: 'Programa de becas integrales', desc: 'Crear 50,000 becas para estudiantes de bajos recursos en universidades públicas y privadas.' },
    { cat: 'Salud', title: 'Hospital en cada provincia', desc: 'Construir hospitales de nivel II en todas las provincias que no cuenten con uno.' },
    { cat: 'Salud', title: 'Seguro universal de salud', desc: 'Implementar cobertura universal de salud para todos los peruanos sin exclusiones.' },
    { cat: 'Salud', title: 'Medicamentos genéricos gratuitos', desc: 'Garantizar acceso gratuito a medicamentos genéricos en todas las postas médicas.' },
    { cat: 'Seguridad Ciudadana', title: 'Reforma policial integral', desc: 'Modernizar la PNP con tecnología, capacitación y mejores salarios.' },
    { cat: 'Seguridad Ciudadana', title: 'Cámaras de vigilancia en todo Lima', desc: 'Instalar 50,000 cámaras de seguridad interconectadas con la policía.' },
    { cat: 'Seguridad Ciudadana', title: 'Tolerancia cero contra el crimen organizado', desc: 'Crear unidades especializadas para combatir extorsión, sicariato y narcotráfico.' },
    { cat: 'Economía', title: 'Reducción del IGV al 15%', desc: 'Bajar el impuesto general a las ventas para dinamizar el consumo interno.' },
    { cat: 'Economía', title: 'Formalización masiva de MYPES', desc: 'Simplificar trámites y reducir costos para formalizar micro y pequeñas empresas.' },
    { cat: 'Economía', title: 'Reactivación de la inversión minera', desc: 'Destrabar proyectos mineros prioritarios respetando estándares ambientales.' },
    { cat: 'Anticorrupción', title: 'Muerte civil para corruptos', desc: 'Inhabilitación perpetua de función pública para condenados por corrupción.' },
    { cat: 'Anticorrupción', title: 'Transparencia total del Estado', desc: 'Publicar en tiempo real todos los gastos del Estado en portal abierto.' },
    { cat: 'Empleo', title: 'Programa Primer Empleo Joven', desc: 'Subsidiar el 50% del salario del primer empleo formal para jóvenes de 18-25 años.' },
    { cat: 'Infraestructura', title: 'Tren de cercanías Lima-Regiones', desc: 'Conectar Lima con Ica, Junín y La Libertad mediante tren de alta velocidad.' },
    { cat: 'Infraestructura', title: 'Agua y desagüe para todos', desc: 'Garantizar acceso universal a agua potable y alcantarillado en 5 años.' },
    { cat: 'Medio Ambiente', title: 'Perú carbono neutral al 2040', desc: 'Transición a energías renovables y reforestación de 1 millón de hectáreas.' },
    { cat: 'Agricultura', title: 'Segunda reforma agraria técnica', desc: 'Modernizar la agricultura familiar con tecnología, créditos y mercados.' },
    { cat: 'Tecnología', title: 'Perú Digital 2030', desc: 'Gobierno electrónico al 100%, conectividad 5G en todas las capitales de región.' },
    { cat: 'Justicia', title: 'Reforma del sistema judicial', desc: 'Modernizar juzgados con tecnología, reducir la carga procesal y eliminar la corrupción judicial.' },
    { cat: 'Descentralización', title: 'Presupuesto participativo regional', desc: 'Transferir el 30% del presupuesto nacional a gobiernos regionales y locales.' },
];

const EVENT_TYPES = ['positive', 'negative', 'corruption', 'achievement'];
const EVENT_POOL = [
    { type: 'achievement', title: 'Reconocimiento por gestión transparente', desc: 'Premiado por organización civil por transparencia en gestión pública.', impact: 8 },
    { type: 'positive', title: 'Propuesta de ley aprobada', desc: 'Logró la aprobación de proyecto de ley en beneficio de la educación.', impact: 6 },
    { type: 'positive', title: 'Alianza estratégica regional', desc: 'Formalizó alianza con organizaciones civiles para combatir la pobreza.', impact: 5 },
    { type: 'negative', title: 'Investigación por financiamiento irregular', desc: 'Bajo investigación preliminar por posible financiamiento irregular de campaña.', impact: -7 },
    { type: 'negative', title: 'Declaraciones polémicas', desc: 'Generó controversia por declaraciones sobre política económica.', impact: -4 },
    { type: 'corruption', title: 'Implicado en caso de corrupción', desc: 'Mencionado en investigación fiscal por presunto lavado de activos.', impact: -15 },
    { type: 'corruption', title: 'Sentencia por peculado', desc: 'Condena en primera instancia por uso indebido de fondos públicos.', impact: -20 },
    { type: 'achievement', title: 'Premio a mejor legislador', desc: 'Reconocido como legislador más productivo del periodo.', impact: 10 },
    { type: 'positive', title: 'Obra de infraestructura inaugurada', desc: 'Inauguró proyecto de infraestructura vial en zona rural.', impact: 7 },
    { type: 'negative', title: 'Ausentismo parlamentario', desc: 'Registró alta tasa de inasistencia a sesiones del pleno.', impact: -5 },
    { type: 'achievement', title: 'Gestión exitosa en pandemia', desc: 'Lideró campaña de vacunación regional con resultados sobresalientes.', impact: 9 },
    { type: 'positive', title: 'Fiscalización efectiva', desc: 'Descubrió irregularidades en licitación pública ahorrando S/ 5 millones.', impact: 8 },
];

// ==================== HELPER FUNCTIONS ====================
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }

function generateName(gender = null) {
    const g = gender || (Math.random() > 0.35 ? 'M' : 'F');
    const first = randomFrom(g === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F);
    const second = Math.random() > 0.4 ? ' ' + randomFrom(g === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F) : '';
    const last1 = randomFrom(LAST_NAMES);
    let last2 = randomFrom(LAST_NAMES);
    while (last2 === last1) last2 = randomFrom(LAST_NAMES);
    return `${first}${second} ${last1} ${last2}`;
}

// ==================== MAIN SEED ====================
async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Clean existing data
        await client.query('DELETE FROM votes');
        await client.query('DELETE FROM candidate_events');
        await client.query('DELETE FROM candidate_proposals');
        await client.query('DELETE FROM party_scores');
        await client.query('DELETE FROM candidates');
        await client.query('DELETE FROM parties');
        console.log('🧹 Cleaned existing data');

        // Insert Parties
        const partyMap = {};
        for (const p of PARTIES) {
            const result = await client.query(
                'INSERT INTO parties (name, abbreviation, color) VALUES ($1, $2, $3) RETURNING id',
                [p.name, p.abbreviation, p.color]
            );
            partyMap[p.name] = result.rows[0].id;
        }
        console.log(`🏛️  Inserted ${PARTIES.length} parties`);

        let totalCandidates = 0;
        let totalProposals = 0;
        let totalEvents = 0;

        // ==================== INSERT PRESIDENTIAL FORMULAS (President + VPs) ====================
        let totalVPs = 0;
        for (const c of PRESIDENTIAL_CANDIDATES) {
            const partyId = partyMap[c.party];
            if (!partyId) continue;

            const result = await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography, 
         intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
         VALUES ($1, $2, $3, 'president', $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING id`,
                [c.name, c.photo, partyId, c.region, c.bio,
                randomFloat(35, 85), randomFloat(10, 80), randomFloat(20, 90), randomFloat(10, 70), c.stars, randomFloat(30, 75)]
            );
            const candId = result.rows[0].id;

            // Insert 1er Vicepresidente
            if (c.vp1 && c.vp1.name) {
                await client.query(
                    `INSERT INTO candidates (name, party_id, position, region, biography, 
                     intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
                     VALUES ($1, $2, 'vice_president_1', $3, $4, $5, $6, $7, $8, $9, $10, true)`,
                    [c.vp1.name, partyId, c.region, c.vp1.bio,
                    randomFloat(30, 75), randomFloat(5, 60), randomFloat(25, 85), randomFloat(10, 60),
                    randomFloat(2.0, 4.0), randomFloat(25, 65)]
                );
                totalVPs++;
            }

            // Insert 2do Vicepresidente
            if (c.vp2 && c.vp2.name) {
                await client.query(
                    `INSERT INTO candidates (name, party_id, position, region, biography, 
                     intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
                     VALUES ($1, $2, 'vice_president_2', $3, $4, $5, $6, $7, $8, $9, $10, true)`,
                    [c.vp2.name, partyId, c.region, c.vp2.bio,
                    randomFloat(30, 75), randomFloat(5, 60), randomFloat(25, 85), randomFloat(10, 60),
                    randomFloat(2.0, 4.0), randomFloat(25, 65)]
                );
                totalVPs++;
            }

            // Add 3-5 proposals per presidential candidate
            const numProposals = randomBetween(3, 5);
            const usedProposals = new Set();
            for (let i = 0; i < numProposals; i++) {
                let prop;
                do { prop = randomFrom(PROPOSALS_POOL); } while (usedProposals.has(prop.title));
                usedProposals.add(prop.title);
                await client.query(
                    'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                    [candId, prop.title, prop.cat, prop.desc]
                );
                totalProposals++;
            }

            // Add 2-4 events per presidential candidate
            const numEvents = randomBetween(2, 4);
            for (let i = 0; i < numEvents; i++) {
                const evt = randomFrom(EVENT_POOL);
                await client.query(
                    `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
           VALUES ($1, $2, $3, $4, $5, true)`,
                    [candId, evt.type, evt.title, evt.desc, evt.impact]
                );
                totalEvents++;
            }
            totalCandidates++;
        }
        console.log(`🇵🇪 Inserted ${PRESIDENTIAL_CANDIDATES.length} presidential candidates + ${totalVPs} vice presidents`);

        // ==================== INSERT SENATORS (130 — 5 per region + extras) ====================
        const senatorsPerParty = {};
        for (const region of REGIONS) {
            // Each region gets ~5-6 senators from different parties
            const numSenators = randomBetween(5, 7);
            const usedParties = new Set();
            for (let i = 0; i < numSenators; i++) {
                let party;
                do { party = randomFrom(PARTIES); } while (usedParties.has(party.name) && usedParties.size < PARTIES.length);
                usedParties.add(party.name);

                const name = generateName();
                const bio = `Candidato(a) al Senado por ${region}. Miembro de ${party.name}.`;
                const stars = randomFloat(1.5, 4.8);

                const result = await client.query(
                    `INSERT INTO candidates (name, party_id, position, region, biography,
           intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
           VALUES ($1, $2, 'senator', $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING id`,
                    [name, partyMap[party.name], region, bio,
                        randomFloat(25, 80), randomFloat(5, 65), randomFloat(20, 85), randomFloat(5, 60), stars, randomFloat(20, 70)]
                );

                // Add 1-3 proposals per senator
                const numProps = randomBetween(1, 3);
                for (let j = 0; j < numProps; j++) {
                    const prop = randomFrom(PROPOSALS_POOL);
                    await client.query(
                        'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                        [result.rows[0].id, prop.title, prop.cat, prop.desc]
                    );
                    totalProposals++;
                }

                // Add 1-2 events per senator
                const numEvts = randomBetween(1, 2);
                for (let j = 0; j < numEvts; j++) {
                    const evt = randomFrom(EVENT_POOL);
                    await client.query(
                        `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
             VALUES ($1, $2, $3, $4, $5, $6)`,
                        [result.rows[0].id, evt.type, evt.title, evt.desc, evt.impact, Math.random() > 0.3]
                    );
                    totalEvents++;
                }
                totalCandidates++;
                senatorsPerParty[party.name] = (senatorsPerParty[party.name] || 0) + 1;
            }
        }
        console.log(`👔 Inserted ${totalCandidates - PRESIDENTIAL_CANDIDATES.length} senators`);

        // ==================== INSERT DEPUTIES (650+ — at least 26 per region) ====================
        const deputiesStart = totalCandidates;
        for (const region of REGIONS) {
            // Lima gets more deputies, other regions get 20-30
            const numDeputies = region === 'Lima' ? randomBetween(35, 45) : randomBetween(20, 30);
            const usedNames = new Set();
            for (let i = 0; i < numDeputies; i++) {
                const party = randomFrom(PARTIES);
                let name;
                do { name = generateName(); } while (usedNames.has(name));
                usedNames.add(name);

                const bio = `Candidato(a) a Diputado(a) por ${region}. Representante de ${party.name}.`;
                const stars = randomFloat(1.5, 4.5);

                const result = await client.query(
                    `INSERT INTO candidates (name, party_id, position, region, biography,
           intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
           VALUES ($1, $2, 'deputy', $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING id`,
                    [name, partyMap[party.name], region, bio,
                        randomFloat(20, 75), randomFloat(3, 55), randomFloat(15, 80), randomFloat(5, 55), stars, randomFloat(15, 65)]
                );

                // Add 1-2 proposals per deputy
                const numProps = randomBetween(1, 2);
                for (let j = 0; j < numProps; j++) {
                    const prop = randomFrom(PROPOSALS_POOL);
                    await client.query(
                        'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                        [result.rows[0].id, prop.title, prop.cat, prop.desc]
                    );
                    totalProposals++;
                }

                // Add 0-2 events per deputy
                if (Math.random() > 0.4) {
                    const evt = randomFrom(EVENT_POOL);
                    await client.query(
                        `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
             VALUES ($1, $2, $3, $4, $5, $6)`,
                        [result.rows[0].id, evt.type, evt.title, evt.desc, evt.impact, Math.random() > 0.3]
                    );
                    totalEvents++;
                }
                totalCandidates++;
            }
        }
        console.log(`📋 Inserted ${totalCandidates - deputiesStart} deputies`);

        // ==================== INSERT ANDEAN PARLIAMENT (100 — ~5 per party) ====================
        const andeanStart = totalCandidates;
        for (const party of PARTIES) {
            const numAndean = randomBetween(4, 6);
            for (let i = 0; i < numAndean; i++) {
                const region = randomFrom(REGIONS);
                const name = generateName();
                const bio = `Candidato(a) al Parlamento Andino. Representante de ${party.name} por ${region}.`;
                const stars = randomFloat(1.5, 4.2);

                const result = await client.query(
                    `INSERT INTO candidates (name, party_id, position, region, biography,
           intelligence_score, momentum_score, integrity_score, risk_score, stars_rating, final_score, is_active)
           VALUES ($1, $2, 'andean', $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING id`,
                    [name, partyMap[party.name], region, bio,
                        randomFloat(20, 70), randomFloat(3, 50), randomFloat(20, 75), randomFloat(5, 50), stars, randomFloat(15, 60)]
                );

                // Add 1 proposal per andean candidate
                const prop = randomFrom(PROPOSALS_POOL);
                await client.query(
                    'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                    [result.rows[0].id, prop.title, prop.cat, prop.desc]
                );
                totalProposals++;

                if (Math.random() > 0.5) {
                    const evt = randomFrom(EVENT_POOL);
                    await client.query(
                        `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
             VALUES ($1, $2, $3, $4, $5, true)`,
                        [result.rows[0].id, evt.type, evt.title, evt.desc, evt.impact]
                    );
                    totalEvents++;
                }
                totalCandidates++;
            }
        }
        console.log(`🌎 Inserted ${totalCandidates - andeanStart} andean parliament candidates`);

        // ==================== GENERATE SIMULATED VOTES ====================
        const allCandidates = await client.query('SELECT id, position FROM candidates');
        let totalVotes = 0;
        const ipPool = [];
        for (let i = 0; i < 500; i++) {
            ipPool.push(`${randomBetween(180, 200)}.${randomBetween(1, 254)}.${randomBetween(1, 254)}.${randomBetween(1, 254)}`);
        }

        // Give presidential candidates more votes
        for (const c of allCandidates.rows) {
            let maxVotes;
            if (c.position === 'president') maxVotes = randomBetween(5000, 50000);
            else if (c.position === 'senator') maxVotes = randomBetween(200, 5000);
            else if (c.position === 'deputy') maxVotes = randomBetween(100, 3000);
            else maxVotes = randomBetween(50, 1500);

            // Insert batch vote count (not individual votes for performance)
            await client.query(
                'UPDATE candidates SET vote_count = $1 WHERE id = $2',
                [maxVotes, c.id]
            );
            totalVotes += maxVotes;
        }
        console.log(`🗳️  Generated ${totalVotes.toLocaleString()} simulated votes`);

        // ==================== INITIALIZE PARTY SCORES ====================
        for (const [partyName, partyId] of Object.entries(partyMap)) {
            const partyStats = await client.query(
                `SELECT AVG(final_score) as avg_score, SUM(vote_count) as total_votes, COUNT(*) as candidate_count
         FROM candidates WHERE party_id = $1 AND is_active = true`,
                [partyId]
            );
            const stats = partyStats.rows[0];
            const partyScore = parseFloat(stats.avg_score || 0).toFixed(2);

            await client.query(
                `INSERT INTO party_scores (party_id, party_full_score, ranking_position)
         VALUES ($1, $2, 1)
         ON CONFLICT (party_id) DO UPDATE SET party_full_score = $2`,
                [partyId, partyScore]
            );
        }
        console.log(`📊 Initialized party scores`);

        // ==================== UPDATE SEARCH VECTORS ====================
        await client.query(`
      UPDATE candidates SET search_vector = 
        to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(region, '') || ' ' || COALESCE(biography, ''))
    `);
        console.log(`🔍 Updated search vectors`);

        // ==================== UPDATE RANKINGS ====================
        // Rank by position
        for (const pos of ['president', 'vice_president_1', 'vice_president_2', 'senator', 'deputy', 'andean']) {
            await client.query(`
        UPDATE candidates SET ranking_position = ranked.rn
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY final_score DESC) as rn
          FROM candidates WHERE position = '${pos}' AND is_active = true
        ) as ranked
        WHERE candidates.id = ranked.id
      `);
        }
        console.log(`🏆 Updated candidate rankings`);

        // Rank parties
        await client.query(`
      UPDATE party_scores SET ranking_position = ranked.rn
      FROM (
        SELECT party_id, ROW_NUMBER() OVER (ORDER BY party_full_score DESC) as rn
        FROM party_scores
      ) as ranked
      WHERE party_scores.party_id = ranked.party_id
    `);
        console.log(`🏛️  Updated party rankings`);

        await client.query('COMMIT');

        console.log(`
╔══════════════════════════════════════╗
║     🗳️  VOTA.PE SEED COMPLETE       ║
╠══════════════════════════════════════╣
║  Parties:     ${PARTIES.length.toString().padStart(6)}               ║
║  Candidates:  ${totalCandidates.toString().padStart(6)}               ║
║  Proposals:   ${totalProposals.toString().padStart(6)}               ║
║  Events:      ${totalEvents.toString().padStart(6)}               ║
║  Votes:       ${totalVotes.toLocaleString().padStart(10)}           ║
╚══════════════════════════════════════╝
    `);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed error:', err);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
}

seed().catch(console.error);
