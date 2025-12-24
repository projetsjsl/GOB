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
    // CRITICAL: Catch undefined variables before runtime
    'no-undef': 'error',
    
    // Prevent accidental console.log in production
    // Set to 'warn' during development, 'error' before release
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    
    // Catch unused variables (often indicates incomplete refactoring)
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Prevent common errors
    'no-unreachable': 'error',
    'no-constant-condition': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-func-assign': 'error',
    'no-irregular-whitespace': 'warn',
    
    // Best practices
    'eqeqeq': ['warn', 'smart'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'warn',
    
    // TypeScript specific (disabled for JS files)
    '@typescript-eslint/no-unused-vars': 'off', // Use regular no-unused-vars
  },
  overrides: [
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off', // TypeScript handles this
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }],
      },
    },
    // API files (allow console for server-side logging)
    {
      files: ['api/**/*.js'],
      rules: {
        'no-console': 'off', // Server-side logging is OK
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/*.spec.js', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off',
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
    
    // React globals (when not using imports)
    React: 'readonly',
    
    // Chart libraries (loaded via CDN)
    Chart: 'readonly',
    Recharts: 'readonly',
    LightweightCharts: 'readonly',
    
    // Custom globals from the dashboard
    BetaCombinedDashboard: 'readonly',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.vercel/',
    '*.min.js',
    'public/js/vendor/',
  ],
};
