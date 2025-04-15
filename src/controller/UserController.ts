import AbstractController from '@/controller/AbstractController';
import {
	Controller,
	Get,
	Header,
	Param,
	Query,
	Response,
} from '@/controller/DI';
import UserDTO from '@/dto/controllerDTO/UserDTO';

@Controller('/user')
class UserController extends AbstractController {
	@Get('/get/:id')
	@Response(200, UserDTO)
	getUser(
		@Param('id') id: number,
		@Query('name') name: string,
		@Header('X-Requested-With') token: string,
	) {
		console.log({
			id,
			name,
		});
		return { id, name };
	}
}

export default UserController;
