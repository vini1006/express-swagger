import { type ZodTypeAny, z as zod } from 'zod';

export type InferSchema<T extends ZodTypeAny> = zod.infer<T>;

export const makeSchema = (create: (z: typeof zod) => ZodTypeAny) => {
	return create(zod);
};
