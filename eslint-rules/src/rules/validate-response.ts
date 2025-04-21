import {
	AST_NODE_TYPES,
	ESLintUtils,
	type TSESTree,
} from '@typescript-eslint/utils';

import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';

type ResponseInfo = {
	status: number;
	decorator: TSESTree.Decorator;
	type: string[];
};

type MethodResponseMap = WeakMap<TSESTree.MethodDefinition, ResponseInfo[]>;
type ReturnMethodMap = WeakMap<
	TSESTree.ReturnStatement,
	TSESTree.MethodDefinition
>;
const createRule = ESLintUtils.RuleCreator(() => '');

export const rule = createRule({
	name: 'opai-validator-factory-response',
	meta: {
		docs: {
			description: 'Ensures that @Response decorators and return types match',
		},
		messages: {
			duplicateStatus: 'Duplicate @Response for status {{status}}.',
			invalidReturnStatus:
				'Returned status {{status}} is not defined in @Response.',
			emptyReturn:
				'Return statement is empty, but @Response decorators are defined.',
			returnWithOutThisRtn:
				'Return must be in the form: return this.rtn<T>(status, res)',
			returnWithoutThisRtnGeneric:
				'Must use generic type for this.rtn<T>(status, res)',
			returnTypeNotMatch:
				"Generic type '{{generic}}' does not match any of expected type '{{expected}}' for status {{status}}.",
		},
		type: 'layout',
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		const methodResponseMap: MethodResponseMap = new WeakMap();
		const returnMethodMap: ReturnMethodMap = new WeakMap();

		return {
			ClassDeclaration(classNode) {
				if (!isControllerClassNode(classNode)) {
					return;
				}

				for (const el of classNode.body.body) {
					if (el.type !== 'MethodDefinition' || el.kind !== 'method') {
						continue;
					}

					collectMethodResponseDecorators(el, methodResponseMap);
					collectMethodReturnStatements(el, returnMethodMap);
				}
			},
			ReturnStatement(returnNode) {
				const methodDefinition = returnMethodMap.get(returnNode);
				if (!methodDefinition) {
					return;
				}

				const isEmptyReturn = _isEmptyReturn(
					context,
					methodDefinition,
					methodResponseMap,
					returnNode,
					false,
				);

				const isUsingInvalidReturnFn = _isUsingInvalidReturnFn(
					context,
					returnNode,
					isEmptyReturn,
				);

				if (isUsingInvalidReturnFn) {
					return;
				}

				_isInvalidReturn(
					context,
					methodDefinition,
					methodResponseMap,
					returnNode,
					isUsingInvalidReturnFn,
				);
			},
		};
	},
});

function isControllerClassNode(classNode: TSESTree.ClassDeclaration) {
	for (const decorator of classNode.decorators) {
		if (
			decorator.expression.type === AST_NODE_TYPES.CallExpression &&
			decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
			decorator.expression.callee.name === 'BasePath'
		) {
			return true;
		}
	}
}

function collectMethodResponseDecorators(
	methodDefinition: TSESTree.MethodDefinition,
	methodResponseMap: MethodResponseMap,
) {
	if (!methodDefinition.decorators?.length) {
		return;
	}

	const responseInfo: ResponseInfo[] = [];
	for (const decorator of methodDefinition.decorators) {
		if (
			decorator.expression.type === AST_NODE_TYPES.CallExpression &&
			decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
			decorator.expression.callee.name === 'Response'
		) {
			const args = decorator.expression.arguments;
			if (args.length < 2) {
				continue;
			}

			if (args[0].type !== AST_NODE_TYPES.Literal) {
				continue;
			}

			const status = Number.parseInt(args[0]!.value as string, 10);
			const rtnType = args[1];

			switch (rtnType.type) {
				case AST_NODE_TYPES.ArrayExpression: {
					const arr: string[] = [];
					for (const el of rtnType.elements) {
						pushToRtnNameList(el, arr);
					}

					responseInfo.push({
						status,
						type: arr,
						decorator: decorator,
					});
					break;
				}
				case AST_NODE_TYPES.Identifier: {
					responseInfo.push({
						status,
						type: pushToRtnNameList(rtnType),
						decorator: decorator,
					});
					break;
				}
			}
		}
	}

	methodResponseMap.set(methodDefinition, responseInfo);

	function pushToRtnNameList(
		el:
			| TSESTree.Expression
			| TSESTree.SpreadElement
			| TSESTree.Identifier
			| null,
		list: string[] = [],
	) {
		if (!el) {
			return list;
		}

		if (
			el.type === AST_NODE_TYPES.MemberExpression &&
			el.object.type === AST_NODE_TYPES.Identifier
		) {
			list.push(el.object.name);
		}

		if (el.type === AST_NODE_TYPES.Identifier) {
			list.push(el.name);
		}

		return list;
	}
}

