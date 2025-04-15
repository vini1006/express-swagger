import type AbstractControllerDTO from '@/dto/controllerDTO/AbstractControllerDTO';
import type { IAttributes } from '@/dto/controllerDTO/AbstractControllerDTO';

abstract class AbstractController {
	rtn(): PromiseLike<AbstractControllerDTO | IAttributes> {
		throw new Error('This is merely a placeholder method');
	}
}

export type ControllerConstructor = new (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	...args: any[]
) => AbstractController;

export default AbstractController;
