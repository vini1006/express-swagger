import 'reflect-metadata';

import type AbstractController from '@/controller/AbstractController';
import type { HttpMethod, ParamSource } from '@/controller/DI/enums';
import type AbstractControllerDTO from '@/dto/controllerDTO/AbstractControllerDTO';
import type { IAttributes } from '@/dto/controllerDTO/AbstractControllerDTO';

const CONTROLLER_META = 'custom:controller' as const;
const ROUTES_META = 'custom:routes' as const;
const PARAMS_META = 'custom:route_params' as const;
const RESPONSE_META = 'custom:response' as const;

type RouteBasePath = string;

export type ControllerMethodNames<T = AbstractController> = keyof {
	[K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
};

type ParameterMeta = {
	index: number;
	source: ParamSource;
	key?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	expectedType?: any;
};

type RouteMeta = {
	method: HttpMethod;
	path: string;
	handlerName: ControllerMethodNames;
};

type ResponseMeta = {
	statusCode: number;
	returnType?: new (attr: IAttributes) => AbstractControllerDTO;
};

export const defineBasePathMetaData = (
	basePath: RouteBasePath,
	target: AbstractController,
) => {
	Reflect.defineMetadata(CONTROLLER_META, basePath, target);
};

export const getBasePathMetaData = (
	controller: AbstractController,
): RouteBasePath => {
	return Reflect.getMetadata(CONTROLLER_META, controller.constructor);
};

export const defineControllerRoutesMetaData = (
	target: AbstractController,
	meta: RouteMeta,
) => {
	const existingRoutes =
		Reflect.getMetadata(ROUTES_META, target.constructor) || [];

	existingRoutes.push(meta);

	Reflect.defineMetadata(ROUTES_META, existingRoutes, target.constructor);
};

export const getControllerRoutesMetaData = <T extends AbstractController>(
	controller: AbstractController,
) => {
	return (Reflect.getMetadata(ROUTES_META, controller.constructor) ||
		[]) as RouteMeta[];
};

export const defineControllerRouteParamMetaData = (
	target: AbstractController,
	handlerName: string,
	parameterMeta: ParameterMeta,
) => {
	console.log(parameterMeta.expectedType);
	const existingParams: ParameterMeta[] =
		Reflect.getMetadata(PARAMS_META, target, handlerName as string) || [];

	existingParams.push(parameterMeta);

	Reflect.defineMetadata(
		PARAMS_META,
		existingParams,
		target,
		handlerName as string,
	);
};

export const getControllerRouteParamsMetaData = (
	controller: AbstractController,
	handlerName: string,
) => {
	return (Reflect.getMetadata(PARAMS_META, controller, handlerName) ||
		[]) as ParameterMeta[];
};

export const defineControllerResponseMetaData = (
	target: AbstractController,
	handlerName: string,
	meta: ResponseMeta,
) => {
	Reflect.defineMetadata(RESPONSE_META, meta, target, handlerName);
};

export const getControllerResponseMetaData = (
	target: AbstractController,
	handlerName: string,
) => {
	return Reflect.getMetadata(
		RESPONSE_META,
		target,
		handlerName,
	) as ResponseMeta;
};

export const getParamTypes = (
	target: AbstractController,
	methodName: string,
	parameterIndex: number,
) => {
	return (Reflect.getMetadata('design:paramtypes', target, methodName) || [])[
		parameterIndex
	];
};
