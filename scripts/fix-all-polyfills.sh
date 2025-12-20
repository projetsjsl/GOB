#!/bin/bash
# Fix exports polyfill in all dashboard HTML files

POLYFILL='    <script>
        // Polyfill for CommonJS exports to prevent Babel errors
        // MUST run before any Babel transpilation
        (function() {
            if (typeof window.exports === '\''undefined'\'') {
                window.exports = {};
            }
            if (typeof window.module === '\''undefined'\'') {
                window.module = { exports: window.exports };
            }
            // Also make available in global scope for Babel
            self.exports = window.exports;
            self.module = window.module;
        })();
    </script>'

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
        echo "Fixing $file..."

        # Find the line with the polyfill comment
        if grep -q "Fix for \"exports is not defined\"" "$file"; then
            # Remove old polyfill (from comment to closing </script>)
            sed -i '/Fix for "exports is not defined"/,/<\/script>/d' "$file"
        fi

        # Find the line with @babel/standalone and add polyfill after it
        babel_line=$(grep -n "@babel/standalone" "$file" | cut -d: -f1)
        if [ -n "$babel_line" ]; then
            # Insert blank line and polyfill after babel line
            sed -i "${babel_line}a\\
\\
    <!-- Fix for \"exports is not defined\" error when Babel transpiles modules -->\\
    <script>\\
        // Polyfill for CommonJS exports to prevent Babel errors\\
        // MUST run before any Babel transpilation\\
        (function() {\\
            if (typeof window.exports === 'undefined') {\\
                window.exports = {};\\
            }\\
            if (typeof window.module === 'undefined') {\\
                window.module = { exports: window.exports };\\
            }\\
            // Also make available in global scope for Babel\\
            self.exports = window.exports;\\
            self.module = window.module;\\
        })();\\
    </script>" "$file"

            echo "✅ Fixed $file"
        else
            echo "⚠️  No Babel found in $file"
        fi
    fi
done

echo ""
echo "✅ All files fixed!"
