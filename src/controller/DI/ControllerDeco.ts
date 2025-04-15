import type IController from '@/controller/IController';
import 'reflect-metadata';

const CONTROLLER_META = 'custom:controller';
const ROUTES_META = 'custom:routes';
type HttpMethod = 'get' | 'post';

export function Controller(basePath: string): ClassDecorator {
	return (target: IController) => {
		Reflect.defineMetadata(CONTROLLER_META, basePath, target);
	};
}

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');

function createMethodDecorator(method: HttpMethod) {
	return function (path: string): MethodDecorator {
		return (target, propertyKey, descriptor) => {
			const existingRoutes =
				Reflect.getMetadata(ROUTES_META, target.constructor) || [];

			existingRoutes.push({
				method,
				path,
				handlerName: propertyKey,
			});

			Reflect.defineMetadata(ROUTES_META, existingRoutes, target.constructor);
		};
	};
}
