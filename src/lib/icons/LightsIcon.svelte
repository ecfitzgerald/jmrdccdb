<script lang="ts">
	let { class: className = 'w-3.5 h-3.5', title, style }: { class?: string; title?: string; style?: string } = $props();
</script>

<svg class={className} {style} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden={!title} role={title ? 'img' : undefined}>
	{#if title}<title>{title}</title>{/if}
	<line x1="9" y1="18" x2="15" y2="18"/>
	<line x1="10" y1="22" x2="14" y2="22"/>
	<path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
</svg>
