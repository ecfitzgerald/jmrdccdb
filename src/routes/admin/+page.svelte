<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	type DashboardCard = readonly [number, string, string];
	const cards = $derived.by(() => [
		[data.pendingCount, 'Pending Suggestions', '/admin/suggestions'],
		[data.trainCount, 'Trains', '/admin/trains'],
		[data.decoderCount, 'Decoders', '/admin/decoders'],
	] as const as DashboardCard[]);
</script>

<svelte:head><title>Admin — DCC Compatibility</title></svelte:head>

<h1 class="text-2xl font-bold text-[var(--color-text)] mb-6">Dashboard</h1>

<div class="grid grid-cols-3 gap-4 mb-8">
	{#each cards as [count, label, href]}
		<a
			{href}
			class="block jr-card-flat border border-[var(--color-border)] rounded p-5 hover:border-[var(--color-border-mid)] transition-colors"
		>
			<div class="text-3xl font-bold text-[var(--color-text)]">{count}</div>
			<div class="text-sm text-[var(--color-dim)] mt-1">{label}</div>
			{#if count > 0 && label === 'Pending Suggestions'}
				<div
					class="mt-2 text-xs font-medium text-[var(--color-warn)] bg-[var(--color-warn-bg)] rounded px-2 py-0.5 inline-block"
				>
					Needs review
				</div>
			{/if}
		</a>
	{/each}
</div>

<div class="jr-card-flat border border-[var(--color-border)] rounded p-5">
	<h2 class="font-semibold text-[var(--color-text)] mb-3">Quick links</h2>
	<div class="flex flex-wrap gap-2">
		<a href="/admin/suggestions" class="text-sm text-[var(--color-green)] hover:underline">Review suggestions →</a>
		<span class="text-[var(--color-border-mid)]">·</span>
		<a href="/admin/trains" class="text-sm text-[var(--color-green)] hover:underline">Add a train →</a>
		<span class="text-[var(--color-border-mid)]">·</span>
		<a href="/admin/decoders" class="text-sm text-[var(--color-green)] hover:underline">Add a decoder →</a>
		<span class="text-[var(--color-border-mid)]">·</span>
		<a href="/admin/links" class="text-sm text-[var(--color-green)] hover:underline">Manage decoder links →</a>
		<span class="text-[var(--color-border-mid)]">·</span>
		<a href="/" class="text-sm text-[var(--color-green)] hover:underline">View public site →</a>
	</div>
</div>
