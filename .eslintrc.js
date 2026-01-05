module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'error',
    
    // General rules
    'no-console': 'off',
    'no-unused-vars': 'off', // Use TypeScript version instead
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-useless-escape': 'error',
  },
  env: {
    node: true,
    jest: true,
    es2020: true,
  },
  ignorePatterns: [
    'lib/',
    'cdk.out/',
    'node_modules/',
    '*.js',
    '!.eslintrc.js',
    '!jest.config.js',
    '!scripts/*.js',
  ],
};