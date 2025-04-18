import type SomethingDTO from '@/dto/SomethingDTO';
import TestDTO from '@/dto/TestDTO';
import UserDTO from '@/dto/UserDTO';

import {
	BasePath,
	Controller,
	Get,
	Header,
	Param,
	Query,
	Response,
} from '@/oapif/controller';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';

@BasePath('/user')
class UserController extends Controller {
	@Get('/get/:id')
	@Response(200, [UserDTO.z, TestDTO.z])
	@Response(402, ViewRenderer)
	getUser(
		@Param('id', (z) => z.string().nonempty()) id: string,
		@Query('name', (z) => z.string().nonempty()) name: string,
		@Header('X-Requested-With', (z, createCustomError) =>
			z.literal('test', createCustomError(401, -1, 'Api key is invalid')),
		)
		token: string,
	) {
		return this.rtn(200, {
			id: '1234',
			name: '12344',
		});
	}
}

export default UserController;
