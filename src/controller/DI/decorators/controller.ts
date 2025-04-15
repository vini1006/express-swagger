import AbstractController from '@/controller/AbstractController';
import { defineBasePathMetaData } from '@/controller/DI/reflect';

export function Controller(basePath: string): ClassDecorator {
	return (target) => {
		if (!(target.prototype instanceof AbstractController)) {
			throw new Error(
				'Controller decorator can only be used on classes that extend AbstractController',
			);
		}

		defineBasePathMetaData(basePath, target as unknown as AbstractController);
	};
}
