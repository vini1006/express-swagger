import tsParser from '@typescript-eslint/parser';
import type { TSESLint } from '@typescript-eslint/utils';
import { rule } from './src/rules/validate-response';

export const getTsLintConfigOption = (
	root: string,
): TSESLint.FlatConfig.Config => {
	return {
		files: ['**/*.ts'],
		ignores: ['**/node_modules/', '.git/', 'eslint-rules/'],
		languageOptions: {
			parserOptions: {
				emitDecoratorMetadata: true,
				experimentalDecorators: true,
				projectService: true,
				tsconfigRootDir: root,
			},
			parser: tsParser,
		},
		plugins: {
			local: {
				rules: {
					'validate-response': rule,
				},
			},
		},
		rules: {
			'local/validate-response': 'error',
		},
	};
};
