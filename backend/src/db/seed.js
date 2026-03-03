/**
 * VOTA.PE — Real JNE Data Seed
 * Loads 6,960 candidates from jne_hojadevida_full.json
 * Source: JNE Voto Informado — HVConsolidado API (2026)
 */
const pool = require('./pool');
const path = require('path');
const fs = require('fs');

// ── Load real JNE data ──
const JNE_DATA_PATH = path.join(__dirname, '..', 'data', 'jne_hojadevida_full.json');
let jneData;
try {
    jneData = JSON.parse(fs.readFileSync(JNE_DATA_PATH, 'utf-8'));
    console.log(`📂 Loaded JNE data: ${JNE_DATA_PATH}`);
} catch (err) {
    console.error(`❌ Cannot load JNE data from ${JNE_DATA_PATH}:`, err.message);
    process.exit(1);
}

// ── Party colors (manually curated for brand identity) ──
const PARTY_COLORS = {
    'PARTIDO DEMOCRATICO SOMOS PERU': '#C62828',
    'RENOVACION POPULAR': '#1A237E',
    'ALIANZA PARA EL PROGRESO': '#1565C0',
    'JUNTOS POR EL PERU': '#E65100',
    'FUERZA POPULAR': '#FF6600',
    'AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL': '#0D47A1',
    'PARTIDO POLITICO NACIONAL PERU LIBRE': '#B71C1C',
    'PODEMOS PERU': '#F44336',
    'PARTIDO MORADO': '#7B1FA2',
    'PARTIDO FRENTE DE LA ESPERANZA 2021': '#004D40',
    'PARTIDO DEMOCRATA UNIDO PERU': '#2E7D32',
    'PARTIDO PATRIOTICO DEL PERU': '#BF360C',
    'PARTIDO DEMOCRATA VERDE': '#388E3C',
    'FE EN EL PERU': '#FF8F00',
    'FRENTE POPULAR AGRICOLA FIA DEL PERU': '#33691E',
    'PARTIDO POLITICO PRIN': '#880E4F',
    'PERU MODERNO': '#0277BD',
    'PARTIDO POLITICO PERU PRIMERO': '#311B92',
    'SALVEMOS AL PERU': '#4A148C',
    'PARTIDO APRISTA PERUANO': '#D32F2F',
    'PRIMERO LA GENTE - COMUNIDAD, ECOLOGIA, LIBERTAD Y PROGRESO': '#00897B',
    'PARTIDO POLITICO PERU ACCION': '#01579B',
    'LIBERTAD POPULAR': '#5D4037',
    'PARTIDO SICREO': '#4E342E',
    'PARTIDO DE LOS TRABAJADORES Y EMPRENDEDORES PTE - PERU': '#00838F',
    'PARTIDO CIVICO OBRAS': '#6D4C41',
    'PARTIDO PAIS PARA TODOS': '#F9A825',
    'PARTIDO DEL BUEN GOBIERNO': '#EF6C00',
    'PROGRESEMOS': '#558B2F',
    'PARTIDO CIUDADANOS POR EL PERU': '#FF7043',
    'AHORA NACION - AN': '#E53935',
    'PARTIDO POLITICO INTEGRIDAD DEMOCRATICA': '#00695C',
    'PARTIDO DEMOCRATICO FEDERAL': '#7B1FA2',
    'PARTIDO POLITICO COOPERACION POPULAR': '#AD1457',
    'UN CAMINO DIFERENTE': '#E91E63',
    'UNIDAD NACIONAL': '#37474F',
    'FUERZA Y LIBERTAD': '#1976D2',
    'ALIANZA ELECTORAL VENCEREMOS': '#43A047',
};

