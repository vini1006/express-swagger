import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import { validateResponse } from './src/rules/validate-response';

export default defineConfig([
	{
		files: ['**/*.ts'],
		ignores: ['**/node_modules/', '.git/'],
		languageOptions: {
			parser: tsParser,
		},
		plugins: {
			local: {
				rules: {
					'validate-response': validateResponse,
				},
			},
		},
		rules: {
			'local/validate-response': 'error',
		},
	},
]);
