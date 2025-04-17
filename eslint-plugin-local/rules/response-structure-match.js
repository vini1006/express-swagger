const {ESLintUtils, ASTUtils} = require('@typescript-eslint/utils');
const ts = require('typescript');

const createRule = ESLintUtils.RuleCreator(() => '');

module.exports = createRule({
    name: 'response-structure-match',
    meta: {
        type: 'problem',
        docs: {
            description: 'Ensure { status, res } return structure matches @Response(status, type)',
            recommended: 'error',
        },
        schema: [],
        messages: {
            missingResponse: 'Either using invalid status or @Response decorator is missing status or type',
            statusMismatch: 'Returned status ({{actual}}) does not match @Response declared status ({{expected}})',
            typeMismatch: 'Returned res type does not match @Response declared type "{{expected}}"',
            invalidFormat: 'Return value must be an object with "status" and "res" properties',
            invalidStatusFormat: 'Returned status must be a number',
        },
    },
    defaultOptions: [],
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();

        return {
            MethodDefinition(node) {
                if (!node.decorators) return;
                if (!node.value.body || node.value.body.type !== 'BlockStatement') return;

                const returns = findReturnStatementsSafely(node.value.body);
                const { responseDecorators, size } = responseDecorateValidate(context, node.decorators);

                if (size === 0) {
                    return;
                }


                validateReturn(context, checker, parserServices, responseDecorators, returns);
            },
        };
    },
});

function responseDecorateValidate(context, decorators) {
    if (!decorators || decorators.length === 0) {
        return;
    }

    let size = 0;
    const responseDecorators = {};
    for (const decorator of decorators) {
        if (decorator.expression.type !== 'CallExpression' || decorator.expression.callee.type !== 'Identifier' || decorator.expression.callee.name !== 'Response') {
            continue;
        }

        const [statusArg, typeArg] = decorator.expression.arguments;
        if (!statusArg || !typeArg || typeArg.type !== 'Identifier') {
            context.report({node: decorator, messageId: 'missingResponse'});
            continue;
        }

        responseDecorators[statusArg.value] = decorator;
        size++;
    }

    return { responseDecorators, size };
}

function validateReturn (context, parserServices, checker, statusDecoratorRecord, returns) {
    if (!returns || returns.length === 0) {
        return;
    }

    for (const ret of returns) {
        if (!ret?.argument || ret.argument.type !== 'ObjectExpression') {
            context.report({node: ret, messageId: 'invalidFormat'});
            continue;
        }

        const statusProp = findReturnValue(ret, 'status');
        const resProp = findReturnValue(ret, 'res');
        if (!statusProp || !resProp) {
            context.report({node: ret, messageId: 'invalidFormat'});
            continue;
        }

        if (statusProp.value.type !== 'Literal' || typeof statusProp.value.value !== 'number') {
            context.report({node: statusProp, messageId: 'invalidStatusFormat'});
            continue;
        }

        const decorator = statusDecoratorRecord[statusProp.value.value];
        if (!decorator) {
            context.report({node: statusProp, messageId: 'missingResponse'});
            continue;
        }

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(resProp.value);

        const expectedSymbol = checker.resolveName(decorator.typeArg.name, tsNode, ts.SymbolFlags.Type, false);
        const expectedType = expectedSymbol && checker.getDeclaredTypeOfSymbol(expectedSymbol);
        if (!expectedType) {
            continue;
        }

        const actualResType = checker.getTypeAtLocation(tsNode);
        if (!checker.isTypeAssignableTo(actualResType, expectedType)) {
            context.report({
                node: resProp.value,
                messageId: 'typeMismatch',
                data: {
                    expected: expectedTypeName,
                }
            })

        }
    }
}



function findReturnStatementsSafely(rootNode) {
    const found = [];

    const visited = new Set();

    function walk(node) {
        if (!node || typeof node !== 'object' || visited.has(node)) return;
        visited.add(node);

        if (node.type === 'ReturnStatement') {
            found.push(node);
        }

        for (const key in node) {
            const child = node[key];
            if (Array.isArray(child)) {
                child.forEach(walk);
            } else if (child && typeof child === 'object' && 'type' in child) {
                walk(child);
            }
        }
    }

    walk(rootNode);
    return found;
}

function findReturnValue (ret, key) {
    return ret.argument.properties.find((p) => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === key);
}

function print(msg) {
    console.log(`log:::: `, msg);
}