function collectMethodReturnStatements(
	methodDefinition: TSESTree.MethodDefinition,
	returnMethodMap: ReturnMethodMap,
) {
	if (!methodDefinition.value.body) {
		return;
	}

	for (const stmt of methodDefinition.value.body?.body || []) {
		traverseReturnNode(methodDefinition, stmt, returnMethodMap);
	}

	function traverseReturnNode(
		methodDefinition: TSESTree.MethodDefinition,
		stmt: TSESTree.Statement | null | undefined,
		returnMethodMap: ReturnMethodMap,
	) {
		if (!stmt) {
			return;
		}

		switch (stmt.type) {
			case AST_NODE_TYPES.ReturnStatement: {
				returnMethodMap.set(stmt, methodDefinition);
				return;
			}
			case AST_NODE_TYPES.BlockStatement: {
				for (const innerStmt of stmt.body) {
					traverseReturnNode(methodDefinition, innerStmt, returnMethodMap);
				}
				return;
			}
			case AST_NODE_TYPES.IfStatement: {
				const { consequent, alternate } = stmt;
				traverseReturnNode(methodDefinition, consequent, returnMethodMap);
				traverseReturnNode(methodDefinition, alternate, returnMethodMap);
				return;
			}
			case AST_NODE_TYPES.SwitchStatement: {
				const { cases } = stmt;
				for (const caseStmt of cases) {
					for (const caseBody of caseStmt.consequent) {
						traverseReturnNode(methodDefinition, caseBody, returnMethodMap);
					}
				}
				return;
			}
			case AST_NODE_TYPES.WhileStatement: {
				const { body } = stmt;
				traverseReturnNode(methodDefinition, body, returnMethodMap);
				return;
			}
		}
	}
}

function _isEmptyReturn(
	context: RuleContext<string, unknown[]>,
	methodDefinition: TSESTree.MethodDefinition,
	methodResponseMap: MethodResponseMap,
	returnNode: TSESTree.ReturnStatement,
	stop: boolean,
): boolean {
	if (stop) {
		return false;
	}

	const responseInfoList = methodResponseMap.get(methodDefinition);
	if (!responseInfoList?.length) {
		context.report({
			node: methodDefinition,
			messageId: 'emptyReturn',
		});

		return true;
	}

	if (returnNode.argument === null) {
		context.report({
			node: returnNode,
			messageId: 'emptyReturn',
		});

		return true;
	}

	return false;
}

function _isUsingInvalidReturnFn(
	context: RuleContext<string, unknown[]>,
	returnNode: TSESTree.ReturnStatement,
	stop: boolean,
): boolean {
	if (stop) {
		return false;
	}

	if (
		!returnNode.argument ||
		returnNode.argument.type !== AST_NODE_TYPES.CallExpression ||
		returnNode.argument.callee.type !== AST_NODE_TYPES.MemberExpression ||
		returnNode.argument.callee.object.type !== AST_NODE_TYPES.ThisExpression ||
		returnNode.argument.callee.property.type !== AST_NODE_TYPES.Identifier ||
		returnNode.argument.callee.property.name !== 'rtn'
	) {
		context.report({
			node: returnNode,
			messageId: 'returnWithOutThisRtn',
		});
		return true;
	}

	return false;
}

function _isInvalidReturn(
	context: RuleContext<string, unknown[]>,
	methodDefinition: TSESTree.MethodDefinition,
	methodResponseMap: MethodResponseMap,
	returnNode: TSESTree.ReturnStatement,
	stop: boolean,
): boolean {
	if (stop) {
		return false;
	}

	if (
		!returnNode.argument ||
		returnNode.argument.type !== AST_NODE_TYPES.CallExpression ||
		!returnNode.argument?.arguments?.[0] ||
		!returnNode.argument?.arguments?.[1]
	) {
		return false;
	}

	const statusArg =
		returnNode.argument &&
		returnNode.argument.type === AST_NODE_TYPES.CallExpression &&
		returnNode.argument?.arguments?.[0];

	if (
		!statusArg ||
		statusArg.type !== AST_NODE_TYPES.Literal ||
		Number.isNaN(statusArg.value)
	) {
		return true;
	}

	const responseInfoList = methodResponseMap.get(methodDefinition)!;
	const statusMatchedReturn = responseInfoList.find(
		(s) => s.status === statusArg.value,
	);

	if (!statusMatchedReturn) {
		context.report({
			node: returnNode,
			messageId: 'invalidReturnStatus',
		});

		return true;
	}

	const typeGeneric = returnNode.argument.typeArguments?.params?.[0];
	if (!typeGeneric) {
		context.report({
			node: returnNode,
			messageId: 'returnWithoutThisRtnGeneric',
		});

		return true;
	}

	const typeGenericName =
		typeGeneric.type === AST_NODE_TYPES.TSTypeReference &&
		typeGeneric.typeName.type === AST_NODE_TYPES.Identifier &&
		typeGeneric.typeName.name;

	if (!typeGenericName) {
		context.report({
			node: returnNode,
			messageId: 'returnWithoutThisRtnGeneric',
		});

		return true;
	}

	const expected = statusMatchedReturn.type;
	if (!expected.includes(typeGenericName)) {
		context.report({
			node: typeGeneric,
			messageId: 'returnTypeNotMatch',
			data: {
				generic: typeGenericName,
				expected: expected.join(', '),
				status: statusArg.value,
			},
		});

		return true;
	}

	return false;
}
