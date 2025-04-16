import type { ZodTypeAny, z } from 'zod';

export type RType<T extends ZodTypeAny> = z.infer<T>;

export const withResponse = <T extends ZodTypeAny>(schema: T) => {
	return <R extends z.infer<T>>(result: R): R => result;
};
