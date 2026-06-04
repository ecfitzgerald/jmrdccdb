<script lang="ts">
	let { class: className = 'w-3.5 h-3.5', title, style }: { class?: string; title?: string; style?: string } = $props();
</script>

<svg
	class={className}
	{style}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={!title}
	role={title ? 'img' : undefined}
>
	{#if title}<title>{title}</title>{/if}
	<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
	<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
</svg>
