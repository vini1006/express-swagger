import Controller, {
	type ControllerConstructor,
} from '@/oapif/controller/Controller';
import { defineBasePathMetaData } from '@/oapif/reflect-metadata/controller';

export function BasePath(basePath: string): ClassDecorator {
	return (target) => {
		if (!(target.prototype instanceof Controller)) {
			throw new Error(
				'Controller decorator can only be used on classes that extend AbstractController',
			);
		}

		defineBasePathMetaData(
			basePath,
			target as unknown as ControllerConstructor,
		);
	};
}
