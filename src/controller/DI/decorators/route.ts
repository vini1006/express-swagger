import AbstractController from '@/controller/AbstractController';
import type { HttpMethod } from '@/controller/DI/enums';
import {
	type ControllerMethodNames,
	defineControllerRoutesMetaData,
} from '@/controller/DI/reflect';

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');

function createMethodDecorator(method: HttpMethod) {
	return (path: string): MethodDecorator =>
		(target, propertyKey, descriptor) => {
			if (!(target instanceof AbstractController)) {
				throw new Error(
					'Route decorator can only be used on classes that extend AbstractController',
				);
			}

			defineControllerRoutesMetaData(target, {
				method,
				path,
				handlerName: propertyKey as ControllerMethodNames,
			});
		};
}
