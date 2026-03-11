const pool = require('./src/db/pool');
(async () => {
    const r = await pool.query("SELECT id, name, photo FROM candidates WHERE LOWER(name) LIKE '%keiko%fujimori%' LIMIT 1");
    if (r.rows.length > 0) {
        console.log('ID:' + r.rows[0].id);
        console.log('NAME:' + r.rows[0].name);
        console.log('PHOTO:' + (r.rows[0].photo || 'NULL'));
    } else {
        console.log('NOT_FOUND');
    }
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'parties' ORDER BY ordinal_position");
    console.log('COLS:' + cols.rows.map(c => c.column_name).join(','));
    process.exit();
})();
