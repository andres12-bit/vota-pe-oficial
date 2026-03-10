const http = require('http');

// Check candidate/1 VP data (the actual route used by the frontend)
http.get('http://localhost:4000/api/candidates/1', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const d = JSON.parse(data);
        console.log('Candidate:', d.name, '| party_id:', d.party_id);
        const vps = d.vice_presidents || [];
        console.log('VPs count:', vps.length);
        vps.forEach(v => {
            console.log('  VP:', v.name, '| sort_order:', v.sort_order, '| candidate_profile_id:', v.candidate_profile_id);
        });

        // Also try to load a VP profile directly
        if (vps.length > 0 && vps[0].candidate_profile_id && vps[0].candidate_profile_id !== d.id) {
            const vpId = vps[0].candidate_profile_id;
            console.log('\nTrying to load VP profile at /api/candidates/' + vpId);
            http.get('http://localhost:4000/api/candidates/' + vpId, (r2) => {
                let d2 = '';
                r2.on('data', c => d2 += c);
                r2.on('end', () => {
                    try {
                        const vp = JSON.parse(d2);
                        console.log('VP Profile loaded:', vp.name, '| position:', vp.position);
                        console.log('VP has education:', !!vp.education);
                        console.log('VP has hoja_de_vida:', !!vp.hoja_de_vida);
                    } catch (e) { console.log('Error:', d2.slice(0, 200)); }
                });
            });
        } else {
            console.log('\nVP candidate_profile_id is same as president or null - ISSUE PERSISTS');

            // Try direct ID range to find VPs
            console.log('\nSearching for VP candidates by trying IDs > 6800...');
            let found = 0;
            let checked = 0;
            const checkId = (id) => {
                http.get('http://localhost:4000/api/candidates/' + id, (r) => {
                    let d3 = '';
                    r.on('data', c => d3 += c);
                    r.on('end', () => {
                        checked++;
                        try {
                            const c = JSON.parse(d3);
                            if (c.position && c.position.includes('vice')) {
                                console.log('  FOUND VP at id', id, ':', c.name, c.position, 'party_id:', c.party_id);
                                found++;
                            }
                        } catch (e) { }
                        if (checked >= 200 && found === 0) console.log('  No VPs found in ID range 6800-7000');
                    });
                });
            };
            for (let i = 6800; i <= 7000; i++) checkId(i);
        }
    });
});
