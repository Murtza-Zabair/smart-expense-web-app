import type { Expense } from '$lib/types/expense';

export const mockExpenses: Expense[] = [
	{
		id: 'exp-001',
		title: 'Starbucks Coffee',
		amount: 7.8,
		category: 'Food',
		categoryIcon: '🍔',
		date: '2026-03-27T08:45:00Z',
		source: 'gmail',
		sourceEmail: 'receipts@starbucks.com'
	},
	{
		id: 'exp-002',
		title: 'Uber Ride Downtown',
		amount: 21.6,
		category: 'Travel',
		categoryIcon: '🚕',
		date: '2026-03-26T17:20:00Z',
		source: 'outlook',
		sourceEmail: 'noreply@uber.com'
	},
	{
		id: 'exp-003',
		title: 'Groceries',
		amount: 63.1,
		category: 'Shopping',
		categoryIcon: '🛍️',
		date: '2026-03-25T11:05:00Z',
		source: 'manual'
	},
	{
		id: 'exp-004',
		title: 'Netflix Subscription',
		amount: 11.99,
		category: 'Entertainment',
		categoryIcon: '🎬',
		date: '2026-03-22T09:00:00Z',
		source: 'gmail',
		sourceEmail: 'info@netflix.com'
	}
];

export const sourceOptions = [
	{ key: 'chat', label: 'Add with chat', subtitle: 'Describe your expense naturally.' },
	{ key: 'receipt', label: 'Receipt upload', subtitle: 'Upload and extract data from receipts.' },
	{ key: 'gmail', label: 'Email receipts', subtitle: 'Import expenses from connected inboxes.' },
	{ key: 'manual', label: 'Manual entry', subtitle: 'Fill in title, amount, and category.' }
];
