import { eq } from 'drizzle-orm';
import { apiOk, db, getUserId, userSettings } from '$lib/server/api';
import { expenses } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
	return apiOk({
		id: userId,
		email: event.locals.user?.email ?? 'demo@local.dev',
		name: event.locals.user?.name ?? 'Demo User',
		settings: settings[0] ?? null
	});
};

export const DELETE: RequestHandler = async (event) => {
	const userId = getUserId(event);
	await db.delete(expenses).where(eq(expenses.userId, userId));
	return apiOk({ deleted: true });
};
