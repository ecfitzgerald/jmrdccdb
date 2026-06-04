<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAdd = $state(false);

	type SortCol = 'name' | 'pinCount' | 'description' | 'trainCount';
	let sortCol = $state<SortCol>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortCol = col;
			sortDir = 'asc';
		}
	}

	const numericCols = new Set<SortCol>(['pinCount', 'trainCount']);

	let sorted = $derived(
		[...data.formats].sort((a, b) => {
			const av = a[sortCol] ?? (numericCols.has(sortCol) ? -Infinity : '');
			const bv = b[sortCol] ?? (numericCols.has(sortCol) ? -Infinity : '');
			const cmp = numericCols.has(sortCol) ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
			return cmp * (sortDir === 'asc' ? 1 : -1);
		})
	);

	function si(col: SortCol) {
		return sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
	}
</script>

<svelte:head><title>Formats — Admin</title></svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)] font-bold">DCC Formats</h1>
	<button
		onclick={() => (showAdd = !showAdd)}
		class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
	>
		{showAdd ? 'Cancel' : '+ Add Format'}
	</button>
</div>

{#if form?.error}<div
		class="bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-[var(--color-danger)] text-sm rounded p-3 mb-4"
	>
		{form.error}
	</div>{/if}
{#if form?.success}<div
		class="bg-[var(--color-ok-bg)] border border-[var(--color-green-mid)] text-[var(--color-green)] text-sm rounded p-3 mb-4"
	>
		Saved.
	</div>{/if}

{#if showAdd}
	<form
		method="POST"
		action="?/add"
		class="jr-card-flat border border-[var(--color-border)] rounded p-5 mb-6 space-y-4"
	>
		<h2 class="font-semibold text-[var(--color-text)]">Add Format</h2>
		<div class="grid grid-cols-3 gap-4">
			<div class="col-span-2">
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="fname">Name *</label>
				<input
					id="fname"
					name="name"
					type="text"
					placeholder="Next18"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="pinCount">Pin count</label>
				<input
					id="pinCount"
					name="pinCount"
					type="number"
					placeholder="18"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="fdesc">Description</label>
			<input
				id="fdesc"
				name="description"
				type="text"
				placeholder="Brief description of the format"
				class="w-full rounded px-3 py-2 text-sm"
			/>
		</div>
		<div class="w-32">
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="sortOrder">Sort order</label>
			<input
				id="sortOrder"
				name="sortOrder"
				type="number"
				placeholder="0"
				class="w-full rounded px-3 py-2 text-sm"
			/>
		</div>
		<button
			type="submit"
			class="bg-[var(--color-green)] text-white px-5 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
		>
			Save Format
		</button>
	</form>
{/if}

<div class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden">
	<table class="w-full text-sm">
		<thead class="bg-[var(--color-raised)] border-b border-[var(--color-border)]">
			<tr>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('name')}>Name{si('name')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('pinCount')}>Pins{si('pinCount')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('description')}>Description{si('description')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('trainCount')}>Trains using{si('trainCount')}</th
				>
				<th class="px-4 py-3"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-[var(--color-border)]">
			{#each sorted as fmt (fmt.id)}
				<tr class="hover:bg-[var(--color-raised)]">
					<td class="px-4 py-2 font-medium">{fmt.name}</td>
					<td class="px-4 py-2 text-[var(--color-dim)]">{fmt.pinCount ?? '—'}</td>
					<td class="px-4 py-2 text-[var(--color-dim)] text-xs">{fmt.description ?? '—'}</td>
					<td class="px-4 py-2 text-[var(--color-dim)]">{fmt.trainCount}</td>
					<td class="px-4 py-2 text-right">
						{#if fmt.trainCount === 0}
							<form
								method="POST"
								action="?/delete"
								onsubmit={(e) => {
									if (!confirm('Delete this format?')) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={fmt.id} />
								<button type="submit" class="text-red-500 hover:text-[var(--color-danger)] text-xs">Delete</button>
							</form>
						{:else}
							<span class="text-xs text-gray-300">in use</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
