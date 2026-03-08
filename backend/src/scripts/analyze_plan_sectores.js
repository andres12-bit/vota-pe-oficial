/**
 * PulsoElectoral.pe — PDF Plan de Gobierno Sector Analysis
 * 
 * Parses all plan gobierno PDFs, extracts text, and runs keyword analysis
 * for 22 Peru sectors + AI usage detection.
 * 
 * Output: data/sector_analysis.json
 * Usage: node src/scripts/analyze_plan_sectores.js
 */

const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const PDF_DIR = path.join(__dirname, '..', 'data', 'pdfs');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'sector_analysis.json');

// =============== 22 SECTORS OF PERU ===============
const SECTORS = [
    { id: 'agricultura', name: 'Agricultura y Ganadería', emoji: '🌾', keywords: ['agrícola', 'agricultura', 'ganadería', 'agropecuario', 'agro', 'riego', 'semilla', 'cosecha', 'campesino', 'agrario', 'cultivo', 'fertilizante', 'ganado', 'pecuario', 'tierra agrícola', 'productor agrario', 'sierra rural'] },
    { id: 'pesca', name: 'Pesca y Acuicultura', emoji: '🐟', keywords: ['pesca', 'acuicultura', 'marítimo', 'pesquero', 'hidrobiológico', 'piscicultura', 'anchoveta', 'litoral', 'recurso marino', 'industria pesquera'] },
    { id: 'mineria', name: 'Minería e Hidrocarburos', emoji: '⛏️', keywords: ['minería', 'minero', 'petróleo', 'gas natural', 'hidrocarburo', 'canon minero', 'mina', 'extracción minera', 'yacimiento', 'oro', 'cobre', 'zinc', 'plata', 'refinería'] },
    { id: 'energia', name: 'Energía', emoji: '⚡', keywords: ['energía', 'eléctrica', 'electricidad', 'renovable', 'solar', 'eólica', 'hidroeléctrica', 'generación eléctrica', 'matriz energética', 'gas natural', 'electrificación'] },
    { id: 'industria', name: 'Industria y Producción', emoji: '🏭', keywords: ['industria', 'manufactura', 'producción', 'fábrica', 'productividad', 'mype', 'pyme', 'mipyme', 'micro empresa', 'pequeña empresa', 'mediana empresa', 'industrialización', 'valor agregado'] },
    { id: 'comercio', name: 'Comercio', emoji: '🛒', keywords: ['comercio', 'exportación', 'importación', 'arancel', 'mercado', 'competitividad', 'emprendimiento', 'comercio exterior', 'tlc', 'acuerdo comercial', 'aduana', 'sunat'] },
    { id: 'transporte', name: 'Transporte y Logística', emoji: '🚛', keywords: ['transporte', 'vial', 'carretera', 'ferrocarril', 'tren', 'puerto', 'aeropuerto', 'logística', 'tránsito', 'autopista', 'infraestructura vial', 'metro', 'corredor', 'terrapuerto'] },
    { id: 'telecom', name: 'Telecomunicaciones y Tecnología', emoji: '📡', keywords: ['telecomunicación', 'internet', 'digital', 'tic', 'tecnología', 'conectividad', 'fibra óptica', 'banda ancha', 'red móvil', 'satelital', 'gobierno digital', 'plataforma digital'] },
    { id: 'turismo', name: 'Turismo', emoji: '🏖️', keywords: ['turismo', 'turístico', 'patrimonio', 'arqueológico', 'hotelería', 'visitante', 'turista', 'machu picchu', 'destino turístico', 'hospedaje', 'artesanía'] },
    { id: 'cultura', name: 'Cultura', emoji: '🎭', keywords: ['cultura', 'cultural', 'arte', 'museo', 'patrimonio cultural', 'identidad', 'intercultural', 'lengua indígena', 'quechua', 'aimara', 'diversidad cultural', 'patrimonio inmaterial'] },
    { id: 'educacion', name: 'Educación', emoji: '📚', keywords: ['educación', 'educativo', 'escuela', 'universidad', 'docente', 'profesor', 'alumno', 'estudiante', 'pedagógico', 'colegio', 'enseñanza', 'aprendizaje', 'formación', 'currículo', 'beca', 'pronabec', 'minedu', 'educación superior', 'educación básica', 'inicial', 'primaria', 'secundaria'] },
    { id: 'salud', name: 'Salud', emoji: '🏥', keywords: ['salud', 'hospital', 'médico', 'sanitario', 'vacuna', 'epidemia', 'sis', 'essalud', 'paciente', 'clínica', 'enfermedad', 'atención primaria', 'centro de salud', 'minsa', 'farmacia', 'medicamento', 'pandemia', 'mortalidad', 'natalidad', 'desnutrición', 'anemia'] },
    { id: 'seguridad', name: 'Seguridad y Defensa', emoji: '🛡️', keywords: ['seguridad', 'policía', 'delincuencia', 'narcotráfico', 'defensa', 'militar', 'crimen', 'violencia', 'fuerzas armadas', 'seguridad ciudadana', 'inseguridad', 'serenazgo', 'penitenciario', 'patrullaje', 'droga'] },
    { id: 'justicia', name: 'Justicia', emoji: '⚖️', keywords: ['justicia', 'judicial', 'corrupción', 'fiscal', 'penal', 'juez', 'poder judicial', 'impunidad', 'denuncia', 'ministerio público', 'fiscalía', 'contraloría', 'tribunal', 'derecho', 'código penal', 'proceso judicial', 'anticorrupción'] },
    { id: 'economia', name: 'Economía y Finanzas', emoji: '💰', keywords: ['economía', 'económico', 'fiscal', 'tributario', 'presupuesto', 'deuda', 'inflación', 'pbi', 'crecimiento', 'inversión', 'finanzas', 'banco', 'bcr', 'mef', 'recaudación', 'gasto público', 'déficit fiscal', 'producto bruto'] },
    { id: 'trabajo', name: 'Trabajo y Empleo', emoji: '👷', keywords: ['empleo', 'trabajo', 'laboral', 'sueldo', 'salario', 'pensión', 'desempleo', 'informalidad', 'trabajador', 'sindic', 'afp', 'onp', 'remuneración', 'capacitación laboral', 'formal', 'contratación'] },
    { id: 'vivienda', name: 'Vivienda y Construcción', emoji: '🏗️', keywords: ['vivienda', 'construcción', 'urbanismo', 'saneamiento', 'agua potable', 'alcantarillado', 'techo propio', 'fondo mivivienda', 'drenaje', 'lotización', 'habilitación urbana', 'asentamiento'] },
    { id: 'ambiente', name: 'Medio Ambiente', emoji: '🌿', keywords: ['ambiente', 'ambiental', 'contaminación', 'deforestación', 'residuo', 'reciclaje', 'clima', 'ecológico', 'biodiversidad', 'cambio climático', 'bosque', 'amazonía', 'recurso natural', 'sostenible', 'huella de carbono', 'emisión'] },
    { id: 'social', name: 'Desarrollo Social', emoji: '🤝', keywords: ['social', 'pobreza', 'inclusión', 'discapacidad', 'adulto mayor', 'género', 'niñez', 'vulnerable', 'programa social', 'qali warma', 'pensión 65', 'juntos', 'cuna más', 'violencia de género', 'igualdad', 'equidad'] },
    { id: 'deporte', name: 'Deporte y Recreación', emoji: '⚽', keywords: ['deporte', 'deportivo', 'recreación', 'olímpico', 'estadio', 'atleta', 'actividad física', 'ipd', 'selección nacional', 'juegos', 'competencia deportiva', 'complejo deportivo'] },
    { id: 'exterior', name: 'Relaciones Exteriores', emoji: '🌐', keywords: ['exterior', 'diplomacia', 'relaciones internacionales', 'tratado', 'frontera', 'migración', 'cooperación internacional', 'cancillería', 'embajada', 'soberanía', 'bilateral', 'multilateral'] },
    { id: 'gobierno', name: 'Gobierno y Admin. Pública', emoji: '🏛️', keywords: ['gobierno', 'administración pública', 'descentralización', 'gestión pública', 'funcionario', 'burocracia', 'reforma del estado', 'modernización', 'gobierno regional', 'gobierno local', 'municipalidad', 'servir', 'meritocracia', 'gobernanza'] },
];

