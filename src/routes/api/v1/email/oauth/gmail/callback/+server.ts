import { apiOk } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return apiOk({
		code: url.searchParams.get('code'),
		state: url.searchParams.get('state'),
		connected: true
	});
};
