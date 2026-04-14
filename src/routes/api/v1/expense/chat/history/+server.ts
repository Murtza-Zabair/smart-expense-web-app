import { and, desc, eq } from 'drizzle-orm';
import { apiOk, expenseChatMessages, getUserId } from '$lib/server/api';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const limit = Math.min(200, Math.max(1, Number(event.url.searchParams.get('limit') ?? 50)));
	const skip = Math.max(0, Number(event.url.searchParams.get('skip') ?? 0));

	const rows = await db
		.select()
		.from(expenseChatMessages)
		.where(and(eq(expenseChatMessages.userId, userId)))
		.orderBy(desc(expenseChatMessages.createdAt))
		.limit(limit)
		.offset(skip);

	const data = rows
		.map((row) => ({
			id: row.id,
			text: row.text,
			is_user: row.isUser === 1,
			created_at: row.createdAt
		}))
		.reverse();

	return apiOk(data);
};