// =============== AI CONTENT DETECTION (Heuristic) ===============
// Detects probability of AI-generated content by analyzing writing patterns

// Formulaic phrases commonly produced by LLMs in Spanish
const AI_FORMULAIC_PHRASES = [
    'en este sentido', 'es importante destacar', 'cabe señalar', 'cabe mencionar',
    'en ese contexto', 'en el marco de', 'con el fin de', 'a fin de',
    'es fundamental', 'resulta fundamental', 'resulta necesario', 'resulta imperativo',
    'se busca garantizar', 'se busca promover', 'se busca fortalecer',
    'en concordancia con', 'de manera integral', 'de manera sostenible',
    'de manera transversal', 'de manera articulada', 'de manera eficiente',
    'para tal efecto', 'en esa línea', 'en esa dirección',
    'es preciso señalar', 'es necesario señalar', 'conviene señalar',
    'en virtud de', 'en función de', 'en relación con',
    'asimismo', 'del mismo modo', 'de igual manera', 'de igual forma',
    'por consiguiente', 'por lo tanto', 'por ende', 'en consecuencia',
    'no obstante', 'sin embargo', 'a pesar de', 'pese a',
    'cabe resaltar', 'vale la pena', 'es menester',
    'se propone implementar', 'se plantea', 'se considera necesario',
    'enfoque integral', 'enfoque multisectorial', 'enfoque inclusivo',
    'perspectiva de género', 'desarrollo sostenible', 'articulación interinstitucional',
    'fortalecimiento institucional', 'modernización del estado',
    'brecha digital', 'inclusión social', 'gestión por resultados',
];

