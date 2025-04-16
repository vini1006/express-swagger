import type { Response } from 'express';

// ejs render

class ViewRenderer {
	constructor(
		private filePath: string,
		private data: Record<string, unknown>,
	) {}

	render(res: Response) {
		res.render(this.filePath, this.data);
	}
}

export default ViewRenderer;
