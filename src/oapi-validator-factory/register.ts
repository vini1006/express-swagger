import type express from 'express';

import {
	type ControllerConstructor,
	registerControllers,
} from '@oapif/controller';
import type { InvalidParamHandler } from '@oapif/type';

type ServerRegisterConfig = {
	controllers: ControllerConstructor[];
	invalidParamResponse?: InvalidParamHandler;
};

export const registerRouter = (
	app: express.Express,
	{ controllers, invalidParamResponse }: ServerRegisterConfig,
) => {
	registerControllers(app, controllers, invalidParamResponse);
};
