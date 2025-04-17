import { validateResponse } from '@/rules/validate-response';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.ts'],
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
