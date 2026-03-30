const pool = require('./config/db');
(async () => {
  try {
    const r = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('users','services','bookings','reviews')");
    console.log('tables:', r.rows);
    const c = await pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users'");
    console.log('users table count', c.rows[0]);
  } catch (e) {
    console.error('DB error:', e.message || e);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();