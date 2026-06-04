<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const s  = data.suggestion;
	const p  = data.payload;

	// add_compat reactive format picker
	let compatFormatId = $state(String(p.formatId ?? ''));
	const decodersForFormat = $derived(
		data.allDecoders.filter(d => String(d.formatId) === compatFormatId)
	);

	// add_decoder: new brand toggle
	let addingBrand = $state(false);

	const typeLabel: Record<string, string> = {
		add_train: 'New Train', add_compat: 'Compatibility', add_decoder: 'New Decoder', correction: 'Correction'
	};
</script>

<svelte:head><title>Review Suggestion — Admin</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<a href="/admin/suggestions" class="text-sm hover:underline" style="color: var(--color-green);">← Back to suggestions</a>
	<span class="text-xs font-medium px-2 py-0.5 rounded"
		style="background: var(--color-green-light); color: var(--color-green);">
		{typeLabel[s.type] ?? s.type}
	</span>
</div>

<!-- Submitter context -->
<div class="jr-card-flat p-4 mb-6 text-sm" style="border-left: 4px solid var(--color-border);">
	<div class="flex gap-4 text-xs mb-2" style="color: var(--color-dim);">
		<span>{s.createdAt}</span>
		{#if s.submitterEmail}<span>from {s.submitterEmail}</span>{/if}
	</div>
	{#if s.submitterNote}
		<p class="italic" style="color: var(--color-muted);">"{s.submitterNote}"</p>
	{/if}
</div>

{#if form?.error}
	<div class="text-sm rounded p-3 mb-4"
		style="background: var(--color-danger-bg); color: var(--color-danger); border-left: 3px solid var(--color-danger);">
		{form.error}
	</div>
{/if}

<!-- ── ADD TRAIN ────────────────────────────────── -->
{#if s.type === 'add_train'}
	<form method="POST" action="?/approve" class="space-y-5">
		<h2 class="text-lg font-bold" style="color: var(--color-text);">Review: Add Train</h2>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="manufacturer">Manufacturer *</label>
				<input id="manufacturer" name="manufacturer" type="text" list="mfr-list" value={p.manufacturer ?? ''} class="w-full rounded px-3 py-2 text-sm" />
				<datalist id="mfr-list">{#each data.manufacturers as m}<option value={m}/>{/each}</datalist>
			</div>
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="scale">Scale *</label>
				<input id="scale" name="scale" type="text" list="scale-list" value={p.scale ?? 'N'} class="w-full rounded px-3 py-2 text-sm" />
				<datalist id="scale-list">{#each data.scales as s}<option value={s}/>{/each}</datalist>
			</div>
		</div>

		<div>
			<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="name">Model Name *</label>
			<input id="name" name="name" type="text" value={p.name ?? ''} class="w-full rounded px-3 py-2 text-sm" />
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="modelNumber">Model Number *</label>
				<input id="modelNumber" name="modelNumber" type="text" value={p.modelNumber ?? ''} class="w-full rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="roadName">Operator</label>
				<input id="roadName" name="roadName" type="text" list="op-list" value={p.roadName ?? ''} class="w-full rounded px-3 py-2 text-sm" />
				<datalist id="op-list">{#each data.operators as o}<option value={o}/>{/each}</datalist>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="era">Era</label>
				<input id="era" name="era" type="text" value={p.era ?? ''} class="w-full rounded px-3 py-2 text-sm" />
			</div>
		</div>

		<!-- Formats + decoders -->
		<div>
			<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);">Compatible Formats & Decoders</label>
			<div class="space-y-3">
				{#each data.formats as fmt}
					{@const checked = (p.formatIds ?? []).map(String).includes(String(fmt.id))}
					<div class="rounded p-3" style="border: 1px solid var(--color-border);">
						<div class="flex items-center gap-3 mb-2">
							<input type="checkbox" name="formatIds" value={fmt.id} id="fmt-{fmt.id}" checked={checked} class="w-4 h-4 shrink-0" />
							<div style="color: var(--color-green);"><FormatDiagram name={fmt.name} size={60}/></div>
							<label for="fmt-{fmt.id}" class="font-medium text-sm cursor-pointer">{fmt.name}</label>
							<select name="formatPurposes" class="ml-auto rounded px-2 py-1 text-xs focus:outline-none" style="border: 1px solid var(--color-border);">
								<option>Motor & Lights</option><option>Motor Only</option><option>Lights Only</option>
							</select>
						</div>
						<div class="pl-7 space-y-1">
							{#each data.allDecoders.filter(d => d.formatId === fmt.id) as dec}
								<label class="flex items-center gap-2 text-xs cursor-pointer">
									<input type="checkbox" name="decoderIds" value={dec.id} class="w-3.5 h-3.5" />
									<span class="font-medium" style="color: var(--color-text);">{dec.brandName}</span>
									<span class="font-mono" style="color: var(--color-muted);">{dec.model}</span>
									<span class="flex items-center gap-0.5 ml-1" style="color: var(--color-green);">
										{#if dec.motor}<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>{/if}
										{#if dec.lights}<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>{/if}
										{#if dec.soundDecoder}<svg class="w-3 h-3" style="color:#7c3aed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>{/if}
									</span>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		{@render reviewActions()}
	</form>

<!-- ── ADD COMPAT ───────────────────────────────── -->
{:else if s.type === 'add_compat'}
	<form method="POST" action="?/approve" class="space-y-5">
		<h2 class="text-lg font-bold" style="color: var(--color-text);">Review: Add Compatibility</h2>

		<div>
			<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="trainId">Train *</label>
			<select id="trainId" name="trainId" class="w-full rounded px-3 py-2 text-sm">
				<option value="">Select…</option>
				{#each data.allTrains as t}
					<option value={t.id} selected={t.id === Number(p.trainId)}>{t.manufacturer} — {t.name} ({t.modelNumber})</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="formatId">Format *</label>
			<select id="formatId" name="formatId" bind:value={compatFormatId} class="w-full rounded px-3 py-2 text-sm">
				<option value="">Select…</option>
				{#each data.formats as fmt}
					<option value={String(fmt.id)}>{fmt.name}</option>
				{/each}
			</select>
			{#if compatFormatId}
				{@const fmt = data.formats.find(f => String(f.id) === compatFormatId)}
				{#if fmt}
					<div class="mt-2 flex items-center gap-3 p-2 rounded" style="background: var(--color-raised); border: 1px solid var(--color-border);">
						<div style="color: var(--color-green);"><FormatDiagram name={fmt.name} size={72}/></div>
						<div>
							<p class="text-xs font-semibold">{fmt.name}</p>
							{#if fmt.description}<p class="text-xs opacity-70">{fmt.description}</p>{/if}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<div>
			<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);">Confirmed Decoders</label>
			{#if decodersForFormat.length === 0}
				<p class="text-sm italic" style="color: var(--color-dim);">Select a format to see decoders</p>
			{:else}
				<div class="rounded border overflow-hidden" style="border-color: var(--color-border);">
					{#each decodersForFormat as dec, i}
						<label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--color-raised)]"
							style="border-top: {i > 0 ? '1px solid var(--color-border)' : 'none'};">
							<input type="checkbox" name="decoderIds" value={dec.id}
								checked={(p.decoderIds ?? []).includes(dec.id)}
								class="w-4 h-4" />
							<span class="font-medium text-sm">{dec.brandName}</span>
							<span class="font-mono text-xs" style="color: var(--color-muted);">{dec.model}</span>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<div>
			<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="notes">Notes</label>
			<input id="notes" name="notes" type="text" value={p.notes ?? ''} class="w-full rounded px-3 py-2 text-sm" />
		</div>

		{@render reviewActions()}
	</form>

<!-- ── ADD DECODER ──────────────────────────────── -->
{:else if s.type === 'add_decoder'}
	<form method="POST" action="?/approve" class="space-y-5">
		<h2 class="text-lg font-bold" style="color: var(--color-text);">Review: Add Decoder</h2>

		<div>
			<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);">Brand *</label>
			{#if addingBrand}
				<div class="grid grid-cols-2 gap-3">
					<input name="newBrandName" type="text" placeholder="Brand name" value={p.brandName ?? ''} class="w-full rounded px-3 py-2 text-sm" />
					<input name="newBrandWebsite" type="url" placeholder="https://…" class="w-full rounded px-3 py-2 text-sm" />
				</div>
				<button type="button" onclick={() => addingBrand = false} class="mt-1 text-xs hover:underline" style="color: var(--color-muted);">← Pick existing brand</button>
			{:else}
				<div class="flex gap-2">
					<select name="brandId" class="flex-1 rounded px-3 py-2 text-sm">
						<option value="">Select…</option>
						{#each data.brands as b}
							<option value={b.id} selected={b.id === Number(p.brandId)}>{b.name}</option>
						{/each}
					</select>
					<button type="button" onclick={() => addingBrand = true}
						class="px-3 py-2 rounded text-sm" style="background: var(--color-raised); border: 1px solid var(--color-border);">+ New</button>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="model">Model *</label>
				<input id="model" name="model" type="text" value={p.model ?? ''} class="w-full rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="formatId2">Format *</label>
				<select id="formatId2" name="formatId" class="w-full rounded px-3 py-2 text-sm">
					<option value="">Select…</option>
					{#each data.formats as fmt}
						<option value={fmt.id} selected={fmt.id === Number(p.formatId)}>{fmt.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div>
			<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);">Capabilities</label>
			<div class="flex gap-4">
				<label class="flex items-center gap-2 cursor-pointer text-sm">
					<input type="checkbox" name="motor" checked={p.motor !== false} class="w-4 h-4" /> Motor
				</label>
				<label class="flex items-center gap-2 cursor-pointer text-sm">
					<input type="checkbox" name="lights" checked={p.lights !== false} class="w-4 h-4" /> Lights
				</label>
				<label class="flex items-center gap-2 cursor-pointer text-sm">
					<input type="checkbox" name="sound" checked={!!p.sound} class="w-4 h-4" /> Sound
				</label>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="dec-notes">Notes</label>
				<input id="dec-notes" name="notes" type="text" value={p.notes ?? ''} class="w-full rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widests uppercase" style="color: var(--color-muted);" for="buyUrl">Buy URL</label>
				<input id="buyUrl" name="buyUrl" type="url" value={p.buyUrl ?? ''} class="w-full rounded px-3 py-2 text-sm" />
			</div>
		</div>

		{@render reviewActions()}
	</form>

<!-- ── CORRECTION ────────────────────────────────── -->
{:else if s.type === 'correction'}
	<form method="POST" action="?/approve" class="space-y-5">
		<h2 class="text-lg font-bold" style="color: var(--color-text);">Review: Correction</h2>

		<div class="grid grid-cols-2 gap-4">
			<div class="p-3 rounded" style="background: var(--color-raised); border: 1px solid var(--color-border);">
				<p class="text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);">Field</p>
				<p class="text-sm font-mono">{p.field ?? '—'}</p>
			</div>
			<div class="p-3 rounded" style="background: var(--color-raised); border: 1px solid var(--color-border);">
				<p class="text-xs font-medium mb-1 tracking-widests uppercase" style="color: var(--color-muted);">Train</p>
				<p class="text-sm">
					{#if p.trainId}
						{data.allTrains.find(t => t.id === Number(p.trainId))?.name ?? `ID ${p.trainId}`}
					{:else}—{/if}
				</p>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);">Current (wrong) value</label>
				<div class="p-3 rounded text-sm line-through opacity-50" style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger);">{p.currentValue ?? '—'}</div>
			</div>
			<div>
				<label class="block text-xs font-medium mb-1 tracking-widest uppercase" style="color: var(--color-muted);" for="correctedValue">Apply this value</label>
				<input id="correctedValue" name="correctedValue" type="text" value={p.suggestedValue ?? ''}
					class="w-full rounded px-3 py-2 text-sm" />
			</div>
		</div>

		<p class="text-xs p-3 rounded" style="background: var(--color-warn-bg); color: var(--color-warn);">
			⚠ Corrections are applied manually — approve to mark as reviewed, then make the change in the relevant admin page.
		</p>

		{@render reviewActions()}
	</form>

{:else}
	<p style="color: var(--color-muted);">Unknown suggestion type: {s.type}</p>
{/if}

{#snippet reviewActions()}
	<div class="flex items-center gap-3 pt-4" style="border-top: 1px solid var(--color-border);">
		<button type="submit" class="px-5 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-85"
			style="background: var(--color-green); color: #fff;">
			Approve & Apply
		</button>
		<input name="adminNote" type="text" placeholder="Admin note (optional)"
			class="flex-1 rounded px-3 py-2 text-sm" style="max-width: 280px;" />
		<a href="/admin/suggestions" class="text-sm" style="color: var(--color-dim);">Cancel</a>

		<!-- Reject form nested aside -->
		<form method="POST" action="?/reject" class="flex items-center gap-2 ml-auto">
			<input name="adminNote" type="text" placeholder="Rejection reason"
				class="rounded px-3 py-2 text-xs" style="width: 200px;" />
			<button type="submit" class="px-3 py-2 rounded text-xs font-medium transition-colors"
				style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger);">
				Reject
			</button>
		</form>
	</div>
{/snippet}
