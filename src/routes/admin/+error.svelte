<script lang="ts">
	import { page } from '$app/state';

	const messages: Record<number, string> = {
		404: 'That admin page does not exist.',
		500: 'An error occurred while loading this admin page. Please try again.'
	};

	let status = $derived(page.status);
	let message = $derived(page.error?.message || messages[status] || 'Something went wrong.');
</script>

<svelte:head>
	<title>Admin error {status} — DCC Database</title>
</svelte:head>

<div class="jr-card-flat rounded p-8 text-center">
	<div
		class="inline-block text-xs font-black tracking-widest uppercase px-3 py-1 rounded-sm"
		style="background: var(--color-danger); color: #fff;"
	>
		Admin error {status}
	</div>
	<h1 class="mt-5 text-xl font-bold" style="color: var(--color-text);">
		{status === 404 ? 'Admin page not found' : 'Something went wrong'}
	</h1>
	<p class="mt-3 text-sm" style="color: var(--color-muted);">{message}</p>
	<a
		href="/admin"
		class="mt-8 inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
		style="background: var(--color-green); color: #fff;"
	>
		← Back to admin dashboard
	</a>
</div>
