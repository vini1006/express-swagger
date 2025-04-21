import 'reflect-metadata';

import type { ZodType, ZodTypeAny } from '@/oapif/adapter/zod';

import type { ControllerConstructor } from '@/oapif/controller/Controller';

import type { HttpMethod, ParamSource } from '@/oapif/controller/enums';
import type { ViewRenderer } from '@/oapif/model/ViewRenderer';

const BASE_PATH_META = 'custom:base_path' as const;
const ROUTES_META = 'custom:routes' as const;
const PARAMS_META = 'custom:route_params' as const;
const RESPONSE_META = 'custom:response' as const;

type RouteBasePath = string;

type ParameterMeta = {
	index: number;
	source: ParamSource;
	key: string;
	validator: ZodTypeAny;
};

type RouteMeta = {
	method: HttpMethod;
	path: string;
	handlerName: string;
};

type ResponseMeta = {
	statusCode: number;
	returnType: ZodType | typeof ViewRenderer;
};

export const defineBasePathMetaData = (
	basePath: RouteBasePath,
	target: ControllerConstructor,
) => {
	Reflect.defineMetadata(BASE_PATH_META, basePath, target);
};

export const getBasePathMetaData = (
	controller: ControllerConstructor,
): RouteBasePath => {
	return Reflect.getMetadata(BASE_PATH_META, controller);
};

export const defineControllerRoutesMetaData = (
	controller: ControllerConstructor,
	meta: RouteMeta,
) => {
	const existingRoutes = Reflect.getMetadata(ROUTES_META, controller) || [];

	existingRoutes.push(meta);

	Reflect.defineMetadata(ROUTES_META, existingRoutes, controller);
};

export const getControllerRoutesMetaData = (
	controller: ControllerConstructor,
) => {
	return (Reflect.getMetadata(ROUTES_META, controller) || []) as RouteMeta[];
};

export const defineControllerRouteParamMetaData = (
	target: ControllerConstructor,
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
	controller: ControllerConstructor,
	handlerName: string,
) => {
	return (Reflect.getMetadata(PARAMS_META, controller, handlerName) ||
		[]) as ParameterMeta[];
};

export const defineControllerResponseMetaData = (
	target: ControllerConstructor,
	handlerName: string,
	meta: ResponseMeta,
) => {
	const existingMeta =
		Reflect.getMetadata(RESPONSE_META, target, handlerName) || [];

	existingMeta.push(meta);

	Reflect.defineMetadata(RESPONSE_META, existingMeta, target, handlerName);
};

export const findControllerResponseMetaDataWithStatus = (
	target: ControllerConstructor,
	handlerName: string,
	statusCode: ResponseMeta['statusCode'],
) => {
	return getAllControllerResponseMetaData(target, handlerName)?.find(
		(meta) => meta.statusCode === statusCode,
	);
};

export const getAllControllerResponseMetaData = (
	target: ControllerConstructor,
	handlerName: string,
) => {
	return Reflect.getMetadata(
		RESPONSE_META,
		target,
		handlerName,
	) as ResponseMeta[];
};
