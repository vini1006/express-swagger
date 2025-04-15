import type { ResponseDTOConstructor } from '@/dto/controllerDTO/AbstractControllerDTO';

import AbstractController from '@/controller/AbstractController';

import { defineControllerResponseMetaData } from '@/controller/DI/reflect';

export const Response = (
	statusCode: number,
	returnType?: ResponseDTOConstructor,
): MethodDecorator => {
	return (target, methodName, descriptor) => {
		if (!(target instanceof AbstractController)) {
			throw new Error(
				'Response decorator can only be used on classes that extend AbstractController',
			);
		}

		defineControllerResponseMetaData(target, methodName as string, {
			statusCode,
			returnType,
		});
	};
};
