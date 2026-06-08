<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAdd = $state(false);
	let showAddBrand = $state(false);

	type SortCol = 'brandName' | 'model' | 'formatName' | 'notes';
	let sortCol = $state<SortCol>('brandName');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortCol = col;
			sortDir = 'asc';
		}
	}

	let sorted = $derived(
		[...data.decoders].sort((a, b) => {
			const av = String(a[sortCol] ?? '');
			const bv = String(b[sortCol] ?? '');
			return av.localeCompare(bv) * (sortDir === 'asc' ? 1 : -1);
		})
	);

	function si(col: SortCol) {
		return sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
	}

	// Inline brand/format creator state
	let newBrand = $state(false);
	let newFormat = $state(false);
	let selectedFormatId = $state('');
	const selectedFormat = $derived(data.formats.find(f => String(f.id) === selectedFormatId) ?? null);

	// Edit state
	let editingId = $state<number | null>(null);
	let editingFormatId = $state('');
	const editingFormat = $derived(data.formats.find(f => String(f.id) === editingFormatId) ?? null);
</script>

<svelte:head><title>Decoders — Admin</title></svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)]">Decoders</h1>
	<div class="flex gap-2">
		<button
			onclick={() => {
				showAddBrand = !showAddBrand;
				showAdd = false;
			}}
			class="border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-light)] transition-colors"
		>
			+ Brand
		</button>
		<button
			onclick={() => {
				showAdd = !showAdd;
				showAddBrand = false;
			}}
			class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
		>
			+ Decoder
		</button>
	</div>
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

{#if showAddBrand}
	<form
		method="POST"
		action="?/addBrand"
		class="jr-card-flat border border-[var(--color-border)] rounded p-5 mb-6 space-y-3"
	>
		<h2 class="font-semibold text-[var(--color-text)]">Add Decoder Brand</h2>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Brand Name *</label>
				<input
					name="name"
					type="text"
					placeholder="TCS"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Website</label>
				<input
					name="website"
					type="url"
					placeholder="https://…"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<button
			type="submit"
			class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
		>
			Save Brand
		</button>
	</form>
{/if}

{#if showAdd}
	<form
		method="POST"
		action="?/add"
		class="jr-card-flat border border-[var(--color-border)] rounded p-5 mb-6 space-y-3"
	>
		<h2 class="font-semibold text-[var(--color-text)]">Add Decoder</h2>
		<div class="grid grid-cols-3 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Brand *</label>
				<select
					name="brandId"
					class="w-full rounded px-3 py-2 text-sm"
				>
					<option value="">Select…</option>
					{#each data.brands as b}
						<option value={b.id}>{b.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Format *</label>
				<select
					name="formatId"
					class="w-full rounded px-3 py-2 text-sm"
				>
					<option value="">Select…</option>
					{#each data.formats as f}
						<option value={f.id}>{f.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Model *</label>
				<input
					name="model"
					type="text"
					placeholder="DN163K0"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Notes</label>
				<input
					name="notes"
					type="text"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Buy URL</label>
				<input
					name="buyUrl"
					type="url"
					placeholder="https://…"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
		</div>
		<div class="flex items-center gap-5">
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" name="motor" class="accent-[var(--color-green)]" checked />
				<span class="text-sm">Motor</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" name="lights" class="accent-[var(--color-green)]" checked />
				<span class="text-sm">Lights</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<input type="checkbox" name="soundDecoder" class="accent-[var(--color-green)]" />
				<span class="text-sm">Sound</span>
			</label>
		</div>
		<button
			type="submit"
			class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
		>
			Save Decoder
		</button>
	</form>
{/if}

<div class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden">
	<table class="w-full text-sm">
		<thead class="bg-[var(--color-raised)] border-b border-[var(--color-border)]">
			<tr>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('brandName')}>Brand{si('brandName')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('model')}>Model{si('model')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('formatName')}>Format{si('formatName')}</th
				>
				<th
					class="text-left px-4 py-3 font-medium text-[var(--color-muted)] cursor-pointer select-none hover:text-[var(--color-text)]"
					onclick={() => toggleSort('notes')}>Notes{si('notes')}</th
				>
				<th class="px-4 py-3"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-[var(--color-border)]">
			{#each sorted as dec (dec.id)}
				{#if editingId === dec.id}
					<tr class="bg-[var(--color-raised)]">
						<td colspan="5" class="px-4 py-4">
							<form
								method="POST"
								action="?/update"
								class="space-y-3"
								onsubmit={() => editingId = null}
							>
								<h3 class="font-medium text-[var(--color-text)] mb-3">Edit Decoder</h3>
								<input type="hidden" name="id" value={dec.id} />

								<div class="grid grid-cols-3 gap-4">
									<div>
										<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Brand *</label>
										<select name="brandId" class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
											{#each data.brands as b}
												<option value={b.id} selected={b.id === dec.brandId}>{b.name}</option>
											{/each}
										</select>
									</div>
									<div>
										<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Format *</label>
										<div class="flex gap-3 items-start">
											<select name="formatId" bind:value={editingFormatId} class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
												{#each data.formats as f}
													<option value={String(f.id)} selected={f.id === dec.formatId}>{f.name}</option>
												{/each}
											</select>
											{#if editingFormat}
												<div style="color: var(--color-green);">
													<FormatDiagram name={editingFormat.name} size={32}/>
												</div>
											{/if}
										</div>
									</div>
									<div>
										<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Model *</label>
										<input name="model" type="text" value={dec.model} class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Notes</label>
										<input name="notes" type="text" value={dec.notes ?? ''} class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
									</div>
									<div>
										<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Buy URL</label>
										<input name="buyUrl" type="url" value={dec.buyUrl ?? ''} class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
									</div>
								</div>

								<div class="flex items-center gap-5">
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="checkbox" name="motor" class="accent-slate-700" checked={dec.motor} />
										<span class="text-sm">Motor</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="checkbox" name="lights" class="accent-slate-700" checked={dec.lights} />
										<span class="text-sm">Lights</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input type="checkbox" name="soundDecoder" class="accent-slate-700" checked={dec.soundDecoder} />
										<span class="text-sm">Sound</span>
									</label>
								</div>

								<div class="flex gap-2">
									<button type="submit" class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors">
										Save
									</button>
									<button type="button" onclick={() => editingId = null} class="border border-slate-300 text-[var(--color-text)] px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-raised)] transition-colors">
										Cancel
									</button>
								</div>
							</form>
						</td>
					</tr>
				{:else}
					<tr class="hover:bg-[var(--color-raised)]">
						<td class="px-4 py-2 font-medium">{dec.brandName}</td>
						<td class="px-4 py-2 font-mono text-xs"
							>{dec.model}
							{#if dec.soundDecoder}<span class="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 rounded">Sound</span
								>{/if}
						</td>
						<td class="px-4 py-2 text-[var(--color-muted)] text-xs">{dec.formatName}</td>
						<td class="px-4 py-2 text-[var(--color-dim)] text-xs">{dec.notes ?? '—'}</td>
						<td class="px-4 py-2 text-right space-x-2">
							<button
								type="button"
								onclick={() => {
									editingId = dec.id;
									editingFormatId = String(dec.formatId);
								}}
								class="text-blue-500 hover:text-blue-700 text-xs"
							>
								Edit
							</button>
							<form
								method="POST"
								action="?/delete"
								class="inline"
								onsubmit={(e) => {
									if (!confirm('Delete this decoder?')) e.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={dec.id} />
								<button type="submit" class="text-red-500 hover:text-[var(--color-danger)] text-xs">Delete</button>
							</form>
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
