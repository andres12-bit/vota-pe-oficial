/**
 * Fix missing hoja_de_vida in jne_hojadevida_full.json
 * Re-fetches from JNE API and patches the seed data file
 * 
 * Usage: node fix_missing_hv.js
 */
const fs = require('fs');
const path = require('path');

const BASE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf';
const PROCESO_ELECTORAL = 124;

const HEADERS = {
    'Content-Type': 'application/json',
    'Origin': 'https://votoinformado.jne.gob.pe',
    'Referer': 'https://votoinformado.jne.gob.pe/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHojaDeVida(dni, idOrgPolitica) {
    const body = JSON.stringify({
        idProcesoElectoral: PROCESO_ELECTORAL,
        strDocumentoIdentidad: String(dni),
        idOrganizacionPolitica: String(idOrgPolitica),
    });
    try {
        const res = await fetch(`${BASE_API}/HVConsolidado`, { method: 'POST', headers: HEADERS, body });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || json;
    } catch { return null; }
}

async function fetchCandidateList(idTipoEleccion, ubigeo = '') {
    const body = JSON.stringify({
        idProcesoElectoral: PROCESO_ELECTORAL,
        strUbiDepartamento: ubigeo,
        idTipoEleccion: idTipoEleccion,
    });
    try {
        const res = await fetch(`${BASE_API}/listarCanditatos`, { method: 'POST', headers: HEADERS, body });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch { return []; }
}

function parseHojaDeVida(hv) {
    if (!hv) return null;
    const personal = hv.oDatosPersonales || {};
    return {
        dni: personal.strDocumentoIdentidad || '',
        sex: personal.strSexo || '',
        birth_date: personal.strFechaNacimiento || '',
        birthplace: [personal.strNaciDepartamento, personal.strNaciProvincia, personal.strNaciDistrito].filter(Boolean).join(', '),
        residence: [personal.strDomiDepartamento, personal.strDomiProvincia, personal.strDomiDistrito].filter(Boolean).join(', '),
        education: {
            basic: hv.oEduBasica ? {
                primary: hv.oEduBasica.strEduPrimaria === '1',
                primary_completed: hv.oEduBasica.strConcluidoEduPrimaria === '1',
                secondary: hv.oEduBasica.strEduSecundaria === '1',
                secondary_completed: hv.oEduBasica.strConcluidoEduSecundaria === '1',
            } : null,
            university: (hv.lEduUniversitaria || []).map(e => ({
                institution: e.strUniversidad || e.strCentroEstudio || '',
                degree: e.strCarreraUni || e.strCarrera || '',
                completed: e.strConcluidoEduUni === '1' || e.strConcluido === 'CONCLUIDA',
                year: e.strAnioBachiller || e.intAnioInicio || null,
                comment: e.strComentario || '',
            })),
            postgraduate: (hv.lEduPosgrado || []).map(e => ({
                institution: e.strCenEstudioPosgrado || e.strCentroEstudio || '',
                specialty: e.strEspecialidadPosgrado || e.strEspecialidad || e.strCarrera || '',
                degree: e.strEsMaestro === '1' ? 'Maestría' : e.strEsDoctor === '1' ? 'Doctorado' : (e.strGradoObtenido || ''),
                completed: e.strConcluidoPosgrado === '1' || e.strConcluido === 'CONCLUIDA',
                year: e.strAnioPosgrado || e.intAnioInicio || null,
                comment: e.strComentario || '',
            })),
            technical: (hv.lEduTecnica || []).map(e => ({
                institution: e.strCentroEstudio || '',
                specialty: e.strCarrera || '',
                completed: e.strConcluido === 'CONCLUIDA' || e.strConcluidoEduTec === '1',
            })),
        },
        work_experience: (hv.lExperienciaLaboral || []).map(e => ({
            employer: e.strCentroTrabajo || '',
            position: e.strOcupacionProfesion || e.strCargo || '',
            start_year: e.strAnioTrabajoDesde || e.intAnioInicio || null,
            end_year: e.strAnioTrabajoHasta || e.intAnioFin || null,
            period: `${e.strAnioTrabajoDesde || '?'} - ${e.strAnioTrabajoHasta === '0000' ? 'Actualidad' : e.strAnioTrabajoHasta || 'Actualidad'}`,
            comment: e.strComentario || '',
        })),
        political_history: (hv.lCargoPartidario || []).map(e => ({
            organization: e.strOrgPolCargoPartidario || e.strOrganizacionPolitica || '',
            position: e.strCargoPartidario || e.strCargo || '',
            start_year: e.strAnioCargoPartiDesde || e.intAnioInicio || null,
            end_year: e.strAnioCargoPartiHasta === '0000' ? 'Actualidad' : (e.strAnioCargoPartiHasta || null),
            comment: e.strComentario || '',
        })),
        resignations: (hv.lRenunciaOP || []).map(e => ({
            organization: e.strOrganizacionPolitica || '',
            year: e.intAnio || null,
        })),
        elections: (hv.lCargoEleccion || []).map(e => ({
            organization: e.strOrgPolCargoElec || e.strOrganizacionPolitica || '',
            position: e.strCargoEleccion2 || e.strCargo || '',
            start_year: e.strAnioCargoElecDesde || null,
            end_year: e.strAnioCargoElecHasta || null,
            elected: e.blElegido || false,
        })),
        finances: (() => {
            const income = hv.oIngresos || {};
            return {
                year: income.strAnioIngresos || null,
                public_income: parseFloat(income.decRemuBrutaPublico || 0),
                private_income: parseFloat(income.decRemuBrutaPrivado || 0),
                total_income: parseFloat((income.decRemuBrutaPublico || 0) + (income.decRemuBrutaPrivado || 0)),
                properties: (hv.lBienInmueble || []).map(p => ({
                    type: p.strTipoBien || 'Inmueble',
                    value: parseFloat(p.decAutoavaluo || 0),
                })),
                vehicles: (hv.lBienMueble || []).map(v => ({
                    type: v.strVehiculo || 'Vehículo',
                    plate: v.strPlaca || '',
                    value: parseFloat(v.decValor || 0),
                })),
            };
        })(),
        sentences: [
            ...(hv.lSentenciaPenal || []).map(s => ({ type: 'Penal', crime: s.strDelitoPenal || '', court: s.strOrganoJurisdiccional || '' })),
            ...(hv.lSentenciaObliga || []).map(s => ({ type: s.strTipoSentencia || 'Obligación', description: s.strModalidad || '' })),
        ],
    };
}

async function main() {
    const dataPath = path.join(__dirname, '..', 'data', 'jne_hojadevida_full.json');
    
    if (!fs.existsSync(dataPath)) {
        console.error('❌ jne_hojadevida_full.json not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Find ALL candidates with null hoja_de_vida across all categories
    const categories = ['presidents', 'vice_presidents', 'senators', 'deputies', 'andean'];
    let totalNull = 0;
    let fixed = 0;
    
    console.log('🔧 Fix Missing Hoja de Vida — PulsoElectoral.pe\n');

    for (const cat of categories) {
        const candidates = data.candidates[cat] || [];
        const nullCandidates = candidates.filter(c => !c.hoja_de_vida);
        
        if (nullCandidates.length === 0) continue;
        
        console.log(`\n📋 ${cat.toUpperCase()}: ${nullCandidates.length} candidates with null HV`);
        totalNull += nullCandidates.length;

        for (const candidate of nullCandidates) {
            const dni = candidate.dni;
            const partyId = candidate.party_jne_id;
            
            if (!dni) {
                console.log(`  ❌ ${candidate.name} — no DNI`);
                continue;
            }
            
            console.log(`  🔍 ${candidate.name} (DNI: ${dni})...`);
            
            const hv = await fetchHojaDeVida(dni, partyId);
            const parsed = parseHojaDeVida(hv);
            
            if (parsed) {
                // Find index in original array and update
                const idx = candidates.findIndex(c => c.dni === dni);
                if (idx >= 0) {
                    candidates[idx].hoja_de_vida = parsed;
                    fixed++;
                    console.log(`  ✅ FIXED! Edu: ${parsed.education.university.length} uni, Work: ${parsed.work_experience.length}, Political: ${parsed.political_history.length}`);
                }
            } else {
                console.log(`  ⚠️ JNE returned empty HV`);
            }
            
            await sleep(300);
        }
    }

    // Save updated file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`\n========================================`);
    console.log(`📊 Total null HV found: ${totalNull}`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`💾 Saved to ${dataPath}`);
    console.log(`\n⚠️ Restart backend with: pm2 restart pulso-backend`);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
