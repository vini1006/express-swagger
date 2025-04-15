import { registerControllers } from '@/controller/DI';
import UserController from '@/controller/UserController';

import express from 'express';

const app = express();
const PORT = 8080;

registerControllers(app, [UserController]);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
