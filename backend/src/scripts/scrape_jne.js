/**
 * JNE Real Data Scraper for VOTA.PE
 * Fetches real candidate data from the JNE (Jurado Nacional de Elecciones) API
 * and saves it as a JSON file for seeding the in-memory database.
 * 
 * API: POST https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/listarCanditatos
 * 
 * Election types:
 *   1  = Presidente y Vicepresidentes
 *   3  = Parlamento Andino
 *   15 = Diputados
 *   20 = Senadores
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/listarCanditatos';
const PROCESO_ELECTORAL = 124; // 2026 General Elections

// Ubigeo codes for all departamentos (for Diputados which are by district)
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

async function fetchCandidates(idTipoEleccion, strUbiDepartamento = '') {
    const body = JSON.stringify({
        idProcesoElectoral: PROCESO_ELECTORAL,
        strUbiDepartamento: strUbiDepartamento,
        idTipoEleccion: idTipoEleccion,
    });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://votoinformado.jne.gob.pe',
                'Referer': 'https://votoinformado.jne.gob.pe/',
            },
            body,
        });

        if (!response.ok) {
            console.error(`  ❌ HTTP ${response.status} for tipo=${idTipoEleccion}, depto=${strUbiDepartamento}`);
            return [];
        }

        const json = await response.json();
        return json.data || [];
    } catch (err) {
        console.error(`  ❌ Error for tipo=${idTipoEleccion}, depto=${strUbiDepartamento}: ${err.message}`);
        return [];
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🗳️  JNE Real Data Scraper for VOTA.PE');
    console.log('=====================================\n');

    const allData = {
        parties: {},       // keyed by idOrganizacionPolitica
        presidents: [],
        senators: [],
        deputies: [],
        andean: [],
    };

    // 1. Fetch Presidential candidates (national, no ubigeo)
    console.log('📋 Fetching PRESIDENTES...');
    const presidents = await fetchCandidates(1, '');
    console.log(`  ✅ ${presidents.length} presidential candidates found`);

    presidents.forEach(c => {
        // Extract party info
        if (!allData.parties[c.idOrganizacionPolitica]) {
            allData.parties[c.idOrganizacionPolitica] = {
                jne_id: c.idOrganizacionPolitica,
                name: c.strOrganizacionPolitica,
                abbreviation: '', // Will be populated if available
                logo_url: c.strUrlOrganizacionPolitica || null,
            };
        }
        allData.presidents.push(normalizaCandidate(c, 'president'));
    });
    await sleep(500);

    // 2. Fetch Senators (national, no ubigeo)
    console.log('📋 Fetching SENADORES...');
    const senators = await fetchCandidates(20, '');
    console.log(`  ✅ ${senators.length} senator candidates found`);

    senators.forEach(c => {
        if (!allData.parties[c.idOrganizacionPolitica]) {
            allData.parties[c.idOrganizacionPolitica] = {
                jne_id: c.idOrganizacionPolitica,
                name: c.strOrganizacionPolitica,
                abbreviation: '',
                logo_url: c.strUrlOrganizacionPolitica || null,
            };
        }
        allData.senators.push(normalizaCandidate(c, 'senator'));
    });
    await sleep(500);

    // 3. Fetch Andean Parliament (national, no ubigeo)
    console.log('📋 Fetching PARLAMENTO ANDINO...');
    const andean = await fetchCandidates(3, '');
    console.log(`  ✅ ${andean.length} andean parliament candidates found`);

    andean.forEach(c => {
        if (!allData.parties[c.idOrganizacionPolitica]) {
            allData.parties[c.idOrganizacionPolitica] = {
                jne_id: c.idOrganizacionPolitica,
                name: c.strOrganizacionPolitica,
                abbreviation: '',
                logo_url: c.strUrlOrganizacionPolitica || null,
            };
        }
        allData.andean.push(normalizaCandidate(c, 'andean'));
    });
    await sleep(500);

    // 4. Fetch Deputies for each departamento
    console.log('📋 Fetching DIPUTADOS by departamento...');
    for (const depto of DEPARTAMENTOS) {
        const deputies = await fetchCandidates(15, depto.code);
        console.log(`  📍 ${depto.name}: ${deputies.length} deputy candidates`);

        deputies.forEach(c => {
            if (!allData.parties[c.idOrganizacionPolitica]) {
                allData.parties[c.idOrganizacionPolitica] = {
                    jne_id: c.idOrganizacionPolitica,
                    name: c.strOrganizacionPolitica,
                    abbreviation: '',
                    logo_url: c.strUrlOrganizacionPolitica || null,
                };
            }
            allData.deputies.push(normalizaCandidate(c, 'deputy', depto.name));
        });
        await sleep(300); // Be polite, don't hammer the API
    }

    // Summary
    const partyCount = Object.keys(allData.parties).length;
    console.log('\n=====================================');
    console.log(`✅ TOTAL: ${partyCount} parties`);
    console.log(`   ${allData.presidents.length} presidents`);
    console.log(`   ${allData.senators.length} senators`);
    console.log(`   ${allData.deputies.length} deputies`);
    console.log(`   ${allData.andean.length} andean parliament`);
    console.log(`   TOTAL CANDIDATES: ${allData.presidents.length + allData.senators.length + allData.deputies.length + allData.andean.length}`);

    // Convert parties object to array
    const output = {
        scraped_at: new Date().toISOString(),
        source: 'JNE - Jurado Nacional de Elecciones (votoinformado.jne.gob.pe)',
        parties: Object.values(allData.parties),
        candidates: {
            presidents: allData.presidents,
            senators: allData.senators,
            deputies: allData.deputies,
            andean: allData.andean,
        },
    };

    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', 'jne_candidates.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n💾 Saved to ${outputPath}`);
}

function normalizaCandidate(raw, position, deptoName) {
    const fullName = [raw.strNombres, raw.strApellidoPaterno, raw.strApellidoMaterno]
        .filter(Boolean)
        .map(s => s.trim())
        .join(' ');

    // Title case
    const titleCase = (str) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    return {
        jne_id: raw.idCandidato || null,
        name: titleCase(fullName),
        first_name: titleCase((raw.strNombres || '').trim()),
        last_name_paterno: titleCase((raw.strApellidoPaterno || '').trim()),
        last_name_materno: titleCase((raw.strApellidoMaterno || '').trim()),
        position: position,
        party_jne_id: raw.idOrganizacionPolitica,
        party_name: raw.strOrganizacionPolitica,
        region: deptoName || raw.strDepartamento || 'Nacional',
        list_position: raw.intPosicion || 0,
        cargo: raw.strCargo || '',
        status: raw.strEstadoCandidato || '',
        photo_guid: raw.strGuidFoto || null,
        photo_url: raw.strGuidFoto ? `https://mpesije.jne.gob.pe/apidocs/${raw.strGuidFoto}.jpg` : null,
    };
}

main().catch(console.error);
