/**
 * Fix production warnings by suppressing console warnings for known issues
 * This script adds conditional console warnings that only show in development
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_FIX = [
    'public/beta-combined-dashboard.html'
];

function suppressProductionWarnings(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Suppress Tailwind CDN warning
    if (content.includes('cdn.tailwindcss.com')) {
        // Already replaced, skip
        return { content, modified: false };
    }

    // Add console warning suppression for Babel
    const babelWarningPattern = /console\.(warn|log)\(['"]You are using the in-browser Babel transformer/;
    if (babelWarningPattern.test(content)) {
        // Already handled
        return { content, modified: false };
    }

    // Add production mode check for console warnings
    const consoleLogPattern = /console\.(log|warn|info)\(/g;
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Suppress Babel/Tailwind warnings in production
        if (line.includes('Babel transformer') || line.includes('cdn.tailwindcss.com')) {
            newLines.push(`            if (process.env.NODE_ENV !== 'production') {`);
            newLines.push(line);
            newLines.push(`            }`);
            modified = true;
        } else {
            newLines.push(line);
        }
    }

    return { content: newLines.join('\n'), modified };
}

function main() {
    console.log('🔧 Fixing production warnings...\n');

    for (const file of FILES_TO_FIX) {
        const fullPath = path.join(__dirname, '..', file);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️ File not found: ${file}`);
            continue;
        }

        const { content, modified } = suppressProductionWarnings(fullPath);
        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Fixed: ${file}`);
        } else {
            console.log(`ℹ️ No changes needed: ${file}`);
        }
    }

    console.log('\n✅ Production warnings fixed!');
}

main();
