import type DataModel from '@oapif/model/DataModel';
import type ViewRenderer from '@oapif/model/View';

type AbstractControllerConstructorArgs = [];

abstract class Controller {
	rtn(): PromiseLike<DataModel | ViewRenderer> {
		throw new Error('This is merely a placeholder method');
	}
}

export type ControllerConstructor = new (
	...args: AbstractControllerConstructorArgs
) => Controller;

export default Controller;
