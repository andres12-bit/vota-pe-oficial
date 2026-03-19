/**
 * PulsoElectoral.pe — Radar Electoral API
 *
 * Political intelligence center endpoints.
 * Uses JS-based aggregation (works with both PostgreSQL and in-memory DB).
 */
const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Helper: round to 1 decimal
const r1 = (n) => Math.round((n || 0) * 10) / 10;

// ==================== OVERVIEW (all-in-one) ====================
router.get('/overview', async (req, res) => {
    try {
        const [planchaIndex, rankings, alerts, metrics] = await Promise.all([
            getPlanchaIndex(),
            getRankings(),
            getAlerts(),
            getMetrics(),
        ]);
        res.json({ planchaIndex, rankings, alerts, metrics });
    } catch (err) {
        console.error('Radar overview error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== PLANCHA INDEX ====================
router.get('/plancha-index', async (req, res) => {
    try { res.json(await getPlanchaIndex()); }
    catch (err) { console.error('Plancha index error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

async function getPlanchaIndex() {
    const result = await pool.query(`
        SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color, p.logo as party_logo
        FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.is_active = true
    `);

    const groups = {};
    for (const c of result.rows) {
        const pid = c.party_id;
        if (!groups[pid]) {
            groups[pid] = {
                party_id: pid,
                party_name: c.party_name || '',
                abbreviation: c.party_abbreviation || '',
                logo: c.party_logo || '',
                color: c.party_color || '#666',
                candidates: [],
                presidents: [],
            };
        }
        groups[pid].candidates.push(c);
        if (c.position === 'president') groups[pid].presidents.push(c);
    }

    const parties = Object.values(groups).map((g) => {
        const cands = g.candidates;
        const n = cands.length;
        const avg = (field) => n > 0 ? r1(cands.reduce((s, c) => s + (parseFloat(c[field]) || 0), 0) / n) : 0;

        const avgHoja = avg('hoja_score');
        const avgExp = avg('experience_score');
        const avgInt = avg('integrity_score');
        const avgPlan = avg('plan_score');
        const avgFinal = avg('final_score');
        const qualityIndex = r1((avgHoja * 0.30 + avgExp * 0.25 + avgInt * 0.35 + avgPlan * 0.10));

        const pres = g.presidents.sort((a, b) => (b.final_score || 0) - (a.final_score || 0))[0];

        return {
            party_id: g.party_id,
            party_name: g.party_name,
            abbreviation: g.abbreviation,
            logo: g.logo,
            color: g.color,
            total_candidates: n,
            avg_hoja: avgHoja,
            avg_experience: avgExp,
            avg_integrity: avgInt,
            avg_plan: avgPlan,
            avg_final: avgFinal,
            quality_index: qualityIndex,
            presidential_candidate: pres ? pres.name : null,
            presidential_photo: pres ? pres.photo : null,
            presidential_score: pres ? r1(parseFloat(pres.final_score) || 0) : null,
        };
    });

    parties.sort((a, b) => b.quality_index - a.quality_index);
    return parties;
}

// ==================== RANKINGS ====================
router.get('/rankings', async (req, res) => {
    try { res.json(await getRankings()); }
    catch (err) { console.error('Rankings error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

async function getRankings() {
    const result = await pool.query(`
        SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color, p.logo as party_logo
        FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.is_active = true
    `);

    const groups = {};
    for (const c of result.rows) {
        const pid = c.party_id;
        if (!groups[pid]) {
            groups[pid] = {
                party_id: pid,
                party_name: c.party_name || '',
                abbreviation: c.party_abbreviation || '',
                color: c.party_color || '#666',
                logo: c.party_logo || '',
                candidates: [],
            };
        }
        groups[pid].candidates.push(c);
    }

    const partyList = Object.values(groups);

    const sentencias = partyList.map(g => {
        const withIssues = g.candidates.filter(c => (parseFloat(c.integrity_score) || 50) < 40).length;
        const avgIntegrity = g.candidates.length > 0 ? r1(g.candidates.reduce((s, c) => s + (parseFloat(c.integrity_score) || 50), 0) / g.candidates.length) : 0;
        return { ...pick(g), total: g.candidates.length, with_issues: withIssues, avg_integrity: avgIntegrity };
    }).filter(r => r.with_issues > 0).sort((a, b) => b.with_issues - a.with_issues).slice(0, 10);

    const profesionales = partyList.map(g => {
        const pros = g.candidates.filter(c => (parseFloat(c.hoja_score) || 0) > 70).length;
        const avgHoja = g.candidates.length > 0 ? r1(g.candidates.reduce((s, c) => s + (parseFloat(c.hoja_score) || 0), 0) / g.candidates.length) : 0;
        return { ...pick(g), total: g.candidates.length, professionals: pros, avg_hoja: avgHoja };
    }).sort((a, b) => b.professionals - a.professionals).slice(0, 10);

    const experiencia = partyList.map(g => {
        const experienced = g.candidates.filter(c => (parseFloat(c.experience_score) || 0) > 60).length;
        const avgExp = g.candidates.length > 0 ? r1(g.candidates.reduce((s, c) => s + (parseFloat(c.experience_score) || 0), 0) / g.candidates.length) : 0;
        return { ...pick(g), total: g.candidates.length, experienced, avg_experience: avgExp };
    }).sort((a, b) => b.avg_experience - a.avg_experience).slice(0, 10);

    const jovenes = partyList.map(g => {
        const young = g.candidates.filter(c => {
            if (!c.birth_date) return false;
            try {
                const bd = new Date(c.birth_date);
                if (isNaN(bd.getTime())) return false;
                const age = (Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                return age < 35;
            } catch { return false; }
        }).length;
        return { ...pick(g), total: g.candidates.length, young_candidates: young };
    }).sort((a, b) => b.young_candidates - a.young_candidates).slice(0, 10);

    return { sentencias, profesionales, experiencia, jovenes };
}

function pick(g) {
    return { party_id: g.party_id, party_name: g.party_name, abbreviation: g.abbreviation, color: g.color, logo: g.logo };
}

// ==================== ALERTS ====================
router.get('/alerts', async (req, res) => {
    try { res.json(await getAlerts()); }
    catch (err) { console.error('Alerts error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

async function getAlerts() {
    const result = await pool.query(`
        SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
        FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.is_active = true
    `);

    const candidates = result.rows;

    const antecedentes = candidates
        .filter(c => (parseFloat(c.integrity_score) || 50) < 30)
        .sort((a, b) => (parseFloat(a.integrity_score) || 50) - (parseFloat(b.integrity_score) || 50))
        .slice(0, 15)
        .map(c => ({
            id: c.id, name: c.name, photo: c.photo, position: c.position,
            integrity_score: r1(parseFloat(c.integrity_score) || 0),
            party_name: c.party_name, abbreviation: c.party_abbreviation || '', color: c.party_color || '#666',
        }));

    const sinEstudios = candidates
        .filter(c => {
            const noEdu = !c.education || c.education === '' || c.education === '[]';
            const noHVEdu = !c.hoja_de_vida || !c.hoja_de_vida.education || Object.keys(c.hoja_de_vida.education || {}).length === 0;
            return noEdu && noHVEdu;
        })
        .slice(0, 15)
        .map(c => ({
            id: c.id, name: c.name, photo: c.photo, position: c.position,
            hoja_score: r1(parseFloat(c.hoja_score) || 0),
            party_name: c.party_name, abbreviation: c.party_abbreviation || '', color: c.party_color || '#666',
        }));

    let denuncias = [];
    try {
        const evResult = await pool.query(
            `SELECT * FROM candidate_events WHERE event_type IN ('negative', 'corruption')`
        );
        const eventsByCandidate = {};
        for (const ev of evResult.rows) {
            if (!eventsByCandidate[ev.candidate_id]) eventsByCandidate[ev.candidate_id] = [];
            eventsByCandidate[ev.candidate_id].push({ title: ev.title, type: ev.event_type });
        }
        const candidateMap = {};
        candidates.forEach(c => candidateMap[c.id] = c);
        denuncias = Object.entries(eventsByCandidate)
            .map(([cid, events]) => {
                const c = candidateMap[parseInt(cid)];
                if (!c) return null;
                return {
                    id: c.id, name: c.name, photo: c.photo, position: c.position,
                    party_name: c.party_name, abbreviation: c.party_abbreviation || '', color: c.party_color || '#666',
                    event_count: events.length, events,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.event_count - a.event_count)
            .slice(0, 15);
    } catch (err) {
        console.error('Alerts denuncias error:', err.message);
    }

    return { antecedentes, sinEstudios, denuncias };
}

// ==================== METRICS ====================
router.get('/metrics', async (req, res) => {
    try { res.json(await getMetrics()); }
    catch (err) { console.error('Metrics error:', err); res.status(500).json({ error: 'Internal server error' }); }
});

async function getMetrics() {
    const result = await pool.query(`
        SELECT c.*, p.name as party_name, p.abbreviation as party_abbreviation, p.color as party_color
        FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.is_active = true
    `);

    const candidates = result.rows;

    const groups = {};
    for (const c of candidates) {
        const pid = c.party_id;
        if (!groups[pid]) {
            groups[pid] = {
                party_id: pid,
                party_name: c.party_name || '',
                abbreviation: c.party_abbreviation || '',
                color: c.party_color || '#666',
                candidates: [],
            };
        }
        groups[pid].candidates.push(c);
    }

    const partyList = Object.values(groups);
    const avg = (arr, field) => arr.length > 0 ? r1(arr.reduce((s, c) => s + (parseFloat(c[field]) || 0), 0) / arr.length) : 0;

    const educacion = partyList.map(g => ({
        ...pick(g), total: g.candidates.length,
        avg_education: avg(g.candidates, 'hoja_score'),
    })).sort((a, b) => b.avg_education - a.avg_education);

    const experiencia = partyList.map(g => ({
        ...pick(g), total: g.candidates.length,
        avg_experience: avg(g.candidates, 'experience_score'),
    })).sort((a, b) => b.avg_experience - a.avg_experience);

    const genero = partyList.map(g => {
        const women = g.candidates.filter(c => {
            const s = (c.sex || '').toLowerCase();
            return s === 'femenino' || s === 'f' || s === 'mujer';
        }).length;
        const men = g.candidates.filter(c => {
            const s = (c.sex || '').toLowerCase();
            return s === 'masculino' || s === 'm' || s === 'hombre';
        }).length;
        const total = g.candidates.length;
        return {
            ...pick(g), total, women, men,
            women_pct: total > 0 ? r1(women / total * 100) : 0,
        };
    }).sort((a, b) => b.women_pct - a.women_pct);

    const topHV = candidates
        .sort((a, b) => (parseFloat(b.hoja_score) || 0) - (parseFloat(a.hoja_score) || 0))
        .slice(0, 10)
        .map(c => ({
            id: c.id, name: c.name, photo: c.photo, position: c.position,
            hoja_score: r1(parseFloat(c.hoja_score) || 0),
            final_score: r1(parseFloat(c.final_score) || 0),
            party_name: c.party_name, abbreviation: c.party_abbreviation || '', color: c.party_color || '#666',
        }));

    const topPlan = candidates
        .filter(c => (parseFloat(c.plan_score) || 0) > 0)
        .sort((a, b) => (parseFloat(b.plan_score) || 0) - (parseFloat(a.plan_score) || 0))
        .slice(0, 10)
        .map(c => ({
            id: c.id, name: c.name, photo: c.photo, position: c.position,
            plan_score: r1(parseFloat(c.plan_score) || 0),
            final_score: r1(parseFloat(c.final_score) || 0),
            party_name: c.party_name, abbreviation: c.party_abbreviation || '', color: c.party_color || '#666',
        }));

    const edad = partyList.map(g => {
        const ages = g.candidates.map(c => {
            if (!c.birth_date) return null;
            try {
                const bd = new Date(c.birth_date);
                if (isNaN(bd.getTime())) return null;
                return Math.round((Date.now() - bd.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            } catch { return null; }
        }).filter(Boolean);
        return {
            ...pick(g), total: g.candidates.length,
            avg_age: ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null,
        };
    }).filter(g => g.avg_age !== null).sort((a, b) => a.avg_age - b.avg_age);

    const totalWomen = candidates.filter(c => ['femenino', 'f', 'mujer'].includes((c.sex || '').toLowerCase())).length;
    const totalMen = candidates.filter(c => ['masculino', 'm', 'hombre'].includes((c.sex || '').toLowerCase())).length;
    const global = {
        total_candidates: candidates.length,
        total_parties: partyList.length,
        avg_score: avg(candidates, 'final_score'),
        avg_hoja: avg(candidates, 'hoja_score'),
        avg_integrity: avg(candidates, 'integrity_score'),
        avg_experience: avg(candidates, 'experience_score'),
        total_women: totalWomen,
        total_men: totalMen,
    };

    return { educacion, experiencia, genero, topHV, topPlan, edad, global };
}

module.exports = router;
