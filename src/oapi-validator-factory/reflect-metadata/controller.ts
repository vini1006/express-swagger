import 'reflect-metadata';

import type { ZodType, ZodTypeAny } from 'zod';

import type Controller from '@oapif/controller/Controller';

import type { HttpMethod, ParamSource } from '@oapif/controller/enums';
import type DataModel from '@oapif/model/DataModel';
import type ViewRenderer from '@oapif/model/View';

const BASE_PATH_META = 'custom:base_path' as const;
const ROUTES_META = 'custom:routes' as const;
const PARAMS_META = 'custom:route_params' as const;
const RESPONSE_META = 'custom:response' as const;

type RouteBasePath = string;

//TODO: Filter with Returning only viewmodel and stuff
export type ControllerMethodNames<T = Controller> = keyof {
	[K in keyof T]: T[K] extends (
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		...arg: any[]
	) => PromiseLike<DataModel | ViewRenderer>
		? K
		: never;
};

type ParameterMeta = {
	index: number;
	source: ParamSource;
	key?: string;
	validator?: ZodTypeAny;
};

type RouteMeta = {
	method: HttpMethod;
	path: string;
	handlerName: ControllerMethodNames;
};

type ResponseMeta = {
	statusCode: number;
	returnType: ZodType;
};

export const defineBasePathMetaData = (
	basePath: RouteBasePath,
	target: Controller,
) => {
	Reflect.defineMetadata(BASE_PATH_META, basePath, target);
};

export const getBasePathMetaData = (controller: Controller): RouteBasePath => {
	return Reflect.getMetadata(BASE_PATH_META, controller.constructor);
};

export const defineControllerRoutesMetaData = (
	target: Controller,
	meta: RouteMeta,
) => {
	const existingRoutes =
		Reflect.getMetadata(ROUTES_META, target.constructor) || [];

	existingRoutes.push(meta);

	Reflect.defineMetadata(ROUTES_META, existingRoutes, target.constructor);
};

export const getControllerRoutesMetaData = <T extends Controller>(
	controller: Controller,
) => {
	return (Reflect.getMetadata(ROUTES_META, controller.constructor) ||
		[]) as RouteMeta[];
};

export const defineControllerRouteParamMetaData = (
	target: Controller,
	handlerName: string,
	parameterMeta: ParameterMeta,
) => {
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
	controller: Controller,
	handlerName: string,
) => {
	return (Reflect.getMetadata(PARAMS_META, controller, handlerName) ||
		[]) as ParameterMeta[];
};

export const defineControllerResponseMetaData = (
	target: Controller,
	handlerName: string,
	meta: ResponseMeta,
) => {
	Reflect.defineMetadata(RESPONSE_META, meta, target, handlerName);
};

export const getControllerResponseMetaData = (
	target: Controller,
	handlerName: string,
) => {
	return Reflect.getMetadata(
		RESPONSE_META,
		target,
		handlerName,
	) as ResponseMeta;
};
