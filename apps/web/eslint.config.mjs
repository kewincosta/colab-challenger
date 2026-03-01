import love from 'eslint-config-love';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  // ── Base config: eslint-config-love (strict TS rules) ─────────────
  {
    ...love,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...love.languageOptions,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ...love.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      ...love.plugins,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...love.rules,
      ...reactHooks.configs.recommended.rules,

      // ── React Refresh ───────────────────────────────────────────
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── Relaxed for React patterns ──────────────────────────────
      'import/no-default-export': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',

      // JSX components return ReactNode — explicit return types are noisy
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow spreading props — common in UI component wrappers
      '@typescript-eslint/no-misused-spread': 'off',

      // Regex 'v' flag not yet widely supported in all browsers
      'require-unicode-regexp': 'off',

      // Allow new Promise for delay patterns (common in React UX)
      'promise/avoid-new': 'off',

      // Void return in promise executors is fine for setTimeout wrappers
      '@typescript-eslint/strict-void-return': 'off',
      'no-promise-executor-return': 'off',

      // Zod superRefine validators naturally exceed default complexity (10)
      complexity: ['warn', 15],

      // Warn-level rules ─────────────────────────────────────────
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

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

  // ── Prettier must be last to override formatting rules ────────────
  {
    files: ['src/**/*.{ts,tsx}'],
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
