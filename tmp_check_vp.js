const http = require('http');
// Check if vice_president_1/2 positions exist in candidates table
http.get('http://localhost:4000/api/candidates?limit=5000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const d = JSON.parse(data);
        const all = d.candidates || [];
        const positions = {};
        all.forEach(c => { positions[c.position] = (positions[c.position] || 0) + 1; });
        console.log('Position counts:', JSON.stringify(positions));
        const vps = all.filter(c => c.position && c.position.includes('vice'));
        console.log('VP candidates found:', vps.length);
        vps.slice(0, 5).forEach(v => console.log('  VP:', v.id, v.name, v.position, v.party_id));
    });
});
