<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function safeParse(json: string): unknown {
		try { return JSON.parse(json); } catch { return null; }
	}

	const typeLabel: Record<string, string> = {
		add_train: 'New Train',
		add_compat: 'Compatibility',
		correction: 'Correction'
	};
	const typeBadge: Record<string, string> = {
		add_train: 'bg-blue-100 text-blue-800',
		add_compat: 'bg-green-100 text-green-800',
		correction: 'bg-[var(--color-warn-bg)] text-amber-800'
	};
</script>

<svelte:head><title>Suggestions — Admin</title></svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)] font-bold">Suggestions</h1>
	<div class="flex gap-1 bg-[var(--color-raised)] rounded p-1 text-sm">
		{#each ['pending', 'approved', 'rejected'] as s}
			<a
				href="?status={s}"
				class="px-3 py-1 rounded-md transition-colors {data.status === s
					? 'jr-card-flat shadow text-[var(--color-text)] font-bold font-medium'
					: 'text-[var(--color-dim)] hover:text-gray-700'}"
			>
				{s.charAt(0).toUpperCase() + s.slice(1)}
			</a>
		{/each}
	</div>
</div>

{#if data.suggestions.length === 0}
	<div class="text-center py-16 text-[var(--color-dim)]">
		<div class="text-3xl mb-2">✓</div>
		<p>No {data.status} suggestions.</p>
	</div>
{:else}
	<div class="space-y-4">
		{#each data.suggestions as s (s.id)}
			{@const parsed = safeParse(s.payload)}
			<div class="jr-card-flat border border-[var(--color-border)] rounded p-5">
				<div class="flex items-start gap-3 mb-3">
					<span
						class="text-xs font-medium px-2 py-0.5 rounded {typeBadge[s.type] ??
							'bg-[var(--color-raised)] text-[var(--color-muted)]'}"
					>
						{typeLabel[s.type] ?? s.type}
					</span>
					<span class="text-xs text-[var(--color-dim)] mt-0.5">{s.createdAt}</span>
					{#if s.submitterEmail}
						<span class="text-xs text-[var(--color-dim)] mt-0.5">from {s.submitterEmail}</span>
					{/if}
				</div>

				<div class="bg-[var(--color-raised)] rounded p-3 mb-3 font-mono text-xs text-gray-700 overflow-x-auto">
					<pre>{parsed !== null ? JSON.stringify(parsed, null, 2) : '(invalid payload)'}</pre>
				</div>

				{#if s.submitterNote}
					<p class="text-sm text-[var(--color-muted)] mb-3 italic">"{s.submitterNote}"</p>
				{/if}

				{#if s.adminNote}
					<p class="text-sm text-[var(--color-dim)] mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
						Admin note: {s.adminNote}
					</p>
				{/if}

				{#if data.status === 'pending'}
					<a
						href="/admin/suggestions/{s.id}"
						class="inline-block px-4 py-1.5 rounded text-xs font-semibold transition-opacity hover:opacity-80"
						style="background: var(--color-green); color: #fff;"
					>
						Review & Edit →
					</a>
				{/if}
			</div>
		{/each}
	</div>
{/if}
