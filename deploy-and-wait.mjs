/**
 * 🚀 DEPLOY AND WAIT
 * Push to GitHub, wait for Vercel deployment, then re-test
 */

import { execSync } from 'child_process';
import fs from 'fs';

const GIT_REPO = process.cwd();
const WAIT_TIME = 120000; // 120 secondes

console.log('🚀 DEPLOY AND WAIT SCRIPT');
console.log('='.repeat(60));

// Step 1: Check git status
console.log('\n📋 Step 1: Checking git status...');
try {
    const status = execSync('git status --porcelain', { cwd: GIT_REPO, encoding: 'utf-8' });
    if (status.trim()) {
        console.log('⚠️ Uncommitted changes detected:');
        console.log(status);
        console.log('\n❓ Do you want to commit these changes? (This script will add and commit all changes)');
    } else {
        console.log('✅ Working tree clean');
    }
} catch (error) {
    console.error('❌ Error checking git status:', error.message);
    process.exit(1);
}

// Step 2: Add all changes
console.log('\n📦 Step 2: Adding all changes...');
try {
    execSync('git add -A', { cwd: GIT_REPO, stdio: 'inherit' });
    console.log('✅ Changes staged');
} catch (error) {
    console.error('❌ Error staging changes:', error.message);
    process.exit(1);
}

// Step 3: Commit
console.log('\n💾 Step 3: Committing changes...');
const commitMessage = `fix: Marathon audit fixes - ${new Date().toISOString().split('T')[0]}`;
try {
    execSync(`git commit -m "${commitMessage}"`, { cwd: GIT_REPO, stdio: 'inherit' });
    console.log('✅ Changes committed');
} catch (error) {
    if (error.message.includes('nothing to commit')) {
        console.log('ℹ️ Nothing to commit');
    } else {
        console.error('❌ Error committing:', error.message);
        process.exit(1);
    }
}

// Step 4: Push to origin
console.log('\n📤 Step 4: Pushing to origin...');
try {
    execSync('git push origin HEAD', { cwd: GIT_REPO, stdio: 'inherit' });
    console.log('✅ Pushed to origin');
} catch (error) {
    console.error('❌ Error pushing:', error.message);
    process.exit(1);
}

// Step 5: Wait for deployment
console.log(`\n⏳ Step 5: Waiting ${WAIT_TIME / 1000} seconds for Vercel deployment...`);
console.log('   (Vercel typically deploys in 1-2 minutes after push)');

const startTime = Date.now();
const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.floor((WAIT_TIME - (Date.now() - startTime)) / 1000);
    if (remaining > 0) {
        process.stdout.write(`\r   ⏳ ${elapsed}s elapsed, ${remaining}s remaining...`);
    }
}, 1000);

await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
clearInterval(interval);
console.log('\n✅ Wait complete');

// Step 6: Save deployment info
const deploymentInfo = {
    timestamp: new Date().toISOString(),
    commitMessage,
    waitTime: WAIT_TIME,
    nextStep: 'Re-run audit to verify fixes'
};

const infoPath = `${GIT_REPO}/deployment-info.json`;
fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
console.log(`\n💾 Deployment info saved: ${infoPath}`);

console.log('\n✅ DEPLOYMENT COMPLETE');
console.log('📋 Next steps:');
console.log('   1. Re-run marathon audit to verify fixes');
console.log('   2. Review any remaining bugs');
console.log('   3. Apply final fixes if needed');
console.log('   4. Deploy again if necessary');
