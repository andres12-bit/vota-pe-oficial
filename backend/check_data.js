// Fetch party ballot numbers from JNE Voto Informado
const fs = require('fs');

const BASE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf';
const HEADERS = {
    'Content-Type': 'application/json',
    'Origin': 'https://votoinformado.jne.gob.pe',
    'Referer': 'https://votoinformado.jne.gob.pe/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function main() {
    // Try organization list endpoint
    const endpoints = [
        'ObtenerOrganizaciones',
        'ListaOrganizaciones',
        'GetOrganizaciones',
        'organizaciones',
        'ListaOP',
    ];

    for (const ep of endpoints) {
        try {
            const body = JSON.stringify({ idProcesoElectoral: 124 });
            const res = await fetch(`${BASE_API}/${ep}`, { method: 'POST', headers: HEADERS, body });
            console.log(`${ep}: ${res.status}`);
            if (res.ok) {
                const json = await res.json();
                console.log('  Data:', JSON.stringify(json).substring(0, 200));
            }
        } catch (e) {
            console.log(`${ep}: ERROR ${e.message}`);
        }
    }

    // Also try to find the number in the existing scraped data for candidates
    const data = JSON.parse(fs.readFileSync('src/data/jne_hojadevida_full.json', 'utf8'));

    // Check raw candidate data structure for any partido_number or similar fields
    const pres = data.candidates.presidents[0];
    console.log('\n\nFirst president keys:', Object.keys(pres).join(', '));
    console.log('party_number:', pres.party_number);
    console.log('ballot_number:', pres.ballot_number);
    console.log('list_position:', pres.list_position);
    console.log('number:', pres.number);

    // Look at the scraper script to see what raw data from the API has
    // The "intNumOrden" or similar field from JNE ListaCandidatos
}

main();
