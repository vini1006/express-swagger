import type express from 'express';

import {
	type ControllerConstructor,
	registerControllers,
} from '@/oapif/controller';
import type { InvalidParamHandler } from '@/oapif/type';

type ServerRegisterConfig = {
	controllers: ControllerConstructor[];
	mode: 'dev' | 'live';
	commonInvalidParamResponse?: InvalidParamHandler;
};

export const registerRouter = (
	app: express.Express,
	{ controllers, commonInvalidParamResponse }: ServerRegisterConfig,
) => {
	registerControllers(app, controllers, commonInvalidParamResponse);
};
