import type { ViewRenderer } from '@/oapif/model/ViewRenderer';

type AbstractControllerConstructorArgs = [];

type ControllerReturnType<T extends ViewRenderer | unknown = unknown> = {
	status: number;
	res: T;
};

export const isControllerReturnType = (
	result: unknown,
): result is ControllerReturnType => {
	return (
		typeof result === 'object' &&
		result !== null &&
		'status' in result &&
		typeof result.status === 'number' &&
		'res' in result
	);
};

abstract class Controller {
	protected rtn<T = void, U extends T = T>(status: number, val: U) {
		return {
			status,
			res: val,
		};
	}
}

export type ControllerConstructor = new (
	...args: AbstractControllerConstructorArgs
) => Controller;

export default Controller;
