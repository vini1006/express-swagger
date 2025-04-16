import type { Response } from 'express';

// ejs render

export class ViewRenderer {
	constructor(
		public filePath: string,
		public data: Record<string, unknown>,
	) {}

	static render(res: Response, viewRenderer: ViewRenderer) {
		res.render(viewRenderer.filePath, viewRenderer.data);
	}
}

export const createViewRenderer = (
	filePath: string,
	data: Record<string, unknown>,
) => {
	return new ViewRenderer(filePath, data);
};
