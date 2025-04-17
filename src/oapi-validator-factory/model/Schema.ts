import { type ZodTypeAny, z as zod } from 'zod';

export type InferSchema<T extends ZodTypeAny> = zod.infer<T>;

export const makeSchema = <T extends ZodTypeAny>(
	create: (z: typeof zod) => T,
): T => {
	return create(zod);
};
