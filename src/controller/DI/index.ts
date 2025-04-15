import express from 'express';

import type { ControllerConstructor } from '@/controller/AbstractController';

import type { IAttributes } from '@/dto/controllerDTO/AbstractControllerDTO';

import {
	getBasePathMetaData,
	getControllerResponseMetaData,
	getControllerRouteParamsMetaData,
	getControllerRoutesMetaData,
} from '@/controller/DI/reflect';

export { Controller } from '@/controller/DI/decorators/controller';
export { Get, Post } from '@/controller/DI/decorators/route';
export {
	Param,
	Query,
	Body,
	Header,
} from '@/controller/DI/decorators/param';
export { Response } from '@/controller/DI/decorators/response';

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
					for (const { index, source, key, expectedType } of paramsMeta) {
						switch (source) {
							case 'param':
								args[index] = castToType(req.params[key!], expectedType);
								break;
							case 'query':
								args[index] = castToType(req.query[key!], expectedType);
								break;
							case 'header':
								args[index] = castToType(
									req.headers[key!.toLowerCase()],
									castToType,
								);
								break;
							case 'body':
								args[index] = castToType(req.body, expectedType);
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
				if (returnType) {
					if (returnType && result instanceof returnType) {
						res.status(statusCode).json(result.toData());
					} else {
						res
							.status(statusCode)
							.json(new returnType(result as IAttributes).toData());
					}
				} else {
					res.status(statusCode).json(result);
				}
			});
		}

		app.use(basePath, router);
	}
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const castToType = (value: any, type: any) => {
	if (type === Number) {
		const val = Number(value);
		if (Number.isNaN(val)) {
			throw new Error(`Invalid type: ${value} is not a Number`);
		}

		return val;
	}

	if (type === String) {
		return `${value}`;
	}

	if (type === Boolean) {
		try {
			return JSON.parse(value);
		} catch (e) {
			throw new Error(`Invalid type: ${value} is not a boolean`);
		}
	}
	if (type === Object)
		try {
			return typeof value === 'object' ? value : JSON.parse(value);
		} catch (error) {
			throw new Error(`Invalid type: ${value} is not a object`);
		}
	return value;
};
