import { registerControllers } from '@oapif/controller';

import UserController from '@/controller/UserController';

import express from 'express';

const app = express();
const PORT = 8080;

app.set('views', '/views');
app.use(
	'view engine',
	// @ts-ignore
	'ejs',
);

registerControllers(app, [UserController]);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
