<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';
	import MotorIcon from '$lib/icons/MotorIcon.svelte';
	import LightsIcon from '$lib/icons/LightsIcon.svelte';
	import SoundIcon from '$lib/icons/SoundIcon.svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAdd = $state(false);

	// Track which format checkboxes are checked to show decoder lists
	let checkedFormats = $state(new Set<number>());
	function toggleFormat(id: number, checked: boolean) {
		const next = new Set(checkedFormats);
		checked ? next.add(id) : next.delete(id);
		checkedFormats = next;
	}
	function decodersFor(formatId: number) {
		return data.allDecoders.filter(d => d.formatId === formatId);
	}

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
	<h1 class="text-2xl font-bold text-[var(--color-text)] font-bold">Trains</h1>
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
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="mfr">Manufacturer *</label>
				<input
					id="mfr"
					name="manufacturer"
					type="text"
					list="mfr-list"
					placeholder="Kato"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
				<datalist id="mfr-list">
					{#each data.manufacturers as m}<option value={m}/>{/each}
				</datalist>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="scale">Scale *</label>
				<input
					id="scale"
					name="scale"
					type="text"
					list="scale-list"
					placeholder="N"
					class="w-full rounded px-3 py-2 text-sm focus:outline-none"
				/>
				<datalist id="scale-list">
					{#each data.scales as s}<option value={s}/>{/each}
				</datalist>
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Name *</label>
			<input
				name="name"
				type="text"
				placeholder="E235 Series Yamanote Line (11-car set)"
				class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
			/>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Model Number *</label>
				<input
					name="modelNumber"
					type="text"
					placeholder="10-1785"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1" for="roadName">Road / Operator</label>
				<input
					id="roadName"
					name="roadName"
					type="text"
					list="operator-list"
					placeholder="JR East"
					class="w-full rounded px-3 py-2 text-sm focus:outline-none"
				/>
				<datalist id="operator-list">
					{#each data.operators as o}<option value={o}/>{/each}
				</datalist>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Era</label>
				<input
					name="era"
					type="text"
					placeholder="2015–present"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-2">Compatible Formats</label>
			<div class="flex flex-col gap-3">
				{#each data.formats as fmt}
					<div class="rounded" style="border: 1px solid var(--color-border);">
						<!-- Format header row -->
						<div class="flex items-center gap-3 p-2">
							<input
								type="checkbox"
								name="formatIds"
								value={fmt.id}
								id="fmt-{fmt.id}"
								class="accent-slate-700 shrink-0"
								onchange={(e) => toggleFormat(fmt.id, (e.target as HTMLInputElement).checked)}
							/>
							<div style="color: var(--color-green);">
								<FormatDiagram name={fmt.name} size={72} />
							</div>
							<div class="flex-1">
								<label for="fmt-{fmt.id}" class="text-sm font-medium cursor-pointer block" style="color: var(--color-text);">{fmt.name}</label>
								{#if fmt.description}
									<p class="text-xs mt-0.5" style="color: var(--color-dim);">{fmt.description}</p>
								{/if}
							</div>
							<select name="formatPurposes"
								style="background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text);"
								class="rounded px-2 py-1 text-xs focus:outline-none shrink-0">
								<option>Motor & Lights</option>
								<option>Motor Only</option>
								<option>Lights Only</option>
							</select>
						</div>

						<!-- Decoder checklist — shown when format is checked -->
						{#if checkedFormats.has(fmt.id)}
							{@const fmtDecoders = decodersFor(fmt.id)}
							<div class="border-t px-3 py-2" style="border-color: var(--color-border); background: var(--color-raised);">
								{#if fmtDecoders.length === 0}
									<p class="text-xs italic" style="color: var(--color-dim);">
										No decoders listed for this format.
										<a href="/admin/decoders" target="_blank" class="underline" style="color: var(--color-green);">Add one first →</a>
									</p>
								{:else}
									<p class="text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);">Confirmed decoders</p>
									<div class="flex flex-col gap-1">
										{#each fmtDecoders as dec}
											<label class="flex items-center gap-2 cursor-pointer text-xs">
												<input type="checkbox" name="decoderIds" value={dec.id} class="accent-slate-700 w-3.5 h-3.5" />
												<span class="font-medium" style="color: var(--color-text);">{dec.brandName}</span>
												<span class="font-mono" style="color: var(--color-muted);">{dec.model}</span>
												<span class="flex items-center gap-0.5" style="color: var(--color-green);">
													{#if dec.motor}<MotorIcon class="w-3 h-3"/>{/if}
													{#if dec.lights}<LightsIcon class="w-3 h-3"/>{/if}
													{#if dec.soundDecoder}<SoundIcon class="w-3 h-3" style="color: #7c3aed;"/>{/if}
												</span>
											</label>
										{/each}
									</div>
									<p class="text-xs mt-2" style="color: var(--color-dim);">
										Decoder not listed?
										<a href="/admin/decoders" target="_blank" class="underline" style="color: var(--color-green);">Add it to the decoders database first →</a>
									</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		<div>
			<label class="block text-xs font-medium text-[var(--color-muted)] mb-1">Notes</label>
			<textarea
				name="notes"
				rows="2"
				class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
