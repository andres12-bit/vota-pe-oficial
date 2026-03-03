/**
 * JNE Hoja de Vida Scraper — VOTA.PE
 * 
 * Extracts complete candidate profiles (education, work experience,
 * political history, finances, sentences) from the JNE Voto Informado portal.
 * 
 * API Endpoints:
 *   1. POST listarCanditatos → Get candidate list with DNIs
 *   2. POST HVConsolidado   → Get full hoja de vida per candidate
 * 
 * Usage: node scrape_jne_hojadevida.js [--presidents-only] [--resume]
 */

const fs = require('fs');
const path = require('path');

const BASE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf';
const PROCESO_ELECTORAL = 124; // 2026 General Elections

const HEADERS = {
    'Content-Type': 'application/json',
    'Origin': 'https://votoinformado.jne.gob.pe',
    'Referer': 'https://votoinformado.jne.gob.pe/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// All departamento codes for deputies
const DEPARTAMENTOS = [
    { code: '140100', name: 'LIMA METROPOLITANA' },
    { code: '150100', name: 'LIMA PROVINCIAS' },
    { code: '020000', name: 'ANCASH' },
    { code: '030000', name: 'APURIMAC' },
    { code: '040000', name: 'AREQUIPA' },
    { code: '050000', name: 'AYACUCHO' },
    { code: '060000', name: 'CAJAMARCA' },
    { code: '070000', name: 'CALLAO' },
    { code: '080000', name: 'CUSCO' },
    { code: '090000', name: 'HUANCAVELICA' },
    { code: '100000', name: 'HUANUCO' },
    { code: '110000', name: 'ICA' },
    { code: '120000', name: 'JUNIN' },
    { code: '130000', name: 'LA LIBERTAD' },
    { code: '140000', name: 'LAMBAYEQUE' },
    { code: '160000', name: 'LORETO' },
    { code: '170000', name: 'MADRE DE DIOS' },
    { code: '180000', name: 'MOQUEGUA' },
    { code: '190000', name: 'PASCO' },
    { code: '200000', name: 'PIURA' },
    { code: '210000', name: 'PUNO' },
    { code: '220000', name: 'SAN MARTIN' },
    { code: '230000', name: 'TACNA' },
    { code: '240000', name: 'TUMBES' },
    { code: '250000', name: 'UCAYALI' },
    { code: '010000', name: 'AMAZONAS' },
    { code: '280000', name: 'PERUANOS RESIDENTES EN EL EXTRANJERO' },
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function titleCase(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ── Step 1: Fetch candidate listing (to get DNIs + party IDs) ──
async function fetchCandidateList(idTipoEleccion, ubigeo = '') {
    const body = JSON.stringify({
        idProcesoElectoral: PROCESO_ELECTORAL,
        strUbiDepartamento: ubigeo,
        idTipoEleccion: idTipoEleccion,
    });

    try {
        const res = await fetch(`${BASE_API}/listarCanditatos`, {
            method: 'POST',
            headers: HEADERS,
            body,
        });
        if (!res.ok) {
            console.error(`  ❌ HTTP ${res.status} for tipo=${idTipoEleccion}`);
            return [];
        }
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        return [];
    }
}

// ── Step 2: Fetch Hoja de Vida for a single candidate ──
async function fetchHojaDeVida(dni, idOrgPolitica) {
    const body = JSON.stringify({
        idProcesoElectoral: PROCESO_ELECTORAL,
        strDocumentoIdentidad: String(dni),
        idOrganizacionPolitica: String(idOrgPolitica),
    });

    try {
        const res = await fetch(`${BASE_API}/HVConsolidado`, {
            method: 'POST',
            headers: HEADERS,
            body,
        });
        if (!res.ok) {
            return null;
        }
        const json = await res.json();
        return json.data || json;
    } catch (err) {
        return null;
    }
}

// ── Parse the HVConsolidado response into a clean structure ──
function parseHojaDeVida(hv) {
    if (!hv) return null;

    const personal = hv.oDatosPersonales || {};
    const education = {
        university: (hv.lEduUniversitaria || []).map(e => ({
            institution: e.strCentroEstudio || '',
            degree: e.strCarrera || '',
            completed: e.strConcluido === 'CONCLUIDA',
            year: e.intAnioInicio || null,
        })),
        postgraduate: (hv.lEduPosgrado || hv.oEduPosgrado?.lEduPosgrado || []).map(e => ({
            institution: e.strCentroEstudio || '',
            specialty: e.strEspecialidad || e.strCarrera || '',
            degree: e.strGradoObtenido || '',
            completed: e.strConcluido === 'CONCLUIDA',
            year: e.intAnioInicio || null,
        })),
        technical: (hv.lEduTecnica || []).map(e => ({
            institution: e.strCentroEstudio || '',
            specialty: e.strCarrera || '',
            completed: e.strConcluido === 'CONCLUIDA',
        })),
    };

    const workExperience = (hv.lExperienciaLaboral || []).map(e => ({
        employer: e.strCentroTrabajo || '',
        position: e.strCargo || e.strOcupacionProfesion || '',
        start_year: e.intAnioInicio || null,
        end_year: e.intAnioFin || null,
        period: `${e.intAnioInicio || '?'} - ${e.intAnioFin || 'Actualidad'}`,
    }));

    const politicalHistory = (hv.lCargoPartidario || []).map(e => ({
        organization: e.strOrganizacionPolitica || '',
        position: e.strCargo || '',
        start_year: e.intAnioInicio || null,
        end_year: e.intAnioFin || null,
    }));

    const resignations = (hv.lRenunciaOP || []).map(e => ({
        organization: e.strOrganizacionPolitica || '',
        year: e.intAnio || null,
    }));

    const elections = (hv.lEleccion || []).map(e => ({
        process: e.strProcesoElectoral || '',
        organization: e.strOrganizacionPolitica || '',
        position: e.strCargo || '',
        elected: e.blElegido || false,
    }));

    const income = hv.oIngresos || {};
    const finances = {
        public_income: parseFloat(income.decRemuBruta || 0),
        private_income: parseFloat(income.decRentaIndividual || 0),
        other_income: parseFloat(income.decOtroIngresoAnual || 0),
        total_income: parseFloat(income.decTotalIngresos || 0),
        properties: (hv.lBienInmueble || []).map(p => ({
            type: p.strTipoBien || 'Inmueble',
            value: parseFloat(p.decAutoavaluo || 0),
            location: p.strDireccion || '',
        })),
        vehicles: (hv.lBienVehiculo || []).map(v => ({
            type: v.strTipoBien || 'Vehículo',
            description: v.strMarca || '',
            year: v.intAnio || null,
            value: parseFloat(v.decValor || 0),
        })),
    };

    const sentences = (hv.lSentencia || []).map(s => ({
        type: s.strTipoSentencia || '',
        description: s.strModalidad || s.strDelitoPenal || '',
        court: s.strOrganoJurisdiccional || '',
        date: s.strFecha || '',
    }));

    const penal = (hv.lSentenciaPenal || []).map(s => ({
        type: 'Penal',
        crime: s.strDelitoPenal || '',
        court: s.strOrganoJurisdiccional || '',
        sentence: s.strSentencia || '',
    }));

    return {
        dni: personal.strDocumentoIdentidad || '',
        sex: personal.strSexo || '',
        birthplace: personal.strLugarNacimiento || personal.strUbigeoNacimiento || '',
        residence: personal.strDomicilioActual || personal.strUbigeoDomicilio || '',
        education,
        work_experience: workExperience,
        political_history: politicalHistory,
        resignations,
        elections,
        finances,
        sentences: [...sentences, ...penal],
    };
}

// ── Main ──
async function main() {
    const args = process.argv.slice(2);
    const presidentsOnly = args.includes('--presidents-only');
    const resumeMode = args.includes('--resume');

    const outputPath = path.join(__dirname, '..', 'data', 'jne_hojadevida_full.json');
    let existingData = {};

    if (resumeMode && fs.existsSync(outputPath)) {
        try {
            existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            console.log(`📂 Resuming — already have ${Object.keys(existingData.candidates || {}).length} categories`);
        } catch { }
    }

    console.log('🗳️  JNE Hoja de Vida Scraper — VOTA.PE');
    console.log('========================================\n');

    const result = {
        scraped_at: new Date().toISOString(),
        source: 'JNE Voto Informado — HVConsolidado API',
        proceso_electoral: PROCESO_ELECTORAL,
        parties: {},
        candidates: {
            presidents: existingData.candidates?.presidents || [],
            vice_presidents: existingData.candidates?.vice_presidents || [],
            senators: existingData.candidates?.senators || [],
            deputies: existingData.candidates?.deputies || [],
            andean: existingData.candidates?.andean || [],
        },
        stats: { total: 0, with_hv: 0, failed: 0 },
    };

    // Track already scraped DNIs to avoid duplicates
    const scrapedDNIs = new Set();
    for (const cat of Object.values(result.candidates)) {
        for (const c of cat) {
            if (c.dni) scrapedDNIs.add(c.dni);
        }
    }

    // ═══════════════════════ PRESIDENTS + VPs ═══════════════════════
    if (!resumeMode || result.candidates.presidents.length === 0) {
        console.log('📋 Phase 1: PRESIDENTES Y VICEPRESIDENTES');
        const rawPresidents = await fetchCandidateList(1, '');
        console.log(`  → ${rawPresidents.length} entries from API`);

        result.candidates.presidents = [];
        result.candidates.vice_presidents = [];

        for (let i = 0; i < rawPresidents.length; i++) {
            const raw = rawPresidents[i];
            const fullName = titleCase([raw.strNombres, raw.strApellidoPaterno, raw.strApellidoMaterno].filter(Boolean).join(' '));
            const cargo = raw.strCargo || '';
            const isPresident = cargo.includes('PRESIDENTE DE LA') && !cargo.includes('VICE');
            const isVP1 = cargo.includes('PRIMER VICEPRESIDENTE');
            const isVP2 = cargo.includes('SEGUNDO VICEPRESIDENTE');

            const position = isPresident ? 'president' : isVP1 ? 'vice_president_1' : isVP2 ? 'vice_president_2' : 'president';

            // Extract DNI — try multiple possible field names
            const dni = raw.strDocumentoIdentidad || raw.strDni || raw.strNumeroDocumento || '';

            // Build base candidate
            const candidate = {
                jne_id: raw.idCandidato || null,
                name: fullName,
                first_name: titleCase((raw.strNombres || '').trim()),
                last_name_paterno: titleCase((raw.strApellidoPaterno || '').trim()),
                last_name_materno: titleCase((raw.strApellidoMaterno || '').trim()),
                position,
                party_jne_id: raw.idOrganizacionPolitica,
                party_name: raw.strOrganizacionPolitica || '',
                region: raw.strDepartamento || 'Nacional',
                list_position: raw.intPosicion || 0,
                cargo: cargo,
                status: raw.strEstadoCandidato || '',
                photo_url: raw.strGuidFoto ? `https://mpesije.jne.gob.pe/apidocs/${raw.strGuidFoto}.jpg` : null,
                dni: dni,
                hoja_de_vida: null,
            };

            // Store party
            if (raw.idOrganizacionPolitica && !result.parties[raw.idOrganizacionPolitica]) {
                result.parties[raw.idOrganizacionPolitica] = {
                    jne_id: raw.idOrganizacionPolitica,
                    name: raw.strOrganizacionPolitica,
                    logo_url: raw.strUrlOrganizacionPolitica || null,
                };
            }

            // Fetch hoja de vida if we have DNI
            if (dni && !scrapedDNIs.has(dni)) {
                const hv = await fetchHojaDeVida(dni, raw.idOrganizacionPolitica);
                candidate.hoja_de_vida = parseHojaDeVida(hv);
                scrapedDNIs.add(dni);
                if (candidate.hoja_de_vida) {
                    result.stats.with_hv++;
                    process.stdout.write(`  ✅ ${fullName}\n`);
                } else {
                    result.stats.failed++;
                    process.stdout.write(`  ⚠️ ${fullName} (sin HV)\n`);
                }
                await sleep(300);
            } else if (scrapedDNIs.has(dni)) {
                process.stdout.write(`  ⏭️ ${fullName} (ya scrapeado)\n`);
            } else {
                process.stdout.write(`  ❌ ${fullName} (sin DNI)\n`);
                result.stats.failed++;
            }

            result.stats.total++;

            if (isPresident) {
                result.candidates.presidents.push(candidate);
            } else {
                result.candidates.vice_presidents.push(candidate);
            }
        }
        console.log(`  📊 ${result.candidates.presidents.length} presidentes, ${result.candidates.vice_presidents.length} vicepresidentes\n`);

        // Save intermediate progress
        saveProgress(outputPath, result);
    }

    if (presidentsOnly) {
        console.log('🏁 --presidents-only flag set, stopping here.');
        saveProgress(outputPath, result);
        return;
    }

    // ═══════════════════════ SENATORS ═══════════════════════
    if (!resumeMode || result.candidates.senators.length === 0) {
        console.log('📋 Phase 2: SENADORES');
        const rawSenators = await fetchCandidateList(20, '');
        console.log(`  → ${rawSenators.length} senator entries from API`);

        result.candidates.senators = [];
        for (let i = 0; i < rawSenators.length; i++) {
            const candidate = await processSingleCandidate(rawSenators[i], 'senator', result, scrapedDNIs);
            result.candidates.senators.push(candidate);

            // Save intermediate every 50 candidates
            if (i > 0 && i % 50 === 0) {
                saveProgress(outputPath, result);
                console.log(`  💾 Progress saved (${i}/${rawSenators.length})`);
            }
        }
        console.log(`  📊 ${result.candidates.senators.length} senadores\n`);
        saveProgress(outputPath, result);
    }

    // ═══════════════════════ ANDEAN PARLIAMENT ═══════════════════════
    if (!resumeMode || result.candidates.andean.length === 0) {
        console.log('📋 Phase 3: PARLAMENTO ANDINO');
        const rawAndean = await fetchCandidateList(3, '');
        console.log(`  → ${rawAndean.length} andean entries from API`);

        result.candidates.andean = [];
        for (let i = 0; i < rawAndean.length; i++) {
            const candidate = await processSingleCandidate(rawAndean[i], 'andean', result, scrapedDNIs);
            result.candidates.andean.push(candidate);

            if (i > 0 && i % 50 === 0) {
                saveProgress(outputPath, result);
                console.log(`  💾 Progress saved (${i}/${rawAndean.length})`);
            }
        }
        console.log(`  📊 ${result.candidates.andean.length} parlamento andino\n`);
        saveProgress(outputPath, result);
    }

    // ═══════════════════════ DEPUTIES (by department) ═══════════════════════
    if (!resumeMode || result.candidates.deputies.length === 0) {
        console.log('📋 Phase 4: DIPUTADOS (por departamento)');
        result.candidates.deputies = [];

        for (const depto of DEPARTAMENTOS) {
            const rawDeputies = await fetchCandidateList(15, depto.code);
            console.log(`  📍 ${depto.name}: ${rawDeputies.length} diputados`);

            for (let i = 0; i < rawDeputies.length; i++) {
                const candidate = await processSingleCandidate(rawDeputies[i], 'deputy', result, scrapedDNIs, depto.name);
                result.candidates.deputies.push(candidate);
            }

            // Save after each department
            saveProgress(outputPath, result);
            await sleep(200);
        }
        console.log(`  📊 ${result.candidates.deputies.length} diputados total\n`);
    }

    // ═══════════════════════ FINAL SAVE ═══════════════════════
    saveProgress(outputPath, result);

    const total = result.candidates.presidents.length +
        result.candidates.vice_presidents.length +
        result.candidates.senators.length +
        result.candidates.deputies.length +
        result.candidates.andean.length;

    console.log('\n========================================');
    console.log(`✅ SCRAPE COMPLETE`);
    console.log(`   Parties:          ${Object.keys(result.parties).length}`);
    console.log(`   Presidents:       ${result.candidates.presidents.length}`);
    console.log(`   Vice Presidents:  ${result.candidates.vice_presidents.length}`);
    console.log(`   Senators:         ${result.candidates.senators.length}`);
    console.log(`   Deputies:         ${result.candidates.deputies.length}`);
    console.log(`   Andean Parliament:${result.candidates.andean.length}`);
    console.log(`   TOTAL:            ${total}`);
    console.log(`   With Hoja de Vida:${result.stats.with_hv}`);
    console.log(`   Failed/No DNI:    ${result.stats.failed}`);
    console.log(`\n💾 Saved to ${outputPath}`);
}

async function processSingleCandidate(raw, position, result, scrapedDNIs, deptoName) {
    const fullName = titleCase([raw.strNombres, raw.strApellidoPaterno, raw.strApellidoMaterno].filter(Boolean).join(' '));
    const dni = raw.strDocumentoIdentidad || raw.strDni || raw.strNumeroDocumento || '';

    const candidate = {
        jne_id: raw.idCandidato || null,
        name: fullName,
        first_name: titleCase((raw.strNombres || '').trim()),
        last_name_paterno: titleCase((raw.strApellidoPaterno || '').trim()),
        last_name_materno: titleCase((raw.strApellidoMaterno || '').trim()),
        position,
        party_jne_id: raw.idOrganizacionPolitica,
        party_name: raw.strOrganizacionPolitica || '',
        region: deptoName || raw.strDepartamento || 'Nacional',
        list_position: raw.intPosicion || 0,
        cargo: raw.strCargo || '',
        status: raw.strEstadoCandidato || '',
        photo_url: raw.strGuidFoto ? `https://mpesije.jne.gob.pe/apidocs/${raw.strGuidFoto}.jpg` : null,
        dni: dni,
        hoja_de_vida: null,
    };

    // Store party
    if (raw.idOrganizacionPolitica && !result.parties[raw.idOrganizacionPolitica]) {
        result.parties[raw.idOrganizacionPolitica] = {
            jne_id: raw.idOrganizacionPolitica,
            name: raw.strOrganizacionPolitica,
            logo_url: raw.strUrlOrganizacionPolitica || null,
        };
    }

    // Fetch hoja de vida
    if (dni && !scrapedDNIs.has(dni)) {
        const hv = await fetchHojaDeVida(dni, raw.idOrganizacionPolitica);
        candidate.hoja_de_vida = parseHojaDeVida(hv);
        scrapedDNIs.add(dni);

        if (candidate.hoja_de_vida) {
            result.stats.with_hv++;
        } else {
            result.stats.failed++;
        }
        await sleep(200); // Rate limit
    }

    result.stats.total++;
    return candidate;
}

function saveProgress(outputPath, result) {
    const output = {
        ...result,
        parties: Object.values(result.parties),
    };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
