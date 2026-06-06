<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { goto } from '$app/navigation';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showOther = $state(false);

	const trainId = $derived(data.selectedTrain?.id ?? 0);

	const linked = $derived(data.decoders.filter((dec) => dec.linked));
	const compatible = $derived(data.decoders.filter((dec) => !dec.linked && dec.formatCompatible));
	const other = $derived(data.decoders.filter((dec) => !dec.linked && !dec.formatCompatible));

	function caps(dec: { motor: boolean; lights: boolean; soundDecoder: boolean | null }): string {
		const parts = [];
		if (dec.motor) parts.push('Motor');
		if (dec.lights) parts.push('Lights');
		if (dec.soundDecoder) parts.push('Sound');
		return parts.join(' · ') || '—';
	}

	function onSelectTrain(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		goto(id ? `/admin/links?train=${id}` : '/admin/links');
	}
</script>

<svelte:head><title>Decoder Links — Admin</title></svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)]">Decoder Links</h1>
	<p class="text-sm text-[var(--color-dim)] mt-1">
		Directly confirm which decoders fit a train — no suggestion flow needed. Confirmed links appear
		prominently on the train's public page; format-compatible decoders show only as fallbacks until
		you confirm them.
	</p>
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
		{#if typeof form.linked === 'number'}
			Linked {form.linked} decoder{form.linked === 1 ? '' : 's'} as confirmed.
		{:else}
			Saved successfully.
		{/if}
	</div>
{/if}

<div class="jr-card-flat border border-[var(--color-border)] rounded p-5 mb-6">
	<label for="train-select" class="block text-xs font-medium text-[var(--color-muted)] mb-1">
		Select a train to manage
	</label>
	<select
		id="train-select"
		onchange={onSelectTrain}
		class="w-full rounded px-3 py-2 text-sm"
	>
		<option value="" selected={!data.selectedTrain}>— Choose a train —</option>
		{#each data.trains as t}
			<option value={t.id} selected={t.id === trainId}>
				{t.manufacturer} — {t.name} ({t.modelNumber}, {t.scale})
			</option>
		{/each}
	</select>
</div>

{#if data.selectedTrain}
	<!-- Currently linked decoders -->
	<section class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden mb-6">
		<div class="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-raised)]">
			<h2 class="font-semibold text-[var(--color-text)]">Linked decoders</h2>
			<p class="text-xs text-[var(--color-dim)] mt-0.5">
				Decoders explicitly linked to this train. Confirmed links are shown as primary
				recommendations on the public page.
			</p>
		</div>
		{#if linked.length === 0}
			<p class="px-4 py-6 text-sm text-[var(--color-dim)] text-center">
				No decoders linked yet. Link format-compatible decoders below to get started.
			</p>
		{:else}
			<table class="w-full text-sm">
				<thead class="border-b border-[var(--color-border)]">
					<tr>
						<th class="text-left px-4 py-2 font-medium text-[var(--color-muted)]">Decoder</th>
						<th class="text-left px-4 py-2 font-medium text-[var(--color-muted)]">Format</th>
						<th class="text-left px-4 py-2 font-medium text-[var(--color-muted)]">Capabilities</th>
						<th class="text-left px-4 py-2 font-medium text-[var(--color-muted)]">Status</th>
						<th class="px-4 py-2"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border)]">
					{#each linked as dec (dec.id)}
						<tr class="hover:bg-[var(--color-raised)]">
							<td class="px-4 py-2">
								<span class="font-medium text-[var(--color-text)]">{dec.brandName}</span>
								<span class="text-[var(--color-muted)]">{dec.model}</span>
							</td>
							<td class="px-4 py-2 text-xs text-[var(--color-muted)]">
								{dec.formatName}
								{#if !dec.formatCompatible}
									<span
										class="ml-1 bg-[var(--color-warn-bg)] text-amber-800 text-[10px] px-1.5 py-0.5 rounded"
										title="This decoder's format is not listed among the train's compatible formats."
									>
										off-format
									</span>
								{/if}
							</td>
							<td class="px-4 py-2 text-xs text-[var(--color-dim)]">{caps(dec)}</td>
							<td class="px-4 py-2">
								{#if dec.confirmed}
									<span
										class="bg-[var(--color-ok-bg)] text-green-800 text-xs px-2 py-0.5 rounded font-medium"
										>Confirmed</span
									>
								{:else}
									<span class="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium"
										>Unconfirmed</span
									>
								{/if}
							</td>
							<td class="px-4 py-2 text-right whitespace-nowrap">
								<form method="POST" action="?/setConfirmed&train={trainId}" class="inline">
									<input type="hidden" name="trainId" value={trainId} />
									<input type="hidden" name="decoderId" value={dec.id} />
									<input type="hidden" name="confirmed" value={dec.confirmed ? 'false' : 'true'} />
									<button type="submit" class="text-xs text-[var(--color-green)] hover:underline">
										{dec.confirmed ? 'Mark unconfirmed' : 'Mark confirmed'}
									</button>
								</form>
								<span class="text-[var(--color-border-mid)] mx-1">·</span>
								<form method="POST" action="?/unlink&train={trainId}" class="inline">
									<input type="hidden" name="trainId" value={trainId} />
									<input type="hidden" name="decoderId" value={dec.id} />
									<button type="submit" class="text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]"
										>Remove</button
									>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- Format-compatible decoders not yet linked -->
	<section class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden mb-6">
		<div class="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-raised)]">
			<h2 class="font-semibold text-[var(--color-text)]">Format-compatible decoders</h2>
			<p class="text-xs text-[var(--color-dim)] mt-0.5">
				These match one of the train's compatible formats but aren't yet confirmed. Select decoders
				and link them to confirm they fit.
			</p>
		</div>
		{#if compatible.length === 0}
			<p class="px-4 py-6 text-sm text-[var(--color-dim)] text-center">
				No unlinked format-compatible decoders. Either all are already linked, or the train has no
				compatible formats set.
			</p>
		{:else}
			<form method="POST" action="?/link&train={trainId}">
				<input type="hidden" name="trainId" value={trainId} />
				<div class="divide-y divide-[var(--color-border)]">
					{#each compatible as dec (dec.id)}
						<label
							class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--color-raised)]"
						>
							<input
								type="checkbox"
								name="decoderIds"
								value={dec.id}
								class="accent-slate-700 shrink-0"
							/>
							<span class="flex-1 min-w-0">
								<span class="font-medium text-[var(--color-text)]">{dec.brandName}</span>
								<span class="text-[var(--color-muted)]">{dec.model}</span>
								<span class="text-xs text-[var(--color-dim)] ml-2">{dec.formatName}</span>
							</span>
							<span class="text-xs text-[var(--color-dim)] shrink-0">{caps(dec)}</span>
						</label>
					{/each}
				</div>
				<div class="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-raised)]">
					<button
						type="submit"
						class="bg-[var(--color-green)] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[var(--color-green-dark)] transition-colors"
					>
						Link selected as confirmed
					</button>
				</div>
			</form>
		{/if}
	</section>

	<!-- Other decoders (off-format) -->
	{#if other.length > 0}
		<section class="jr-card-flat border border-[var(--color-border)] rounded overflow-hidden mb-6">
			<button
				type="button"
				onclick={() => (showOther = !showOther)}
				class="w-full text-left px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-raised)] flex items-center justify-between"
			>
				<span>
					<span class="font-semibold text-[var(--color-text)]">Other decoders (off-format)</span>
					<span class="text-xs text-[var(--color-dim)] ml-2">{other.length} decoders</span>
				</span>
				<span class="text-[var(--color-dim)] text-sm">{showOther ? '▲' : '▼'}</span>
			</button>
			{#if showOther}
				<p class="px-4 pt-3 text-xs text-[var(--color-dim)]">
					These decoders don't match any of the train's compatible formats. Only link them if you've
					verified an exception.
				</p>
				<form method="POST" action="?/link&train={trainId}">
					<input type="hidden" name="trainId" value={trainId} />
					<div class="divide-y divide-[var(--color-border)] mt-2">
						{#each other as dec (dec.id)}
							<label
								class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--color-raised)]"
							>
								<input
									type="checkbox"
									name="decoderIds"
									value={dec.id}
									class="accent-slate-700 shrink-0"
								/>
								<span class="flex-1 min-w-0">
									<span class="font-medium text-[var(--color-text)]">{dec.brandName}</span>
									<span class="text-[var(--color-muted)]">{dec.model}</span>
									<span class="text-xs text-amber-700 ml-2">{dec.formatName}</span>
								</span>
								<span class="text-xs text-[var(--color-dim)] shrink-0">{caps(dec)}</span>
							</label>
						{/each}
					</div>
					<div class="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-raised)]">
						<button
							type="submit"
							class="bg-[var(--color-muted)] text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
						>
							Link selected as confirmed
						</button>
					</div>
				</form>
			{/if}
		</section>
	{/if}
{:else}
	<div class="jr-card-flat border border-[var(--color-border)] rounded p-8 text-center">
		<p class="text-sm text-[var(--color-dim)]">Choose a train above to manage its decoder links.</p>
	</div>
{/if}
