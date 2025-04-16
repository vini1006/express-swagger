const START = '__custom' as const;
const DELIMITER = '::' as const;

export const createCustomErrorResponseMessage = (
	httpStatus: number,
	errorCode: number,
	message: string,
) => {
	const msg = `${START}${DELIMITER}${httpStatus}${DELIMITER}${errorCode}${DELIMITER}${message}`;
	return {
		message: msg,
		errorMap: () => ({
			message: msg,
		}),
	};
};

export const isCustomErrorResponseMessage = (msg: string) => {
	return (msg || '').startsWith(START);
};

export const extractCustomErrorResponseMessage = (msg: string) => {
	if (!isCustomErrorResponseMessage(msg)) {
		throw new Error('Invalid custom error response message');
	}

	const [, httpStatus, errorCode, message] = msg.split(DELIMITER);

	return {
		httpStatus: Number(httpStatus),
		errorCode: Number(errorCode),
		message,
	};
};
