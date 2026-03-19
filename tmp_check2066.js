const { Pool } = require('pg');
const p = new Pool();
p.query('SELECT id, name, hoja_vida, education_score, work_experience_score, political_experience_score, financial_score, judicial_score FROM candidates WHERE id = 2066')
  .then(r => {
    const c = r.rows[0];
    console.log('Name:', c.name);
    console.log('education_score:', c.education_score);
    console.log('work_experience_score:', c.work_experience_score);
    console.log('political_experience_score:', c.political_experience_score);
    console.log('financial_score:', c.financial_score);
    console.log('judicial_score:', c.judicial_score);
    if (c.hoja_vida) {
      console.log('HV keys:', Object.keys(c.hoja_vida));
      const hv = c.hoja_vida;
      console.log('Education:', JSON.stringify(hv.education).substring(0, 200));
      console.log('Work:', JSON.stringify(hv.work_experience).substring(0, 200));
    } else {
      console.log('NO HOJA DE VIDA DATA');
    }
    p.end();
  })
  .catch(e => { console.error(e); p.end(); });
