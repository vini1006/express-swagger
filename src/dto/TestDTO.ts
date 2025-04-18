import { makeSchema } from '@/oapif/model/Schema';

class TestDTO extends makeSchema((z) => {
	return z.object({
		id: z.string().uuid(),
		name: z.string().min(1),
	});
}) {}

export default TestDTO;
