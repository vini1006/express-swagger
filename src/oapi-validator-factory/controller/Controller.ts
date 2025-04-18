import type ASchema from '@/oapif/model/Schema';
import type { ViewRenderer } from '@/oapif/model/ViewRenderer';

type AbstractControllerConstructorArgs = [];

type ControllerReturnType = {
	status: number;
	res: ViewRenderer | ASchema;
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

type ValidateControllerReturnVal<T = void> = T extends ASchema
	? ASchema['type']
	: T extends ViewRenderer
		? ViewRenderer
		: 'Define Generic Return Type from one of the following @Response types: ASchema | ViewRenderer';

abstract class Controller {
	protected rtn<T = void, U extends T = T>(
		status: number,
		_val: ValidateControllerReturnVal<U>,
	): {
		status: number;
		res: ValidateControllerReturnVal<U>;
	} {
		return {
			status,
			res: _val as U extends ASchema ? ASchema['type'] : never,
		};
	}
}

export type ControllerConstructor = new (
	...args: AbstractControllerConstructorArgs
) => Controller;

export default Controller;
