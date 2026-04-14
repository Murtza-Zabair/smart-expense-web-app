import { apiOk } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return apiOk({ url: `${url.origin}/oauth/outlook`, state: 'local-dev' });
};
