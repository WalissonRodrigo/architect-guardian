import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/dist-server/**',
      '*.vsix',
      'package-lock.json',
      '.vscode/**',
      '.antigravity/**',
      '.architect-guardian/**',
      '.github/**',
      'docs/**',
      'scripts/**',
      'demo-project/**',
      'test-fixtures/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        node: true,
        process: true,
        console: true,
        Buffer: true,
        setTimeout: true,
        clearTimeout: true,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
