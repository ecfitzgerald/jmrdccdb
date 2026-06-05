<script lang="ts">
	import type { PageData } from './$types';
	import MotorIcon from '$lib/icons/MotorIcon.svelte';
	import LightsIcon from '$lib/icons/LightsIcon.svelte';
	import SoundIcon from '$lib/icons/SoundIcon.svelte';
	let { data }: { data: PageData } = $props();

	// decoderCard is rendered with both format-level decoders and confirmed
	// decoders; the latter add compatNotes/confirmed, so model those as optional.
	type DecoderCard = PageData['formatDecoders'][number] &
		Partial<Pick<PageData['confirmedDecoders'][number], 'compatNotes' | 'confirmed'>>;

	let decoderFilter = $state<'all' | 'basic' | 'sound'>('all');

	// Confirmed decoders grouped by formatId
	const confirmedByFormat = $derived(() => {
		const map = new Map<number, typeof data.confirmedDecoders>();
		for (const dec of data.confirmedDecoders) {
			if (!map.has(dec.formatId)) map.set(dec.formatId, []);
			map.get(dec.formatId)!.push(dec);
		}
		return map;
	});

	// Format-level decoders grouped by formatId (excluding confirmed ones)
	const formatByFormat = $derived(() => {
		const confirmedIds = new Set(data.confirmedDecoders.map((d) => d.id));
		const map = new Map<number, typeof data.formatDecoders>();
		for (const dec of data.formatDecoders) {
			if (confirmedIds.has(dec.id)) continue;
			if (!map.has(dec.formatId)) map.set(dec.formatId, []);
			map.get(dec.formatId)!.push(dec);
		}
		return map;
	});

	const hasAnyConfirmed = $derived(data.confirmedDecoders.length > 0);
	const hasSoundDecoders = $derived(
		data.confirmedDecoders.some((d) => d.soundDecoder) || data.formatDecoders.some((d) => d.soundDecoder)
	);

	function filterDecoders<T extends { soundDecoder: boolean | null }>(list: T[]) {
		if (decoderFilter === 'sound') return list.filter((d) => d.soundDecoder);
		if (decoderFilter === 'basic') return list.filter((d) => !d.soundDecoder);
		return list;
	}

	// The snippet takes dec directly — purpose is now read from dec.motor/dec.lights
</script>

<svelte:head>
	<title>{data.train.manufacturer} {data.train.modelNumber} — DCC Compatibility</title>
</svelte:head>

<div class="mb-5">
	<a href="/" class="text-sm transition-colors hover:underline" style="color: var(--color-green);">← Back to search</a>
</div>

