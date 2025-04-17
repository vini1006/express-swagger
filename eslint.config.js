const localRules = require('./eslint-plugin-local')
const tsEslintParser = require('@typescript-eslint/parser');


module.exports = [
    {
        files: ['./src/**/*.ts'],
        plugins: {
            local: localRules,
        },
        rules: {
            'local/response-structure-match': 'error',
        },
        languageOptions: {
            parser: tsEslintParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        }
    },
]

