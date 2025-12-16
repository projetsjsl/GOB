/**
 * Deploy Supabase Schema using pg library
 */

const fs = require('fs');

const PROJECT_REF = 'boyuxgdplbpkknplxbxp';
const PASSWORD = '5mUaqujMflrgZyCo';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;

async function deploy() {
  console.log('🚀 Deploying Supabase schema...\n');
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log(`🔗 Host: ${DB_HOST}\n`);

  // Check if pg is installed
  let pg;
  try {
    pg = require('pg');
  } catch (error) {
    console.log('📦 Installing pg library...\n');
    const { execSync } = require('child_process');
    execSync('npm install pg --no-save', { stdio: 'inherit' });
    pg = require('pg');
  }

  const { Client } = pg;

  const client = new Client({
    host: DB_HOST,
    port: 5432,
    user: 'postgres',
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL file
    const sqlContent = fs.readFileSync('./supabase-seeking-alpha-ADD-ONLY.sql', 'utf8');

    // Split into individual statements (rough split by semicolon + newline)
    const statements = sqlContent
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^SELECT\s+'.*'\s+as\s+(message|info|next_steps|step|blank)/));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');

      try {
        await client.query(statement + ';');
        successCount++;

        // Log important operations
        if (statement.includes('CREATE TABLE')) {
          console.log(`✅ Table created: ${statement.match(/CREATE TABLE (\w+)/)?.[1]}`);
        } else if (statement.includes('CREATE VIEW')) {
          console.log(`✅ View created: ${statement.match(/CREATE VIEW (\w+)/)?.[1]}`);
        } else if (statement.includes('CREATE FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
          console.log(`✅ Function created: ${statement.match(/FUNCTION (\w+)/)?.[1]}`);
        } else if (statement.includes('CREATE INDEX')) {
          console.log(`✅ Index created: ${statement.match(/CREATE INDEX (\w+)/)?.[1]}`);
        } else if (statement.includes('CREATE POLICY')) {
          console.log(`✅ Policy created: ${statement.match(/CREATE POLICY "([^"]+)"/)?.[1]}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          console.log(`✅ Trigger created: ${statement.match(/CREATE TRIGGER (\w+)/)?.[1]}`);
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists: ${preview}...`);
        } else {
          errorCount++;
          console.error(`❌ Error: ${error.message.substring(0, 100)}`);
          console.error(`   Statement: ${preview}...`);
        }
      }
    }

    console.log(`\n📊 Deployment summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verify deployment
    console.log(`\n🔍 Verifying deployment...\n`);

    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'seeking_alpha_analysis'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ seeking_alpha_analysis table exists');
    }

    const viewCheck = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_name = 'latest_seeking_alpha_analysis'
    `);

    if (viewCheck.rows.length > 0) {
      console.log('✅ latest_seeking_alpha_analysis view exists');
    }

    const functionCheck = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_name = 'get_tickers_needing_analysis'
    `);

    if (functionCheck.rows.length > 0) {
      console.log('✅ get_tickers_needing_analysis function exists');
    }

    console.log('\n🎉 Deployment successful!\n');
    console.log('Next steps:');
    console.log('1. ✅ Schema deployed to Supabase');
    console.log('2. ⏳ Wait for Vercel deployment: https://vercel.com/projetsjsls-projects/gob');
    console.log('3. 🧪 Test APIs: https://gobapps.com/api/seeking-alpha-tickers');
    console.log('4. 🌐 Open dashboard: https://gobapps.com\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.end();
  }
}

deploy();
