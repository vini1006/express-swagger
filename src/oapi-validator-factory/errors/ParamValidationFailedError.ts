class ParamValidationFailedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ParamValidationFailedError';
	}
}

export default ParamValidationFailedError;
