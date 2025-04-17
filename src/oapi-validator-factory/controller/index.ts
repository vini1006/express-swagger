import express, { type Request, type Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

import {
	extractCustomErrorResponseMessage,
	isCustomErrorResponseMessage,
} from '@/oapif/adapter/zod';

import { tryCatchWrapper } from '@/oapif/utils';

import type { InvalidParamHandler } from '@/oapif/type';

import {
	findControllerResponseMetaData,
	getBasePathMetaData,
	getControllerRouteParamsMetaData,
	getControllerRoutesMetaData,
} from '@/oapif/reflect-metadata/controller';

import ParamValidationFailedError from '@/oapif/errors/ParamValidationFailedError';

import Controller, {
	type ControllerConstructor,
	isControllerReturnType,
} from '@/oapif/controller/Controller';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';

export const registerControllers = (
	app: express.Express,
	controllers: ControllerConstructor[],
	InvalidParamHandler?: InvalidParamHandler,
) => {
	for (const ControllerClass of controllers) {
		const router = express.Router();
		const instance = new ControllerClass();

		const routeMetaList = getControllerRoutesMetaData(instance) || [];
		for (const routeMeta of routeMetaList) {
			router[routeMeta.method](routeMeta.path, async (req, res) => {
				const [args, castError] = tryCatchWrapper(() =>
					createControllerParameters(req, instance, routeMeta.handlerName),
				);

				if (args === null) {
					const rtn = handleParamCastError(castError);

					if (rtn.isCustom) {
						res.status(rtn.httpStatus).json({
							code: rtn.code,
							message: rtn.message,
						});

						return;
					}
					if (InvalidParamHandler) {
						res.status(400).json(InvalidParamHandler(rtn.message));
						return;
					}

					res.status(rtn.httpStatus).json({
						code: rtn.code,
						message: rtn.message,
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
							code: -9999,
							error: 'Internal Server Error',
						});
					}
				});
			});
		}

		const basePath = getBasePathMetaData(instance);
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
		const customError = result.error.errors.find((e: unknown) =>
			isCustomErrorResponseMessage(
				(typeof e === 'object' &&
					e !== null &&
					'message' in e &&
					typeof e.message === 'string' &&
					e.message) ||
					'',
			),
		) as ZodError | undefined;

		if (customError) {
			const { httpStatus, errorCode, message } =
				extractCustomErrorResponseMessage(customError.message);

			throw new ParamValidationFailedError(
				message,
				true,
				httpStatus,
				errorCode,
			);
		}

		throw new ParamValidationFailedError(result.error.message, false);
	}

	return value;
};

const handleParamCastError = (error: unknown) => {
	if (error instanceof ParamValidationFailedError) {
		if (error.isCustom) {
			return {
				isCustom: true,
				httpStatus: error.httpStatus!,
				code: error.errorCode!,
				message: error.message!,
			};
		}

		return {
			isCustom: false,
			httpStatus: 400,
			code: -9999,
			message: error.message,
		};
	}

	console.error(error || 'Unknown error occurred while casting parameters');
	return {
		isCustom: false,
		httpStatus: 500,
		code: -9999,
		message: 'Internal Server Error',
	};
};

export { BasePath } from '@/oapif/controller/decorators/basePath';
export { Get, Post } from '@/oapif/controller/decorators/route';
export {
	Param,
	Query,
	Body,
	Header,
} from '@/oapif/controller/decorators/param';
export { Controller, type ControllerConstructor };
export { Response } from '@/oapif/controller/decorators/response';