<!-- Train header -->
<div class="jr-card p-6 mb-6">
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2 mb-2">
				<span
					class="text-xs font-bold px-2 py-0.5 rounded-sm"
					style="background: {data.train.scale === 'HO'
						? 'var(--color-jrc-orange)'
						: 'var(--color-green)'}; color: #fff; letter-spacing: 0.08em;"
				>
					{data.train.scale} SCALE
				</span>
				<span class="font-mono text-xs" style="color: var(--color-muted);">{data.train.modelNumber}</span>
				{#if data.train.era}
					<span class="text-xs" style="color: var(--color-dim);">{data.train.era}</span>
				{/if}
			</div>
			<h1 class="text-2xl font-bold mb-1" style="color: var(--color-text);">{data.train.name}</h1>
			<div class="text-sm" style="color: var(--color-muted);">
				<span class="font-semibold" style="color: var(--color-green);">{data.train.manufacturer}</span>
				{#if data.train.roadName}
					<span class="mx-2" style="color: var(--color-border-mid);">·</span>
					<span>{data.train.roadName}</span>
				{/if}
			</div>
		</div>
		<a
			href="/suggest?trainId={data.train.id}"
			class="text-xs transition-colors hover:underline"
			style="color: var(--color-dim);"
		>
			Suggest correction
		</a>
	</div>
	{#if data.train.notes}
		<p
			class="mt-4 text-sm p-3 rounded"
			style="background: var(--color-warn-bg); color: var(--color-warn); border-left: 3px solid var(--color-warn);"
		>
			{data.train.notes}
		</p>
	{/if}
</div>

{#if data.compatFormats.length === 0}
	<div class="text-center py-12" style="color: var(--color-dim);">
		<p class="font-medium" style="color: var(--color-muted);">No compatibility data yet for this model.</p>
		<a
			href="/suggest?trainId={data.train.id}"
			class="inline-block mt-2 text-sm hover:underline"
			style="color: var(--color-green);"
		>
			Add compatibility info →
		</a>
	</div>
{:else}
	<!-- Sound filter -->
	{#if hasSoundDecoders}
		<div class="flex items-center gap-1 mb-6">
			{#each [['all', 'All'], ['basic', 'Basic'], ['sound', 'Sound']] as [val, label]}
				<button
					onclick={() => (decoderFilter = val as typeof decoderFilter)}
					class="px-3 py-1.5 rounded text-xs font-medium transition-colors"
					style={decoderFilter === val
						? 'background: var(--color-green); color: #fff;'
						: 'background: var(--color-raised); color: var(--color-muted); border: 1px solid var(--color-border);'}
				>
					{#if val === 'sound'}
						<svg
							class="inline w-3 h-3 mr-1 mb-0.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg
						>
					{/if}
					{label}
				</button>
			{/each}
		</div>
	{/if}

	{#each data.compatFormats as fmt}
		{@const confirmed = filterDecoders(confirmedByFormat().get(fmt.formatId) ?? [])}
		{@const formatOnly = filterDecoders(formatByFormat().get(fmt.formatId) ?? [])}
		{@const hasConfirmedForFormat = confirmedByFormat().has(fmt.formatId)}

		{#if confirmed.length > 0 || formatOnly.length > 0 || decoderFilter === 'all'}
			<div class="mb-8">
				<!-- Format header -->
				<div
					class="flex items-center gap-3 px-4 py-2.5 mb-4 rounded"
					style="background: var(--color-green-light); border-left: 4px solid var(--color-green);"
				>
					<span class="font-bold text-sm" style="color: var(--color-green);">{fmt.formatName}</span>
					{#if fmt.purpose}
						<span
							class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-sm"
							style="background: var(--color-green); color: #fff;"
						>
							{#if fmt.purpose === 'Motor Only' || fmt.purpose === 'Motor & Lights'}
								<svg
									class="w-3 h-3"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path
										d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
									/></svg
								>
							{/if}
							{#if fmt.purpose === 'Motor & Lights'}
								<span class="text-xs leading-none">+</span>
							{/if}
							{#if fmt.purpose === 'Lights Only' || fmt.purpose === 'Motor & Lights'}
								<svg
									class="w-3 h-3"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" /><path
										d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"
									/></svg
								>
							{/if}
						</span>
					{/if}
					{#if fmt.notes}
						<span
							class="text-xs px-2 py-0.5 rounded"
							style="background: var(--color-warn-bg); color: var(--color-warn);"
						>
							⚠ {fmt.notes}
						</span>
					{/if}
					{#if fmt.formatDescription}
						<span class="text-xs ml-auto" style="color: var(--color-muted);">{fmt.formatDescription}</span>
					{/if}
				</div>

				<!-- Confirmed tier -->
				{#if confirmed.length > 0}
					<p
						class="text-xs font-semibold tracking-widest uppercase mb-2 px-1 flex items-center gap-2"
						style="color: var(--color-green);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
							><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg
						>
						Confirmed for this model
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
						{#each confirmed as dec (dec.id)}
							{@render decoderCard(dec, true)}
						{/each}
					</div>
				{/if}

				<!-- Format-level decoders -->
				{#if formatOnly.length > 0}
					{#if hasConfirmedForFormat}
						<p class="text-xs font-semibold tracking-widest uppercase mb-2 px-1" style="color: var(--color-muted);">
							Other compatible decoders
						</p>
					{/if}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each formatOnly as dec (dec.id)}
							{@render decoderCard(dec, false)}
						{/each}
					</div>
				{/if}

				{#if confirmed.length === 0 && formatOnly.length === 0}
					<p class="text-sm px-1 italic" style="color: var(--color-dim);">
						No {decoderFilter !== 'all' ? decoderFilter + ' ' : ''}decoders listed for this format.
					</p>
				{/if}
			</div>
		{/if}
	{/each}
{/if}

{#snippet decoderCard(dec: DecoderCard, isConfirmed: boolean)}
	<div
		class="jr-card-flat p-4 hover:border-[var(--color-green-mid)] transition-colors"
		style="{dec.soundDecoder ? 'border-top: 3px solid #7c3aed;' : ''}{isConfirmed
			? 'border-left: 3px solid var(--color-green);'
			: ''}"
	>
		<!-- Icon cluster — capabilities are fixed properties of the decoder model -->
		<div class="flex items-center justify-between mb-2">
			<div class="flex items-center gap-1" style="color: var(--color-green);">
				{#if dec.motor}
					<MotorIcon title="Motor" />
				{/if}
				{#if dec.lights}
					<LightsIcon title="Lights" />
				{/if}
				{#if dec.soundDecoder}
					<SoundIcon title="Sound" style="color: #7c3aed;" />
				{/if}
			</div>
			{#if isConfirmed}
				<span
					class="text-xs font-semibold px-1.5 py-0.5 rounded-sm"
					style="background: var(--color-green-light); color: var(--color-green); letter-spacing: 0.04em;"
				>
					✓ Confirmed
				</span>
			{/if}
		</div>

		<div class="font-semibold text-sm mb-0.5" style="color: var(--color-green);">{dec.brandName}</div>
		<div class="font-mono text-xs font-medium mb-2" style="color: var(--color-text);">{dec.model}</div>
		{#if dec.compatNotes}
			<p class="text-xs mb-1" style="color: var(--color-warn);">⚠ {dec.compatNotes}</p>
		{/if}
		{#if dec.notes}
			<p class="text-xs" style="color: var(--color-muted);">{dec.notes}</p>
		{/if}
		{#if dec.buyUrl}
			<a
				href={dec.buyUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-block mt-2 text-xs hover:underline"
				style="color: var(--color-green);">Buy →</a
			>
		{/if}
	</div>
{/snippet}
