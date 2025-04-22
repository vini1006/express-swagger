import { makeSchema } from '@/oapif/model/Schema';

class UserDTO extends makeSchema((z) => {
	return z.object({
		id: z.string().min(1),
		name: z.string().min(1),
	});
}) {}

export default UserDTO;
