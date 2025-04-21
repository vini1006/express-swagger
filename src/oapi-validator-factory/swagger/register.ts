import fs from 'node:fs';

import { type ZodTypeAny, createZodSwaggerDocument } from '@/oapif/adapter/zod';

import type { ZodOpenApiPathsObject } from 'zod-openapi/dist/create/document';

import type { ControllerConstructor } from '@/oapif/controller';

import type { SwaggerConfig } from './config';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';
import {
	getAllControllerResponseMetaData,
	getBasePathMetaData,
	getControllerRoutesMetaData,
} from '@/oapif/reflect-metadata/controller';

export const registerSwaggerDoc = (
	swaggerConfig: SwaggerConfig,
	controllers: ControllerConstructor[],
) => {
	for (const controller of controllers) {
		const basePath = getBasePathMetaData(controller);
		const routeMetaList = getControllerRoutesMetaData(controller) || [];

		const res = createZodSwaggerDocument({
			openapi: swaggerConfig.swaggerVer,
			info: {
				title: swaggerConfig.info.title,
				version: swaggerConfig.info.version,
			},
			paths: routeMetaList.reduce((acc: ZodOpenApiPathsObject, routeMeta) => {
				const responseMetaList = getAllControllerResponseMetaData(
					controller,
					routeMeta.handlerName,
				);

				acc[`${basePath}${routeMeta.path}`] = {
					[routeMeta.method]: {
						operationId: routeMeta.handlerName,
						responses: responseMetaList.reduce((acc, meta) => {
							acc = {
								...acc,
								...makeResponseMeta(meta.statusCode, meta.returnType),
							};
							return acc;
						}, {}),
						parameters: [],
					},
				};

				return acc;
			}, {}),
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

		// for (const routeMeta of routeMetaList) {
		// 	const path = `${basePath}${routeMeta.path}`;
		// 	const method = routeMeta.method;
		// 	const responseMeta = findControllerResponseMetaData(
		// 		controller,
		// 		routeMeta.handlerName,
		// 	);
		// 	// Register the Swagger doc here
		// }
	}
};

function makeResponseMeta(
	status: number,
	returnType: ZodTypeAny | typeof ViewRenderer,
) {
	if (returnType === ViewRenderer) {
		return {
			[status]: {
				description: 'ViewRenderer',
				content: {
					'text/html': {
						schema: {
							type: 'string',
						},
					},
				},
			},
		};
		// biome-ignore lint/style/noUselessElse: <explanation>
	} else {
		return {
			[status]: {
				description: 'ZodTypeAny',
				content: {
					'application/json': {
						schema: returnType,
					},
				},
			},
		};
	}
}
