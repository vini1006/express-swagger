class ParamValidationFailedError extends Error {
	constructor(
		message: string,
		public isCustom: boolean,
		public httpStatus?: number,
		public errorCode?: number,
	) {
		super(message);
		this.name = 'ParamValidationFailedError';
	}
}

export default ParamValidationFailedError;
