import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^(event|_)', ignoreMethods: true }],
      'no-unsafe-finally': 'error',
      'no-console': 'warn',
    },
  },
];
