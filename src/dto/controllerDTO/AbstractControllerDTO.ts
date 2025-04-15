export type IAttributes = Record<string, unknown>;

export default abstract class AbstractControllerDTO<
	T extends IAttributes = IAttributes,
> {
	constructor(props: T) {
		if (this.constructor === AbstractControllerDTO) {
			throw new Error('AbstractResponseDTO cannot be instantiated directly.');
		}
	}

	abstract toData(): T;

	abstract validate(v: T): boolean;
}

export type ResponseDTOConstructor = new (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	...args: any[]
) => AbstractControllerDTO;
