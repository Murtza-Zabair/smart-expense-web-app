import { apiFail, apiOk, connectedEmailAccounts, db, getUserId, id } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const body = await event.request.json().catch(() => null);
	const email = body?.email ? String(body.email).trim() : '';
	if (!email) return apiFail('email is required');

	const account = {
		id: id(),
		userId,
		email,
		provider: 'gmail',
		connectedAt: new Date()
	};
	await db.insert(connectedEmailAccounts).values(account);
	return apiOk(account, 201);
};
