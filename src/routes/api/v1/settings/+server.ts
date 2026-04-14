import { eq } from 'drizzle-orm';
import { apiOk, db, getUserId, userSettings } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
	return apiOk(rows[0] ?? { theme: 'system', currency: 'USD', countryCode: null });
};

export const PATCH: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const body = await event.request.json().catch(() => null);
	const theme = body?.theme ? String(body.theme) : 'system';
	const currency = body?.currency ? String(body.currency) : 'USD';
	const countryCode = body?.countryCode ? String(body.countryCode) : null;

	await db
		.insert(userSettings)
		.values({ userId, theme, currency, countryCode })
		.onDuplicateKeyUpdate({ set: { theme, currency, countryCode } });

	const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
	return apiOk(rows[0]);
};
