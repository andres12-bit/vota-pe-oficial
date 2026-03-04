/**
 * VOTA.PE — Database Seeder
 * Loads real JNE data into PostgreSQL with scores at 0.
 * Run AFTER migrations: DATABASE_URL=... node src/db/seeder.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set.'); process.exit(1); }

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Color palette for parties
const PARTY_COLORS = [
    '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5',
    '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#C0CA33',
    '#FDD835', '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#546E7A',
    '#EF5350', '#AB47BC', '#7E57C2', '#42A5F5', '#26C6DA', '#66BB6A',
    '#FFCA28', '#FFA726', '#FF7043', '#8D6E63', '#78909C', '#EC407A',
    '#29B6F6', '#26A69A', '#9CCC65', '#FFEE58', '#FF8A65', '#BDBDBD',
    '#5C6BC0', '#0097A7', '#2E7D32', '#F57F17',
];

// Helper: extract education from hoja de vida
function extractEducation(hv) {
    if (!hv || !hv.education) return null;
    const edu = hv.education;
    const parts = [];
    if (edu.postgraduate && edu.postgraduate.length > 0) {
        edu.postgraduate.forEach(pg => {
            if (pg.degree || pg.specialty) parts.push(`${pg.degree || 'Posgrado'}${pg.specialty ? ' en ' + pg.specialty : ''}${pg.institution ? ' (' + pg.institution + ')' : ''}`);
        });
    }
    if (edu.university && edu.university.length > 0) {
        edu.university.forEach(u => {
            if (u.degree || u.specialty) parts.push(`${u.degree || 'Profesional'}${u.specialty ? ' en ' + u.specialty : ''}${u.institution ? ' (' + u.institution + ')' : ''}`);
        });
    }
    return parts.length > 0 ? parts.join('. ') + '.' : null;
}

// Helper: extract work experience
function extractExperience(hv) {
    if (!hv || !hv.work_experience || hv.work_experience.length === 0) return null;
    const top = hv.work_experience.slice(0, 3);
    const parts = top.filter(w => w.position || w.employer).map(w => {
        return `${w.position || 'Cargo'}${w.employer ? ' en ' + w.employer : ''}${w.period ? ' (' + w.period + ')' : ''}`;
    });
    return parts.length > 0 ? parts.join('. ') + '.' : null;
}

// Helper: build biography
function buildBio(raw, position) {
    const hv = raw.hoja_de_vida;
    const baseBio = `Candidato(a) ${raw.cargo || position}. ${raw.party_name || ''}.`;
    if (!hv) return baseBio;
    const edu = extractEducation(hv);
    const exp = extractExperience(hv);
    const parts = [edu, exp].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : baseBio;
}

async function seed() {
    console.log('🌱 Starting database seed...');

    // Clear existing data (order matters for FK constraints)
    await pool.query('TRUNCATE encuesta_votes, encuesta_polls, candidate_plan_gobierno, candidate_vice_presidents, candidate_proposals, candidate_events, votes, party_scores, candidates, parties, users RESTART IDENTITY CASCADE');
    console.log('🗑️  Cleared existing data.');

    // Load JNE data
    const jnePathFull = path.join(__dirname, '..', 'data', 'jne_hojadevida_full.json');
    const jnePathBasic = path.join(__dirname, '..', 'data', 'jne_candidates.json');
    let jneData;
    try {
        jneData = JSON.parse(fs.readFileSync(jnePathFull, 'utf-8'));
        console.log('📄 Loaded jne_hojadevida_full.json');
    } catch (e) {
        try {
            jneData = JSON.parse(fs.readFileSync(jnePathBasic, 'utf-8'));
            console.log('📄 Using jne_candidates.json (basic)');
        } catch (e2) {
            console.error('❌ Could not load JNE data.'); process.exit(1);
        }
    }

    // Load plan de gobierno
    let planData;
    try {
        planData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'jne_plan_gobierno.json'), 'utf-8'));
    } catch (e) { planData = { plans: [] }; }

    // ==================== SEED PARTIES ====================
    const jnePartyMap = {}; // jne_id → our party id
    for (let idx = 0; idx < jneData.parties.length; idx++) {
        const jp = jneData.parties[idx];
        const abbrev = jp.abbreviation || jp.name.split(' ').map(w => w[0]).join('').substring(0, 5);
        const color = PARTY_COLORS[idx % PARTY_COLORS.length];
        const result = await pool.query(
            `INSERT INTO parties (name, abbreviation, logo, color, party_full_score)
       VALUES ($1, $2, $3, $4, 0) RETURNING id`,
            [jp.name, abbrev, jp.logo_url || null, color]
        );
        jnePartyMap[jp.jne_id] = result.rows[0].id;
    }
    console.log(`✅ Seeded ${jneData.parties.length} parties`);

    // ==================== SEED CANDIDATES (all scores = 0) ====================
    async function seedCandidate(raw, position) {
        const partyId = jnePartyMap[raw.party_jne_id];
        if (partyId === undefined) return null;

        const hv = raw.hoja_de_vida;
        const isActive = raw.status !== 'EXCLUIDO' && raw.status !== 'IMPROCEDENTE';

        const result = await pool.query(
            `INSERT INTO candidates (
        name, photo, party_id, position, region, biography, education, experience,
        birth_date, dni, sex, cargo, party_jne_name, hoja_de_vida,
        intelligence_score, momentum_score, integrity_score, risk_score,
        stars_rating, final_score, vote_count, jne_status, list_position, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, 0,0,0,0, 0,0,0, $15,$16,$17) RETURNING id`,
            [
                raw.name,
                raw.photo_url || null,
                partyId,
                position,
                raw.region || 'Lima',
                buildBio(raw, position),
                extractEducation(hv),
                extractExperience(hv),
                hv ? (hv.personal ? hv.personal.birth_date : null) : null,
                raw.dni || null,
                hv ? hv.sex : null,
                raw.cargo || position,
                raw.party_name || '',
                hv ? JSON.stringify(hv) : null,
                raw.status || 'INSCRITO',
                raw.list_position || 0,
                isActive,
            ]
        );
        return result.rows[0].id;
    }

    // Presidents
    const presidents = jneData.candidates.presidents.filter(c =>
        (c.cargo || '').toUpperCase().includes('PRESIDENTE') && !(c.cargo || '').toUpperCase().includes('VICE')
    );
    let presCount = 0;
    for (const c of presidents) { if (await seedCandidate(c, 'president')) presCount++; }

    // Senators
    let senCount = 0;
    for (const c of jneData.candidates.senators) { if (await seedCandidate(c, 'senator')) senCount++; }

    // Deputies
    let depCount = 0;
    for (const c of jneData.candidates.deputies) { if (await seedCandidate(c, 'deputy')) depCount++; }

    // Andean Parliament
    let andCount = 0;
    for (const c of jneData.candidates.andean) { if (await seedCandidate(c, 'andean')) andCount++; }

    console.log(`✅ Seeded candidates — Presidents: ${presCount}, Senators: ${senCount}, Deputies: ${depCount}, Andean: ${andCount}`);

    // ==================== SEED VICE PRESIDENTS ====================
    const jneVPs = jneData.candidates.vice_presidents || [];
    const vpsByParty = {};
    jneVPs.forEach(vp => {
        if (!vpsByParty[vp.party_jne_id]) vpsByParty[vp.party_jne_id] = [];
        vpsByParty[vp.party_jne_id].push(vp);
    });

    // Build reverse lookup: our party id → jne party id
    const partyIdToJneId = {};
    for (const [jneId, ourId] of Object.entries(jnePartyMap)) {
        partyIdToJneId[ourId] = jneId;
    }

    const presCandidates = await pool.query(`SELECT id, party_id FROM candidates WHERE position = 'president'`);
    let vpCount = 0;
    for (const cand of presCandidates.rows) {
        const jnePartyId = partyIdToJneId[cand.party_id];
        if (!jnePartyId) continue;
        const partyVPs = (vpsByParty[jnePartyId] || []).sort((a, b) => {
            return (a.position === 'vice_president_1' ? 1 : 2) - (b.position === 'vice_president_1' ? 1 : 2);
        });
        for (let i = 0; i < partyVPs.length; i++) {
            const vp = partyVPs[i];
            const vpEdu = extractEducation(vp.hoja_de_vida);
            const vpExp = extractExperience(vp.hoja_de_vida);
            const vpBio = [vpEdu, vpExp].filter(Boolean).join(' ') || `Candidato(a) ${vp.cargo || 'Vicepresidente'}.`;
            await pool.query(
                `INSERT INTO candidate_vice_presidents (candidate_id, name, position_label, photo, biography, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [cand.id, vp.name, vp.cargo || (i === 0 ? 'Primer(a) Vicepresidente(a)' : 'Segundo(a) Vicepresidente(a)'), vp.photo_url || null, vpBio, i + 1]
            );
            vpCount++;
        }
    }
    console.log(`✅ Seeded ${vpCount} vice presidents`);

    // ==================== SEED PLAN DE GOBIERNO ====================
    const allCandidates = await pool.query(`SELECT id, party_id, position FROM candidates WHERE is_active = true`);
    let planCount = 0;

    // Default plan template
    const PLAN_TEMPLATE = [
        {
            dim: 'DIMENSIÓN SOCIAL', items: [
                { prob: 'Vivienda, Agua y Saneamiento', obj: 'Reducir el déficit de viviendas.', goals: 'Meta 2026-2030: 500,000 conexiones.', ind: 'Cobertura de agua potable (%).' },
                { prob: 'Salud', obj: 'Acceso universal a salud.', goals: 'Meta 2026-2030: Hospital por región.', ind: 'Tasa de mortalidad infantil.' },
                { prob: 'Educación', obj: 'Mejorar calidad educativa.', goals: 'Meta 2026-2030: +20% resultados PISA.', ind: 'Rendimiento pruebas estandarizadas.' },
            ]
        },
        {
            dim: 'DIMENSIÓN ECONÓMICA', items: [
                { prob: 'Empleo y Formalización', obj: 'Reducir informalidad laboral.', goals: 'Meta 2026-2028: Formalizar 1M trabajadores.', ind: 'Tasa de informalidad (%).' },
            ]
        },
        {
            dim: 'DIMENSIÓN INSTITUCIONAL', items: [
                { prob: 'Seguridad Ciudadana', obj: 'Reducir criminalidad.', goals: 'Meta 2026-2028: +30,000 efectivos.', ind: 'Tasa de homicidios.' },
            ]
        },
    ];

    for (const cand of allCandidates.rows) {
        const jnePartyId = partyIdToJneId[cand.party_id];
        const partyPlan = jnePartyId ? planData.plans.find(p => String(p.party_jne_id) === String(jnePartyId)) : null;

        if (partyPlan && partyPlan.dimensions.length > 0) {
            let sortOrder = 1;
            for (const dim of partyPlan.dimensions) {
                for (const item of dim.items) {
                    await pool.query(
                        `INSERT INTO candidate_plan_gobierno (candidate_id, dimension, problem, objective, goals, indicator, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                        [cand.id, dim.dimension, item.problem, item.objective, item.goals, item.indicator, sortOrder++]
                    );
                    planCount++;
                }
            }
            // Update PDF URLs (plan + resumen)
            if (partyPlan.plan_pdf_url || partyPlan.resumen_pdf_url) {
                await pool.query(`UPDATE candidates SET plan_pdf_url = COALESCE($1, plan_pdf_url) WHERE id = $2`, [partyPlan.plan_pdf_url || partyPlan.resumen_pdf_url, cand.id]);
                if (partyPlan.resumen_pdf_url) {
                    await pool.query(`UPDATE candidates SET plan_pdf_local = $1 WHERE id = $2`, [partyPlan.resumen_pdf_url, cand.id]);
                }
            }
        } else {
            let sortOrder = 1;
            for (const dim of PLAN_TEMPLATE) {
                for (const item of dim.items) {
                    await pool.query(
                        `INSERT INTO candidate_plan_gobierno (candidate_id, dimension, problem, objective, goals, indicator, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                        [cand.id, dim.dim, item.prob, item.obj, item.goals, item.ind, sortOrder++]
                    );
                    planCount++;
                }
            }
        }
    }
    console.log(`✅ Seeded ${planCount} plan de gobierno items`);

    // ==================== SEED ENCUESTA POLLS (no simulated votes) ====================
    const POLLS = [
        {
            question: '¿Quién sería mejor Presidente(a) del Perú?', emoji: '🏛️', category: 'Presidencia',
            options: ['Keiko Fujimori', 'César Acuña', 'Hernando de Soto', 'Daniel Urresti', 'Lescano Ancieta', 'Otro candidato']
        },
        {
            question: '¿Cuál es el tema más importante para el Perú?', emoji: '📊', category: 'Opinión',
            options: ['Economía y empleo', 'Seguridad ciudadana', 'Educación', 'Salud pública', 'Lucha contra la corrupción', 'Infraestructura']
        },
        {
            question: '¿Confías en el sistema electoral peruano?', emoji: '🗳️', category: 'Confianza',
            options: ['Sí, totalmente', 'Parcialmente', 'No confío', 'Necesita reforma total']
        },
        {
            question: '¿A qué Partido le darías tu voto?', emoji: '🎯', category: 'Partidos',
            options: ['Fuerza Popular', 'Alianza para el Progreso', 'Renovación Popular', 'Avanza País', 'Partido Morado', 'Otro partido']
        },
        {
            question: '¿Cuál debe ser la prioridad del gobierno 2026-2031?', emoji: '🎯', category: 'Prioridades',
            options: ['Generar empleo formal', 'Mejorar hospitales y postas', 'Reforma del poder judicial', 'Construcción de carreteras', 'Seguridad y lucha contra el crimen']
        },
    ];

    for (const poll of POLLS) {
        await pool.query(
            `INSERT INTO encuesta_polls (question, emoji, category, options) VALUES ($1,$2,$3,$4)`,
            [poll.question, poll.emoji, poll.category, JSON.stringify(poll.options)]
        );
    }
    console.log(`✅ Seeded ${POLLS.length} encuesta polls (0 votes)`);

    // ==================== SEED PARTY SCORES ====================
    const parties = await pool.query('SELECT id FROM parties');
    for (const p of parties.rows) {
        await pool.query(
            `INSERT INTO party_scores (party_id, party_full_score, ranking_position) VALUES ($1, 0, 0)`,
            [p.id]
        );
    }
    console.log(`✅ Seeded party scores (all 0)`);

    // Summary
    const stats = await pool.query('SELECT COUNT(*) as cnt FROM candidates');
    console.log(`\n🎉 Database seeded successfully! ${stats.rows[0].cnt} candidates, all scores at 0.`);

    await pool.end();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
