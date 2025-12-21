#!/bin/bash
# Fix require/exports/module polyfill in all dashboard HTML files

# List of files to fix
files=(
    "public/beta-combined-dashboard-modular.html"
    "public/modular-dashboard-beta.html"
    "public/test-simple.html"
    "public/bienvenue/index.html"
    "public/dashboard-rgl-example.html"
    "public/diagnose-dashboard.html"
    "public/financial-dashboard.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file with require() polyfill..."

        # Check if file already has the old polyfill
        if grep -q "Fix for \"exports is not defined\"" "$file"; then
            # Use sed to replace the entire polyfill block
            sed -i '/<\!-- Fix for "exports is not defined"/,/<\/script>/c\
    <\!-- Fix for "exports is not defined" error when Babel transpiles modules -->\
    <script>\
        \/\/ Polyfill for CommonJS to prevent Babel and library errors\
        \/\/ MUST run before any Babel transpilation or libraries\
        (function() {\
            if (typeof window.exports === '\''undefined'\'') {\
                window.exports = {};\
            }\
            if (typeof window.module === '\''undefined'\'') {\
                window.module = { exports: window.exports };\
            }\
\
            \/\/ 🔥 FIX: Add require() polyfill for react-grid-layout\
            if (typeof window.require === '\''undefined'\'') {\
                window.require = function(moduleName) {\
                    \/\/ Return window globals for known modules\
                    const modules = {\
                        '\''react'\'': window.React,\
                        '\''react-dom'\'': window.ReactDOM,\
                        '\''prop-types'\'': window.PropTypes || {}\
                    };\
                    return modules[moduleName] || {};\
                };\
            }\
\
            \/\/ Also make available in global scope for Babel\
            self.exports = window.exports;\
            self.module = window.module;\
            self.require = window.require;\
        })();\
    <\/script>' "$file"

            echo "✅ Updated $file"
        else
            echo "⚠️  No polyfill found in $file - skipping"
        fi
    else
        echo "⚠️  File not found: $file"
    fi
done

echo ""
echo "✅ All files updated with require() polyfill!"
