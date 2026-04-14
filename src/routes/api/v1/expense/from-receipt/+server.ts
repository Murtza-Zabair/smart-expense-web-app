import { eq } from 'drizzle-orm';
import { apiOk, categories, db, ensureSeedCategories, expenses, getUserId, id } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	await ensureSeedCategories(userId);
	const formData = await event.request.formData();
	const image = formData.get('image');
	const titleRaw = formData.get('title');
	const amountRaw = formData.get('amount');

	const selectedCategory = await db
		.select()
		.from(categories)
		.where(eq(categories.userId, userId))
		.limit(1);
	const category = selectedCategory[0];

	const title =
		typeof titleRaw === 'string' && titleRaw.trim()
			? titleRaw.trim()
			: image instanceof File
				? `Receipt: ${image.name}`
				: 'Receipt Expense';
	const amount =
		typeof amountRaw === 'string' && Number(amountRaw) > 0 ? Number(amountRaw) : 0;

	const expenseId = id();
	await db.insert(expenses).values({
		id: expenseId,
		userId,
		categoryId: category.id,
		title,
		amount: amount.toFixed(2),
		date: new Date(),
		source: 'receipt'
	});

	return apiOk({
		id: expenseId,
		title,
		amount,
		source: 'receipt',
		category_id: {
			_id: category.id,
			name: category.name,
			icon: category.icon,
			color: category.color
		}
	});
};
