import type { ZodTypeAny } from 'zod';

class DataModel {
	constructor(private readonly zType: ZodTypeAny) {}

	safeParse(val: unknown) {
		return this.zType.safeParse(val);
	}
}

export default DataModel;
