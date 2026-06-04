<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';
	import MotorIcon from '$lib/icons/MotorIcon.svelte';
	import LightsIcon from '$lib/icons/LightsIcon.svelte';
	import SoundIcon from '$lib/icons/SoundIcon.svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let type = $state(data.typeParam === 'add_compat' ? 'add_compat' : 'add_train');
	let compatFormatId = $state('');

	const decodersForFormat = $derived(
		compatFormatId ? data.allDecoders.filter((d) => String(d.formatId) === compatFormatId) : []
	);
</script>

<svelte:head>
	<title>Suggest — DCC Compatibility</title>
</svelte:head>

<div class="max-w-2xl">
	<h1 class="text-xl font-bold tracking-wide mb-1" style="color: var(--color-text);">
		SUGGEST AN ADDITION OR CORRECTION
	</h1>
	<p class="text-xs tracking-widest uppercase mb-6" style="color: var(--color-muted);">
		All suggestions are reviewed before going live. Thank you for contributing.
	</p>

	{#if form?.success}
		<div
			class="text-sm rounded-sm p-4 mb-6"
			style="background: var(--color-ok-bg); color: var(--color-ok); border-left: 3px solid var(--color-ok);"
		>
			✓ Suggestion submitted for review.
		</div>
	{/if}

	{#if form?.error}
		<div
			class="text-sm rounded-sm p-4 mb-6"
			style="background: var(--color-danger-bg); color: var(--color-danger); border-left: 3px solid var(--color-danger);"
		>
			{form.error}
		</div>
	{/if}

	<form method="POST" class="jr-card p-6 space-y-5">
		<!-- Suggestion type -->
		<div>
			<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);"
				>What would you like to do?</label
			>
			<div class="flex flex-wrap gap-2">
				{#each [['add_train', 'Add a new train'], ['add_compat', 'Add compatibility info'], ['correction', 'Correct existing data']] as [val, label]}
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="radio" name="type" value={val} bind:group={type} class="accent-slate-700" />
						<span class="text-sm">{label}</span>
					</label>
				{/each}
			</div>
		</div>

		<!-- Add Train form -->
		{#if type === 'add_train'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="manufacturer">Manufacturer *</label
					>
					<input
						id="manufacturer"
						name="manufacturer"
						type="text"
						list="suggest-mfr-list"
						placeholder="Kato, Tomix, Micro Ace…"
						class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
					/>
					<datalist id="suggest-mfr-list">
						{#each data.manufacturers as m}<option value={m}/>{/each}
					</datalist>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="scale">Scale *</label
					>
					<input
						id="scale"
						name="scale"
						type="text"
						list="suggest-scale-list"
						placeholder="N"
						class="w-full rounded px-3 py-2 text-sm focus:outline-none"
					/>
					<datalist id="suggest-scale-list">
						{#each data.scales as s}<option value={s}/>{/each}
					</datalist>
				</div>
			</div>
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="name">Model Name *</label
				>
				<input
					id="name"
					name="name"
					type="text"
					placeholder="E235 Series Yamanote Line (11-car set)"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="modelNumber">Model Number *</label
					>
					<input
						id="modelNumber"
						name="modelNumber"
						type="text"
						placeholder="10-1785"
						class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
					/>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="roadName">Road / Operator</label
					>
					<input
						id="roadName"
						name="roadName"
						type="text"
						list="suggest-operator-list"
						placeholder="JR East"
						class="w-full rounded px-3 py-2 text-sm focus:outline-none"
					/>
					<datalist id="suggest-operator-list">
						{#each data.operators as o}<option value={o}/>{/each}
					</datalist>
				</div>
			</div>
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="era">Era / Years</label
				>
				<input
					id="era"
					name="era"
					type="text"
					placeholder="2015–present"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>
			<div>
				<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);"
					>Compatible DCC Formats</label
				>
				<div class="flex flex-wrap gap-3">
					{#each data.formats as fmt}
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" name="formatIds" value={fmt.id} class="accent-slate-700" />
							<span class="text-sm">{fmt.name}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Add Compat form -->
		{:else if type === 'add_compat'}
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="compatTrainId">Train *</label
				>
				<select
					id="compatTrainId"
					name="trainId"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				>
					<option value="">Select a train…</option>
					{#each data.allTrains as t}
						<option value={t.id} selected={data.preselectedTrain?.id === t.id}>
							{t.manufacturer} — {t.name} ({t.modelNumber})
						</option>
					{/each}
				</select>
			</div>

			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="compatFormatId">DCC Format *</label
				>
				<select
					id="compatFormatId"
					name="formatId"
					bind:value={compatFormatId}
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				>
					<option value="">Select a format…</option>
					{#each data.formats as fmt}
						<option value={String(fmt.id)}>{fmt.name}</option>
					{/each}
				</select>
				{#if compatFormatId}
					{@const selectedFmt = data.formats.find((f) => String(f.id) === compatFormatId)}
					{#if selectedFmt}
						<div
							class="mt-2 flex items-center gap-3 p-3 rounded"
							style="background: var(--color-raised); border: 1px solid var(--color-border);"
						>
							<div style="color: var(--color-green);">
								<FormatDiagram name={selectedFmt.name} size={96} />
							</div>
							<div>
								<p class="text-xs font-semibold" style="color: var(--color-text);">{selectedFmt.name}</p>
								{#if selectedFmt.description}
									<p class="text-xs mt-0.5" style="color: var(--color-muted);">{selectedFmt.description}</p>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Decoder picklist — updates when format changes -->
			<div>
				<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);">
					Confirmed Decoders *
					<span class="normal-case font-normal ml-1" style="color: var(--color-dim);"
						>Select all you have tested and confirmed working</span
					>
				</label>
				{#if !compatFormatId}
					<p
						class="text-sm italic py-3 px-3 rounded"
						style="color: var(--color-dim); background: var(--color-raised); border: 1px solid var(--color-border);"
					>
						Select a format above to see available decoders
					</p>
				{:else if decodersForFormat.length === 0}
					<p
						class="text-sm italic py-3 px-3 rounded"
						style="color: var(--color-dim); background: var(--color-raised); border: 1px solid var(--color-border);"
					>
						No decoders in the database for this format yet
					</p>
				{:else}
					<div class="rounded border overflow-hidden" style="border-color: var(--color-border);">
						{#each decodersForFormat as dec, i}
							<label
								class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-raised)]"
								style="border-top: {i > 0 ? '1px solid var(--color-border)' : 'none'};"
							>
								<input
									type="checkbox"
									name="decoderIds"
									value={dec.id}
									class="accent-[var(--color-green)] w-4 h-4 shrink-0"
								/>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm" style="color: var(--color-text);">{dec.brandName}</span>
										<span class="font-mono text-xs" style="color: var(--color-muted);">{dec.model}</span>
										<span class="flex items-center gap-0.5" style="color: var(--color-green);">
											{#if dec.motor}
												<MotorIcon class="w-3 h-3" title="Motor" />
											{/if}
											{#if dec.lights}
												<LightsIcon class="w-3 h-3" title="Lights" />
											{/if}
											{#if dec.soundDecoder}
												<SoundIcon class="w-3 h-3" style="color: #7c3aed;" title="Sound" />
											{/if}
										</span>
									</div>
									{#if dec.notes}
										<p class="text-xs mt-0.5" style="color: var(--color-dim);">{dec.notes}</p>
									{/if}
								</div>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="notes">Notes</label
				>
				<input
					id="notes"
					name="notes"
					type="text"
					placeholder="e.g. requires trimming, fits motor car only"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>

			<!-- Correction form -->
		{:else if type === 'correction'}
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="trainId">Train</label
				>
				<select
					id="trainId"
					name="trainId"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				>
					<option value="">Select a train (or leave blank for general correction)…</option>
					{#each data.allTrains as t}
						<option value={t.id} selected={data.preselectedTrain?.id === t.id}>
							{t.manufacturer} — {t.name} ({t.modelNumber})
						</option>
					{/each}
				</select>
			</div>
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="field">What field needs correcting?</label
				>
				<input
					id="field"
					name="field"
					type="text"
					placeholder="e.g. model number, compatible format, decoder notes"
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="currentValue">Current (wrong) value</label
					>
					<input
						id="currentValue"
						name="currentValue"
						type="text"
						class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
					/>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="suggestedValue">Correct value *</label
					>
					<input
						id="suggestedValue"
						name="suggestedValue"
						type="text"
						class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
					/>
				</div>
			</div>
		{/if}

		<!-- Common fields -->
		<div>
			<label
				class="block text-xs font-medium mb-1 tracking-widest uppercase"
				style="color: var(--color-muted);"
				for="submitterNote">Additional notes</label
			>
			<textarea
				id="submitterNote"
				name="submitterNote"
				rows="3"
				placeholder="Any extra context, sources, or links…"
				class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
			></textarea>
		</div>
		<div>
			<label
				class="block text-xs font-medium mb-1 tracking-widest uppercase"
				style="color: var(--color-muted);"
				for="submitterEmail"
			>
				Email (optional — only used if we need to follow up)
			</label>
			<input
				id="submitterEmail"
				name="submitterEmail"
				type="email"
				class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
			/>
		</div>

		<button
			type="submit"
			class="text-sm font-medium px-6 py-2 rounded-sm tracking-widest uppercase transition-opacity hover:opacity-80"
			style="background: var(--color-green); color: #fff;"
		>
			Submit Suggestion
		</button>
	</form>
</div>