// ── Party abbreviations ──
const PARTY_ABBREVS = {
    'PARTIDO DEMOCRATICO SOMOS PERU': 'SP',
    'RENOVACION POPULAR': 'RP',
    'ALIANZA PARA EL PROGRESO': 'APP',
    'JUNTOS POR EL PERU': 'JPP',
    'FUERZA POPULAR': 'FP',
    'AVANZA PAIS - PARTIDO DE INTEGRACION SOCIAL': 'AVP',
    'PARTIDO POLITICO NACIONAL PERU LIBRE': 'PL',
    'PODEMOS PERU': 'POD',
    'PARTIDO MORADO': 'PM',
    'PARTIDO FRENTE DE LA ESPERANZA 2021': 'FE21',
    'PARTIDO DEMOCRATA UNIDO PERU': 'PDUP',
    'PARTIDO PATRIOTICO DEL PERU': 'PPP',
    'PARTIDO DEMOCRATA VERDE': 'PDV',
    'FE EN EL PERU': 'FEP',
    'FRENTE POPULAR AGRICOLA FIA DEL PERU': 'FREPAP',
    'PARTIDO POLITICO PRIN': 'PRIN',
    'PERU MODERNO': 'PMOD',
    'PARTIDO POLITICO PERU PRIMERO': 'PP',
    'SALVEMOS AL PERU': 'SAP',
    'PARTIDO APRISTA PERUANO': 'PAP',
    'PRIMERO LA GENTE - COMUNIDAD, ECOLOGIA, LIBERTAD Y PROGRESO': 'PLG',
    'PARTIDO POLITICO PERU ACCION': 'PA',
    'LIBERTAD POPULAR': 'LP',
    'PARTIDO SICREO': 'SIC',
    'PARTIDO DE LOS TRABAJADORES Y EMPRENDEDORES PTE - PERU': 'PTE',
    'PARTIDO CIVICO OBRAS': 'PCO',
    'PARTIDO PAIS PARA TODOS': 'PPT',
    'PARTIDO DEL BUEN GOBIERNO': 'PBG',
    'PROGRESEMOS': 'PROG',
    'PARTIDO CIUDADANOS POR EL PERU': 'CPP',
    'AHORA NACION - AN': 'AN',
    'PARTIDO POLITICO INTEGRIDAD DEMOCRATICA': 'ID',
    'PARTIDO DEMOCRATICO FEDERAL': 'PDF',
    'PARTIDO POLITICO COOPERACION POPULAR': 'CP',
    'UN CAMINO DIFERENTE': 'UCD',
    'UNIDAD NACIONAL': 'UN',
    'FUERZA Y LIBERTAD': 'FYL',
    'ALIANZA ELECTORAL VENCEREMOS': 'AEV',
};

// ── Proposal templates ──
const PROPOSALS_POOL = [
    { cat: 'Educación', title: 'Universalización de educación digital', desc: 'Dotar a todas las escuelas públicas de conectividad y tablets para estudiantes.' },
    { cat: 'Educación', title: 'Incremento salarial a docentes', desc: 'Aumentar el sueldo base de maestros en 40% durante el quinquenio.' },
    { cat: 'Educación', title: 'Programa de becas integrales', desc: 'Crear 50,000 becas para estudiantes de bajos recursos.' },
    { cat: 'Salud', title: 'Hospital en cada provincia', desc: 'Construir hospitales de nivel II en todas las provincias que no cuenten con uno.' },
    { cat: 'Salud', title: 'Seguro universal de salud', desc: 'Implementar cobertura universal de salud para todos los peruanos.' },
    { cat: 'Salud', title: 'Medicamentos genéricos gratuitos', desc: 'Garantizar acceso gratuito a medicamentos genéricos en todas las postas médicas.' },
    { cat: 'Seguridad', title: 'Reforma policial integral', desc: 'Modernizar la PNP con tecnología, capacitación y mejores salarios.' },
    { cat: 'Seguridad', title: 'Tolerancia cero contra el crimen', desc: 'Crear unidades especializadas para combatir extorsión, sicariato y narcotráfico.' },
    { cat: 'Economía', title: 'Reducción del IGV al 15%', desc: 'Bajar el impuesto general a las ventas para dinamizar el consumo interno.' },
    { cat: 'Economía', title: 'Formalización masiva de MYPES', desc: 'Simplificar trámites y reducir costos para formalizar micro y pequeñas empresas.' },
    { cat: 'Anticorrupción', title: 'Muerte civil para corruptos', desc: 'Inhabilitación perpetua de función pública para condenados por corrupción.' },
    { cat: 'Anticorrupción', title: 'Transparencia total del Estado', desc: 'Publicar en tiempo real todos los gastos del Estado en portal abierto.' },
    { cat: 'Empleo', title: 'Programa Primer Empleo Joven', desc: 'Subsidiar el 50% del salario del primer empleo formal para jóvenes de 18-25 años.' },
    { cat: 'Infraestructura', title: 'Agua y desagüe para todos', desc: 'Garantizar acceso universal a agua potable y alcantarillado en 5 años.' },
    { cat: 'Medio Ambiente', title: 'Perú carbono neutral 2040', desc: 'Transición a energías renovables y reforestación de 1 millón de hectáreas.' },
    { cat: 'Tecnología', title: 'Perú Digital 2030', desc: 'Gobierno electrónico al 100%, conectividad 5G en todas las capitales de región.' },
    { cat: 'Justicia', title: 'Reforma del sistema judicial', desc: 'Modernizar juzgados, reducir carga procesal y eliminar la corrupción judicial.' },
    { cat: 'Agricultura', title: 'Modernización agraria', desc: 'Modernizar la agricultura familiar con tecnología, créditos y mercados.' },
];

