import UserDTO, { type UserDtoType } from '@/dto/UserDTO';

import { withResponse } from '@/controller/util';

import {
	BasePath,
	Body,
	Controller,
	Get,
	Header,
	Param,
	Query,
	Response,
} from '@oapif/controller';

const responseAsUser = withResponse(UserDTO);

@BasePath('/user')
class UserController extends Controller {
	@Get('/get/:id')
	@Response(200, UserDTO)
	getUser(
		@Param('id', (z) => z.string().nonempty()) id: string,
		@Query('name', (z) => z.string().nonempty()) name: string,
		@Header('X-Requested-With', (z) => z.literal('test')) token: string,
		@Body('userExt', () => UserDTO) userExt: UserDtoType,
	) {
		return responseAsUser({ id, name });
	}
}

export default UserController;
