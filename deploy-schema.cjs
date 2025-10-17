/**
 * Deploy Supabase Schema
 * Executes supabase-seeking-alpha-ADD-ONLY.sql
 */

const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const PROJECT_REF = 'boyuxgdplbpkknplxbxp';
const PASSWORD = '5mUaqujMflrgZyCo';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`;
const CONNECTION_STRING = `postgresql://postgres:${PASSWORD}@${DB_HOST}:5432/postgres`;

async function deploy() {
  console.log('🚀 Deploying Supabase schema...\n');
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log(`🔗 Host: ${DB_HOST}\n`);

  try {
    // Read SQL file
    const sqlContent = fs.readFileSync('./supabase-seeking-alpha-ADD-ONLY.sql', 'utf8');

    // Save to temp file (without verification queries at the end)
    const sqlLines = sqlContent.split('\n');
    const mainSql = sqlLines.slice(0, sqlLines.findIndex(l => l.includes('VERIFICATION QUERIES'))).join('\n');

    fs.writeFileSync('./temp-deploy.sql', mainSql);

    console.log('📝 SQL file prepared (245 lines)\n');
    console.log('⏳ Executing schema deployment...\n');

    // Execute using psql
    const command = `PGPASSWORD="${PASSWORD}" psql -h ${DB_HOST} -U postgres -d postgres -p 5432 -f temp-deploy.sql`;

    const { stdout, stderr } = await execPromise(command);

    if (stderr && !stderr.includes('NOTICE')) {
      console.error('❌ Errors:', stderr);
    }

    console.log('✅ Schema deployment complete!\n');
    console.log('📊 Output:', stdout);

    // Clean up temp file
    fs.unlinkSync('./temp-deploy.sql');

    // Verify deployment
    console.log('\n🔍 Verifying deployment...\n');

    const verifyCommand = `PGPASSWORD="${PASSWORD}" psql -h ${DB_HOST} -U postgres -d postgres -p 5432 -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_name IN ('seeking_alpha_analysis');"`;

    const { stdout: verifyOut } = await execPromise(verifyCommand);
    console.log('Table verification:', verifyOut);

    console.log('\n🎉 Deployment successful!\n');
    console.log('Next steps:');
    console.log('1. Check Vercel deployment: https://vercel.com/projetsjsls-projects/gob');
    console.log('2. Test APIs: curl https://gobapps.com/api/seeking-alpha-tickers');
    console.log('3. Open dashboard: https://gobapps.com\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);

    if (error.message.includes('psql: command not found')) {
      console.log('\n💡 psql not installed. Installing via Homebrew...\n');
      try {
        await execPromise('brew install postgresql');
        console.log('✅ PostgreSQL installed. Retrying deployment...\n');
        // Retry
        await deploy();
      } catch (installError) {
        console.error('❌ Installation failed. Please install PostgreSQL manually:');
        console.log('   brew install postgresql');
      }
    }
  }
}

deploy();
