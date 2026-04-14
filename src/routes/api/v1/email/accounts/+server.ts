import { desc, eq } from 'drizzle-orm';
import { apiOk, connectedEmailAccounts, db, getUserId } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const accounts = await db
		.select()
		.from(connectedEmailAccounts)
		.where(eq(connectedEmailAccounts.userId, userId))
		.orderBy(desc(connectedEmailAccounts.connectedAt));

	return apiOk({ accounts });
};
