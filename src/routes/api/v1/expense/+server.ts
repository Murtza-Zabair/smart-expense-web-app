import { and, eq } from 'drizzle-orm';
import {
	apiFail,
	apiOk,
	categories,
	db,
	ensureSeedCategories,
	expenses,
	getFilterDateRange,
	getUserId,
	id,
	parseAmount,
	queryExpenses
} from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const userId = getUserId(event);
	const url = event.url;
	const q = url.searchParams.get('q');
	const startDateRaw = url.searchParams.get('start_date');
	const endDateRaw = url.searchParams.get('end_date');
	const filter = url.searchParams.get('filter');
	const limit = Number(url.searchParams.get('limit') ?? 200);
	const skip = Number(url.searchParams.get('skip') ?? 0);

	let startDate = startDateRaw ? new Date(startDateRaw) : null;
	let endDate = endDateRaw ? new Date(endDateRaw) : null;
	if (!startDate && !endDate && filter) {
		const range = getFilterDateRange(filter);
		startDate = range.start;
		endDate = range.end;
	}

	const rows = await queryExpenses({ userId, search: q, startDate, endDate, limit, skip });
	const data = rows.map((row) => ({
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
	}));
	return apiOk({ expenses: data });
};

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	await ensureSeedCategories(userId);
	const body = await event.request.json().catch(() => null);
	if (!body?.title || !body?.amount) return apiFail('title and amount are required');

	let categoryId = body.category_id ? String(body.category_id) : '';
	if (!categoryId) {
		const fallback = await db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.limit(1);
		categoryId = fallback[0]?.id ?? '';
	}
	if (!categoryId) return apiFail('category_id is required');

	const record = {
		id: id(),
		userId,
		categoryId,
		title: String(body.title),
		amount: String(parseAmount(body.amount).toFixed(2)),
		date: body.date ? new Date(String(body.date)) : new Date(),
		description: body.description ? String(body.description) : null,
		currency: body.currency ? String(body.currency) : 'USD',
		notes: body.notes ? String(body.notes) : null,
		source: body.source ? String(body.source) : 'manual',
		sourceEmail: body.source_email ? String(body.source_email) : null
	};
	await db.insert(expenses).values(record);
	const joined = await db
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
		.where(and(eq(expenses.id, record.id), eq(expenses.userId, userId)))
		.limit(1);

	return apiOk(joined[0] ?? record, 201);
};
