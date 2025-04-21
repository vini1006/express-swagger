import { type ZodTypeAny, z as zod } from '@/oapif/adapter/zod';

import Controller, {
	type ControllerConstructor,
} from '@/oapif/controller/Controller';
import type { ParamSource } from '@/oapif/controller/enums';

import { createCustomErrorResponseMessage } from '@/oapif/adapter/zod';

import { defineControllerRouteParamMetaData } from '@/oapif/reflect-metadata/controller';

export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
export const Body = createParamDecorator('body');
export const Header = createParamDecorator('header');

function createParamDecorator(source: ParamSource) {
	return (
		paramKey: string,
		validator: (
			z: typeof zod,
			createCustomError: typeof createCustomErrorResponseMessage,
		) => ZodTypeAny,
	): ParameterDecorator =>
		(target, methodName, parameterIndex) => {
			if (!(target instanceof Controller)) {
				throw new Error(
					'Param decorator can only be used on classes that extend AbstractController',
				);
			}

			defineControllerRouteParamMetaData(
				target.constructor as ControllerConstructor,
				methodName as string,
				{
					index: parameterIndex,
					source,
					key: paramKey,
					validator: validator(zod, createCustomErrorResponseMessage),
				},
			);
		};
}
