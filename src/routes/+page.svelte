<script lang="ts">
	import { mockExpenses, sourceOptions } from '$lib/data/mockData';
	import type { AppTab, AppTheme, Expense, ExpenseSource } from '$lib/types/expense';

	const storageKey = 'smart-expense-web-v1';
	const currencyOptions = ['USD', 'EUR', 'GBP', 'PKR', 'INR'];
	const categoryOptions = [
		{ label: 'Food', icon: '🍔' },
		{ label: 'Travel', icon: '🚕' },
		{ label: 'Shopping', icon: '🛍️' },
		{ label: 'Bills', icon: '🧾' },
		{ label: 'Entertainment', icon: '🎬' }
	];

	type PersistedState = {
		expenses: Expense[];
		theme: AppTheme;
		currency: string;
	};

	const readStoredState = (): PersistedState | null => {
		if (typeof localStorage === 'undefined') return null;
		const raw = localStorage.getItem(storageKey);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as PersistedState;
		} catch {
			return null;
		}
	};

	const initial = readStoredState();

	let activeTab = $state<AppTab>('dashboard');
	let expenses = $state<Expense[]>(initial?.expenses?.length ? initial.expenses : mockExpenses);
	let theme = $state<AppTheme>(initial?.theme ?? 'system');
	let currency = $state(initial?.currency ?? 'USD');
	let search = $state('');
	let filter = $state<'week' | 'month' | 'year'>('month');
	let showAddModal = $state(false);
	let showForm = $state(false);
	let formTitle = $state('');
	let formAmount = $state<number>(0);
	let formCategory = $state('Food');
	let formDate = $state(new Date().toISOString().slice(0, 10));
	let formNotes = $state('');
	let editingId = $state<string | null>(null);

	const isDark = $derived(
		theme === 'dark' ||
			(theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
	);

	const now = $derived(new Date());

	const filteredExpenses = $derived.by(() => {
		const query = search.trim().toLowerCase();
		return [...expenses]
			.filter((expense) => {
				const expenseDate = new Date(expense.date);
				const dayDiff = (now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24);

				const withinRange =
					filter === 'week'
						? dayDiff <= 7
						: filter === 'month'
							? expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
							: expenseDate.getFullYear() === now.getFullYear();

				const matchesQuery =
					!query ||
					expense.title.toLowerCase().includes(query) ||
					expense.category.toLowerCase().includes(query) ||
					(expense.sourceEmail ?? '').toLowerCase().includes(query);

				return withinRange && matchesQuery;
			})
			.sort((a, b) => +new Date(b.date) - +new Date(a.date));
	});

	const totalSpend = $derived(filteredExpenses.reduce((sum, item) => sum + item.amount, 0));
	const todaySpend = $derived(
		expenses
			.filter((expense) => new Date(expense.date).toDateString() === now.toDateString())
			.reduce((sum, item) => sum + item.amount, 0)
	);
	const monthlySpend = $derived(
		expenses
			.filter((expense) => {
				const d = new Date(expense.date);
				return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
			})
			.reduce((sum, item) => sum + item.amount, 0)
	);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			maximumFractionDigits: 2
		}).format(value);

	const formatDate = (date: string) =>
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(date));

	const saveState = () => {
		if (typeof localStorage === 'undefined') return;
		const payload: PersistedState = { expenses, theme, currency };
		localStorage.setItem(storageKey, JSON.stringify(payload));
	};

	$effect(() => {
		saveState();
	});

	const openAddExpenseForm = (source: ExpenseSource = 'manual') => {
		showAddModal = false;
		showForm = true;
		editingId = null;
		formTitle = '';
		formAmount = 0;
		formCategory = 'Food';
		formDate = new Date().toISOString().slice(0, 10);
		formNotes = source === 'chat' ? 'Added via chat flow' : source === 'receipt' ? 'Added via receipt upload flow' : '';
	};

	const startEdit = (expense: Expense) => {
		showForm = true;
		editingId = expense.id;
		formTitle = expense.title;
		formAmount = expense.amount;
		formCategory = expense.category;
		formDate = new Date(expense.date).toISOString().slice(0, 10);
		formNotes = expense.notes ?? '';
	};

	const removeExpense = (id: string) => {
		expenses = expenses.filter((item) => item.id !== id);
	};

	const submitExpenseForm = () => {
		const category = categoryOptions.find((item) => item.label === formCategory) ?? categoryOptions[0];
		const payload: Expense = {
			id: editingId ?? `exp-${Date.now()}`,
			title: formTitle.trim(),
			amount: Number(formAmount),
			category: category.label,
			categoryIcon: category.icon,
			date: new Date(formDate).toISOString(),
			notes: formNotes.trim() || undefined,
			source: 'manual'
		};

		if (!payload.title || payload.amount <= 0) return;

		if (editingId) {
			expenses = expenses.map((item) => (item.id === editingId ? payload : item));
		} else {
			expenses = [payload, ...expenses];
		}

		showForm = false;
	};
</script>

