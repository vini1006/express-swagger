import UserDTO, { type UserDtoType } from '@/dto/UserDTO';

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
		@Header('X-Requested-With', (z) => z.literal('test')) token: string,
	) {
		return this.rtn<UserDtoType>(200, {
			id,
			name,
		});
	}
}

export default UserController;
