import type { ZodTypeAny } from 'zod/lib/types';

import Controller from '@oapif/controller/Controller';

import { defineControllerResponseMetaData } from '@oapif/reflect-metadata/controller';

export const Response = (
	statusCode: number,
	returnType: ZodTypeAny,
): MethodDecorator => {
	return (target, methodName, descriptor) => {
		if (!(target instanceof Controller)) {
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