function detectAiContent(text) {
    // Use lowercase text WITH punctuation for sentence splitting
    const lowerText = (text || '').toLowerCase();
    const normalizedText = normalize(text);
    const sentences = lowerText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const paragraphs = lowerText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 30);
    const words = normalizedText.split(/\s+/).filter(w => w.length > 2);

    if (sentences.length < 10 || words.length < 100) {
        return { percentage: 0, signals: {}, details: `Texto insuficiente (${sentences.length} oraciones, ${words.length} palabras)` };
    }

    const signals = {};

    // 1. SENTENCE LENGTH UNIFORMITY (AI writes uniform sentence lengths)
    // Low std dev = more AI-like
    const sentLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
    const sentStdDev = Math.sqrt(sentLengths.reduce((sum, l) => sum + Math.pow(l - avgSentLen, 2), 0) / sentLengths.length);
    const coeffOfVariation = avgSentLen > 0 ? sentStdDev / avgSentLen : 0;
    // Human text: CV ~0.5-0.8, AI text: CV ~0.2-0.4
    const uniformityScore = Math.max(0, Math.min(100, Math.round((1 - (coeffOfVariation / 0.7)) * 100)));
    signals.sentence_uniformity = { score: uniformityScore, cv: Math.round(coeffOfVariation * 100) / 100, avgLen: Math.round(avgSentLen) };

    // 2. VOCABULARY DIVERSITY (Type-Token Ratio)
    // AI tends to have lower vocabulary diversity
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / Math.sqrt(words.length); // Corrected TTR (Guiraud)
    // Human text: Guiraud ~7-10, AI text: ~5-7
    const vocabScore = Math.max(0, Math.min(100, Math.round((1 - ((ttr - 4) / 6)) * 100)));
    signals.vocabulary_diversity = { score: vocabScore, ttr: Math.round(ttr * 100) / 100, unique: uniqueWords.size, total: words.length };

    // 3. FORMULAIC PHRASES (AI uses these heavily)
    let formulaicCount = 0;
    const detectedPhrases = [];
    for (const phrase of AI_FORMULAIC_PHRASES) {
        const normalizedPhrase = normalize(phrase);
        let idx = 0;
        let count = 0;
        while ((idx = normalizedText.indexOf(normalizedPhrase, idx)) !== -1) {
            count++;
            idx += normalizedPhrase.length;
        }
        if (count > 0) {
            formulaicCount += count;
            detectedPhrases.push({ phrase, count });
        }
    }
    // Formulaic density per 1000 words
    const formulaicDensity = words.length > 0 ? (formulaicCount / words.length) * 1000 : 0;
    // Human: ~2-5 per 1000 words, AI: ~8-20 per 1000 words
    const formulaicScore = Math.max(0, Math.min(100, Math.round(((formulaicDensity - 2) / 15) * 100)));
    signals.formulaic_phrases = {
        score: formulaicScore,
        density: Math.round(formulaicDensity * 10) / 10,
        count: formulaicCount,
        topPhrases: detectedPhrases.sort((a, b) => b.count - a.count).slice(0, 10),
    };

    // 4. PARAGRAPH LENGTH UNIFORMITY
    if (paragraphs.length >= 3) {
        const paraLengths = paragraphs.map(p => p.split(/\s+/).length);
        const avgParaLen = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
        const paraStdDev = Math.sqrt(paraLengths.reduce((sum, l) => sum + Math.pow(l - avgParaLen, 2), 0) / paraLengths.length);
        const paraCv = avgParaLen > 0 ? paraStdDev / avgParaLen : 0;
        const paraScore = Math.max(0, Math.min(100, Math.round((1 - (paraCv / 0.8)) * 100)));
        signals.paragraph_uniformity = { score: paraScore, cv: Math.round(paraCv * 100) / 100, count: paragraphs.length };
    } else {
        signals.paragraph_uniformity = { score: 50, cv: 0, count: paragraphs.length };
    }

    // 5. CONNECTOR/TRANSITION DENSITY
    const connectors = ['ademas', 'asimismo', 'por otro lado', 'por otra parte', 'en primer lugar',
        'en segundo lugar', 'finalmente', 'en conclusion', 'en resumen', 'por lo tanto',
        'sin embargo', 'no obstante', 'a su vez', 'de esta manera', 'en tal sentido',
        'cabe destacar', 'es decir', 'dicho esto', 'en efecto', 'ahora bien'];
    let connectorCount = 0;
    for (const conn of connectors) {
        let idx = 0;
        while ((idx = normalizedText.indexOf(conn, idx)) !== -1) {
            connectorCount++;
            idx += conn.length;
        }
    }
    const connectorDensity = sentences.length > 0 ? connectorCount / sentences.length : 0;
    // Human: ~0.05-0.15 connectors/sentence, AI: ~0.2-0.4
    const connectorScore = Math.max(0, Math.min(100, Math.round(((connectorDensity - 0.05) / 0.3) * 100)));
    signals.connector_density = { score: connectorScore, density: Math.round(connectorDensity * 100) / 100, count: connectorCount };

    // 6. WORD LENGTH CONSISTENCY (AI uses more uniform word lengths)
    const wordLengths = words.map(w => w.length);
    const avgWordLen = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const wordLenStd = Math.sqrt(wordLengths.reduce((sum, l) => sum + Math.pow(l - avgWordLen, 2), 0) / wordLengths.length);
    const wordLenCv = avgWordLen > 0 ? wordLenStd / avgWordLen : 0;
    const wordLenScore = Math.max(0, Math.min(100, Math.round((1 - (wordLenCv / 0.6)) * 100)));
    signals.word_uniformity = { score: wordLenScore, cv: Math.round(wordLenCv * 100) / 100, avgLen: Math.round(avgWordLen * 10) / 10 };

    // FINAL WEIGHTED SCORE
    const weights = {
        sentence_uniformity: 0.20,
        vocabulary_diversity: 0.20,
        formulaic_phrases: 0.25,
        paragraph_uniformity: 0.10,
        connector_density: 0.15,
        word_uniformity: 0.10,
    };

    let finalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
        finalScore += (signals[key]?.score || 0) * weight;
    }
    const percentage = Math.max(0, Math.min(100, Math.round(finalScore)));

    // Classification
    let classification;
    if (percentage >= 70) classification = 'alto';
    else if (percentage >= 40) classification = 'moderado';
    else if (percentage >= 20) classification = 'bajo';
    else classification = 'mínimo';

    return {
        percentage,
        classification,
        signals,
        details: `Análisis basado en ${sentences.length} oraciones, ${words.length} palabras, ${paragraphs.length} párrafos`,
    };
}

