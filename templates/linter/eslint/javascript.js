import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
]
