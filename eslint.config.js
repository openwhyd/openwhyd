const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const async = require('eslint-config-async');

module.exports = tseslint.config(
  {
    // Note: you can add files and globs to this list and to .prettierignore
    ignores: [
      '.*.js', // dot files, ignored by default with eslintrc
      'public/**/*-min.js',
      'public/**/*.min.js',
      'public/**/*jquery*.js',
      'public/js/dropzone.js',
      'public/js/md5.js',
      'public/js/mustache.js',
      'public/js/playem-all.js',
      'public/js/soundmanager2*.js',
      'public/press/js/sliderz.v1.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        ecmaVersion: 2019,
      },
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.jest,
        ...globals.node,
        ...globals.es6,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-deprecated': 'warn',
      // rules that became stricter or were added in ESLint 9 / typescript-eslint 8: keep legacy behavior
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    // Tolerate (as warnings) non critical issues on legacy JavaScript files, by default
    files: ['**/*.js'],
    rules: {
      'prefer-const': 'warn',
      'no-inner-declarations': ['warn', 'functions'],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    // Tolerate (as warnings) additional non critical issues on legacy front-end code and non-production code
    files: [
      'config/**/*.js',
      'misc/**/*.js',
      'public/**/*.js',
      'scripts/**/*.js',
      'test/**/*.js',
    ],
    rules: {
      'no-undef': 'warn',
      'no-redeclare': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
    },
  },
  {
    // Enforce stricter rules on domain / business logic
    files: ['app/domain/**/*.js', 'app/domain/**/*.ts'],
    extends: [...async.base, ...async.node, ...async.typescript],
    rules: {
      'prefer-const': 'error',
      'no-return-await': 'error',
    },
  },
);
