import { apiOk } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return apiOk({ url: `${url.origin}/oauth/gmail`, state: 'local-dev' });
};
