import AbstractControllerDTO from '@/dto/controllerDTO/AbstractControllerDTO';

type Attributes = {
	[key: string]: unknown;
};

export default class PrimitiveDTO extends AbstractControllerDTO {
	toData(): Attributes {
		throw new Error('Method not implemented.');
	}

	validate(v: Attributes): boolean {
		throw new Error('Method not implemented.');
	}
}
