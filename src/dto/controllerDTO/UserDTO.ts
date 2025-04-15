import AbstractControllerDTO, {
	type IAttributes,
} from '@/dto/controllerDTO/AbstractControllerDTO';

interface Attributes extends IAttributes {
	id: string;
	name: string;
}

class UserDTO extends AbstractControllerDTO<Attributes> {
	public id: string;
	public name: string;

	constructor(attr: Attributes) {
		super(attr);
		this.id = attr.id;
		this.name = attr.name;
	}

	toData(): Attributes {
		return {
			id: this.id,
			name: this.name,
		};
	}

	validate(v: Attributes): boolean {
		return typeof v.id === 'string' && typeof v.name === 'string';
	}
}

export default UserDTO;
