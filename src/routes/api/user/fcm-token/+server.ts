import { and, eq } from 'drizzle-orm';
import { apiFail, apiOk, db, fcmTokens, getUserId, id } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const body = await event.request.json().catch(() => null);
	const token = body?.token ? String(body.token) : '';
	const platform = body?.platform ? String(body.platform) : '';
	if (!token || !platform) return apiFail('token and platform are required');

	const existing = await db
		.select()
		.from(fcmTokens)
		.where(and(eq(fcmTokens.userId, userId), eq(fcmTokens.token, token)))
		.limit(1);
	if (existing.length === 0) {
		await db.insert(fcmTokens).values({
			id: id(),
			userId,
			token,
			platform
		});
	}

	return apiOk({ saved: true });
};
