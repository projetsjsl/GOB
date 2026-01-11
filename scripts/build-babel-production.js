/**
 * Build script to precompile Babel scripts for production
 * Replaces Babel Standalone in-browser compilation with pre-compiled files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const BABEL_CONFIG = {
    presets: ['@babel/preset-react', '@babel/preset-env'],
    plugins: []
};

// Files to precompile
const FILES_TO_COMPILE = [
    {
        input: 'public/js/dashboard/app-inline.js',
        output: 'public/js/dashboard/app-inline.compiled.js',
        description: 'Main dashboard app'
    }
];

function compileWithBabel(inputPath, outputPath) {
    const fullInputPath = path.join(PROJECT_ROOT, inputPath);
    const fullOutputPath = path.join(PROJECT_ROOT, outputPath);
    
    console.log(`📦 Compiling ${inputPath}...`);
    
    try {
        // Use Babel CLI to compile
        const babelCmd = `npx babel "${fullInputPath}" --out-file "${fullOutputPath}" --presets=@babel/preset-react,@babel/preset-env --minified --compact`;
        execSync(babelCmd, { stdio: 'inherit', cwd: PROJECT_ROOT });
        
        // Get file sizes
        const inputSize = fs.statSync(fullInputPath).size;
        const outputSize = fs.statSync(fullOutputPath).size;
        const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
        
        console.log(`✅ Compiled: ${(inputSize / 1024).toFixed(1)}KB → ${(outputSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
        return true;
    } catch (error) {
        console.error(`❌ Error compiling ${inputPath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔨 Building Babel-compiled production files...\n');
    
    let successCount = 0;
    for (const file of FILES_TO_COMPILE) {
        if (compileWithBabel(file.input, file.output)) {
            successCount++;
        }
    }
    
    console.log(`\n📊 Summary: ${successCount}/${FILES_TO_COMPILE.length} files compiled successfully`);
    
    if (successCount === FILES_TO_COMPILE.length) {
        console.log('✅ All files compiled successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Update HTML files to use .compiled.js instead of .js with type="text/babel"');
        console.log('   2. Remove Babel Standalone script from HTML files');
        console.log('   3. Test the compiled files in production');
    } else {
        console.log('⚠️ Some files failed to compile');
        process.exit(1);
    }
}

main();
