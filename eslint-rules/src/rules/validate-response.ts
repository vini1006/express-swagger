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
			emptyReturn:
				'Return statement is empty, but @Response decorators are defined.',
			returnWithOutThisRtn:
				'Return must be in the form: return this.rtn(status, res)',
			returnStatusShouldBeNumber:
				'First argument to this.rtn must be a numeric status code',
		},
		language: 'typescript',
	},
	create(context) {
		return {
			ClassDeclaration(classNode: TSESTree.ClassDeclaration) {
				const hasBasePath = classNode.decorators?.some((decorator) => {
					return (
						decorator.expression.type === 'CallExpression' &&
						decorator.expression.callee.type === 'Identifier' &&
						decorator.expression.callee.name === 'BasePath'
					);
				});

				if (!hasBasePath) return;

				for (const element of classNode.body.body) {
					if (element.type !== 'MethodDefinition' || element.kind !== 'method')
						continue;

					if (element.type !== 'MethodDefinition' || element.kind !== 'method')
						continue;

					const responses = extractResponseDecorators(element);

					if (responses.length === 0) continue;

					reportDuplicateStatuses(context, responses);
					validateReturnFormat(context, element, responses);
				}
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

function validateReturnFormat(
	context: Context,
	node: TSESTree.MethodDefinition,
	responses: ResponseInfo[],
): void {
	const body = node.value.body;
	if (!body) return;

	const validStatuses = new Set(responses.map((r) => r.status));
	let hasAnyReturn = false;

	for (const stmt of body.body) {
		if (stmt.type !== 'ReturnStatement') continue;

		hasAnyReturn = true;
		const expr = stmt.argument;

		if (!expr) {
			context.report({
				node: stmt,
				messageId: 'emptyReturn',
			});
			continue;
		}

		if (
			expr.type !== 'CallExpression' ||
			expr.callee.type !== 'MemberExpression' ||
			expr.callee.object.type !== 'ThisExpression' ||
			expr.callee.property.type !== 'Identifier' ||
			expr.callee.property.name !== 'rtn'
		) {
			context.report({
				node: stmt,
				messageId: 'returnWithOutThisRtn',
			});
			continue;
		}

		const [statusArg] = expr.arguments;

		if (
			!statusArg ||
			statusArg.type !== 'Literal' ||
			typeof statusArg.value !== 'number'
		) {
			context.report({
				node: stmt,
				messageId: 'returnStatusShouldBeNumber',
			});
			continue;
		}

		const status = statusArg.value;

		if (!validStatuses.has(status)) {
			context.report({
				node: statusArg,
				messageId: 'invalidReturnStatus',
				data: { status: `${status}` },
			});
		}
	}

	// ✅ 바디에 return문 자체가 없을 때
	if (!hasAnyReturn && responses.length > 0) {
		context.report({
			node,
			messageId: 'emptyReturn',
		});
	}
}
