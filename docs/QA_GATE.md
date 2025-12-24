# QA Gate Workflow

This document describes the QA practices for the GOB Dashboard project.

## Quick Commands

```bash
# Run full QA check (lint + typecheck)
npm run qa

# Run linting only
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run TypeScript type checking
npm run typecheck
```

## CI Integration

Add to your CI/CD pipeline (GitHub Actions, Vercel):

```yaml
# .github/workflows/qa.yml
name: QA Check
on: [push, pull_request]
jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run qa
```

## ESLint Rules

The `.eslintrc.cjs` configuration includes:

| Rule | Level | Purpose |
|------|-------|---------|
| `no-undef` | error | **Catch undefined variables** (prevented crash in api/news.js) |
| `no-console` | warn | Reduce debug logs in production |
| `no-unused-vars` | warn | Identify dead code |
| `eqeqeq` | warn | Prefer `===` over `==` |
| `no-eval` | error | Security: prevent eval() usage |

## Verified Bug Prevention

These bugs were found and would be caught by the QA gate:

### 1. Undefined Variables (Critical)

**File**: `api/news.js` line 476

```javascript
// ❌ BEFORE: Would crash at runtime
const regex = new RegExp(`\\b(${queryLower}|${tickerBase})\\b`, 'i');

// ✅ AFTER: Variables properly declared
const queryLower = query.toLowerCase();
const tickerBase = query.replace(/\.(TO|TSX|V|CN|NEO)$/i, '');
```

ESLint would catch this with `no-undef: error`.

### 2. Division by Zero

ESLint won't catch this, but TypeScript strict mode with `strictNullChecks` would flag potential issues.

## Memory Leak Prevention

For TradingView widgets, always include cleanup:

```typescript
// ✅ Correct pattern
useEffect(() => {
  // Setup widget
  const container = containerRef.current;
  const script = document.createElement('script');
  container.appendChild(script);
  
  // CLEANUP: Required to prevent memory leaks
  return () => {
    container.innerHTML = '';
  };
}, [dependencies]);
```

## Console Log Budget

Current count: ~114 `console.log` statements

Target for production:

- `console.log`: 0 (use logger.debug() instead)
- `console.warn`: ✓ allowed
- `console.error`: ✓ allowed

Use the logger utility at `lib/logger.js`:

```javascript
import { logger } from '../lib/logger.js';

// ✅ These work in production
logger.info('Operation completed');
logger.warn('Fallback activated');
logger.error('API failed', error);

// ⚠️ These only appear in development
logger.debug('Verbose debug info');
```

## Recommended Workflow

1. **Before commit**: Run `npm run qa`
2. **Before merge**: Ensure CI passes
3. **After deployment**: Monitor Vercel logs for errors

## Files to Watch

High-risk files that should be reviewed carefully:

| File | Risk | Reason |
|------|------|--------|
| `api/emma-agent.js` | High | 112 console.logs, complex AI logic |
| `api/chat.js` | Medium | 42 console.logs |
| `AskEmmaTab.tsx` | Medium | innerHTML usage (sanitized) |
| TradingView tabs | Medium | Memory leak potential |
