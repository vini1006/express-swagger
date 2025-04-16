import { z } from 'zod';

const UserDto = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
});

export type UserDtoType = z.infer<typeof UserDto>;

export default UserDto;
