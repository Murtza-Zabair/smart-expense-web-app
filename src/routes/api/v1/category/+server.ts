import { eq } from 'drizzle-orm';
import { apiFail, apiOk, categories, db, ensureSeedCategories, getUserId, id } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	await ensureSeedCategories(userId);
	const rows = await db.select().from(categories).where(eq(categories.userId, userId));
	return apiOk(rows);
};

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const body = await event.request.json().catch(() => null);
	if (!body?.name) return apiFail('name is required');

	const record = {
		id: id(),
		userId,
		name: String(body.name),
		icon: body.icon ? String(body.icon) : null,
		color: body.color ? String(body.color) : '#6366F1'
	};
	await db.insert(categories).values(record);
	return apiOk(record, 201);
};
