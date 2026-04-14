import { and, eq } from 'drizzle-orm';
import { apiFail, apiOk, categories, db, getUserId } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const categoryId = event.params.id;
	const rows = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
		.limit(1);
	if (rows.length === 0) return apiFail('Category not found', 404);
	return apiOk(rows[0]);
};

export const PATCH: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const categoryId = event.params.id;
	const body = await event.request.json().catch(() => null);
	if (!body) return apiFail('Invalid payload');

	await db
		.update(categories)
		.set({
			name: body.name ? String(body.name) : undefined,
			icon: body.icon ? String(body.icon) : undefined,
			color: body.color ? String(body.color) : undefined
		})
		.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

	const rows = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
		.limit(1);
	if (rows.length === 0) return apiFail('Category not found', 404);
	return apiOk(rows[0]);
};

export const DELETE: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const categoryId = event.params.id;
	await db
		.delete(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
	return apiOk({ deleted: true });
};
