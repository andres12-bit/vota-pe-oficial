/**
 * Migration: Insert Vice Presidents into candidates table
 * Run on VPS: cd /opt/pulsoelectoral/backend && node src/db/migrate_vps.js
 */
require('dotenv').config();
const pool = require('./pool');
const path = require('path');
const fs = require('fs');

const JNE_DATA_PATH = path.join(__dirname, '..', 'data', 'jne_hojadevida_full.json');

function buildBiography(candidate) {
    const hv = candidate.hoja_de_vida;
    if (!hv) return `Candidato(a) por ${candidate.party_name || 'su partido'}.`;
    const parts = [];
    const edu = hv.education || {};
    if (edu.postgraduate && edu.postgraduate.length > 0) {
        const pg = edu.postgraduate[0];
        parts.push(`${pg.degree || 'Posgrado'} ${pg.specialty ? 'en ' + pg.specialty : ''} (${pg.institution || ''})`);
    } else if (edu.university && edu.university.length > 0) {
        const u = edu.university[0];
        parts.push(`${u.degree || 'Profesional'} (${u.institution || ''})`);
    }
    if (hv.work_experience && hv.work_experience.length > 0) {
        const top = hv.work_experience.slice(0, 2);
        for (const w of top) { if (w.position && w.employer) parts.push(`${w.position} en ${w.employer}`); }
    }
    if (parts.length === 0) return `Candidato(a) por ${candidate.party_name || 'su partido'}.`;
    return parts.join('. ') + '.';
}

function computeStars(candidate) {
    const hv = candidate.hoja_de_vida;
    if (!hv) return 2.5;
    let score = 2.0;
    const edu = hv.education || {};
    if (edu.postgraduate && edu.postgraduate.length > 0) score += 0.8;
    else if (edu.university && edu.university.length > 0) score += 0.4;
    if (hv.work_experience && hv.work_experience.length >= 3) score += 0.5;
    else if (hv.work_experience && hv.work_experience.length >= 1) score += 0.2;
    if (hv.political_history && hv.political_history.length >= 2) score += 0.3;
    if (hv.sentences && hv.sentences.length > 0) score -= 1.0;
    score = Math.max(1.0, Math.min(5.0, score + (Math.random() - 0.5) * 0.4));
    return parseFloat(score.toFixed(1));
}

function normalizeRegion(raw) {
    if (!raw) return 'Nacional';
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

function randomFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }

async function migrate() {
    const client = await pool.connect();
    try {
        const jneData = JSON.parse(fs.readFileSync(JNE_DATA_PATH, 'utf-8'));
        const vps = jneData.candidates.vice_presidents || [];
        console.log(`Found ${vps.length} VPs in JNE data`);

        // Ensure position constraint allows VPs
        await client.query(`
            ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_position_check;
            ALTER TABLE candidates ADD CONSTRAINT candidates_position_check 
                CHECK (position IN ('president', 'vice_president_1', 'vice_president_2', 'senator', 'deputy', 'andean'));
        `);

        // Build party map: jne_id -> db_id
        const parties = await client.query('SELECT id, name FROM parties');
        const jneParties = jneData.parties || [];
        const partyMap = {}; // jne_id -> db_id
        for (const jp of jneParties) {
            const dbParty = parties.rows.find(p => p.name === jp.name);
            if (dbParty) partyMap[jp.jne_id] = dbParty.id;
        }

        // Check if VPs already exist
        const existing = await client.query("SELECT COUNT(*) FROM candidates WHERE position IN ('vice_president_1','vice_president_2')");
        if (parseInt(existing.rows[0].count) > 0) {
            console.log(`Already ${existing.rows[0].count} VP candidates. Deleting to re-insert...`);
            await client.query("DELETE FROM candidates WHERE position IN ('vice_president_1','vice_president_2')");
        }

        let inserted = 0;
        for (const vp of vps) {
            const partyId = partyMap[vp.party_jne_id];
            if (!partyId) { console.log(`  Skip VP ${vp.name} — no party match for ${vp.party_jne_id}`); continue; }

            const pos = vp.position === 'vice_president_1' ? 'vice_president_1' : 'vice_president_2';
            const bio = buildBiography(vp);
            const stars = computeStars(vp);
            const hvJson = vp.hoja_de_vida ? JSON.stringify(vp.hoja_de_vida) : null;
            const eduJson = vp.hoja_de_vida?.education ? JSON.stringify(vp.hoja_de_vida.education) : null;
            const expJson = vp.hoja_de_vida?.work_experience ? JSON.stringify(vp.hoja_de_vida.work_experience) : null;

            await client.query(
                `INSERT INTO candidates (name, photo, party_id, position, region, biography,
                 intelligence_score, momentum_score, integrity_score, risk_score,
                 stars_rating, final_score, is_active, dni, hoja_de_vida, education, experience)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14, $15, $16)`,
                [vp.name, vp.photo_url, partyId, pos, normalizeRegion(vp.region), bio,
                randomFloat(30, 75), randomFloat(5, 60), randomFloat(25, 85), randomFloat(10, 60),
                    stars, randomFloat(25, 65), vp.dni || null, hvJson, eduJson, expJson]
            );
            inserted++;
        }

        console.log(`✅ Inserted ${inserted} VP candidates into candidates table`);

        // Verify
        const verify = await client.query("SELECT COUNT(*), position FROM candidates WHERE position IN ('vice_president_1','vice_president_2') GROUP BY position");
        verify.rows.forEach(r => console.log(`  ${r.position}: ${r.count}`));

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
