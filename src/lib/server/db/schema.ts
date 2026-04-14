import {
	mysqlTable,
	serial,
	int,
	text,
	varchar,
	timestamp,
	decimal,
	datetime
} from 'drizzle-orm/mysql-core';

export const task = mysqlTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: int('priority').notNull().default(1)
});

export const categories = mysqlTable('categories', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	name: varchar('name', { length: 120 }).notNull(),
	icon: varchar('icon', { length: 12 }),
	color: varchar('color', { length: 16 }).default('#6366F1').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export const expenses = mysqlTable('expenses', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	categoryId: varchar('category_id', { length: 36 }).notNull(),
	title: varchar('title', { length: 255 }).notNull(),
	amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
	date: datetime('date').notNull(),
	description: text('description'),
	currency: varchar('currency', { length: 8 }).default('USD').notNull(),
	notes: text('notes'),
	source: varchar('source', { length: 32 }).default('manual').notNull(),
	sourceEmail: varchar('source_email', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export const connectedEmailAccounts = mysqlTable('connected_email_accounts', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull(),
	provider: varchar('provider', { length: 32 }).notNull(),
	connectedAt: timestamp('connected_at').defaultNow().notNull()
});

export const expenseChatMessages = mysqlTable('expense_chat_messages', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	text: text('text').notNull(),
	isUser: int('is_user').notNull().default(1),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const userSettings = mysqlTable('user_settings', {
	userId: varchar('user_id', { length: 255 }).primaryKey(),
	theme: varchar('theme', { length: 16 }).default('system').notNull(),
	currency: varchar('currency', { length: 8 }).default('USD').notNull(),
	countryCode: varchar('country_code', { length: 8 }),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export const fcmTokens = mysqlTable('fcm_tokens', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	token: varchar('token', { length: 255 }).notNull(),
	platform: varchar('platform', { length: 32 }).notNull(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export * from './auth.schema';
