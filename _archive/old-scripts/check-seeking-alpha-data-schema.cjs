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
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'seeking_alpha_data'
    ORDER BY ordinal_position
  `);

  console.log('seeking_alpha_data table structure:\n');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
  });

  const sample = await client.query('SELECT id, ticker, scraped_at, scraping_method, data_quality, analyst_report->\'summary\' as summary FROM seeking_alpha_data LIMIT 2');
  console.log('\nSample data:');
  console.log(sample.rows);

  await client.end();
}

check();