function normalize(text) {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ');
}

function countKeywordMatches(text, keywords) {
    const normalizedText = normalize(text);
    let totalMatches = 0;
    const matchedKeywords = [];
    for (const kw of keywords) {
        const normalizedKw = normalize(kw);
        let idx = 0;
        let count = 0;
        while ((idx = normalizedText.indexOf(normalizedKw, idx)) !== -1) {
            count++;
            idx += normalizedKw.length;
        }
        if (count > 0) {
            totalMatches += count;
            matchedKeywords.push({ keyword: kw, count });
        }
    }
    return { totalMatches, matchedKeywords };
}

async function extractPdfText(filepath) {
    try {
        const buffer = new Uint8Array(fs.readFileSync(filepath));
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
    } catch (err) {
        console.error(`  ⚠️ Error parsing ${path.basename(filepath)}: ${err.message}`);
        return '';
    }
}

async function main() {
    console.log('📊 PulsoElectoral.pe — PDF Sector Analysis');
    console.log('==========================================\n');

    // Find all plan gobierno PDFs (not resumen)
    const planPdfs = fs.readdirSync(PDF_DIR)
        .filter(f => f.startsWith('plan_gobierno_') && f.endsWith('.pdf'))
        .sort();

    console.log(`📄 Found ${planPdfs.length} plan de gobierno PDFs\n`);

    const results = {};

    for (const filename of planPdfs) {
        // Extract party JNE ID from filename: plan_gobierno_{ID}_{NAME}.pdf
        const match = filename.match(/plan_gobierno_(\d+)_(.+)\.pdf/);
        if (!match) continue;
        const partyJneId = match[1];
        const partyName = match[2].replace(/_/g, ' ');

        console.log(`\n📋 Processing: ${partyName} (JNE ID: ${partyJneId})`);

        // Extract text from PDF
        const filepath = path.join(PDF_DIR, filename);
        const text = await extractPdfText(filepath);

        if (!text || text.length < 100) {
            console.log(`   ⚠️ Insufficient text extracted (${text.length} chars), skipping`);
            continue;
        }

        console.log(`   📝 Extracted ${text.length} characters`);

        // Total word count for normalization
        const totalWords = normalize(text).split(/\s+/).filter(w => w.length > 2).length;

        // Analyze each sector — count raw matches first
        const rawSectors = SECTORS.map(sector => {
            const { totalMatches, matchedKeywords } = countKeywordMatches(text, sector.keywords);
            return {
                id: sector.id,
                name: sector.name,
                emoji: sector.emoji,
                matches: totalMatches,
                topKeywords: matchedKeywords.sort((a, b) => b.count - a.count).slice(0, 5),
            };
        });

        // Calculate proportional percentages (sum = 100%)
        const totalAllMatches = rawSectors.reduce((sum, s) => sum + s.matches, 0);
        const sectorAnalysis = rawSectors.map(sector => ({
            ...sector,
            percentage: totalAllMatches > 0 ? Math.round((sector.matches / totalAllMatches) * 100) : 0,
        })).sort((a, b) => b.percentage - a.percentage);

        // AI Content Detection (heuristic analysis)
        const aiDetection = detectAiContent(text);

        results[partyJneId] = {
            party_jne_id: partyJneId,
            party_name: partyName,
            pdf_file: filename,
            total_chars: text.length,
            total_words: totalWords,
            sectors: sectorAnalysis,
            ai_analysis: aiDetection,
        };

        // Print top sectors
        const topSectors = sectorAnalysis.filter(s => s.percentage > 0).slice(0, 5);
        console.log(`   🏆 Top sectors: ${topSectors.map(s => `${s.emoji} ${s.name} ${s.percentage}%`).join(', ')}`);
        console.log(`   🤖 AI Content: ${aiDetection.percentage}% (${aiDetection.classification})`);
    }

    // Save
    const output = {
        generated_at: new Date().toISOString(),
        total_parties: Object.keys(results).length,
        analysis: results,
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

    console.log('\n==========================================');
    console.log(`✅ Analysis complete! ${Object.keys(results).length} plans analyzed`);
    console.log(`📁 Saved to: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
