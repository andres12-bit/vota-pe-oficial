const pool = require('./src/db/pool');
pool.query("SELECT name, final_score FROM candidates WHERE name ILIKE '%Fujimori%'").then(r => {
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
