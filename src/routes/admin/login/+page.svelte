<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Admin Login</title></svelte:head>

<div class="max-w-sm mx-auto mt-16">
	<div class="jr-card p-8">
		<h1 class="text-xl font-bold mb-6" style="color: var(--color-text);">Admin Login</h1>
		{#if form?.error}
			<div class="text-sm rounded p-3 mb-4"
				style="background: var(--color-danger-bg); color: var(--color-danger); border-left: 3px solid var(--color-danger);">
				{form.error}
			</div>
		{/if}
		<form method="POST" class="space-y-4">
			<div>
				<label class="block text-xs font-medium mb-1" style="color: var(--color-muted);" for="password">Password</label>
				<input id="password" name="password" type="password"
					class="w-full rounded px-3 py-2 text-sm focus:outline-none" />
			</div>
			<button type="submit"
				class="w-full py-2 rounded text-sm font-semibold transition-opacity hover:opacity-85"
				style="background: var(--color-green); color: #fff;">
				Sign in
			</button>
		</form>
	</div>
</div>
