/**
 * JNE Plan de Gobierno Scraper — PulsoElectoral.pe
 * 
 * Scrapes plan de gobierno data from JNE Voto Informado:
 *   GET /detalle-plangobierno?IdPlanGobierno=X → structured summary with dimensions
 * 
 * Also downloads the PDFs for each party.
 * Usage: node scrape_plan_gobierno.js
 */

const fs = require('fs');
const path = require('path');

const BASE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf';

const HEADERS = {
    'Origin': 'https://votoinformado.jne.gob.pe',
    'Referer': 'https://votoinformado.jne.gob.pe/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPlanGobiernoDetail(idPlanGobierno) {
    try {
        const res = await fetch(`${BASE_API}/detalle-plangobierno?IdPlanGobierno=${idPlanGobierno}`, { headers: HEADERS });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

async function downloadPDF(url, filename) {
    if (!url) return null;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return null;
        const buffer = Buffer.from(await res.arrayBuffer());
        const pdfDir = path.join(__dirname, '..', 'data', 'pdfs');
        fs.mkdirSync(pdfDir, { recursive: true });
        const filepath = path.join(pdfDir, filename);
        fs.writeFileSync(filepath, buffer);
        return path.basename(filepath);
    } catch (e) {
        console.log(`    ⚠️ PDF download failed: ${e.message}`);
        return null;
    }
}

function parsePlanGobierno(detail) {
    if (!detail || !detail.datoGeneral) return null;
    const g = detail.datoGeneral;

    // Parse the individual dimension arrays
    const DIMENSION_KEYS = [
        { key: 'dimensionSocial', label: 'DIMENSIÓN SOCIAL' },
        { key: 'dimensionEconomica', label: 'DIMENSIÓN ECONÓMICA' },
        { key: 'dimensionAmbiental', label: 'DIMENSIÓN AMBIENTAL' },
        { key: 'dimensionInstitucional', label: 'DIMENSIÓN INSTITUCIONAL' },
        { key: 'dimensionPropuesta', label: 'PROPUESTAS ADICIONALES' },
    ];

    const dimensions = [];
    for (const { key, label } of DIMENSION_KEYS) {
        const items = (detail[key] || []).map(item => ({
            problem: item.txPgProblema || '',
            objective: item.txPgObjetivo || '',
            goals: item.txPgMeta || '',
            indicator: item.txPgIndicador || '',
        }));
        if (items.length > 0) {
            dimensions.push({ dimension: label, items });
        }
    }

    // Find PDF URLs in datoGeneral
    let planPdfUrl = null;
    let resumenPdfUrl = null;
    for (const [k, v] of Object.entries(g)) {
        if (typeof v === 'string' && v.includes('mpesije.jne.gob.pe') && v.includes('.pdf')) {
            if (k.toLowerCase().includes('resumen')) {
                resumenPdfUrl = v;
            } else {
                planPdfUrl = v;
            }
        }
    }

    return {
        id_plan_gobierno: g.idPlanGobierno,
        party_jne_id: g.idOrganizacionPolitica,
        party_name: g.txOrganizacionPolitica || '',
        plan_pdf_url: planPdfUrl,
        resumen_pdf_url: resumenPdfUrl,
        dimensions,
    };
}

async function main() {
    console.log('📋 JNE Plan de Gobierno Scraper — PulsoElectoral.pe');
    console.log('==========================================\n');

    const result = { scraped_at: new Date().toISOString(), plans: [] };
    const seenParties = new Set();

    // Scan a range of plan IDs — known: Somos Peru (14) = 29681
    console.log('Phase 1: Scanning plan IDs via GET /detalle-plangobierno...\n');

    // Scan range 29670-29750 to cover all 36+ parties (each has 2 entries: plan + resumen)
    for (let id = 29670; id <= 29760; id++) {
        const detail = await fetchPlanGobiernoDetail(id);
        if (detail && detail.datoGeneral) {
            const parsed = parsePlanGobierno(detail);
            if (parsed && parsed.dimensions.length > 0) {
                // Only keep one entry per party (skip duplicate plan type)
                if (!seenParties.has(parsed.party_jne_id)) {
                    seenParties.add(parsed.party_jne_id);
                    result.plans.push(parsed);
                    console.log(`  ✅ ID ${id}: ${parsed.party_name} — ${parsed.dimensions.length} dims, ${parsed.dimensions.reduce((s, d) => s + d.items.length, 0)} items`);
                    if (parsed.plan_pdf_url) console.log(`     📄 PDF: ${parsed.plan_pdf_url.substring(0, 70)}...`);
                }
            }
        }
        // Rate limit every 5 requests
        if (id % 5 === 0) await sleep(150);
    }

    console.log(`\n✅ Found ${result.plans.length} unique party plans\n`);

    // Phase 2: Download PDFs
    console.log('Phase 2: Downloading PDFs...\n');
    for (const plan of result.plans) {
        const safeName = (plan.party_name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

        if (plan.plan_pdf_url) {
            const filename = `plan_gobierno_${plan.party_jne_id}_${safeName}.pdf`;
            process.stdout.write(`  📥 ${plan.party_name}... `);
            const local = await downloadPDF(plan.plan_pdf_url, filename);
            plan.plan_pdf_local = local;
            console.log(local ? `✅ ${local}` : '⚠️ failed');
        }
        if (plan.resumen_pdf_url) {
            const filename = `resumen_pg_${plan.party_jne_id}_${safeName}.pdf`;
            const local = await downloadPDF(plan.resumen_pdf_url, filename);
            plan.resumen_pdf_local = local;
        }
        await sleep(300);
    }

    // Save
    const outputPath = path.join(__dirname, '..', 'data', 'jne_plan_gobierno.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    const totalItems = result.plans.reduce((s, p) => s + p.dimensions.reduce((s2, d) => s2 + d.items.length, 0), 0);
    const withPDFs = result.plans.filter(p => p.plan_pdf_local).length;

    console.log('\n==========================================');
    console.log(`✅ SCRAPE COMPLETE`);
    console.log(`   Plans: ${result.plans.length} parties`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   PDFs downloaded: ${withPDFs}`);
    console.log(`   Saved to: ${outputPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
