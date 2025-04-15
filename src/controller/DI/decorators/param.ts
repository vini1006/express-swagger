import AbstractController from '@/controller/AbstractController';

import type { ParamSource } from '@/controller/DI/enums';
import {
	defineControllerRouteParamMetaData,
	getParamTypes,
} from '@/controller/DI/reflect';

export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
export const Body = createParamDecorator('body');
export const Header = createParamDecorator('header');

function createParamDecorator(source: ParamSource, key?: string) {
	return (paramKey?: string): ParameterDecorator =>
		(target, methodName, parameterIndex) => {
			if (!(target instanceof AbstractController)) {
				throw new Error(
					'Param decorator can only be used on classes that extend AbstractController',
				);
			}

			defineControllerRouteParamMetaData(target, methodName as string, {
				index: parameterIndex,
				source,
				key: paramKey || key,
				expectedType: getParamTypes(
					target,
					methodName as string,
					parameterIndex,
				),
			});
		};
}
