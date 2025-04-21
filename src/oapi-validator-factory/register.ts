import type express from 'express';

import {
	type ControllerConstructor,
	registerControllers,
} from '@/oapif/controller';
import type { SwaggerConfig } from '@/oapif/swagger/config';
import { registerSwaggerDoc } from '@/oapif/swagger/register';
import type { InvalidParamHandler } from '@/oapif/type';

type ServerRegisterConfig = {
	mode: 'dev' | 'live';
	commonInvalidParamResponse?: InvalidParamHandler;
};

export const registerRouter = (config: {
	app: express.Express;
	controllers: ControllerConstructor[];
	serverRegisterConfig: ServerRegisterConfig;
	swaggerConfig: SwaggerConfig;
}) => {
	registerControllers(
		config.app,
		config.controllers,
		config.serverRegisterConfig.commonInvalidParamResponse,
	);
	registerSwaggerDoc(config.swaggerConfig, config.controllers);
};
