#!/bin/bash

# Open PR creation page directly
PR_URL="https://github.com/projetsjsl/GOB/compare/main...claude/validate-vercel-deployment-BGrrA?expand=1&title=%F0%9F%9A%80%20Production%20Ready%3A%20React%20Grid%20Layout%20Fix%20%2B%20Critical%20Bug%20Fixes"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Opening Pull Request Creation Page"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URL: $PR_URL"
echo ""
echo "Copy this PR description (already in clipboard if using xclip):"
echo ""
cat PR_DESCRIPTION.md
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try to copy to clipboard
if command -v xclip &> /dev/null; then
    cat PR_DESCRIPTION.md | xclip -selection clipboard
    echo "✅ PR description copied to clipboard!"
fi

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "$PR_URL" 2>/dev/null &
    echo "✅ Opening browser..."
elif command -v open &> /dev/null; then
    open "$PR_URL" 2>/dev/null &
    echo "✅ Opening browser..."
else
    echo "⚠️  Please open this URL manually:"
    echo "$PR_URL"
fi

echo ""
echo "Next steps:"
echo "1. Paste PR description (Ctrl+V if copied to clipboard)"
echo "2. Review changes"
echo "3. Click 'Create Pull Request'"
echo "4. Merge when ready"
echo "5. Run post-deployment validation"
echo ""
