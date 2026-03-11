/**
 * Quick script to fetch party logos from JNE API and check Keiko's photo
 */
const fs = require('fs');
const path = require('path');

const API_URL = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/listarCanditatos';

async function main() {
    // Fetch presidential candidates to get party logos
    console.log('Fetching presidential candidates from JNE...');
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://votoinformado.jne.gob.pe',
            'Referer': 'https://votoinformado.jne.gob.pe/',
        },
        body: JSON.stringify({
            idProcesoElectoral: 124,
            strUbiDepartamento: '',
            idTipoEleccion: 1,
        }),
    });

    const json = await response.json();
    const candidates = json.data || [];
    console.log(`Found ${candidates.length} presidential candidates`);

    // Extract unique parties with logos
    const parties = {};
    candidates.forEach(c => {
        if (!parties[c.idOrganizacionPolitica]) {
            parties[c.idOrganizacionPolitica] = {
                jne_id: c.idOrganizacionPolitica,
                name: c.strOrganizacionPolitica,
                logo_url: c.strUrlOrganizacionPolitica || null,
            };
        }
    });

    console.log('\n=== PARTY LOGOS ===');
    Object.values(parties).forEach(p => {
        console.log(`${p.name}: ${p.logo_url || 'NO LOGO'}`);
    });

    // Check Keiko
    console.log('\n=== KEIKO CHECK ===');
    const keiko = candidates.find(c =>
        (c.strNombres + ' ' + c.strApellidoPaterno).toLowerCase().includes('keiko') ||
        (c.strApellidoPaterno || '').toLowerCase().includes('fujimori')
    );
    if (keiko) {
        console.log(`Found: ${keiko.strNombres} ${keiko.strApellidoPaterno} ${keiko.strApellidoMaterno}`);
        console.log(`Photo GUID: ${keiko.strGuidFoto || 'NONE'}`);
        console.log(`Photo URL: ${keiko.strGuidFoto ? 'https://mpesije.jne.gob.pe/apidocs/' + keiko.strGuidFoto + '.jpg' : 'NO PHOTO'}`);
        console.log(`Party: ${keiko.strOrganizacionPolitica}`);
        console.log(`Status: ${keiko.strEstadoCandidato}`);
    } else {
        console.log('Keiko Fujimori NOT FOUND in JNE presidential candidates');
    }

    // Now update the jne_hojadevida_full.json with logo URLs
    const fullDataPath = path.join(__dirname, 'backend', 'src', 'data', 'jne_hojadevida_full.json');
    const fullData = JSON.parse(fs.readFileSync(fullDataPath, 'utf-8'));

    let updated = 0;
    fullData.parties.forEach(p => {
        const match = parties[p.jne_id];
        if (match && match.logo_url) {
            p.logo_url = match.logo_url;
            updated++;
        }
    });

    console.log(`\nUpdated ${updated} party logos in jne_hojadevida_full.json`);

    // Also check if Keiko exists in the candidates data
    const allPresidents = fullData.candidates.presidents || [];
    const keikoInData = allPresidents.find(c =>
        c.name && c.name.toLowerCase().includes('fujimori')
    );
    if (keikoInData) {
        console.log(`\nKeiko in hojadevida: ${keikoInData.name}, photo: ${keikoInData.photo_url || 'NO PHOTO'}`);
    } else {
        console.log('\nKeiko NOT in jne_hojadevida_full.json candidates');
    }

    // Save updated data
    fs.writeFileSync(fullDataPath, JSON.stringify(fullData, null, 2), 'utf-8');
    console.log('Saved updated data');
}

main().catch(console.error);
