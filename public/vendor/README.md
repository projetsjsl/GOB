# Vendor Libraries

This directory contains vendorized versions of critical frontend libraries to eliminate dependency on external CDNs.

## Libraries Included

### React 18.2.0
- **File**: `react.production.min.js`
- **Source**: https://unpkg.com/react@18.2.0/umd/react.production.min.js
- **License**: MIT
- **Purpose**: React core library for UI components

### ReactDOM 18.2.0
- **File**: `react-dom.production.min.js`
- **Source**: https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js
- **License**: MIT
- **Purpose**: React DOM renderer

### Babel Standalone 7.23.6
- **File**: `babel.min.js`
- **Source**: https://unpkg.com/@babel/standalone@7.23.6/babel.min.js
- **License**: MIT
- **Purpose**: In-browser JSX transpilation

## Manual Download Instructions

If files are missing or need updating, download manually:

```bash
# React
curl -L -o public/vendor/react.production.min.js \
  https://unpkg.com/react@18.2.0/umd/react.production.min.js

# ReactDOM
curl -L -o public/vendor/react-dom.production.min.js \
  https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js

# Babel
curl -L -o public/vendor/babel.min.js \
  https://unpkg.com/@babel/standalone@7.23.6/babel.min.js
```

## Fallback Strategy

The dashboard HTML includes automatic fallback to CDN if local files fail to load.

## Why Vendorized?

- **Reliability**: No dependency on external CDN availability
- **Performance**: Faster load times (no DNS lookup, same origin)
- **Security**: Integrity verification via file hashing
- **Offline**: Works without internet connection (localhost development)
