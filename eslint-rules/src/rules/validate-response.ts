import type {
	LanguageOptions,
	RuleContext,
	RuleDefinition,
	SourceCode,
} from '@eslint/core';
import type { TSESTree } from '@typescript-eslint/utils';

type ResponseInfo = {
	status: number;
	type: string;
	decorator: TSESTree.Decorator;
};

type Context = RuleContext<{
	LangOptions: LanguageOptions;
	Code: SourceCode<{
		LangOptions: LanguageOptions;
		RootNode: unknown;
		SyntaxElementWithLoc: unknown;
		ConfigNode: unknown;
	}>;
	RuleOptions: unknown[];
	Node: unknown;
	MessageIds: string;
}>;

export const validateResponse: RuleDefinition = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensures that @Response decorators and return types match',
			recommended: false,
		},
		messages: {
			duplicateStatus: 'Duplicate @Response for status {{status}}.',
			invalidReturnStatus:
				'Returned status {{status}} is not defined in @Response.',
			invalidReturnRes:
				'Return res does not match expected type for status {{status}}.',
			emptyReturn:
				'Return statement is empty, but @Response decorators are defined.',
		},
		language: 'typescript',
	},
	create(context) {
		return {
			MethodDefinition(node: TSESTree.MethodDefinition) {
				const responses = extractResponseDecorators(node);
				reportDuplicateStatuses(context, responses);
				validateReturnStatements(context, node, responses);
				validateResTypes(context, node, responses);
			},
		};
	},
};

function extractResponseDecorators(
	node: TSESTree.MethodDefinition,
): ResponseInfo[] {
	if (!node.decorators) return [];

	const responses: ResponseInfo[] = [];

	for (const decorator of node.decorators) {
		if (
			decorator.expression.type === 'CallExpression' &&
			decorator.expression.callee.type === 'Identifier' &&
			decorator.expression.callee.name === 'Response'
		) {
			const args = decorator.expression.arguments;
			if (args.length !== 2) continue;

			const [statusArg, typeArg] = args;

			if (statusArg.type !== 'Literal' || typeof statusArg.value !== 'number')
				continue;

			let typeName: string | null = null;

			if (typeArg.type === 'Identifier') {
				typeName = typeArg.name;
			} else if (typeArg.type === 'ArrayExpression') {
				typeName = 'Array';
			} else {
				typeName = `${typeArg.type}`;
			}

			if (typeName) {
				responses.push({
					status: statusArg.value,
					type: typeName,
					decorator,
				});
			}
		}
	}

	return responses;
}

function reportDuplicateStatuses(
	context: Context,
	responses: ResponseInfo[],
): void {
	const statusMap = new Map<number, TSESTree.Decorator>();

	for (const res of responses) {
		if (statusMap.has(res.status)) {
			context.report({
				node: res.decorator,
				messageId: 'duplicateStatus',
				data: { status: `${res.status}` },
			});
		} else {
			statusMap.set(res.status, res.decorator);
		}
	}
}

function validateReturnStatements(
	context: Context,
	node: TSESTree.MethodDefinition,
	responses: ResponseInfo[],
): void {
	const functionBody = node.value.body;
	if (!functionBody) return;

	const validStatuses = new Set(responses.map((r) => r.status));

	let hasAnyValidReturn = false;

	for (const stmt of functionBody.body) {
		if (
			stmt.type === 'ReturnStatement' &&
			stmt.argument?.type === 'ObjectExpression'
		) {
			const obj = stmt.argument;

			const statusProp = obj.properties.find(
				(p) =>
					p.type === 'Property' &&
					p.key.type === 'Identifier' &&
					p.key.name === 'status',
			) as TSESTree.Property | undefined;

			if (
				statusProp &&
				statusProp.value.type === 'Literal' &&
				typeof statusProp.value.value === 'number'
			) {
				const status = statusProp.value.value;
				hasAnyValidReturn = true;

				if (!validStatuses.has(status)) {
					context.report({
						node: statusProp,
						messageId: 'invalidReturnStatus',
						data: { status: `${status}` },
					});
				}
			}
		}
	}

	if (responses.length > 0 && !hasAnyValidReturn) {
		context.report({
			node,
			messageId: 'emptyReturn',
			data: { status: 'none (missing return)' },
		});
	}
}

function validateResTypes(
	context: Context,
	node: TSESTree.MethodDefinition,
	responses: ResponseInfo[],
): void {
	const body = node.value.body;
	if (!body) return;

	const responseMap = new Map<number, string>();
	for (const res of responses) {
		responseMap.set(res.status, res.type);
	}

	for (const stmt of body.body) {
		if (
			stmt.type === 'ReturnStatement' &&
			stmt.argument?.type === 'ObjectExpression'
		) {
			const obj = stmt.argument;

			const statusProp = obj.properties.find(
				(p) =>
					p.type === 'Property' &&
					p.key.type === 'Identifier' &&
					p.key.name === 'status',
			) as TSESTree.Property | undefined;

			const resProp = obj.properties.find(
				(p) =>
					p.type === 'Property' &&
					p.key.type === 'Identifier' &&
					p.key.name === 'res',
			) as TSESTree.Property | undefined;

			if (
				!statusProp ||
				!resProp ||
				statusProp.value.type !== 'Literal' ||
				typeof statusProp.value.value !== 'number'
			) {
				continue;
			}

			const status = statusProp.value.value;
			const expectedType = responseMap.get(status);
			if (!expectedType) continue;

			const actual = resProp.value;

			let matches = false;

			// Case 1: Identifier (e.g., UserDTO)
			if (actual.type === 'Identifier' && actual.name === expectedType) {
				matches = true;
			}

			// Case 2: NewExpression (e.g., new ViewRenderer())
			if (
				actual.type === 'NewExpression' &&
				actual.callee.type === 'Identifier' &&
				actual.callee.name === expectedType
			) {
				matches = true;
			}

			// Case 3: z.infer<UserDTO> → MemberExpression or CallExpression (skip for now)

			if (!matches) {
				context.report({
					node: resProp,
					messageId: 'invalidReturnRes',
					data: { status: `${status}` },
				});
			}
		}
	}
}
