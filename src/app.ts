import express from 'express';

import { registerRouter } from '@oapif/register';

import UserController from '@/controller/UserController';

const app = express();
const PORT = 8080;

app.set('views', `${__dirname}/views`).set('view engine', 'ejs');

registerRouter(app, {
	controllers: [UserController],
	commonInvalidParamResponse: (errMessage) => {
		return {
			code: -1000,
			msg: errMessage,
			data: {},
		};
	},
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
