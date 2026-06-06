<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAdd = $state(false);

	type SortCol = 'manufacturer' | 'scale' | 'name' | 'modelNumber' | 'formats';
	let sortCol = $state<SortCol>('manufacturer');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortCol = col;
			sortDir = 'asc';
		}
	}

	let sorted = $derived(
		[...data.trains].sort((a, b) => {
			const av = sortCol === 'formats' ? a.formats.join(', ') : String(a[sortCol] ?? '');
			const bv = sortCol === 'formats' ? b.formats.join(', ') : String(b[sortCol] ?? '');
			return av.localeCompare(bv) * (sortDir === 'asc' ? 1 : -1);
		})
	);

	function si(col: SortCol) {
		return sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
	}
</script>

<svelte:head><title>Trains — Admin</title></svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)]">Trains</h1>
	<button
		onclick={() => (showAdd = !showAdd)}
		class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
	>
		{showAdd ? 'Cancel' : '+ Add Train'}
	</button>
</div>

{#if form?.error}
	<div
		class="bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-[var(--color-danger)] text-sm rounded p-3 mb-4"
	>
		{form.error}
	</div>
{/if}
{#if form?.success}
	<div
		class="bg-[var(--color-ok-bg)] border border-[var(--color-green-mid)] text-[var(--color-green)] text-sm rounded p-3 mb-4"
	>
		Saved successfully.
	</div>
{/if}

{#if showAdd}
	<form
		method="POST"
		action="?/add"
		class="jr-card-flat border border-[var(--color-border)] rounded p-5 mb-6 space-y-4"
	>
		<h2 class="font-semibold text-[var(--color-text)]">Add New Train</h2>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Manufacturer *</label>
				<input
					name="manufacturer"
					type="text"
					placeholder="Kato"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Scale *</label>
				<select
					name="scale"
					class="w-full rounded px-3 py-2 text-sm"
				>
					<option value="N">N</option>
					<option value="HO">HO</option>
					<option value="Z">Z</option>
					<option value="O">O</option>
				</select>
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Name *</label>
			<input
				name="name"
				type="text"
				placeholder="E235 Series Yamanote Line (11-car set)"
				class="w-full rounded px-3 py-2 text-sm"
			/>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Model Number *</label>
				<input
					name="modelNumber"
					type="text"
					placeholder="10-1785"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Road / Operator</label>
				<input
					name="roadName"
					type="text"
					placeholder="JR East"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Era</label>
				<input
					name="era"
					type="text"
					placeholder="2015–present"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-2">Compatible Formats</label>
			<div class="flex flex-col gap-3">
				{#each data.formats as fmt}
					<div class="flex items-center gap-3 p-2 rounded" style="border: 1px solid var(--color-border);">
						<input
							type="checkbox"
							name="formatIds"
							value={fmt.id}
							id="fmt-{fmt.id}"
							class="accent-slate-700 shrink-0"
						/>
						<div style="color: var(--color-green);">
							<FormatDiagram name={fmt.name} size={72} />
						</div>
						<div class="flex-1">
							<label
								for="fmt-{fmt.id}"
								class="text-sm font-medium cursor-pointer block"
								style="color: var(--color-text);">{fmt.name}</label
							>
							{#if fmt.description}
								<p class="text-xs mt-0.5" style="color: var(--color-dim);">{fmt.description}</p>
							{/if}
						</div>
						<select
							name="formatPurposes"
							class="rounded px-2 py-1 text-xs shrink-0"
						>
							<option>Motor & Lights</option>
							<option>Motor Only</option>
							<option>Lights Only</option>
						</select>
					</div>
				{/each}
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Notes</label>
			<textarea
				name="notes"
				rows="2"
				class="w-full rounded px-3 py-2 text-sm"
			></textarea>
		</div>
		<button
			type="submit"
			class="bg-[var(--color-green)] text-white px-5 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
		>
			Save Train
		</button>
	</form>
{/if}

<div class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden">
	<table class="w-full text-sm">
		<thead class="bg-[var(--color-raised)] border-b border-[var(--color-border)]">
			<tr>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('manufacturer')}>Manufacturer{si('manufacturer')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('scale')}>Scale{si('scale')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('name')}>Name{si('name')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('modelNumber')}>Model #{si('modelNumber')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('formats')}>Formats{si('formats')}</th
				>
				<th class="px-4 py-3"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-[var(--color-border)]">
			{#each sorted as t (t.id)}
				<tr class="hover:bg-[var(--color-raised)]">
					<td class="px-4 py-2 font-medium">{t.manufacturer}</td>
					<td class="px-4 py-2"><span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{t.scale}</span></td
					>
					<td class="px-4 py-2">{t.name}</td>
					<td class="px-4 py-2 font-mono text-xs text-[var(--color-muted)]">{t.modelNumber}</td>
					<td class="px-4 py-2 text-xs text-[var(--color-dim)]">{t.formats.join(', ') || '—'}</td>
					<td class="px-4 py-2 text-right">
						<form
							method="POST"
							action="?/delete"
							onsubmit={(e) => {
								if (!confirm('Delete this train?')) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={t.id} />
							<button type="submit" class="text-red-500 hover:text-[var(--color-danger)] text-xs">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
