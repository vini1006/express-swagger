import express from 'express';

import { registerRouter } from '@/oapif/register';

import UserController from '@/controller/UserController';

const app = express();
const PORT = 8080;

app.set('views', `${__dirname}/views`).set('view engine', 'ejs');

registerRouter({
	app,
	controllers: [UserController],
	serverRegisterConfig: {
		mode: 'dev',
		commonInvalidParamResponse: (errMessage) => {
			return {
				code: -1000,
				msg: errMessage,
				data: {},
			};
		},
	},
	swaggerConfig: {
		swaggerVer: '3.0.1',
		info: {
			title: 'API Documentation',
			version: '1.0.0',
		},
	},
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
