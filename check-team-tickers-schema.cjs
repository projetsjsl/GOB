const { Client } = require('pg');

const client = new Client({
  host: 'db.boyuxgdplbpkknplxbxp.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '5mUaqujMflrgZyCo',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();

  const result = await client.query(`
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'team_tickers'
    ORDER BY ordinal_position
  `);

  console.log('team_tickers table structure:\n');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
  });

  const sample = await client.query('SELECT * FROM team_tickers LIMIT 3');
  console.log('\nSample data:');
  console.log(sample.rows);

  await client.end();
}

check();
