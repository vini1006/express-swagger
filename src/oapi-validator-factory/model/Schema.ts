import { type ZodTypeAny, z as zod } from '@/oapif/adapter/zod';

type InferZodSchema<T extends ZodTypeAny> = zod.infer<T>;

abstract class ASchema<
	T extends ZodTypeAny = ZodTypeAny,
	A = InferZodSchema<T>,
> {
	static get z(): ZodTypeAny {
		throw new Error('static z is not implemented');
	}

	public readonly type!: A;
}

export const makeSchema = <T extends ZodTypeAny>(
	create: (z: typeof zod) => T,
) => {
	const _z = create(zod);

	return class extends ASchema<T> {
		static get z() {
			return _z as T;
		}
	};
};

export default ASchema;
