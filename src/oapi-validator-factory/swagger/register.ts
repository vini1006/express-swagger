import fs from 'node:fs';
import _ from 'lodash/fp';

import { createZodSwaggerDocument } from '@/oapif/adapter/zod';

import {
	ZodOpenApiOperationObject,
	ZodOpenApiParameters,
	ZodOpenApiPathsObject,
	ZodOpenApiRequestBodyObject,
} from 'zod-openapi/dist/create/document';

import type { ControllerConstructor } from '@/oapif/controller';

import type { SwaggerConfig } from './config';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';
import {
	type ParameterMeta,
	type ResponseMeta,
	type RouteMeta,
	getAllControllerResponseMetaData,
	getBasePathMetaData,
	getControllerRoutesMetaData,
} from '@/oapif/reflect-metadata/controller';
import { ZodType } from 'zod';

export const registerSwaggerDoc = (
	swaggerConfig: SwaggerConfig,
	controllers: ControllerConstructor[],
) => {
	for (const controller of controllers) {
		const res = createZodSwaggerDocument({
			openapi: swaggerConfig.swaggerVer,
			info: {
				title: swaggerConfig.info.title,
				version: swaggerConfig.info.version,
			},
			paths: makePaths(controller),
		});

		const dirPath = './open-api-schema';
		try {
			fs.mkdirSync(dirPath, { recursive: true });
			// Write swagger.json file
			fs.writeFileSync(`${dirPath}/swagger.json`, JSON.stringify(res, null, 2));
			console.log(`Swagger documentation written to ${dirPath}/swagger.json`);
		} catch (err) {
			console.error('Error writing swagger documentation:', err);
		}
	}
};

function makePaths(controller: ControllerConstructor) {
	const basePath = getBasePathMetaData(controller);
	const routeMetaList = getControllerRoutesMetaData(controller) || [];

	return _.pipe(
		_.map((routeMeta: RouteMeta) => {
			const path = `${basePath}${routeMeta.path}`;
			const method = routeMeta.method;
			const responseMetaList = getAllControllerResponseMetaData(
				controller,
				routeMeta.handlerName,
			);
			const parameterMetaList = getAllControllerResponseMetaData(
				controller,
				routeMeta.handlerName,
			);

			return [
				path,
				{
					[method]: {
						operationId: routeMeta.handlerName,
						responses: makeResponses(responseMetaList),
					},
				},
			];
		}),
		_.fromPairs,
	)(routeMetaList);
}

function makeRequest(parameterMetaList: ParameterMeta[]) {
	const result = {
		parameters: [],
		requestParams: {},
		requestBody: {},
	} as unknown as {
		parameters: ZodOpenApiOperationObject['parameters'];
		requestParams: ZodOpenApiOperationObject['requestParams'];
		requestBody: ZodOpenApiOperationObject['requestBody'];
	};

	for (const paramMeta of parameterMetaList) {
		switch (paramMeta.source) {
			case 'query': {
				result.parameters!.push({
					name: paramMeta.key,
					in: 'query',
				});
				break;
			}
			case 'param':
			case 'body':
			case 'header':
		}
	}
}

function makeResponses(responseMetaList: ResponseMeta[]) {
	return _.pipe(
		_.map(({ statusCode, returnType, description }: ResponseMeta) => {
			if (returnType === ViewRenderer) {
				return [
					statusCode,
					{
						description: description || 'html page',
						content: {
							'text/html': {
								schema: {
									type: 'string',
								},
							},
						},
					},
				];
				// biome-ignore lint/style/noUselessElse: <explanation>
			} else {
				return [
					statusCode,
					{
						description: description || 'json',
						content: {
							'application/json': {
								schema: returnType,
							},
						},
					},
				];
			}
		}),
		_.fromPairs,
	)(responseMetaList) as ZodOpenApiPathsObject;
}
