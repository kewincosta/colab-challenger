import love from 'eslint-config-love';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  // ── Base config: eslint-config-love (strict TS rules) ─────────────
  {
    ...love,
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      ...love.languageOptions,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ...love.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...love.rules,

      // ── Relaxed for NestJS patterns ─────────────────────────────
      '@typescript-eslint/no-extraneous-class': 'off',
      'import/no-default-export': 'off',
      '@typescript-eslint/no-parameter-properties': 'off',
      'n/no-process-exit': 'off',

      // Magic numbers are common in configs, ports, timeouts, HTTP codes
      '@typescript-eslint/no-magic-numbers': 'off',

      // Allow truthiness checks — idiomatic TS (if (!raw), if (!text))
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // Destructuring enforcement too aggressive for entity getter patterns
      '@typescript-eslint/prefer-destructuring': 'off',

      // Some class methods implement interface contracts without using `this`
      '@typescript-eslint/class-methods-use-this': 'off',

      // Warn-level rules ─────────────────────────────────────────
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Allow void for fire-and-forget (NestJS lifecycle hooks)
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],

      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Max line readability
      'max-len': [
        'warn',
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
    },
  },

  // ── Test-specific overrides (relaxed for mocks, assertions, test patterns) ─
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/strict-void-return': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
      complexity: 'off',
    },
  },

  // ── Prettier must be last to override formatting rules ────────────
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    ...prettier,
    plugins: {
      ...prettier.plugins,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettier.rules,
      'prettier/prettier': 'error',
    },
  },
];
