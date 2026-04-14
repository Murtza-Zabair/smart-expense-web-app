import { and, eq } from 'drizzle-orm';
import { apiOk, categories, db, expenses, getUserId } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const data = await db
		.select({
			id: expenses.id,
			title: expenses.title,
			amount: expenses.amount,
			date: expenses.date,
			currency: expenses.currency,
			categoryName: categories.name,
			source: expenses.source
		})
		.from(expenses)
		.leftJoin(categories, and(eq(expenses.categoryId, categories.id)))
		.where(eq(expenses.userId, userId));

	return apiOk({
		message: 'Export generated',
		exported_at: new Date().toISOString(),
		total_records: data.length,
		records: data
	});
};
