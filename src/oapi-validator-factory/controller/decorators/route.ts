import Controller, {
	type ControllerConstructor,
} from '@/oapif/controller/Controller';
import type { HttpMethod } from '@/oapif/controller/enums';
import { defineControllerRoutesMetaData } from '@/oapif/reflect-metadata/controller';

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');

function createMethodDecorator(method: HttpMethod) {
	return (path: string, description?: string): MethodDecorator =>
		(target, propertyKey, descriptor) => {
			if (!(target instanceof Controller)) {
				throw new Error(
					'Route decorator can only be used on classes that extend AbstractController',
				);
			}

			defineControllerRoutesMetaData(
				target.constructor as ControllerConstructor,
				{
					method,
					path,
					handlerName: propertyKey as string,
					description,
				},
			);
		};
}
