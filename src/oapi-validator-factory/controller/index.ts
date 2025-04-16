import express, { type Request, type Response } from 'express';
import type { ZodTypeAny } from 'zod';

import Controller, {
	type ControllerConstructor,
	isControllerReturnType,
} from '@oapif/controller/Controller';

import ParamValidationFailedError from '@oapif/errors/ParamValidationFailedError';
import {
	findControllerResponseMetaData,
	getBasePathMetaData,
	getControllerRouteParamsMetaData,
	getControllerRoutesMetaData,
} from '@oapif/reflect-metadata/controller';

import { ViewRenderer } from '@oapif/model/ViewRenderer';
import type { InvalidParamHandler } from '@oapif/type';
import { tryCatchWrapper } from '@oapif/utils';

export { BasePath } from '@oapif/controller/decorators/basePath';
export { Get, Post } from '@oapif/controller/decorators/route';
export {
	Param,
	Query,
	Body,
	Header,
} from '@oapif/controller/decorators/param';
export { Controller, type ControllerConstructor };
export { Response } from '@oapif/controller/decorators/response';

export const registerControllers = (
	app: express.Express,
	controllers: ControllerConstructor[],
	InvalidParamHandler?: InvalidParamHandler,
) => {
	for (const ControllerClass of controllers) {
		const instance = new ControllerClass();
		const router = express.Router();

		const basePath = getBasePathMetaData(instance);
		const routeMetaList = getControllerRoutesMetaData(instance);

		for (const routeMeta of routeMetaList) {
			router[routeMeta.method](routeMeta.path, async (req, res) => {
				const [args, castError] = tryCatchWrapper(() =>
					createControllerParameters(req, instance, routeMeta.handlerName),
				);

				if (args === null) {
					if (castError) {
						if (castError instanceof ParamValidationFailedError) {
							res.status(400).json(
								InvalidParamHandler
									? InvalidParamHandler(castError.message)
									: {
											error: castError.message,
										},
							);
							return;
						}

						console.error(castError);
						res.status(500).json({
							error: 'Internal Server Error',
						});
						return;
					}

					console.error('Unknown error occurred while casting parameters');
					res.status(500).json({
						error: 'Internal Server Error',
					});
					return;
				}

				handleControllerHandler(
					instance,
					routeMeta.handlerName,
					args,
					res,
				).catch((error) => {
					console.error(error);
					if (!res.headersSent) {
						res.status(500).json({
							error: 'Internal Server Error',
						});
					}
				});
			});
		}

		app.use(basePath, router);
	}
};

const handleControllerHandler = async (
	instance: Controller,
	handlerName: string,
	args: unknown[],
	response: Response,
) => {
	// @ts-ignore
	const handler = instance[handlerName].bind(instance) as (
		// @ts-ignore
		..._args: typeof args
	) => unknown;
	// @ts-ignore
	const result = await handler(...args);
	if (!isControllerReturnType(result)) {
		throw new Error(
			'Controller return type mismatch. Please use protected method Controller.rtn()',
		);
	}

	const responseMeta = findControllerResponseMetaData(
		instance,
		handlerName,
		result.status,
	);

	if (!responseMeta || !responseMeta.returnType) {
		throw new Error(
			'Response without @Response. Please add @Response to handler',
		);
	}

	const { returnType, statusCode } = responseMeta;

	if (returnType === ViewRenderer) {
		if (!(result.res instanceof ViewRenderer)) {
			throw new Error('Response type mismatch. Expected ViewRenderer');
		}

		response.status(statusCode);
		return ViewRenderer.render(response, result.res);
	}

	const parsedResult = (returnType as ZodTypeAny).safeParse(result);
	if (parsedResult.error) {
		response.status(500).json({
			error: 'Internal Server Error, Response type validation failed',
			message: parsedResult.error.message,
		});
		return;
	}

	response.status(statusCode).json(parsedResult.data);
};

const createControllerParameters = (
	req: Request,
	instance: Controller,
	handlerName: string,
) => {
	const paramsMeta =
		getControllerRouteParamsMetaData(instance, handlerName) || [];

	const args: unknown[] = [];

	for (const { index, source, key, validator } of paramsMeta) {
		switch (source) {
			case 'param':
				args[index] = validateAndCastToType(req.params[key!], validator);
				break;
			case 'query':
				args[index] = validateAndCastToType(req.query[key!], validator);
				break;
			case 'header':
				args[index] = validateAndCastToType(
					req.headers[key!.toLowerCase()],
					validator,
				);
				break;
			case 'body':
				args[index] = validateAndCastToType(req.body, validator);
				break;
		}
	}

	return args;
};

const validateAndCastToType = (value: unknown, validator: ZodTypeAny) => {
	const result = validator.safeParse(value);
	if (result.error) {
		throw new ParamValidationFailedError(result.error.message);
	}

	return value;
};
