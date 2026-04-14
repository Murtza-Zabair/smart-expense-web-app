import { and, eq } from 'drizzle-orm';
import { apiOk, connectedEmailAccounts, db, getUserId } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const accountId = event.params.accountId;
	await db
		.delete(connectedEmailAccounts)
		.where(and(eq(connectedEmailAccounts.id, accountId), eq(connectedEmailAccounts.userId, userId)));
	return apiOk({ deleted: true });
};
