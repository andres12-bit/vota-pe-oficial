/**
 * PulsoElectoral.pe — Initial Scorer
 *
 * Runs all scoring engines on every candidate to populate initial scores.
 * Run: DATABASE_URL=... node src/engines/initialScorer.js
 */
require('dotenv').config();
const pool = require('../db/pool');
const HojaDeVidaScorer = require('./hojaDeVidaScorer');
const PlanGobiernoScorer = require('./planGobiernoScorer');
const IntegrityScorer = require('./integrityScorer');
const RankingEngine = require('./rankingEngine');

async function runInitialScoring() {
    console.log('🔄 PulsoElectoral.pe — Running initial scoring for all candidates...\n');

    // 1. Ensure new columns exist (ALTER TABLE for existing DBs)
    try {
        await pool.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hoja_score NUMERIC(6,2) DEFAULT 0');
        await pool.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan_score NUMERIC(6,2) DEFAULT 0');
        await pool.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_score NUMERIC(6,2) DEFAULT 0');
        console.log('✅ Database columns verified (hoja_score, plan_score, experience_score)');
    } catch (err) {
        console.log('ℹ️  Columns may already exist:', err.message);
    }

    // 2. Score Hojas de Vida
    console.log('\n📋 Scoring Hojas de Vida...');
    const hvCount = await HojaDeVidaScorer.calculateAll();

    // 3. Score Planes de Gobierno
    console.log('\n📜 Scoring Planes de Gobierno...');
    const planCount = await PlanGobiernoScorer.calculateAll();

    // 3b. Score Integrity
    console.log('\n🔵 Scoring Integrity...');
    const integrityCount = await IntegrityScorer.calculateAll();

    // 4. Recalculate final scores for all candidates using new formula
    console.log('\n🏆 Recalculating final scores with new formula...');

    // Get max votes per position for normalization
    const maxVotesResult = await pool.query(`
        SELECT position, MAX(vote_count) as max_votes 
        FROM candidates 
        WHERE is_active = true 
        GROUP BY position
    `);
    const maxVotesByPosition = {};
    maxVotesResult.rows.forEach(r => {
        maxVotesByPosition[r.position] = parseInt(r.max_votes) || 1;
    });

    // Get all candidates
    const candidates = await pool.query(
        'SELECT * FROM candidates WHERE is_active = true'
    );

    let recalcCount = 0;
    for (const candidate of candidates.rows) {
        const finalScore = RankingEngine.calculateFinalScore(candidate);

        await pool.query(
            'UPDATE candidates SET final_score = $1, updated_at = NOW() WHERE id = $2',
            [finalScore, candidate.id]
        );
        recalcCount++;
    }
    console.log(`✅ Recalculated final scores for ${recalcCount} candidates`);

    // 5. Recalculate party scores
    console.log('\n🏛️ Recalculating party scores...');
    const parties = await pool.query('SELECT id FROM parties');
    for (const party of parties.rows) {
        await RankingEngine.recalculatePartyScore(party.id);
    }
    console.log(`✅ Recalculated scores for ${parties.rows.length} parties`);

    // 6. Print summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 SCORING SUMMARY');
    console.log('═'.repeat(50));

    // Top 5 presidential candidates by new score
    const top5 = await pool.query(`
        SELECT c.name, c.final_score, c.hoja_score, c.plan_score, c.vote_count, c.integrity_score,
               p.abbreviation
        FROM candidates c
        JOIN parties p ON c.party_id = p.id
        WHERE c.position = 'president' AND c.is_active = true
        ORDER BY c.final_score DESC
        LIMIT 10
    `);

    console.log('\n🏅 TOP 10 PRESIDENTIAL CANDIDATES (new formula):');
    console.log('─'.repeat(90));
    console.log('  #  | Candidato                        | Partido | Final | HV   | Plan | Exp  | Int');
    console.log('─'.repeat(90));
    top5.rows.forEach((c, i) => {
        const name = c.name.substring(0, 32).padEnd(32);
        const party = (c.abbreviation || '').substring(0, 7).padEnd(7);
        console.log(
            `  ${String(i + 1).padStart(2)} | ${name} | ${party} | ${String(c.final_score).padStart(5)} | ${String(c.hoja_score).padStart(4)} | ${String(c.plan_score).padStart(4)} | ${String(c.experience_score || 0).padStart(4)} | ${String(c.integrity_score).padStart(3)}`
        );
    });
    console.log('─'.repeat(90));

    // Score distribution
    const dist = await pool.query(`
        SELECT 
            COUNT(*) FILTER (WHERE final_score = 0) as score_0,
            COUNT(*) FILTER (WHERE final_score > 0 AND final_score <= 25) as score_1_25,
            COUNT(*) FILTER (WHERE final_score > 25 AND final_score <= 50) as score_26_50,
            COUNT(*) FILTER (WHERE final_score > 50 AND final_score <= 75) as score_51_75,
            COUNT(*) FILTER (WHERE final_score > 75) as score_76_100,
            ROUND(AVG(hoja_score)::numeric, 2) as avg_hv,
            ROUND(AVG(plan_score)::numeric, 2) as avg_plan,
            ROUND(AVG(final_score)::numeric, 2) as avg_final
        FROM candidates WHERE is_active = true
    `);
    const d = dist.rows[0];
    console.log(`\n📈 Score Distribution:`);
    console.log(`   Score = 0:     ${d.score_0} candidates`);
    console.log(`   Score 1-25:    ${d.score_1_25} candidates`);
    console.log(`   Score 26-50:   ${d.score_26_50} candidates`);
    console.log(`   Score 51-75:   ${d.score_51_75} candidates`);
    console.log(`   Score 76-100:  ${d.score_76_100} candidates`);
    console.log(`\n📊 Averages: HV=${d.avg_hv} | Plan=${d.avg_plan} | Final=${d.avg_final}`);

    console.log('\n🎉 Initial scoring complete!');
}

runInitialScoring()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Scoring failed:', err);
        process.exit(1);
    });
