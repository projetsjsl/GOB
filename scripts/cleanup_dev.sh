#!/bin/bash

echo "🧹 Cleaning up development processes..."

# Kill Google Chrome / Chromium processes
echo "Killing Chrome processes..."
pkill -f "Google Chrome" || echo "No Chrome processes found."
pkill -f "Chromium" || echo "No Chromium processes found."
pkill -f "chrome_crashpad_handler" || echo "No crashpad handlers found."

# Kill Playwright
echo "Killing Playwright..."
pkill -f "playwright" || echo "No Playwright processes found."

# Kill Python HTTP servers
echo "Killing Python HTTP servers..."
pkill -f "http.server" || echo "No Python servers found."

# Kill Node processes (be careful not to kill the IDE helper if possible, but strict cleanup might require it)
# We will target common dev server ports or names if possible, but pkill -f node is risky in this environment.
# Instead, let's look for known script names or just warn.
echo "⚠️  Note: Node.js processes were not automatically killed to avoid stopping your IDE extensions."
echo "If you need to kill specific Node servers, use: ps aux | grep node"

echo "✅ Cleanup complete!"
