import { json, type RequestEvent } from '@sveltejs/kit';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, expenses, connectedEmailAccounts, expenseChatMessages } from '$lib/server/db/schema';

export const getUserId = (event: RequestEvent) => event.locals.user?.id ?? 'demo-user';

export const apiOk = (data: unknown, status = 200) => json({ success: true, data }, { status });
export const apiFail = (message: string, status = 400) =>
	json({ success: false, message }, { status });

export const id = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ensureSeedCategories = async (userId: string) => {
	const existing = await db.select().from(categories).where(eq(categories.userId, userId)).limit(1);
	if (existing.length > 0) return;

	await db.insert(categories).values([
		{ id: id(), userId, name: 'Food', icon: '🍔', color: '#f97316' },
		{ id: id(), userId, name: 'Travel', icon: '🚕', color: '#0ea5e9' },
		{ id: id(), userId, name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
		{ id: id(), userId, name: 'Bills', icon: '🧾', color: '#ef4444' },
		{ id: id(), userId, name: 'Entertainment', icon: '🎬', color: '#10b981' }
	]);
};

export const parseAmount = (value: string | number | null | undefined) => {
	const num = typeof value === 'number' ? value : Number(value ?? 0);
	return Number.isFinite(num) ? num : 0;
};

export const getFilterDateRange = (filter: string | null) => {
	const now = new Date();
	if (filter === 'week') {
		return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
	}
	if (filter === 'year') {
		return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
	}
	return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
};

export const getDashboard = async (userId: string) => {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

	const rows = await db
		.select({
			id: expenses.id,
			title: expenses.title,
			amount: expenses.amount,
			date: expenses.date,
			source: expenses.source,
			sourceEmail: expenses.sourceEmail,
			categoryId: categories.id,
			categoryName: categories.name,
			categoryIcon: categories.icon,
			categoryColor: categories.color
		})
		.from(expenses)
		.leftJoin(categories, eq(expenses.categoryId, categories.id))
		.where(eq(expenses.userId, userId))
		.orderBy(desc(expenses.date));

	const toNum = (v: unknown) => Number(v ?? 0);
	const today_total = rows
		.filter((r) => new Date(r.date).getTime() >= dayStart.getTime())
		.reduce((sum, r) => sum + toNum(r.amount), 0);
	const monthly_total = rows
		.filter((r) => new Date(r.date).getTime() >= monthStart.getTime())
		.reduce((sum, r) => sum + toNum(r.amount), 0);

	const recent_expenses = rows.slice(0, 10).map((r) => ({
		id: r.id,
		title: r.title,
		amount: toNum(r.amount),
		date: new Date(r.date).toISOString(),
		category_id: r.categoryId
			? {
					_id: r.categoryId,
					name: r.categoryName ?? 'Unknown',
					icon: r.categoryIcon ?? '',
					color: r.categoryColor ?? '#D3D3D3'
				}
			: null,
		category_name: r.categoryName ?? 'Unknown',
		source: r.source,
		source_email: r.sourceEmail
	}));

	const weeklyRows = rows.filter((r) => new Date(r.date).getTime() >= weekStart.getTime());

	const categoryMap = new Map<string, { amount: number; name: string; color: string; icon: string }>();
	for (const row of weeklyRows) {
		const key = row.categoryId ?? 'uncategorized';
		const prev = categoryMap.get(key) ?? {
			amount: 0,
			name: row.categoryName ?? 'Uncategorized',
			color: row.categoryColor ?? '#D3D3D3',
			icon: row.categoryIcon ?? '🧾'
		};
		prev.amount += toNum(row.amount);
		categoryMap.set(key, prev);
	}

	const weekly_category_data = [...categoryMap.entries()].map(([key, value]) => ({
		category_id: key,
		category_name: value.name,
		amount: value.amount,
		color: value.color,
		icon: value.icon
	}));

	const dailyMap = new Map<string, number>();
	for (let i = 0; i < 7; i++) {
		const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
		const key = date.toISOString().slice(0, 10);
		dailyMap.set(key, 0);
	}
	for (const row of weeklyRows) {
		const key = new Date(row.date).toISOString().slice(0, 10);
		if (dailyMap.has(key)) {
			dailyMap.set(key, (dailyMap.get(key) ?? 0) + toNum(row.amount));
		}
	}
	const weekly_daily_spending = [...dailyMap.entries()].map(([date, amount]) => {
		const d = new Date(date);
		return {
			date,
			amount,
			day_name: d.toLocaleDateString('en-US', { weekday: 'short' })
		};
	});

	return {
		today_total,
		monthly_total,
		total_transactions: rows.length,
		recent_expenses,
		weekly_category_data,
		weekly_daily_spending
	};
};

export const queryExpenses = async ({
	userId,
	search,
	startDate,
	endDate,
	limit = 200,
	skip = 0
}: {
	userId: string;
	search?: string | null;
	startDate?: Date | null;
	endDate?: Date | null;
	limit?: number;
	skip?: number;
}) => {
	const where = [eq(expenses.userId, userId)];
	if (startDate) where.push(gte(expenses.date, startDate));
	if (endDate) where.push(lte(expenses.date, endDate));
	if (search && search.trim()) {
		const q = `%${search.trim()}%`;
		where.push(
			sql`(${expenses.title} LIKE ${q} OR ${expenses.notes} LIKE ${q} OR ${expenses.sourceEmail} LIKE ${q})`
		);
	}

	return db
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
		.where(and(...where))
		.orderBy(desc(expenses.date))
		.limit(Math.max(1, Math.min(limit, 500)))
		.offset(Math.max(0, skip));
};

export { db, categories, expenses, connectedEmailAccounts, expenseChatMessages };
