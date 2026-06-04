<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen" style="background: var(--color-bg); color: var(--color-text);">

	<header style="background: var(--color-green); color: #fff;">
		<div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
			<a href="/" class="flex items-center gap-3 group">
				<!-- JR East-style route badge -->
				<div style="background: #fff; color: var(--color-green); font-weight: 900; font-size: 0.7rem; padding: 3px 8px; letter-spacing: 0.1em; border-radius: 2px; line-height: 1.4;">
					DCC
				</div>
				<div class="flex items-baseline gap-2">
					<span class="font-bold text-base tracking-wide text-white">Japanese Model Trains DCC Database</span>
				</div>
			</a>
			<nav class="flex items-center gap-5 text-xs tracking-widest uppercase text-white opacity-80">
				<a href="/" class="hover:opacity-100 transition-opacity">Search</a>
				<a href="/suggest" class="hover:opacity-100 transition-opacity">Suggest</a>
				<a href="/admin" class="hover:opacity-100 transition-opacity opacity-50">Admin</a>
			</nav>
		</div>
	</header>

	<!-- Green rule under header — matches JR East station sign bottom stripe -->
	<div style="height: 4px; background: var(--color-green-dark);"></div>

	<main class="max-w-7xl mx-auto px-4 py-8">
		{@render children()}
	</main>

	<footer class="mt-16" style="background: var(--color-raised); border-top: 1px solid var(--color-border);">
		<div class="max-w-7xl mx-auto px-4 py-5 text-xs text-center" style="color: var(--color-muted);">
			Community-maintained DCC compatibility database for Japanese model trains.
			<a href="/suggest" class="ml-1 hover:underline" style="color: var(--color-green);">Submit a correction or addition →</a>
		</div>
	</footer>
</div>
