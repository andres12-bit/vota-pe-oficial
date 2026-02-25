const pool = require('./pool');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('[Migration] Adding JNE profile columns...');
        await client.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS education TEXT`);
        await client.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience TEXT`);
        await client.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20)`);
        await client.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS dni VARCHAR(20)`);
        console.log('[Migration] Columns added.');

        console.log('[Migration] Creating candidate_vice_presidents table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_vice_presidents (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                position_label VARCHAR(100) NOT NULL,
                photo TEXT,
                biography TEXT,
                sort_order INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('[Migration] Creating candidate_plan_gobierno table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_plan_gobierno (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
                dimension VARCHAR(100) NOT NULL,
                problem TEXT,
                objective TEXT,
                goals TEXT,
                indicator TEXT,
                sort_order INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_vice_presidents_candidate ON candidate_vice_presidents(candidate_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_plan_gobierno_candidate ON candidate_plan_gobierno(candidate_id)`);

        console.log('[Migration] All done!');
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(e => { console.error(e); process.exit(1); });
