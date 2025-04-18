import type {
	LanguageOptions,
	RuleContext,
	RuleDefinition,
	SourceCode,
} from '@eslint/core';
import type { TSESTree } from '@typescript-eslint/utils';

/** Types **/
type ResponseInfo = {
	status: number;
	type: string[];
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

/** Rule Definition **/
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
			returnTypeNotMatch:
				"Generic type '{{generic}}' does not match any of expected type '{{expected}}' for status {{status}}.",
		},
		language: 'typescript',
	},

	create(context) {
		const methodResponseMap = new WeakMap<
			TSESTree.MethodDefinition,
			ResponseInfo[]
		>();
		const statusTypeCache = new WeakMap<
			TSESTree.MethodDefinition,
			Map<number, string[]>
		>();
		const returnToMethodMap = new WeakMap<
			TSESTree.ReturnStatement,
			TSESTree.MethodDefinition
		>();

		return {
			ClassDeclaration(classNode) {
				try {
					// @ts-ignore
					const hasBasePath = classNode.decorators?.some((decorator) => {
						return (
							decorator.expression.type === 'CallExpression' &&
							decorator.expression.callee.type === 'Identifier' &&
							decorator.expression.callee.name === 'BasePath'
						);
					});
					if (!hasBasePath) return;

					for (const element of classNode.body.body) {
						if (
							element.type !== 'MethodDefinition' ||
							element.kind !== 'method'
						)
							continue;

						const responses = extractResponseDecorators(element);
						if (responses.length > 0) {
							methodResponseMap.set(element, responses);
							reportDuplicateStatuses(context, responses);

							const statusMap = new Map<number, string[]>();
							for (const { status, type } of responses) {
								statusMap.set(
									status,
									type.map((el) =>
										el === 'ViewRenderer' ? 'ViewRenderer' : el.split('.')[0],
									),
								);
							}
							statusTypeCache.set(element, statusMap);

							const body = element.value.body;
							if (body) {
								collectReturnStatements(body, (ret) => {
									returnToMethodMap.set(ret, element);
								});
							}
						}
					}
				} catch (error) {
					console.error(error);
				}
			},
			ReturnStatement(returnNode) {
				try {
					const methodNode = returnToMethodMap.get(returnNode);
					if (!methodNode) return;

					const expectedMap = statusTypeCache.get(methodNode);
					if (!expectedMap) return;

					validateReturnFormat(context, returnNode, expectedMap);
				} catch (error) {
					console.error(error);
				}
			},
		};
	},
};

/** Utilities **/
function collectReturnStatements(
	node: TSESTree.Node,
	onReturn: (stmt: TSESTree.ReturnStatement) => void,
	visited = new Set<TSESTree.Node>(),
): void {
	if (visited.has(node)) return;
	visited.add(node);

	if (node.type === 'ReturnStatement') {
		onReturn(node);
		return;
	}

	for (const key in node) {
		if (!Object.prototype.hasOwnProperty.call(node, key)) continue;

		//@ts-ignore
		const value = node[key];

		if (Array.isArray(value)) {
			for (const child of value) {
				if (child && typeof child.type === 'string') {
					collectReturnStatements(child, onReturn, visited);
				}
			}
		} else if (
			value &&
			typeof value === 'object' &&
			typeof value.type === 'string'
		) {
			collectReturnStatements(value, onReturn, visited);
		}
	}
}

function validateReturnFormat(
	context: Context,
	stmt: TSESTree.ReturnStatement,
	expectedMap: Map<number, string[]>,
): void {
	const expr = stmt.argument;

	if (!expr) {
		context.report({ node: stmt, messageId: 'emptyReturn' });
		return;
	}

	if (
		expr.type !== 'CallExpression' ||
		expr.callee.type !== 'MemberExpression' ||
		expr.callee.object.type !== 'ThisExpression' ||
		expr.callee.property.type !== 'Identifier' ||
		expr.callee.property.name !== 'rtn'
	) {
		context.report({ node: stmt, messageId: 'returnWithOutThisRtn' });
		return;
	}

	const [statusArg] = expr.arguments;

	if (
		!statusArg ||
		statusArg.type !== 'Literal' ||
		typeof statusArg.value !== 'number'
	) {
		context.report({ node: stmt, messageId: 'returnStatusShouldBeNumber' });
		return;
	}

	const status = statusArg.value;
	const expected = expectedMap.get(status) || [];

	if (!expected.length) {
		context.report({
			node: statusArg,
			messageId: 'invalidReturnStatus',
			data: { status: `${status}` },
		});
		return;
	}

	const typeParams = expr.typeArguments;
	if (
		typeParams &&
		typeParams.type === 'TSTypeParameterInstantiation' &&
		typeParams.params.length > 0
	) {
		const typeNode = typeParams.params[0];

		if (
			typeNode.type === 'TSTypeReference' &&
			typeNode.typeName.type === 'Identifier'
		) {
			const generic = typeNode.typeName.name;
			if (!expected.includes(generic)) {
				context.report({
					node: typeParams,
					messageId: 'returnTypeNotMatch',
					data: {
						generic,
						expected: expected.join(', '),
						status: `${status}`,
					},
				});
			}
		}
	}
}

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

			let typeName: string[] | undefined;

			if (typeArg.type === 'Identifier') {
				typeName = [typeArg.name];
			} else if (typeArg.type === 'ArrayExpression') {
				typeName = [];
				for (const el of typeArg.elements) {
					if (
						el?.type === 'MemberExpression' &&
						isValidMemberExpressionType(el)
					) {
						typeName.push(`${el.object.name}`);
					}
				}
			} else if (isValidMemberExpressionType(typeArg)) {
				typeName = [`${typeArg.object.name}`];
			}

			if (typeName?.length) {
				responses.push({ status: statusArg.value, type: typeName, decorator });
			}
		}
	}

	return responses;

	function isValidMemberExpressionType(
		typeArg: unknown,
	): typeArg is { object: { name: string } } {
		return (
			typeof typeArg === 'object' &&
			typeArg !== null &&
			'type' in typeArg &&
			typeArg.type === 'MemberExpression' &&
			'property' in typeArg &&
			typeof typeArg.property === 'object' &&
			typeArg.property !== null &&
			'name' in typeArg.property &&
			typeArg.property.name === 'z' &&
			'object' in typeArg &&
			typeof typeArg.object === 'object' &&
			typeArg.object !== null &&
			'name' in typeArg.object
		);
	}
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
