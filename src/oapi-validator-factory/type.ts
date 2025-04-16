// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AnyConstructor = new (...args: any[]) => any;

export type InvalidParamHandler = (
	errMessage: string,
) => Record<string, unknown>;
