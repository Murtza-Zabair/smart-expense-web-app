import { and, eq } from 'drizzle-orm';
import { apiFail, apiOk, categories, db, expenses, getUserId, parseAmount } from '$lib/server/api';
import type { RequestHandler } from './$types';

const mapRow = (row: {
	id: string;
	title: string;
	amount: string;
	date: Date;
	description: string | null;
	currency: string;
	notes: string | null;
	source: string;
	sourceEmail: string | null;
	categoryId: string | null;
	categoryName: string | null;
	categoryIcon: string | null;
	categoryColor: string | null;
}) => ({
	id: row.id,
	title: row.title,
	amount: parseAmount(row.amount),
	date: new Date(row.date).toISOString(),
	description: row.description,
	currency: row.currency,
	notes: row.notes,
	source: row.source,
	source_email: row.sourceEmail,
	category_id: row.categoryId
		? {
				_id: row.categoryId,
				name: row.categoryName,
				icon: row.categoryIcon,
				color: row.categoryColor
			}
		: null
});

const fetchOne = async (userId: string, expenseId: string) => {
	const rows = await db
		.select({
			id: expenses.id,
			title: expenses.title,
			amount: expenses.amount,
			date: expenses.date,
			description: expenses.description,
			currency: expenses.currency,
			notes: expenses.notes,
			source: expenses.source,
			sourceEmail: expenses.sourceEmail,
			categoryId: categories.id,
			categoryName: categories.name,
			categoryIcon: categories.icon,
			categoryColor: categories.color
		})
		.from(expenses)
		.leftJoin(categories, eq(expenses.categoryId, categories.id))
		.where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
		.limit(1);
	return rows[0];
};

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const expenseId = event.params.id;
	const row = await fetchOne(userId, expenseId);
	if (!row) return apiFail('Expense not found', 404);
	return apiOk(mapRow(row));
};

export const PATCH: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const expenseId = event.params.id;
	const body = await event.request.json().catch(() => null);
	if (!body) return apiFail('Invalid payload');

	await db
		.update(expenses)
		.set({
			categoryId: body.category_id ? String(body.category_id) : undefined,
			title: body.title ? String(body.title) : undefined,
			amount: body.amount !== undefined ? String(parseAmount(body.amount).toFixed(2)) : undefined,
			date: body.date ? new Date(String(body.date)) : undefined,
			description: body.description !== undefined ? String(body.description) : undefined,
			currency: body.currency ? String(body.currency) : undefined,
			notes: body.notes !== undefined ? String(body.notes) : undefined,
			source: body.source ? String(body.source) : undefined,
			sourceEmail: body.source_email !== undefined ? String(body.source_email) : undefined
		})
		.where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));

	const row = await fetchOne(userId, expenseId);
	if (!row) return apiFail('Expense not found', 404);
	return apiOk(mapRow(row));
};

export const DELETE: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const expenseId = event.params.id;
	await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
	return apiOk({ deleted: true });
};
