<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { shortFormat } from '$lib/format-utils';
	import MotorIcon from '$lib/icons/MotorIcon.svelte';
	import LightsIcon from '$lib/icons/LightsIcon.svelte';
	import SoundIcon from '$lib/icons/SoundIcon.svelte';

	let { data }: { data: PageData } = $props();

	let q = $state('');
	let formatFilter = $state('');
	let manufacturerFilter = $state('');
	let scaleFilter = $state('');

	type SortCol = 'manufacturer' | 'scale' | 'name' | 'modelNumber' | 'operatorName';

	const sortColumns: [SortCol, string][] = [
		['manufacturer', 'Manufacturer'],
		['scale', 'Scale'],
		['name', 'Model Name'],
		['modelNumber', 'Model No.'],
		['operatorName', 'Operator']
	];

	let sortCol = $state<SortCol>('manufacturer');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortCol = col;
			sortDir = 'asc';
		}
	}

	function sortIcon(col: string) {
		if (sortCol !== col) return '↕';
		return sortDir === 'asc' ? '↑' : '↓';
	}

	const iconClass = 'inline w-3 h-3 opacity-70';

	const filtered = $derived(() => {
		const qLower = q.toLowerCase();
		return data.trains.filter((t) => {
			if (manufacturerFilter && t.manufacturer !== manufacturerFilter) return false;
			if (scaleFilter && t.scale !== scaleFilter) return false;
			if (formatFilter && !t.formats.some((f) => f.formatId === Number(formatFilter))) return false;
			if (
				qLower &&
				![t.name, t.manufacturer, t.modelNumber, t.operatorName ?? ''].some((s) => s.toLowerCase().includes(qLower))
			)
				return false;
			return true;
		});
	});

	const sorted = $derived(
		[...filtered()].sort((a, b) => {
			const av = (a[sortCol] ?? '').toString().toLowerCase();
			const bv = (b[sortCol] ?? '').toString().toLowerCase();
			return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
		})
	);

	const activeFilters = $derived(() => {
		const pills: { label: string; clear: () => void }[] = [];
		if (manufacturerFilter) pills.push({ label: manufacturerFilter, clear: () => (manufacturerFilter = '') });
		if (scaleFilter) pills.push({ label: `Scale: ${scaleFilter}`, clear: () => (scaleFilter = '') });
		if (formatFilter) {
			const fmt = data.formats.find((f) => String(f.id) === formatFilter);
			if (fmt) pills.push({ label: shortFormat(fmt.name), clear: () => (formatFilter = '') });
		}
		if (q) pills.push({ label: `"${q}"`, clear: () => (q = '') });
		return pills;
	});
</script>

<svelte:head>
	<title>DCC Compatibility — Japanese Model Trains</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex items-end justify-between">
	<div>
		<h1 class="text-2xl font-bold" style="color: var(--color-text);">Decoder Compatibility</h1>
		<p class="text-sm mt-0.5" style="color: var(--color-muted);">
			Find which DCC decoders fit your Japanese model train.
		</p>
	</div>
	<div class="text-right text-xs hidden sm:block" style="color: var(--color-muted);">
		<span class="font-bold" style="color: var(--color-green);">{data.trains.length}</span> trains ·
		<span class="font-bold" style="color: var(--color-green);">{data.formats.length}</span> formats ·
		<span class="font-bold" style="color: var(--color-green);"
			>{data.trains.reduce((n, t) => n + t.formats.reduce((m, f) => m + (f.decoderCount ?? 0), 0), 0)}</span
		> decoders
	</div>
</div>

