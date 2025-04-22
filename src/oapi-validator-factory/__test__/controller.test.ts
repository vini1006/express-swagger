import { describe, expect, test } from 'bun:test';
import type { Request } from 'express';
import { v4 } from 'uuid';
import { z } from 'zod';

import {
	BasePath,
	Body,
	Controller,
	type ControllerConstructor,
	Header,
	Param,
	Post,
	Query,
	Response,
	createControllerParameters,
} from '@/oapif/controller';

import { makeSchema } from '@/oapif/model/Schema';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';
import {
	findControllerResponseMetaDataWithStatus,
	getAllControllerResponseMetaData,
	getBasePathMetaData,
	getControllerRouteParamsMetaData,
	getControllerRoutesMetaData,
} from '@/oapif/reflect-metadata/controller';

class TestDTO extends makeSchema((z) => {
	return z.object({
		id: z.string().min(1),
		name: z.string().min(1),
	});
}) {}

@BasePath('/test')
class MockController extends Controller {
	@Post('/test-path')
	@Response(201, TestDTO.z)
	@Response(400, ViewRenderer)
	getTest(
		@Param('param0', (z) => z.string().nonempty()) arg0: string,
		@Query('queryKey', (z) => z.number().gte(0)) arg1: string,
		@Header('headerKey', (z) => z.string().nonempty()) arg2: string,
		@Body('bodyKey', (z) => z.object({ key1: z.string().nonempty() }))
		arg3: { key1: string },
	) {
		return this.rtn<TestDTO>(201, {
			id: v4(),
			name: 'test',
		});
	}
}

describe('Reflect meta datas', () => {
	const mockController = new MockController();

	test('getBasePathMetaData', () => {
		const basePath = getBasePathMetaData(
			mockController.constructor as ControllerConstructor,
		);

		expect(basePath).toBe('/test');
	});

	test('getControllerRoutesMetaData', () => {
		const routeMetaList = getControllerRoutesMetaData(
			mockController.constructor as ControllerConstructor,
		);

		const routeMeta = routeMetaList[0];
		expect(routeMetaList).toHaveLength(1);
		expect(routeMeta.method).toBe('post');
		expect(routeMeta.path).toBe('/test-path');
		expect(routeMeta.handlerName).toBe('getTest');
	});

	test('getControllerRouteParamsMetaData', () => {
		const paramMetaList = getControllerRouteParamsMetaData(
			mockController.constructor as ControllerConstructor,
			'getTest',
		);

		expect(paramMetaList).toHaveLength(4);
		for (const paramMeta of paramMetaList) {
			switch (`${paramMeta.index}`) {
				case '0':
					expect(paramMeta.source).toBe('param');
					expect(paramMeta.key).toBe('param0');
					expect(paramMeta.validator.safeParse('string').error).toBeFalsy();
					break;
				case '1':
					expect(paramMeta.source).toBe('query');
					expect(paramMeta.key).toBe('queryKey');
					expect(paramMeta.validator.safeParse(1).error).toBeFalsy();
					break;
				case '2':
					expect(paramMeta.source).toBe('header');
					expect(paramMeta.key).toBe('headerKey');
					expect(paramMeta.validator.safeParse('string').error).toBeFalsy();
					break;
				case '3':
					expect(paramMeta.source).toBe('body');
					expect(paramMeta.key).toBe('bodyKey');
					expect(
						paramMeta.validator.safeParse({ key1: 'hello' }).error,
					).toBeFalsy();
					break;
			}
		}
	});

	test('findControllerResponseMetaDataWithStatus', () => {
		const zodResponseMeta = findControllerResponseMetaDataWithStatus(
			mockController.constructor as ControllerConstructor,
			'getTest',
			201,
		);

		const viewRendererResponseMeta = findControllerResponseMetaDataWithStatus(
			mockController.constructor as ControllerConstructor,
			'getTest',
			400,
		);

		expect(zodResponseMeta).toBeDefined();
		expect(zodResponseMeta!.returnType instanceof z.ZodObject).toBe(true);

		expect(viewRendererResponseMeta).toBeDefined();
		expect(viewRendererResponseMeta!.returnType === ViewRenderer).toBe(true);
	});

	test('getAllControllerResponseMetaData', () => {
		const responesMetaList = getAllControllerResponseMetaData(
			mockController.constructor as ControllerConstructor,
			'getTest',
		);

		expect(responesMetaList).toHaveLength(2);
	});
});

describe('register controller', () => {
	const mockController = new MockController();

	test('createControllerParameters', () => {
		const args = createControllerParameters(
			{
				params: {
					param0: 'paramkey rtn',
				},
				query: {
					queryKey: 1,
				},
				headers: {
					['headerKey'.toLowerCase()]: 'headerKey rtn',
				},
				body: {
					bodyKey: {
						key1: 'body key1',
					},
				},
			} as unknown as Request,
			mockController,
			'getTest',
		);

		expect(args).toHaveLength(4);
		for (let i = 0; i < args.length; i++) {
			switch (`${i}`) {
				case '0':
					expect(args[i]).toBe('paramkey rtn');
					break;
				case '1':
					expect(args[i]).toBe(1);
					break;
				case '2':
					expect(args[i]).toBe('headerKey rtn');
					break;
				case '3':
					expect(args[i]).toEqual({
						key1: 'body key1',
					});
					break;
			}
		}
	});
});
