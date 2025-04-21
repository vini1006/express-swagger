import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleModule } from '@typescript-eslint/utils/ts-eslint';
import { rule } from '../rules/validate-response';

const ruleTester = new RuleTester();

ruleTester.run(
	'validate-response',
	rule as unknown as RuleModule<
		| 'duplicateStatus'
		| 'invalidReturnStatus'
		| 'emptyReturn'
		| 'returnWithOutThisRtn'
		| 'returnStatusShouldBeNumber'
		| 'returnTypeNotMatch',
		[]
	>,
	{
		valid: [
			{
				code: `
				    @BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, UserDTO.z)
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							return this.rtn<UserDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				name: 'Testing VALID CASE 1',
			},
			{
				code: `
				    @BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, UserDTO.z)
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							return this.rtn<ViewRenderer>(402, {
								id,
								name,
							});
						}
					}
				`,
				name: 'Testing VALID CASE 2 402 ViewRenderer',
			},
			{
				code: `
				    @BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, [UserDTO.z, SomethingDTO.z])
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							return this.rtn<UserDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				name: 'Testing VALID CASE 3 Array Response ZodType',
			},
			{
				code: `
				    @BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, [UserDTO.z, SomethingDTO.z])
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							return this.rtn<UserDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				name: 'Testing VALID CASE 4 Array Response ZodType',
			},
			{
				code: `
					@BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, UserDTO)
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							if (a) {
								return this.rtn<ViewRenderer>(402, new ViewRenderer());
							}
							
							return this.rtn<UserDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				name: 'Testing VALID CASE 5 if statement',
			},
		],
		invalid: [
			{
				code: `
				    @BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, UserDTO)
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							return this.rtn<SomethingDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				errors: [{ messageId: 'returnTypeNotMatch' }],
				name: 'INVALID2: Testing invalid rtn generic',
			},
			{
				code: `
					@BasePath('/user')
				    class UserController extends Controller {
						@Get('/get/:id')
						@Response(200, UserDTO)
						@Response(402, ViewRenderer)
						getUser(
							@Param('id', (z) => z.string().nonempty()) id: string,
							@Query('name', (z) => z.string().nonempty()) name: string,
							@Header('X-Requested-With', (z, createCustomError) =>
								z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
							)
							token: string,
						) {
							if (a) {
								return this.rtn<SomethingDTO>(402, {
									id,
									name,
								});
							}
							
							return this.rtn<UserDTO>(200, {
								id,
								name,
							});
						}
					}
				`,
				errors: [{ messageId: 'returnTypeNotMatch' }],
				name: 'INVALID 3: Testing invalid rtn generic in if statement',
			},
		],
	},
);

console.log('test done!');

// {
// 	// return 없음
// 	code: `
// 	  class A {
// 		@Response(200, UserDTO)
// 		noReturn() {}
// 	  }
// 	`,
// 	errors: [{ messageId: 'emptyReturn' }],
// },
