import UserDTO, { UserDtoType } from '@/dto/UserDTO';

import {
	BasePath,
	Controller,
	Get,
	Header,
	Param,
	Query,
	Response,
} from '@oapif/controller';

import { ViewRenderer } from '@oapif/model/ViewRenderer';

@BasePath('/user')
class UserController extends Controller {
	@Get('/get/:id')
	@Response(200, UserDTO)
	@Response(402, ViewRenderer)
	getUser(
		@Param('id', (z) => z.string().nonempty()) id: string,
		@Query('name', (z) => z.string().nonempty()) name: string,
		@Header('X-Requested-With', (z, createCustomError) =>
			z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
		)
		token: string,
	) {
		return {
			// error
			status: 401,
			res: new ViewRenderer('error', { message: '1MESAS' }),
		};
	}
}

export default UserController;
