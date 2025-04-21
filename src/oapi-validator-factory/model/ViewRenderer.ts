import type { Response } from 'express';

// ejs render

export class ViewRenderer {
	constructor(
		public filePath: string,
		public data: Record<string, unknown>,
		public description?: string,
	) {}

	static render(res: Response, viewRenderer: ViewRenderer) {
		res.render(viewRenderer.filePath, viewRenderer.data);
	}
}
