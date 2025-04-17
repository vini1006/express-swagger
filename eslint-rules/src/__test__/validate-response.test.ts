import { validateResponse } from '@/rules/validate-response';
// import tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';

// // @ts-ignore
// global.afterAll = (args) => {
// 	args();
// };
// // @ts-ignore
// global.afterEach = () => {};
// // @ts-ignore
// global.beforeAll = () => {};
// // @ts-ignore
// global.beforeEach = () => {};
// // @ts-ignore
// global.describe = () => {};

const ruleTester = new RuleTester();
ruleTester.run(
	'validate-response',
	validateResponse as unknown as RuleModule<
		| 'duplicateStatus'
		| 'invalidReturnStatus'
		| 'emptyReturn'
		| 'invalidReturnRes',
		[]
	>,
	{
		valid: [
			{
				code: `
						class A {
						  @Response(200, ViewRenderer)
						  getUser() {
							return { status: 200, res: new ViewRenderer() };
						  }
						}
					`,
			},
			{
				code: `
					class UserController {
					  @Response(200, UserDTO)
					  getUser() {
						return { status: 200, res: {} };
					  }
					}
				  `,
			},
			{
				code: `
					class A {
					  @Response(200, UserDTO)
					  @Response(400, ViewRenderer)
					  handler() {
						return { status: 400, res: {} };
					  }
					}
				  `,
			},
		],
		invalid: [
			{
				code: `
						class A {
						  @Response(200, UserDTO)
						  getUser() {
							return { status: 200, res: new ViewRenderer() }; // ❌ 잘못된 타입
						  }
						}
				  `,
				errors: [{ messageId: 'invalidReturnRes', data: { status: '200' } }],
			},
			{
				code: `
						class A {
						  @Response(200, UserDTO)
						  @Response(400, ViewRenderer)
						  handler() {}
						}
				  `,
				errors: [
					{
						messageId: 'emptyReturn',
					},
				],
			},
			{
				code: `
					class B {
					  @Response(200, UserDTO)
					  @Response(200, UserDTO)
					  handler() {
						return { status: 200, res: {} };
					  }
					}
				  `,
				errors: [{ messageId: 'duplicateStatus' }],
			},
			{
				code: `
					class C {
					  @Response(200, UserDTO)
					  getUser() {
						return { status: 404, res: {} };
					  }
					}
				  `,
				errors: [{ messageId: 'invalidReturnStatus', data: { status: '404' } }],
			},
		],
	},
);

console.log('test done!');
