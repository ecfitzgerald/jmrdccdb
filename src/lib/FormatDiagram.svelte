<script lang="ts">
	let { name, size = 80 }: { name: string; size?: number } = $props();

	// All diagrams drawn in a 120×60 viewBox, top-down schematic view
	// Stroke colour inherits from parent so it works on any background
</script>

{#if name === 'K0'}
	<!-- K0: simple rectangle -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="10" y="12" width="100" height="36" rx="1" />
		<!-- connector edge marker on left -->
		<line x1="10" y1="12" x2="10" y2="48" stroke-width="3" />
		<!-- pin dots along left edge -->
		{#each [18, 24, 30, 36, 42] as y}
			<circle cx="10" cy={y} r="2.5" fill="currentColor" stroke="none" />
		{/each}
		<text x="60" y="34" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>K0</text
		>
	</svg>
{:else if name === 'K1'}
	<!--
		K1: 5 sections along the length — narrow, wide, narrow, wide, narrow(longer)
		Viewed from above. "Narrow" = board is thinner (small height), "wide" = board is fuller height.
		Section widths (x): N1=14, W1=18, N2=14, W2=18, N3=22  (total=86, centred with 10px margin each side)
		Heights: narrow=20, wide=40, centred at y=30
	-->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polygon
			points="
			10,20  24,20  24,10  42,10  42,20  56,20  56,10  74,10  74,20  96,20
			96,40  74,40  74,50  56,50  56,40  42,40  42,50  24,50  24,40  10,40
		"
		/>
		<!-- connector edge marker on left -->
		<line x1="10" y1="20" x2="10" y2="40" stroke-width="3" />
		<circle cx="10" cy="26" r="2.5" fill="currentColor" stroke="none" />
		<circle cx="10" cy="30" r="2.5" fill="currentColor" stroke="none" />
		<circle cx="10" cy="34" r="2.5" fill="currentColor" stroke="none" />
		<text x="60" y="33" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>K1</text
		>
	</svg>
{:else if name === 'K2'}
	<!-- K2: shape TBD — placeholder -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="10" y="12" width="100" height="36" rx="1" stroke-dasharray="4 3" />
		<text x="60" y="28" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>K2</text
		>
		<text x="60" y="40" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" opacity="0.5"
			>shape TBD</text
		>
	</svg>
{:else if name === 'K4'}
	<!-- K4: shape TBD — placeholder -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="10" y="12" width="100" height="36" rx="1" stroke-dasharray="4 3" />
		<text x="60" y="28" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>K4</text
		>
		<text x="60" y="40" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" opacity="0.5"
			>shape TBD</text
		>
	</svg>
{:else if name === 'EM13'}
	<!-- EM13: rectangular board, 13-pin edge connector along bottom -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="10" y="8" width="100" height="36" rx="1" />
		<!-- 13 pins along bottom edge -->
		{#each Array.from({ length: 13 }, (_, i) => 10 + 4 + i * 7) as x}
			<rect {x} y="44" width="4" height="8" rx="0.5" />
		{/each}
		<text x="60" y="30" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>EM13</text
		>
	</svg>
{:else if name === 'FL12'}
	<!-- FL12: small rectangular lighting board -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="25" y="14" width="70" height="28" rx="1" />
		<!-- small connector on left -->
		<line x1="25" y1="14" x2="25" y2="42" stroke-width="3" />
		<circle cx="25" cy="22" r="2.5" fill="currentColor" stroke="none" />
		<circle cx="25" cy="28" r="2.5" fill="currentColor" stroke="none" />
		<circle cx="25" cy="34" r="2.5" fill="currentColor" stroke="none" />
		<text x="65" y="32" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-family="monospace"
			>FL12</text
		>
	</svg>
{:else if name === 'NEM651 (6-pin)'}
	<!-- NEM651: 6-pin plug, 2 rows of 3 -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<!-- plug body -->
		<rect x="30" y="10" width="60" height="38" rx="2" />
		<!-- keying notch -->
		<rect x="30" y="25" width="6" height="10" rx="1" fill="currentColor" stroke="none" opacity="0.3" />
		<!-- 6 pins in 2×3 grid -->
		{#each [0, 1, 2] as col}
			{#each [0, 1] as row}
				<circle cx={45 + col * 14} cy={22 + row * 14} r="3.5" stroke-width="1.5" />
			{/each}
		{/each}
		<text x="60" y="56" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-family="monospace"
			>NEM651 · 6-pin</text
		>
	</svg>
{:else if name === 'NEM652 (8-pin)'}
	<!-- NEM652: 8-pin plug, 2 rows of 4 -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="20" y="10" width="80" height="38" rx="2" />
		<rect x="20" y="25" width="6" height="10" rx="1" fill="currentColor" stroke="none" opacity="0.3" />
		{#each [0, 1, 2, 3] as col}
			{#each [0, 1] as row}
				<circle cx={34 + col * 14} cy={22 + row * 14} r="3.5" stroke-width="1.5" />
			{/each}
		{/each}
		<text x="60" y="56" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-family="monospace"
			>NEM652 · 8-pin</text
		>
	</svg>
{:else if name === 'Wired (direct)'}
	<!-- Wired: simplified decoder blob with wires -->
	<svg
		width={size}
		height={size * 0.5}
		viewBox="0 0 120 60"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="35" y="15" width="50" height="28" rx="3" />
		<!-- wires on left -->
		<line x1="10" y1="22" x2="35" y2="22" />
		<line x1="10" y1="28" x2="35" y2="28" />
		<line x1="10" y1="34" x2="35" y2="34" />
		<!-- wires on right -->
		<line x1="85" y1="22" x2="110" y2="22" />
		<line x1="85" y1="28" x2="110" y2="28" />
		<line x1="85" y1="34" x2="110" y2="34" />
		<text x="60" y="33" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-family="monospace"
			>WIRED</text
		>
	</svg>
{:else}
	<svg width={size} height={size * 0.5} viewBox="0 0 120 60" fill="none" stroke="currentColor" stroke-width="1.5">
		<rect x="10" y="12" width="100" height="36" rx="1" stroke-dasharray="4 3" opacity="0.4" />
		<text x="60" y="34" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" opacity="0.4">?</text>
	</svg>
{/if}
