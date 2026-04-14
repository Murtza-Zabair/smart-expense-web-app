import { eq } from 'drizzle-orm';
import {
	apiFail,
	apiOk,
	categories,
	db,
	ensureSeedCategories,
	expenseChatMessages,
	expenses,
	getUserId,
	id
} from '$lib/server/api';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const userId = getUserId(event);
	await ensureSeedCategories(userId);
	const body = await event.request.json().catch(() => null);
	const message = body?.message ? String(body.message).trim() : '';
	if (!message) return apiFail('message is required');

	await db.insert(expenseChatMessages).values({
		id: id(),
		userId,
		text: message,
		isUser: 1
	});

	const amountMatch = message.match(/(\d+(\.\d+)?)/);
	const amount = amountMatch ? Number(amountMatch[1]) : 0;
	const title = message.length > 60 ? `${message.slice(0, 57)}...` : message;
	let createdExpense = null;

	if (amount > 0) {
		const defaultCategory = await db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.limit(1);
		const categoryId = defaultCategory[0]?.id;
		if (categoryId) {
			const expenseId = id();
			await db.insert(expenses).values({
				id: expenseId,
				userId,
				categoryId,
				title,
				amount: amount.toFixed(2),
				date: new Date(),
				source: 'chat'
			});
			createdExpense = {
				id: expenseId,
				title,
				amount
			};
		}
	}

	const assistantMessage = createdExpense
		? `Expense saved: ${createdExpense.title} (${createdExpense.amount}).`
		: 'Got it. Include an amount to auto-create an expense.';

	await db.insert(expenseChatMessages).values({
		id: id(),
		userId,
		text: assistantMessage,
		isUser: 0
	});

	return apiOk({
		assistant_message: assistantMessage,
		expense: createdExpense
	});
};