<main class="min-h-screen transition-colors duration-300" class:bg-slate-950={isDark} class:text-slate-100={isDark}>
	<div class="mx-auto max-w-6xl px-4 py-6 md:px-6">
		<header class="mb-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white shadow-lg">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div>
					<p class="text-sm/5 opacity-85">Smart Expense Web</p>
					<h1 class="text-2xl font-bold">Expense Dashboard</h1>
				</div>
				<div class="flex items-center gap-2">
					<select class="rounded-xl border-0 bg-white/20 px-3 py-2 text-sm" bind:value={currency}>
						{#each currencyOptions as code}
							<option value={code} class="text-black">{code}</option>
						{/each}
					</select>
					<button class="rounded-xl bg-white/20 px-3 py-2 text-sm" onclick={() => (showAddModal = true)}>
						Add Expense
					</button>
				</div>
			</div>
			<div class="mt-5 grid gap-3 md:grid-cols-3">
				<div class="rounded-2xl bg-white/15 p-4">
					<p class="text-xs opacity-80">This month</p>
					<p class="mt-1 text-xl font-semibold">{formatCurrency(monthlySpend)}</p>
				</div>
				<div class="rounded-2xl bg-white/15 p-4">
					<p class="text-xs opacity-80">Today</p>
					<p class="mt-1 text-xl font-semibold">{formatCurrency(todaySpend)}</p>
				</div>
				<div class="rounded-2xl bg-white/15 p-4">
					<p class="text-xs opacity-80">Transactions</p>
					<p class="mt-1 text-xl font-semibold">{filteredExpenses.length}</p>
				</div>
			</div>
		</header>

		<nav class={`mb-6 grid grid-cols-4 gap-2 rounded-2xl p-1 ${isDark ? 'bg-slate-900/70' : 'bg-slate-100'}`}>
			{#each [
				{ id: 'dashboard', label: 'Dashboard' },
				{ id: 'expenses', label: 'Expenses' },
				{ id: 'emails', label: 'Emails' },
				{ id: 'settings', label: 'Settings' }
			] as item}
				<button
					class="rounded-xl px-3 py-2 text-sm font-medium"
					class:bg-indigo-500={activeTab === item.id}
					class:text-white={activeTab === item.id}
					onclick={() => (activeTab = item.id as AppTab)}
				>
					{item.label}
				</button>
			{/each}
		</nav>

		{#if activeTab === 'dashboard'}
			<section class="grid gap-4 md:grid-cols-2">
				<div class="rounded-2xl border p-5" class:border-slate-800={isDark}>
					<h2 class="text-lg font-semibold">Recent Expenses</h2>
					<div class="mt-4 space-y-3">
						{#if expenses.length === 0}
							<p class="text-sm opacity-70">No expenses yet. Start by adding one.</p>
						{:else}
							{#each expenses.slice(0, 5) as expense}
								<div class="flex items-center justify-between rounded-xl border p-3" class:border-slate-800={isDark}>
									<div class="flex items-center gap-3">
										<span class="text-xl">{expense.categoryIcon}</span>
										<div>
											<p class="text-sm font-medium">{expense.title}</p>
											<p class="text-xs opacity-70">{expense.category} • {formatDate(expense.date)}</p>
										</div>
									</div>
									<p class="font-semibold">{formatCurrency(expense.amount)}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				<div class="rounded-2xl border p-5" class:border-slate-800={isDark}>
					<h2 class="text-lg font-semibold">Category Breakdown</h2>
					<div class="mt-4 space-y-3">
						{#each categoryOptions as category}
							{@const categoryTotal = expenses
								.filter((item) => item.category === category.label)
								.reduce((sum, item) => sum + item.amount, 0)}
							<div>
								<div class="mb-1 flex justify-between text-sm">
									<span>{category.icon} {category.label}</span>
									<span>{formatCurrency(categoryTotal)}</span>
								</div>
								<div class="h-2 rounded bg-slate-200" class:bg-slate-800={isDark}>
									<div
										class="h-2 rounded bg-indigo-500"
										style={`width: ${monthlySpend ? Math.min((categoryTotal / monthlySpend) * 100, 100) : 0}%`}
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if activeTab === 'expenses'}
			<section class="rounded-2xl border p-5" class:border-slate-800={isDark}>
				<div class="mb-4 flex flex-wrap items-center gap-3">
					<input
						class="min-w-64 flex-1 rounded-xl border px-3 py-2 text-sm"
						class:border-slate-700={isDark}
						placeholder="Search by title, category, or source email"
						bind:value={search}
					/>
					<select class="rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} bind:value={filter}>
						<option value="week">This Week</option>
						<option value="month">This Month</option>
						<option value="year">This Year</option>
					</select>
					<button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm text-white" onclick={() => openAddExpenseForm()}>
						Manual Entry
					</button>
				</div>
				<div class="mb-4 rounded-xl bg-indigo-500/10 p-4">
					<p class="text-xs opacity-70">Filtered total</p>
					<p class="text-xl font-semibold">{formatCurrency(totalSpend)}</p>
				</div>
				<div class="space-y-3">
					{#if filteredExpenses.length === 0}
						<p class="text-sm opacity-70">No expenses found for current filters.</p>
					{:else}
						{#each filteredExpenses as expense}
							<div class="rounded-xl border p-3" class:border-slate-800={isDark}>
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div>
										<p class="font-medium">{expense.categoryIcon} {expense.title}</p>
										<p class="text-xs opacity-70">
											{expense.category} • {formatDate(expense.date)} • {expense.source}
											{#if expense.sourceEmail}
												({expense.sourceEmail})
											{/if}
										</p>
									</div>
									<p class="font-semibold">{formatCurrency(expense.amount)}</p>
								</div>
								<div class="mt-3 flex gap-2">
									<button class="rounded-lg border px-3 py-1 text-xs" class:border-slate-700={isDark} onclick={() => startEdit(expense)}>
										Edit
									</button>
									<button
										class="rounded-lg border border-red-400 px-3 py-1 text-xs text-red-500"
										onclick={() => removeExpense(expense.id)}
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</section>
		{/if}

		{#if activeTab === 'emails'}
			<section class="rounded-2xl border p-5" class:border-slate-800={isDark}>
				<h2 class="text-lg font-semibold">Connected Emails</h2>
				<p class="mt-2 text-sm opacity-75">
					Web placeholder for Gmail/Outlook connection flow from the Flutter app.
				</p>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<div class="rounded-xl border p-4" class:border-slate-800={isDark}>
						<p class="font-medium">Gmail</p>
						<p class="text-sm opacity-70">Connected as receipts@gmail.com</p>
					</div>
					<div class="rounded-xl border p-4" class:border-slate-800={isDark}>
						<p class="font-medium">Outlook</p>
						<p class="text-sm opacity-70">Not connected</p>
					</div>
				</div>
			</section>
		{/if}

		{#if activeTab === 'settings'}
			<section class="rounded-2xl border p-5" class:border-slate-800={isDark}>
				<h2 class="text-lg font-semibold">Settings</h2>
				<div class="mt-4 grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="mb-1 block text-sm opacity-80">Theme</span>
						<select class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} bind:value={theme}>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
							<option value="system">System</option>
						</select>
					</label>
					<label class="block">
						<span class="mb-1 block text-sm opacity-80">Currency</span>
						<select class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} bind:value={currency}>
							{#each currencyOptions as code}
								<option value={code}>{code}</option>
							{/each}
						</select>
					</label>
				</div>
				<div class="mt-6 rounded-xl border border-red-300 p-4">
					<p class="font-medium text-red-500">Sign out</p>
					<p class="text-sm opacity-75">Auth is not wired yet on web, but this keeps Flutter parity in layout.</p>
				</div>
			</section>
		{/if}
	</div>

	{#if showAddModal}
		<div class="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
			<div class="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl" class:bg-slate-900={isDark}>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold">Add Expense</h3>
					<button class="text-sm opacity-70" onclick={() => (showAddModal = false)}>Close</button>
				</div>
				<div class="space-y-3">
					{#each sourceOptions as option}
						<button
							class="w-full rounded-xl border p-3 text-left"
							class:border-slate-700={isDark}
							onclick={() => (option.key === 'manual' ? openAddExpenseForm() : openAddExpenseForm(option.key as ExpenseSource))}
						>
							<p class="font-medium">{option.label}</p>
							<p class="text-xs opacity-70">{option.subtitle}</p>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if showForm}
		<div class="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
			<div class="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" class:bg-slate-900={isDark}>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold">{editingId ? 'Edit Expense' : 'Manual Expense Entry'}</h3>
					<button class="text-sm opacity-70" onclick={() => (showForm = false)}>Close</button>
				</div>
				<form
					class="space-y-3"
					onsubmit={(event) => {
						event.preventDefault();
						submitExpenseForm();
					}}
				>
					<label class="block">
						<span class="mb-1 block text-sm opacity-80">Title</span>
						<input class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} bind:value={formTitle} required />
					</label>
					<label class="block">
						<span class="mb-1 block text-sm opacity-80">Amount</span>
						<input class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} type="number" min="0.01" step="0.01" bind:value={formAmount} required />
					</label>
					<div class="grid gap-3 md:grid-cols-2">
						<label class="block">
							<span class="mb-1 block text-sm opacity-80">Category</span>
							<select class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} bind:value={formCategory}>
								{#each categoryOptions as category}
									<option value={category.label}>{category.icon} {category.label}</option>
								{/each}
							</select>
						</label>
						<label class="block">
							<span class="mb-1 block text-sm opacity-80">Date</span>
							<input class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} type="date" bind:value={formDate} />
						</label>
					</div>
					<label class="block">
						<span class="mb-1 block text-sm opacity-80">Notes</span>
						<textarea class="w-full rounded-xl border px-3 py-2 text-sm" class:border-slate-700={isDark} rows="3" bind:value={formNotes}></textarea>
					</label>
					<button class="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white" type="submit">
						{editingId ? 'Save Changes' : 'Add Expense'}
					</button>
				</form>
			</div>
		</div>
	{/if}
</main>

