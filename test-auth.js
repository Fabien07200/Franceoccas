require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT password_hash FROM users WHERE email = $1', ['fabien.mourgues07200@gmail.com']).then(async r => {
  if (!r.rows[0]) { console.log('Utilisateur non trouve'); process.exit(1); }
  const valid = await bcrypt.compare('Vesseaux07200@', r.rows[0].password_hash);
  console.log('Mot de passe valide:', valid);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
