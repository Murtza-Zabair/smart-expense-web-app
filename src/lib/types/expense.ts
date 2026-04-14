export type ExpenseSource = 'manual' | 'gmail' | 'outlook' | 'chat' | 'receipt';

export type Expense = {
	id: string;
	title: string;
	amount: number;
	category: string;
	categoryIcon: string;
	date: string;
	notes?: string;
	source: ExpenseSource;
	sourceEmail?: string;
};

export type AppTheme = 'light' | 'dark' | 'system';
export type AppTab = 'dashboard' | 'expenses' | 'emails' | 'settings';
