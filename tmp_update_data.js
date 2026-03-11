/**
 * Update jne_hojadevida_full.json:
 * 1. Set party logo_url to sroppublico.jne.gob.pe URLs using jne_id
 * 2. Fix ALL candidate photo URLs from .jpg to .jpeg
 */
const fs = require('fs');
const path = require('path');

const fullDataPath = path.join(__dirname, 'backend', 'src', 'data', 'jne_hojadevida_full.json');
const data = JSON.parse(fs.readFileSync(fullDataPath, 'utf-8'));

// 1. Update party logos using ROP public API
let logoCount = 0;
data.parties.forEach(p => {
    p.logo_url = `https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/${p.jne_id}`;
    logoCount++;
});
console.log(`Updated ${logoCount} party logos`);

// 2. Fix ALL candidate photo URLs from .jpg to .jpeg
let photoFixed = 0;
const positions = ['presidents', 'vice_presidents', 'senators', 'deputies', 'andean'];
positions.forEach(pos => {
    const candidates = data.candidates[pos] || [];
    candidates.forEach(c => {
        if (c.photo_url && c.photo_url.endsWith('.jpg')) {
            c.photo_url = c.photo_url.replace(/\.jpg$/, '.jpeg');
            photoFixed++;
        }
    });
});
console.log(`Fixed ${photoFixed} photo URLs from .jpg to .jpeg`);

// Verify Keiko
const keiko = data.candidates.presidents.find(c => c.name && c.name.toLowerCase().includes('fujimori'));
if (keiko) {
    console.log(`Keiko photo: ${keiko.photo_url}`);
} else {
    console.log('Keiko not found');
}

// Save
fs.writeFileSync(fullDataPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('Saved!');
