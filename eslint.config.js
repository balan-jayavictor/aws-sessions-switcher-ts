// @ts-nocheck

// Using ts-nocheck as there are type compatibility issues between ESM imports and ESLint types
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.config.js',
      '.eslintrc.js', 
      'jest.config.js'
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: (await import('@typescript-eslint/parser')).default,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
    },
    rules: {
      // Relaxed rules for development purposes
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
];
