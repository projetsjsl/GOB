const { Client } = require('pg');

const client = new Client({
  host: 'db.boyuxgdplbpkknplxbxp.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '5mUaqujMflrgZyCo',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function addColumn() {
  await client.connect();

  console.log('Adding raw_text and url columns to seeking_alpha_data...\n');

  try {
    // Check if columns exist first
    const check = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'seeking_alpha_data' AND column_name IN ('raw_text', 'url', 'raw_html', 'status', 'error_message')
    `);

    const existingColumns = check.rows.map(r => r.column_name);

    if (!existingColumns.includes('raw_text')) {
      await client.query('ALTER TABLE seeking_alpha_data ADD COLUMN raw_text TEXT');
      console.log('✅ Added raw_text column');
    } else {
      console.log('⚠️  raw_text column already exists');
    }

    if (!existingColumns.includes('url')) {
      await client.query('ALTER TABLE seeking_alpha_data ADD COLUMN url TEXT');
      console.log('✅ Added url column');
    } else {
      console.log('⚠️  url column already exists');
    }

    if (!existingColumns.includes('raw_html')) {
      await client.query('ALTER TABLE seeking_alpha_data ADD COLUMN raw_html TEXT');
      console.log('✅ Added raw_html column');
    } else {
      console.log('⚠️  raw_html column already exists');
    }

    if (!existingColumns.includes('status')) {
      await client.query('ALTER TABLE seeking_alpha_data ADD COLUMN status TEXT DEFAULT \'success\'');
      console.log('✅ Added status column');
    } else {
      console.log('⚠️  status column already exists');
    }

    if (!existingColumns.includes('error_message')) {
      await client.query('ALTER TABLE seeking_alpha_data ADD COLUMN error_message TEXT');
      console.log('✅ Added error_message column');
    } else {
      console.log('⚠️  error_message column already exists');
    }

    console.log('\n✅ Schema updated successfully!');

    // Verify
    const verify = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'seeking_alpha_data'
      ORDER BY ordinal_position
    `);

    console.log('\nUpdated table structure:');
    verify.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addColumn();