<!-- Filters -->
<div class="jr-card-flat p-4 mb-2 flex flex-wrap gap-3 items-end">
	<div class="flex-1 min-w-48">
		<label class="block text-xs font-medium mb-1" style="color: var(--color-muted);" for="q">Search</label>
		<input
			id="q"
			type="search"
			placeholder="Train name, model number, road name…"
			bind:value={q}
			class="w-full rounded px-3 py-2 text-sm focus:outline-none"
		/>
	</div>
	<div class="min-w-36">
		<label class="block text-xs font-medium mb-1" style="color: var(--color-muted);" for="manufacturer"
			>Manufacturer</label
		>
		<select
			id="manufacturer"
			bind:value={manufacturerFilter}
			class="w-full rounded px-3 py-2 text-sm focus:outline-none"
		>
			<option value="">All</option>
			{#each data.manufacturers as m}
				<option value={m}>{m}</option>
			{/each}
		</select>
	</div>
	<div class="min-w-28">
		<label class="block text-xs font-medium mb-1" style="color: var(--color-muted);" for="scale">Scale</label>
		<select id="scale" bind:value={scaleFilter} class="w-full rounded px-3 py-2 text-sm focus:outline-none">
			<option value="">All</option>
			{#each data.scales as s}
				<option value={s}>{s}</option>
			{/each}
		</select>
	</div>
	<div class="min-w-44">
		<label class="block text-xs font-medium mb-1" style="color: var(--color-muted);" for="format">DCC Format</label>
		<select id="format" bind:value={formatFilter} class="w-full rounded px-3 py-2 text-sm focus:outline-none">
			<option value="">All</option>
			{#each data.formats as f}
				<option value={String(f.id)}>{f.name}</option>
			{/each}
		</select>
	</div>
</div>

<!-- Active filter pills -->
{#if activeFilters().length > 0}
	<div class="flex flex-wrap gap-2 mb-4 px-1">
		{#each activeFilters() as pill}
			<button
				onclick={pill.clear}
				class="filter-pill inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border transition-colors"
			>
				{pill.label} <span class="opacity-60 text-sm leading-none">×</span>
			</button>
		{/each}
		{#if activeFilters().length > 1}
			<button
				onclick={() => {
					q = '';
					manufacturerFilter = '';
					scaleFilter = '';
					formatFilter = '';
				}}
				class="text-xs px-1 py-1 transition-colors hover:underline"
				style="color: var(--color-dim);"
			>
				Clear all
			</button>
		{/if}
	</div>
{:else}
	<div class="mb-4"></div>
{/if}

<!-- Results -->
{#if sorted.length === 0}
	<div class="text-center py-16" style="color: var(--color-dim);">
		<div class="text-5xl mb-4" style="color: var(--color-green-mid);">○</div>
		<p class="font-medium" style="color: var(--color-muted);">No trains found.</p>
		<p class="text-sm mt-1">
			Try a different search or <a href="/suggest" class="underline" style="color: var(--color-green);"
				>suggest a new entry</a
			>.
		</p>
	</div>
{:else}
	<div class="text-xs mb-2" style="color: var(--color-dim);">
		{sorted.length}{sorted.length < data.trains.length ? ` of ${data.trains.length}` : ''} train{sorted.length !== 1
			? 's'
			: ''}
	</div>

	<div class="jr-card-flat overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr style="background: var(--color-green); color: #fff;">
						{#each sortColumns as [col, label]}
							<th class="text-left px-4 py-3 whitespace-nowrap">
								<button
									onclick={() => toggleSort(col)}
									class="flex items-center gap-1 text-xs font-semibold tracking-wide uppercase transition-opacity hover:opacity-75 text-white"
									style="opacity: {sortCol === col ? '1' : '0.75'};"
								>
									{label}
									<span class="opacity-60">{sortIcon(col)}</span>
								</button>
							</th>
						{/each}
						<th class="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-white">
							<div class="flex items-center gap-3">
								<span class="opacity-75">Formats</span>
								<span class="flex items-center gap-2 font-normal normal-case tracking-normal opacity-60 text-xs">
									<span class="flex items-center gap-0.5">
										<MotorIcon class="w-3 h-3" />
										motor
									</span>
									·
									<span class="flex items-center gap-0.5">
										<LightsIcon class="w-3 h-3" />
										lights
									</span>
									·
									<span class="flex items-center gap-0.5">
										<SoundIcon class="w-3 h-3" />
										sound
									</span>
								</span>
							</div>
						</th>
						<th class="px-4 py-3 w-6"></th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as train, i (train.id)}
						<tr
							class="group cursor-pointer transition-colors"
							style="border-top: 1px solid var(--color-border); background: {i % 2 === 1
								? 'var(--color-raised)'
								: 'var(--color-surface)'};"
							onclick={(e) => {
								if ((e.target as HTMLElement).closest('a, button')) return;
								if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
								goto(`/trains/${train.id}`);
							}}
							onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-green-light)')}
							onmouseleave={(e) =>
								((e.currentTarget as HTMLElement).style.background =
									i % 2 === 1 ? 'var(--color-raised)' : 'var(--color-surface)')}
						>
							<td class="px-4 py-3" style="color: var(--color-text);">{train.manufacturer}</td>

							<td class="px-4 py-3">
								<span
									class="text-xs font-bold px-2 py-0.5 rounded-sm"
									style="background: {train.scale === 'HO'
										? 'var(--color-jrc-orange)'
										: 'var(--color-green)'}; color: #fff; letter-spacing: 0.06em;"
								>
									{train.scale}
								</span>
							</td>

							<td class="px-4 py-3" style="color: var(--color-text);">{train.name}</td>

							<td class="px-4 py-3 font-mono text-xs" style="color: var(--color-muted);">{train.modelNumber}</td>

							<td class="px-4 py-3 text-sm" style="color: var(--color-muted);">{train.operatorName ?? '—'}</td>

							<td class="px-4 py-3">
								<div class="flex flex-wrap gap-1">
									{#each train.formats as fmt}
										<span
											class="text-xs px-2 py-0.5 rounded-sm font-medium border"
											title={fmt.formatName}
											style="background: var(--color-green-light); color: var(--color-green); border-color: var(--color-green-mid);"
										>
											{shortFormat(fmt.formatName)}
											<span class="inline-flex items-center gap-0.5 ml-1 opacity-70">
												{#if fmt.purpose === 'Motor Only' || fmt.purpose === 'Motor & Lights'}
													<MotorIcon class="w-3 h-3" title="Motor" />
												{/if}
												{#if fmt.purpose === 'Motor & Lights'}
													<span class="text-xs leading-none">+</span>
												{/if}
												{#if fmt.purpose === 'Lights Only' || fmt.purpose === 'Motor & Lights'}
													<LightsIcon class="w-3 h-3" title="Lights" />
												{/if}
											</span>
											{#if fmt.decoderCount > 0}
												<span class="ml-1 opacity-50">·{fmt.decoderCount}</span>
											{/if}
										</span>
										{#if fmt.compatNotes}
											<span
												title={fmt.compatNotes}
												aria-label="Notes: {fmt.compatNotes}"
												class="text-xs px-1.5 py-0.5 rounded-sm font-medium border cursor-help"
												style="background: var(--color-warn-bg); color: var(--color-warn); border-color: var(--color-warn);"
											>
												⚠ notes
											</span>
										{/if}
									{/each}
									{#if train.formats.length === 0}
										<span class="text-xs italic" style="color: var(--color-dim);">no data</span>
									{/if}
									{#if train.formats.some((f) => f.soundDecoderCount > 0)}
										<span title="Sound decoders available" style="color: var(--color-muted);">
											<SoundIcon class="inline w-3.5 h-3.5 mb-0.5 ml-1" />
										</span>
									{/if}
								</div>
							</td>

							<td class="px-4 py-3 text-right">
								<a
									href="/trains/{train.id}"
									tabindex="0"
									aria-label="View {train.name} details"
									class="row-chevron transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="inline w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}


<style>
	.filter-pill {
		background: var(--color-green-light);
		color: var(--color-green);
		border-color: var(--color-green-mid);
	}
	.filter-pill:hover {
		background: var(--color-green-dark);
		border-color: var(--color-green-dark);
		color: white;
	}
	.row-chevron {
		color: var(--color-border-mid);
	}
	:global(tr:hover) .row-chevron {
		color: var(--color-green);
	}
</style>
