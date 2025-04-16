import express from 'express';
import type { ZodTypeAny } from 'zod';

import type { ControllerConstructor } from '@oapif/controller/Controller';

import {
	getBasePathMetaData,
	getControllerResponseMetaData,
	getControllerRouteParamsMetaData,
	getControllerRoutesMetaData,
} from '@oapif/reflect-metadata/controller';

export { BasePath } from '@oapif/controller/decorators/basePath';
export { Get, Post } from '@oapif/controller/decorators/route';
export {
	Param,
	Query,
	Body,
	Header,
} from '@oapif/controller/decorators/param';
export { Response } from '@oapif/controller/decorators/response';
export { default as Controller } from '@oapif/controller/Controller';

export const registerControllers = (
	app: express.Express,
	controllers: ControllerConstructor[],
) => {
	for (const ControllerClass of controllers) {
		const instance = new ControllerClass();
		const router = express.Router();

		const basePath = getBasePathMetaData(instance);
		const routes = getControllerRoutesMetaData(instance);

		for (const route of routes) {
			const handler = instance[route.handlerName].bind(instance);
			const paramsMeta = getControllerRouteParamsMetaData(
				instance,
				route.handlerName,
			);

			router[route.method](route.path, async (req, res) => {
				const args: unknown[] = [];

				const responseMeta = getControllerResponseMetaData(
					instance,
					route.handlerName,
				);

				try {
					for (const { index, source, key, validator } of paramsMeta) {
						switch (source) {
							case 'param':
								args[index] = validateAndCastToType(
									`params.${key}`,
									req.params[key!],
									validator,
								);
								break;
							case 'query':
								args[index] = validateAndCastToType(
									`query.${key}`,
									req.query[key!],
									validator,
								);
								break;
							case 'header':
								args[index] = validateAndCastToType(
									`headers.${key}`,
									req.headers[key!.toLowerCase()],
									validator,
								);
								break;
							case 'body':
								args[index] = validateAndCastToType(
									`body.${key}`,
									req.body,
									validator,
								);
								break;
						}
					}
				} catch (error: unknown) {
					if (!error) {
						console.error(error);
						res.status(500).json({
							error: 'Internal Server Error',
						});
					}

					if (error instanceof Error) {
						res.status(400).json({
							error: error.message,
						});
					} else {
						console.error(error);
						res.status(500).json({
							error: 'Internal Server Error',
						});
					}
				}

				// @ts-ignore
				const result = await handler(...args);
				const { statusCode, returnType } = responseMeta || {
					statusCode: 200,
					returnType: undefined,
				};

				if (!returnType) {
					throw new Error(
						'Response without @Response. Please add @Response to handler',
					);
				}

				const parsedResult = returnType.safeParse(result);
				if (!parsedResult.success) {
					throw new Error(
						`Response validation failed: ${parsedResult.error.message}`,
					);
				}

				res.status(statusCode).json(parsedResult.data);
			});
		}

		app.use(basePath, router);
	}
};

const validateAndCastToType = (
	key: string,
	value: unknown,
	validator?: ZodTypeAny,
) => {
	if (!validator) {
		return value;
	}

	const result = validator.safeParse(value);
	if (!result.success) {
		throw new Error(`Validation Failed for ${key} ${value} is not acceptable`);
	}

	return value;
};
