module.exports = {
  root: true,
  env: {
    browser: false,
    es2020: true,
    mocha: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['.eslintrc.js', 'tsconfig.json'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'standard',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: ['./Backend/tsconfig.json'],
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    camelcase: 'off',
  },
}
