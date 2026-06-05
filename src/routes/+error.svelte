<script lang="ts">
	import { page } from '$app/state';

	const messages: Record<number, string> = {
		404: 'This track leads nowhere — the page you requested could not be found.',
		500: 'A signal fault occurred on our end. Please try again shortly.'
	};

	let status = $derived(page.status);
	let message = $derived(page.error?.message || messages[status] || 'Something went wrong.');
</script>

<svelte:head>
	<title>{status} — DCC Database</title>
</svelte:head>

<div class="max-w-xl mx-auto py-16 text-center">
	<div class="jr-card rounded p-8">
		<div
			class="inline-block text-xs font-black tracking-widest uppercase px-3 py-1 rounded-sm"
			style="background: var(--color-green); color: #fff;"
		>
			Error {status}
		</div>
		<h1 class="mt-5 text-2xl font-bold" style="color: var(--color-text);">
			{status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-3 text-sm" style="color: var(--color-muted);">{message}</p>
		<a
			href="/"
			class="mt-8 inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
			style="background: var(--color-green); color: #fff;"
		>
			← Back to search
		</a>
	</div>
</div>