const EVENT_POOL = [
    { type: 'achievement', title: 'Reconocimiento por gestión transparente', desc: 'Premiado por organización civil por transparencia en gestión pública.', impact: 8 },
    { type: 'positive', title: 'Propuesta de ley aprobada', desc: 'Logró la aprobación de proyecto de ley en beneficio de la educación.', impact: 6 },
    { type: 'positive', title: 'Alianza estratégica regional', desc: 'Formalizó alianza con organizaciones civiles para combatir la pobreza.', impact: 5 },
    { type: 'negative', title: 'Investigación por financiamiento irregular', desc: 'Bajo investigación preliminar por posible financiamiento irregular.', impact: -7 },
    { type: 'negative', title: 'Declaraciones polémicas', desc: 'Generó controversia por declaraciones sobre política económica.', impact: -4 },
    { type: 'corruption', title: 'Implicado en caso de corrupción', desc: 'Mencionado en investigación fiscal por presunto lavado de activos.', impact: -15 },
    { type: 'achievement', title: 'Premio a mejor legislador', desc: 'Reconocido como legislador más productivo del periodo.', impact: 10 },
    { type: 'positive', title: 'Obra inaugurada', desc: 'Inauguró proyecto de infraestructura vial en zona rural.', impact: 7 },
    { type: 'negative', title: 'Ausentismo parlamentario', desc: 'Registró alta tasa de inasistencia a sesiones del pleno.', impact: -5 },
    { type: 'achievement', title: 'Gestión exitosa en pandemia', desc: 'Lideró campaña de vacunación regional con resultados sobresalientes.', impact: 9 },
    { type: 'positive', title: 'Fiscalización efectiva', desc: 'Descubrió irregularidades en licitación pública ahorrando S/ 5 millones.', impact: 8 },
];

// ── Helpers ──
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }

function buildBiography(candidate) {
    const hv = candidate.hoja_de_vida;
    if (!hv) return `Candidato(a) por ${candidate.party_name}.`;

    const parts = [];

    // Education
    const edu = hv.education || {};
    if (edu.postgraduate && edu.postgraduate.length > 0) {
        const pg = edu.postgraduate[0];
        parts.push(`${pg.degree || 'Posgrado'} ${pg.specialty ? 'en ' + pg.specialty : ''} (${pg.institution || ''})`);
    } else if (edu.university && edu.university.length > 0) {
        const u = edu.university[0];
        parts.push(`${u.degree || 'Profesional'} (${u.institution || ''})`);
    }

    // Work experience - top 2
    if (hv.work_experience && hv.work_experience.length > 0) {
        const top = hv.work_experience.slice(0, 2);
        for (const w of top) {
            if (w.position && w.employer) {
                parts.push(`${w.position} en ${w.employer}`);
            }
        }
    }

    // Political history
    if (hv.political_history && hv.political_history.length > 0) {
        const ph = hv.political_history[0];
        if (ph.position && ph.organization) {
            parts.push(`${ph.position} de ${ph.organization}`);
        }
    }

    if (parts.length === 0) return `Candidato(a) por ${candidate.party_name}.`;
    return parts.join('. ') + '.';
}

function computeStars(candidate) {
    const hv = candidate.hoja_de_vida;
    if (!hv) return parseFloat(randomFloat(1.5, 3.0));

    let score = 2.0; // base

    // Education bonus
    const edu = hv.education || {};
    if (edu.postgraduate && edu.postgraduate.length > 0) score += 0.8;
    else if (edu.university && edu.university.length > 0) score += 0.4;

    // Experience bonus
    if (hv.work_experience && hv.work_experience.length >= 3) score += 0.5;
    else if (hv.work_experience && hv.work_experience.length >= 1) score += 0.2;

    // Political experience bonus
    if (hv.political_history && hv.political_history.length >= 2) score += 0.3;

    // Sentences penalty
    if (hv.sentences && hv.sentences.length > 0) score -= 1.0;

    // Clamp 1.0 - 5.0
    score = Math.max(1.0, Math.min(5.0, score));
    // Add small random variation
    score += (Math.random() - 0.5) * 0.4;
    return Math.max(1.0, Math.min(5.0, parseFloat(score.toFixed(1))));
}

