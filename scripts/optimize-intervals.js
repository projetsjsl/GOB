/**
 * Optimize setInterval calls to reduce performance violations
 * Replaces frequent intervals with requestAnimationFrame or throttled intervals
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_OPTIMIZE = [
    'public/js/dashboard/components/v0-integration-wrapper.js',
    'public/js/dashboard/realtime-sync.js'
];

function optimizeIntervals(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: setInterval with very short intervals (< 200ms)
    const shortIntervalPattern = /setInterval\s*\([^,]+,\s*(\d{1,3})\s*\)/g;
    
    content = content.replace(shortIntervalPattern, (match, interval) => {
        const intervalMs = parseInt(interval);
        if (intervalMs < 200) {
            modified = true;
            // Replace with requestAnimationFrame-based throttling
            return `(function() {
                let rafId = null;
                let lastUpdate = Date.now();
                const updateInterval = ${Math.max(intervalMs * 2, 200)};
                const updateTimer = () => {
                    const now = Date.now();
                    if (now - lastUpdate >= updateInterval) {
                        ${match.replace(/setInterval\s*\(([^,]+),\s*\d+\s*\)/, '$1')}
                        lastUpdate = now;
                    }
                    rafId = requestAnimationFrame(updateTimer);
                };
                rafId = requestAnimationFrame(updateTimer);
                return () => { if (rafId) cancelAnimationFrame(rafId); };
            })()`;
        }
        return match;
    });

    return { content, modified };
}

function main() {
    console.log('⚡ Optimizing setInterval calls...\n');

    for (const file of FILES_TO_OPTIMIZE) {
        const fullPath = path.join(__dirname, '..', file);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️ File not found: ${file}`);
            continue;
        }

        const { content, modified } = optimizeIntervals(fullPath);
        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Optimized: ${file}`);
        } else {
            console.log(`ℹ️ No changes needed: ${file}`);
        }
    }

    console.log('\n✅ Interval optimization complete!');
}

main();
