export const tryCatchWrapper = <T>(cb: () => T) => {
	try {
		return [cb(), null] as const;
	} catch (error) {
		return [null, error] as const;
	}
};
