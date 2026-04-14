import { apiOk, getDashboard, getUserId } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const dashboard = await getDashboard(userId);
	return apiOk(dashboard);
};
