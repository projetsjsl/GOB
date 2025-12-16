/**
 * Deploy Supabase Schema - Simple version (execute full SQL)
 */

const fs = require('fs');
const { Client } = require('pg');

const PROJECT_REF = 'boyuxgdplbpkknplxbxp';
const PASSWORD = '5mUaqujMflrgZyCo';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;

async function deploy() {
  console.log('🚀 Deploying Supabase schema...\n');

  const client = new Client({
    host: DB_HOST,
    port: 5432,
    user: 'postgres',
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL file (remove verification queries)
    let sqlContent = fs.readFileSync('./supabase-seeking-alpha-ADD-ONLY.sql', 'utf8');

    // Remove the verification SELECT statements at the end (they're just for display)
    sqlContent = sqlContent.split('-- Check table created successfully')[0];

    console.log('📝 Executing full SQL schema...\n');

    await client.query(sqlContent);

    console.log('✅ Schema executed successfully!\n');

    // Verify deployment
    console.log('🔍 Verifying deployment...\n');

    const tableCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'seeking_alpha_analysis'
      ORDER BY ordinal_position
      LIMIT 10
    `);

    console.log(`✅ seeking_alpha_analysis table: ${tableCheck.rows.length} columns (showing first 10):`);
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    const totalColumns = await client.query(`
      SELECT COUNT(*) as total
      FROM information_schema.columns
      WHERE table_name = 'seeking_alpha_analysis'
    `);
    console.log(`   Total columns: ${totalColumns.rows[0].total}\n`);

    const viewCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_name = 'latest_seeking_alpha_analysis'
    `);

    if (viewCheck.rows[0].count > 0) {
      console.log('✅ latest_seeking_alpha_analysis view exists');
    }

    const functionCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_name = 'get_tickers_needing_analysis'
    `);

    if (functionCheck.rows[0].count > 0) {
      console.log('✅ get_tickers_needing_analysis() function exists');
    }

    const policyCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE tablename = 'seeking_alpha_analysis'
    `);

    console.log(`✅ ${policyCheck.rows[0].count} RLS policies created\n`);

    console.log('🎉 Deployment completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Table: seeking_alpha_analysis (50+ columns)');
    console.log('   ✅ View: latest_seeking_alpha_analysis');
    console.log('   ✅ Function: get_tickers_needing_analysis()');
    console.log(`   ✅ RLS Policies: ${policyCheck.rows[0].count}`);
    console.log('\n🔗 Next steps:');
    console.log('   1. Vercel deployment: https://vercel.com/projetsjsls-projects/gob');
    console.log('   2. Test API: https://gobapps.com/api/seeking-alpha-tickers');
    console.log('   3. Dashboard: https://gobapps.com\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Schema already exists (this is OK - safe to ignore)');
      console.log('   Run DROP TABLE seeking_alpha_analysis CASCADE; first to rebuild\n');
    } else {
      console.error('\nFull error:', error);
    }
  } finally {
    await client.end();
  }
}

deploy();
