const pool = require('./config/db');
(async () => {
  try {
    const cols = await pool.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_name='services'");
    console.log('cols', cols.rows);
    const sample = await pool.query('SELECT * FROM services LIMIT 3');
    console.log('sample', sample.rows);
  } catch (e) {
    console.error('err', e);
  } finally {
    process.exit(0);
  }
})();