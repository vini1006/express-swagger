import { type InferSchema, makeSchema } from '@oapif/model/Schema';

const UserDto = makeSchema((z) =>
	z.object({
		id: z.string().uuid(),
		name: z.string().min(1),
	}),
);

export type UserDtoType = InferSchema<typeof UserDto>;

export default UserDto;
