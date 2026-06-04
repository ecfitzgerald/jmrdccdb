<script lang="ts">
	let { children } = $props();
</script>

<div class="flex gap-6">
	<nav class="w-48 shrink-0">
		<div class="jr-card-flat border border-[var(--color-border)] rounded p-3">
			<div class="text-xs font-semibold text-[var(--color-dim)] uppercase tracking-wide mb-3 px-2">Admin</div>
			<ul class="space-y-1 text-sm">
				{#each [['/admin', 'Dashboard'], ['/admin/suggestions', 'Suggestions'], ['/admin/trains', 'Trains'], ['/admin/decoders', 'Decoders'], ['/admin/formats', 'Formats']] as [href, label]}
					<li>
						<a
							{href}
							class="block px-2 py-1.5 rounded hover:bg-[var(--color-green-light)] text-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
						>
							{label}
						</a>
					</li>
				{/each}
				<li class="border-t border-[var(--color-border)] mt-2 pt-2">
					<form method="POST" action="/admin/login?/logout">
						<button
							type="submit"
							class="block w-full text-left px-2 py-1.5 rounded hover:bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-sm transition-colors"
						>
							Sign out
						</button>
					</form>
				</li>
			</ul>
		</div>
	</nav>
	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
</div>