function normalizeRegion(raw) {
    if (!raw) return 'Lima';
    const mapping = {
        'LIMA METROPOLITANA': 'Lima', 'LIMA PROVINCIAS': 'Lima', 'LIMA': 'Lima',
        'AREQUIPA': 'Arequipa', 'LA LIBERTAD': 'La Libertad', 'PIURA': 'Piura',
        'CAJAMARCA': 'Cajamarca', 'JUNIN': 'Junín', 'CUSCO': 'Cusco',
        'PUNO': 'Puno', 'LAMBAYEQUE': 'Lambayeque', 'ANCASH': 'Áncash',
        'LORETO': 'Loreto', 'ICA': 'Ica', 'SAN MARTIN': 'San Martín',
        'HUANUCO': 'Huánuco', 'UCAYALI': 'Ucayali', 'AYACUCHO': 'Ayacucho',
        'TACNA': 'Tacna', 'MADRE DE DIOS': 'Madre de Dios', 'AMAZONAS': 'Amazonas',
        'TUMBES': 'Tumbes', 'APURIMAC': 'Apurímac', 'HUANCAVELICA': 'Huancavelica',
        'MOQUEGUA': 'Moquegua', 'PASCO': 'Pasco', 'CALLAO': 'Callao',
        'NACIONAL': 'Nacional', 'Nacional': 'Nacional',
        'PERUANOS RESIDENTES EN EL EXTRANJERO': 'Extranjero',
    };
    return mapping[raw.toUpperCase()] || raw;
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
        await client.query('DELETE FROM candidate_vice_presidents');
        await client.query('DELETE FROM candidate_plan_gobierno');
        await client.query('DELETE FROM party_scores');
        await client.query('DELETE FROM candidates');
        await client.query('DELETE FROM parties');
        console.log('🧹 Cleaned existing data');

        // Alter position constraint to allow vice presidents
        await client.query(`
            ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_position_check;
            ALTER TABLE candidates ADD CONSTRAINT candidates_position_check 
                CHECK (position IN ('president', 'vice_president_1', 'vice_president_2', 'senator', 'deputy', 'andean'));
        `);

        // ── Insert Parties ──
        const partyMap = {}; // jne_id → db_id
        const partyNameMap = {}; // party_name → db_id
        for (const p of jneData.parties) {
            const color = PARTY_COLORS[p.name] || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const abbrev = PARTY_ABBREVS[p.name] || p.name.split(' ').map(w => w[0]).join('').slice(0, 5);

            const result = await client.query(
                'INSERT INTO parties (name, abbreviation, color, logo) VALUES ($1, $2, $3, $4) RETURNING id',
                [p.name, abbrev, color, p.logo_url || null]
            );
            partyMap[p.jne_id] = result.rows[0].id;
            partyNameMap[p.name] = result.rows[0].id;
        }
        console.log(`🏛️  Inserted ${jneData.parties.length} parties`);

        let totalCandidates = 0;
        let totalProposals = 0;
        let totalEvents = 0;
        let totalVPs = 0;

        // ── Insert Presidents ──
        const presidentsByParty = {}; // party_jne_id → candidate db_id (for linking VPs)
        for (const c of jneData.candidates.presidents) {
            const partyId = partyMap[c.party_jne_id];
            if (!partyId) continue;

            const bio = buildBiography(c);
            const stars = computeStars(c);
            const eduJson = c.hoja_de_vida?.education ? JSON.stringify(c.hoja_de_vida.education) : null;
            const expJson = c.hoja_de_vida?.work_experience ? JSON.stringify(c.hoja_de_vida.work_experience) : null;

            const result = await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score, 
                 stars_rating, final_score, is_active, dni, education, experience)
                 VALUES ($1, $2, $3, 'president', $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14) RETURNING id`,
                [c.name, c.photo_url, partyId, normalizeRegion(c.region), bio,
                randomFloat(35, 85), randomFloat(10, 80), randomFloat(20, 90), randomFloat(10, 70),
                    stars, randomFloat(30, 75), c.dni || null, eduJson, expJson]
            );
            const candId = result.rows[0].id;
            presidentsByParty[c.party_jne_id] = candId;

            // Proposals (3-5)
            const numProposals = randomBetween(3, 5);
            const usedProps = new Set();
            for (let i = 0; i < numProposals; i++) {
                let prop;
                do { prop = randomFrom(PROPOSALS_POOL); } while (usedProps.has(prop.title));
                usedProps.add(prop.title);
                await client.query(
                    'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                    [candId, prop.title, prop.cat, prop.desc]
                );
                totalProposals++;
            }

            // Events (2-4)
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
        console.log(`🇵🇪 Inserted ${jneData.candidates.presidents.length} presidential candidates`);

        // ── Insert Vice Presidents ──
        for (const vp of (jneData.candidates.vice_presidents || [])) {
            const partyId = partyMap[vp.party_jne_id];
            if (!partyId) continue;

            const pos = vp.position === 'vice_president_1' ? 'vice_president_1' : 'vice_president_2';
            const bio = buildBiography(vp);
            const stars = computeStars(vp);

            await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score,
                 stars_rating, final_score, is_active, dni)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13)`,
                [vp.name, vp.photo_url, partyId, pos, normalizeRegion(vp.region), bio,
                randomFloat(30, 75), randomFloat(5, 60), randomFloat(25, 85), randomFloat(10, 60),
                    stars, randomFloat(25, 65), vp.dni || null]
            );

            // Also insert into candidate_vice_presidents for the linked president
            const presidentId = presidentsByParty[vp.party_jne_id];
            if (presidentId) {
                const posLabel = pos === 'vice_president_1' ? '1er Vicepresidente' : '2do Vicepresidente';
                await client.query(
                    `INSERT INTO candidate_vice_presidents (candidate_id, name, position_label, photo, biography, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [presidentId, vp.name, posLabel, vp.photo_url, bio, pos === 'vice_president_1' ? 1 : 2]
                );
            }
            totalVPs++;
            totalCandidates++;
        }
        console.log(`👔 Inserted ${totalVPs} vice presidents`);

        // ── Insert Senators ──
        let senatorCount = 0;
        for (const c of jneData.candidates.senators) {
            const partyId = partyMap[c.party_jne_id];
            if (!partyId) continue;

            const bio = buildBiography(c);
            const stars = computeStars(c);

            const result = await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score,
                 stars_rating, final_score, is_active, dni)
                 VALUES ($1, $2, $3, 'senator', $4, $5, $6, $7, $8, $9, $10, $11, true, $12) RETURNING id`,
                [c.name, c.photo_url, partyId, normalizeRegion(c.region), bio,
                randomFloat(25, 80), randomFloat(5, 65), randomFloat(20, 85), randomFloat(5, 60),
                    stars, randomFloat(20, 70), c.dni || null]
            );

            // 1-2 proposals
            const numProps = randomBetween(1, 2);
            for (let j = 0; j < numProps; j++) {
                const prop = randomFrom(PROPOSALS_POOL);
                await client.query(
                    'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                    [result.rows[0].id, prop.title, prop.cat, prop.desc]
                );
                totalProposals++;
            }

            // 1-2 events (70% chance)
            if (Math.random() > 0.3) {
                const evt = randomFrom(EVENT_POOL);
                await client.query(
                    `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [result.rows[0].id, evt.type, evt.title, evt.desc, evt.impact, Math.random() > 0.3]
                );
                totalEvents++;
            }
            senatorCount++;
            totalCandidates++;
        }
        console.log(`📋 Inserted ${senatorCount} senators`);

        // ── Insert Deputies ──
        let deputyCount = 0;
        for (const c of jneData.candidates.deputies) {
            const partyId = partyMap[c.party_jne_id];
            if (!partyId) continue;

            const bio = buildBiography(c);
            const stars = computeStars(c);

            const result = await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score,
                 stars_rating, final_score, is_active, dni)
                 VALUES ($1, $2, $3, 'deputy', $4, $5, $6, $7, $8, $9, $10, $11, true, $12) RETURNING id`,
                [c.name, c.photo_url, partyId, normalizeRegion(c.region), bio,
                randomFloat(20, 75), randomFloat(3, 55), randomFloat(15, 80), randomFloat(5, 55),
                    stars, randomFloat(15, 65), c.dni || null]
            );

            // 1 proposal (50% chance)
            if (Math.random() > 0.5) {
                const prop = randomFrom(PROPOSALS_POOL);
                await client.query(
                    'INSERT INTO candidate_proposals (candidate_id, title, category, description) VALUES ($1, $2, $3, $4)',
                    [result.rows[0].id, prop.title, prop.cat, prop.desc]
                );
                totalProposals++;
            }

            // 1 event (40% chance)
            if (Math.random() > 0.6) {
                const evt = randomFrom(EVENT_POOL);
                await client.query(
                    `INSERT INTO candidate_events (candidate_id, event_type, title, description, impact_score, is_validated)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [result.rows[0].id, evt.type, evt.title, evt.desc, evt.impact, Math.random() > 0.3]
                );
                totalEvents++;
            }
            deputyCount++;
            totalCandidates++;
        }
        console.log(`📋 Inserted ${deputyCount} deputies`);

        // ── Insert Andean Parliament ──
        let andeanCount = 0;
        for (const c of jneData.candidates.andean) {
            const partyId = partyMap[c.party_jne_id];
            if (!partyId) continue;

            const bio = buildBiography(c);
            const stars = computeStars(c);

            const result = await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score,
                 stars_rating, final_score, is_active, dni)
                 VALUES ($1, $2, $3, 'andean', $4, $5, $6, $7, $8, $9, $10, $11, true, $12) RETURNING id`,
                [c.name, c.photo_url, partyId, normalizeRegion(c.region), bio,
                randomFloat(20, 70), randomFloat(3, 50), randomFloat(20, 75), randomFloat(5, 50),
                    stars, randomFloat(15, 60), c.dni || null]
            );

            // 1 proposal
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
            andeanCount++;
            totalCandidates++;
        }
        console.log(`🌎 Inserted ${andeanCount} andean parliament candidates`);

        // ── Generate Simulated Votes ──
        const allCandidates = await client.query('SELECT id, position FROM candidates');
        let totalVotes = 0;
        for (const c of allCandidates.rows) {
            let maxVotes;
            if (c.position === 'president') maxVotes = randomBetween(5000, 50000);
            else if (c.position.startsWith('vice_president')) maxVotes = randomBetween(500, 5000);
            else if (c.position === 'senator') maxVotes = randomBetween(200, 5000);
            else if (c.position === 'deputy') maxVotes = randomBetween(100, 3000);
            else maxVotes = randomBetween(50, 1500);

            await client.query('UPDATE candidates SET vote_count = $1 WHERE id = $2', [maxVotes, c.id]);
            totalVotes += maxVotes;
        }
        console.log(`🗳️  Generated ${totalVotes.toLocaleString()} simulated votes`);

        // ── Initialize Party Scores ──
        for (const [jneId, dbId] of Object.entries(partyMap)) {
            const stats = await client.query(
                `SELECT AVG(final_score) as avg_score, SUM(vote_count) as total_votes, COUNT(*) as cnt
                 FROM candidates WHERE party_id = $1 AND is_active = true`, [dbId]
            );
            const partyScore = parseFloat(stats.rows[0].avg_score || 0).toFixed(2);
            await client.query(
                `INSERT INTO party_scores (party_id, party_full_score, ranking_position)
                 VALUES ($1, $2, 1) ON CONFLICT (party_id) DO UPDATE SET party_full_score = $2`,
                [dbId, partyScore]
            );
        }
        console.log(`📊 Initialized party scores`);

        // ── Update Search Vectors ──
        await client.query(`
            UPDATE candidates SET search_vector = 
                to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(region, '') || ' ' || COALESCE(biography, ''))
        `);
        console.log(`🔍 Updated search vectors`);

        // ── Update Rankings ──
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
╔══════════════════════════════════════════╗
║     🗳️  VOTA.PE SEED COMPLETE (JNE)     ║
╠══════════════════════════════════════════╣
║  Source:      JNE Voto Informado 2026    ║
║  Parties:     ${jneData.parties.length.toString().padStart(6)}                   ║
║  Candidates:  ${totalCandidates.toString().padStart(6)}                   ║
║    Presidents:  ${jneData.candidates.presidents.length.toString().padStart(5)}                  ║
║    VPs:         ${totalVPs.toString().padStart(5)}                  ║
║    Senators:    ${senatorCount.toString().padStart(5)}                  ║
║    Deputies:    ${deputyCount.toString().padStart(5)}                  ║
║    Andean:      ${andeanCount.toString().padStart(5)}                  ║
║  Proposals:   ${totalProposals.toString().padStart(6)}                   ║
║  Events:      ${totalEvents.toString().padStart(6)}                   ║
║  Votes:       ${totalVotes.toLocaleString().padStart(10)}               ║
╚══════════════════════════════════════════╝
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
