/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL ERRORS (Will break at runtime)
    // ═══════════════════════════════════════════════════════════════════
    'no-undef': 'error',            // Undefined variables crash
    'no-dupe-keys': 'error',        // Duplicate keys cause bugs
    'no-duplicate-case': 'error',   // Duplicate switch cases
    'no-func-assign': 'error',      // Reassigning functions
    'no-unreachable': 'error',      // Dead code after return
    'no-constant-condition': 'error', // if(true) is suspicious
    'no-eval': 'error',             // Security risk
    'no-implied-eval': 'error',     // Security risk
    'no-new-func': 'error',         // Security (unless eslint-disabled)
    
    // ═══════════════════════════════════════════════════════════════════
    // TURNED OFF (acceptable in production codebase)
    // ═══════════════════════════════════════════════════════════════════
    'no-console': 'off',            // Console OK in development
    'no-unused-vars': 'off',        // Let TypeScript handle this
    'no-empty': 'off',              // Empty catch blocks are often intentional
    'no-extra-semi': 'off',         // Cosmetic
    'no-irregular-whitespace': 'off', // Cosmetic
    'eqeqeq': 'off',                // == vs === is style preference
    'no-return-await': 'off',       // Slightly redundant but not harmful
    'no-case-declarations': 'off',  // const in switch cases works fine
    'no-useless-escape': 'off',     // Extra escapes don't break anything
    'no-inner-declarations': 'off', // Valid in ES6+
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': 'off', // Noise reduction
  },
  overrides: [
    // TypeScript files - let tsc handle type checking
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off', // TypeScript handles this
      },
    },
  ],
  globals: {
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    fetch: 'readonly',
    URLSearchParams: 'readonly',
    AbortController: 'readonly',
    FormData: 'readonly',
    Blob: 'readonly',
    File: 'readonly',
    FileReader: 'readonly',
    URL: 'readonly',
    Headers: 'readonly',
    Request: 'readonly',
    Response: 'readonly',
    
    // React globals
    React: 'readonly',
    JSX: 'readonly',
    
    // Node.js globals for API files
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    module: 'readonly',
    require: 'readonly',
    exports: 'readonly',
    
    // Chart libraries (loaded via CDN)
    Chart: 'readonly',
    Recharts: 'readonly',
    LightweightCharts: 'readonly',
    
    // Dashboard globals
    BetaCombinedDashboard: 'readonly',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.vercel/',
    '*.min.js',
    'public/js/vendor/',
    'public/3p1/node_modules/',
  ],
};
