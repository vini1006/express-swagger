import { validateResponse } from '@/rules/validate-response';
// import tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';

const ruleTester = new RuleTester();
ruleTester.run(
	'validate-response',
	validateResponse as unknown as RuleModule<
		| 'duplicateStatus'
		| 'invalidReturnStatus'
		| 'emptyReturn'
		| 'returnWithOutThisRtn'
		| 'returnStatusShouldBeNumber',
		[]
	>,
	{
		valid: [
			{
				code: `
				  const UserDTO = z.object({ name: z.string() });
				  class A {
					@Response(200, UserDTO)
					getUser() {
					  return this.rtn(200, { name: "hi" });
					}
				  }
				`,
			},
			{
				code: `
				  class A {
					@Response(200, ViewRenderer)
					renderPage() {
					  return this.rtn(200, new ViewRenderer());
					}
				  }
				`,
			},
			{
				code: `
				  class A {
					@Response(200, UserDTO)
					@Response(400, ViewRenderer)
					handle() {
					  return this.rtn(400, new ViewRenderer());
					}
				  }
				`,
			},
			{
				code: `
				  class A {
					@Response(200, UserDTO)
					@Response(400, ViewRenderer)
					handle() {
					  return this.rtn(200, {});
					}
				  }
				`,
			},
		],
		invalid: [
			{
				// return 없음
				code: `
				  class A {
					@Response(200, UserDTO)
					noReturn() {}
				  }
				`,
				errors: [{ messageId: 'emptyReturn' }],
			},
			{
				// return 없음
				code: `
				  class A {
					@Response(200, UserDTO)
					notNumber() {
					  return this.rtn("200", {});
					}
				  }
				`,
				errors: [{ messageId: 'returnStatusShouldBeNumber' }],
			},
			{
				// 중복된 status
				code: `
				  class B {
					@Response(200, UserDTO)
					@Response(200, UserDTO)
					handler() {
					  return this.rtn(200, {});
					}
				  }
				`,
				errors: [{ messageId: 'duplicateStatus' }],
			},
			{
				// 정의되지 않은 status
				code: `
				  class C {
					@Response(200, UserDTO)
					getUser() {
					  return this.rtn(404, {});
					}
				  }
				`,
				errors: [{ messageId: 'invalidReturnStatus', data: { status: '404' } }],
			},
			{
				// this.rtn 아님
				code: `
				  class A {
					@Response(200, UserDTO)
					get() {
					  return { status: 200, res: {} };
					}
				  }
				`,
				errors: [
					{
						messageId: 'returnWithOutThisRtn',
					},
				],
			},
		],
	},
);

console.log('test done!');
