<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import FormatDiagram from '$lib/FormatDiagram.svelte';
	import MotorIcon from '$lib/icons/MotorIcon.svelte';
	import LightsIcon from '$lib/icons/LightsIcon.svelte';
	import SoundIcon from '$lib/icons/SoundIcon.svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let type = $state<'add_train' | 'add_compat' | 'add_decoder'>('add_train');
	let compatFormatId = $state('');
	let addDecoderFormatId = $state('');
	let updateDecoderSearch = $state('');
	let updateDecoderField = $state('');

	$effect(() => {
		type = data.typeParam === 'add_compat' ? 'add_compat' : 'add_train';
	});

	const decodersForFormat = $derived(
		compatFormatId ? data.allDecoders.filter((d) => String(d.formatId) === compatFormatId) : []
	);

	let trainFormatIds = $state(new Set<number>());

	const LIGHTING = new Set(['FL12', 'FL13']);

	const showMultiFormatWarning = $derived(
		trainFormatIds.size >= 2 &&
			!data.formats.filter((f) => trainFormatIds.has(f.id)).some((f) => LIGHTING.has(f.name))
	);

	const trainFormatsSelected = $derived(
		data.formats
			.filter((f) => trainFormatIds.has(f.id))
			.map((fmt) => ({
				format: fmt,
				decoders: data.allDecoders.filter((d) => d.formatId === fmt.id)
			}))
	);

	function switchToAddDecoder(formatId: number) {
		addDecoderFormatId = String(formatId);
		type = 'add_decoder';
	}
</script>

<svelte:head>
	<title>Suggest — DCC Compatibility</title>
</svelte:head>

<div class="max-w-2xl">
	<h1 class="text-2xl font-bold mb-1" style="color: var(--color-text);">
		Suggest an Addition or Correction
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
				{#each [['add_train', 'Add a new train'], ['add_decoder', 'Add a decoder'], ['add_compat', 'Add compatibility info'], ['correction', 'Correct existing data'], ['update_decoder', 'Update a decoder']] as [val, label]}
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="radio" name="type" value={val} bind:group={type} class="accent-[var(--color-green)]" />
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
						placeholder="Kato, Tomix, Micro Ace…"
						list="manufacturer-list"
						class="w-full rounded px-3 py-2 text-sm"
					/>
					<datalist id="manufacturer-list">
						{#each data.manufacturers as m}
							<option value={m}></option>
						{/each}
					</datalist>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="scale">Scale *</label
					>
					<select
						id="scale"
						name="scale"
						class="w-full rounded px-3 py-2 text-sm"
					>
						<option value="N">N</option>
						<option value="HO">HO</option>
						<option value="Z">Z</option>
						<option value="O">O</option>
					</select>
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
					class="w-full rounded px-3 py-2 text-sm"
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
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="operatorId">Operator</label
					>
					<select
						id="operatorId"
						name="operatorId"
						class="w-full rounded px-3 py-2 text-sm"
					>
						<option value="">— None —</option>
						{#each data.operators as op}
							<option value={op.id}>{op.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
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
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="line">Line</label
					>
					<input
						id="line"
						name="line"
						type="text"
						placeholder="Yamanote Line"
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
			</div>
			<div>
				<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);"
					>Compatible DCC Formats</label
				>
				<div class="rounded border overflow-hidden" style="border-color: var(--color-border);">
					<p class="text-xs font-semibold px-3 pt-2.5 pb-1" style="color: var(--color-text);">Motor / board formats</p>
					{#each data.formats.filter((f) => !LIGHTING.has(f.name)) as fmt}
						<label
							class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-raised)]"
							style="border-top: 1px solid var(--color-border);"
						>
							<input
								type="checkbox"
								name="formatIds"
								value={fmt.id}
								onchange={(e) => {
									const s = new Set(trainFormatIds);
									if (e.currentTarget.checked) s.add(fmt.id);
									else s.delete(fmt.id);
									trainFormatIds = s;
								}}
								class="accent-[var(--color-green)] w-4 h-4 shrink-0"
							/>
							<span class="text-sm">{fmt.name}</span>
						</label>
					{/each}
					{#if data.formats.some((f) => LIGHTING.has(f.name))}
						<p
							class="text-xs font-semibold px-3 pt-3 pb-1"
							style="color: var(--color-text); border-top: 1px solid var(--color-border);"
						>Lighting boards</p>
						<p class="text-xs px-3 pb-2" style="color: var(--color-dim);">Lighting boards (FL12/FL13) are usually paired with a motor format on the same model.</p>
						{#each data.formats.filter((f) => LIGHTING.has(f.name)) as fmt}
							<label
								class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-raised)]"
								style="border-top: 1px solid var(--color-border);"
							>
								<input
									type="checkbox"
									name="formatIds"
									value={fmt.id}
									onchange={(e) => {
										const s = new Set(trainFormatIds);
										if (e.currentTarget.checked) s.add(fmt.id);
										else s.delete(fmt.id);
										trainFormatIds = s;
									}}
									class="accent-[var(--color-green)] w-4 h-4 shrink-0"
								/>
								<span class="text-sm">{fmt.name}</span>
							</label>
						{/each}
					{/if}
				</div>
			</div>

			{#if showMultiFormatWarning}
				<div
					class="text-sm rounded-sm p-4"
					style="background: var(--color-warn-bg); color: var(--color-warn); border-left: 3px solid var(--color-warn);"
				>
					Most trains use a single decoder format — are you sure this model uses multiple?
				</div>
			{/if}

			{#if trainFormatIds.size > 0}
				<div>
					<label class="block text-xs font-medium mb-3 tracking-widest uppercase" style="color: var(--color-muted);">
						Decoder Compatibility
						<span class="normal-case font-normal ml-1" style="color: var(--color-dim);">Select decoders you have tested</span>
					</label>
					<div class="space-y-4">
						{#each trainFormatsSelected as { format, decoders }}
							<div>
								<p class="text-xs font-semibold mb-2" style="color: var(--color-text);">{format.name}</p>
								{#if decoders.length === 0}
									<div
										class="flex flex-wrap items-center gap-3 p-3 rounded text-sm"
										style="background: var(--color-raised); border: 1px solid var(--color-border);"
									>
										<p class="flex-1" style="color: var(--color-dim);">
											No decoders listed for this format yet — consider submitting an add-decoder suggestion first.
										</p>
										<button
											type="button"
											onclick={() => switchToAddDecoder(format.id)}
											class="shrink-0 text-xs font-medium px-3 py-1.5 rounded-sm tracking-widest uppercase transition-opacity hover:opacity-80"
											style="background: var(--color-green); color: #fff;"
										>
											Add a decoder
										</button>
									</div>
								{:else}
									<div class="rounded border overflow-hidden" style="border-color: var(--color-border);">
										{#each decoders as dec, i}
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
																<SoundIcon class="w-3 h-3" style="color: var(--color-sound);" title="Sound" />
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
						{/each}
					</div>
				</div>
			{/if}

			<!-- Add Decoder form -->
		{:else if type === 'add_decoder'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="brandName">Brand *</label
					>
					<input
						id="brandName"
						name="brandName"
						type="text"
						list="brand-list"
						placeholder="Digitrax, TCS, SoundTraxx…"
						class="w-full rounded px-3 py-2 text-sm"
					/>
					<datalist id="brand-list">
						{#each data.allBrands as b}
							<option value={b.name}></option>
						{/each}
					</datalist>
				</div>
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="decoderModel">Model Number *</label
					>
					<input
						id="decoderModel"
						name="model"
						type="text"
						placeholder="DN163K0"
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
			</div>
			<div>
				<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);"
					>Features</label
				>
				<div class="flex flex-wrap gap-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" name="motor" class="accent-[var(--color-green)]" checked />
						<span class="flex items-center gap-1 text-sm">
							<MotorIcon class="w-3.5 h-3.5" style="color: var(--color-green);" />
							Motor
						</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" name="lights" class="accent-[var(--color-green)]" checked />
						<span class="flex items-center gap-1 text-sm">
							<LightsIcon class="w-3.5 h-3.5" style="color: var(--color-green);" />
							Lights
						</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" name="soundDecoder" class="accent-[var(--color-green)]" />
						<span class="flex items-center gap-1 text-sm">
							<SoundIcon class="w-3.5 h-3.5" style="color: var(--color-sound);" />
							Sound
						</span>
					</label>
				</div>
			</div>
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="decoderFormat">DCC Format *</label
				>
				<select
					id="decoderFormat"
					name="formatId"
					bind:value={addDecoderFormatId}
					class="w-full rounded px-3 py-2 text-sm"
				>
					<option value="">Select a format…</option>
					{#each data.formats as fmt}
						<option value={String(fmt.id)}>{fmt.name}</option>
					{/each}
				</select>
				{#if addDecoderFormatId}
					{@const selectedFmt = data.formats.find((f) => String(f.id) === addDecoderFormatId)}
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
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="decoderNotes">Notes</label
				>
				<input
					id="decoderNotes"
					name="notes"
					type="text"
					placeholder="e.g. requires capacitor removal, N-scale only"
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="buyUrl">Buy / Product URL</label
				>
				<input
					id="buyUrl"
					name="buyUrl"
					type="url"
					placeholder="https://www.jmri.org/…"
					class="w-full rounded px-3 py-2 text-sm"
				/>
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
					class="w-full rounded px-3 py-2 text-sm"
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
					class="w-full rounded px-3 py-2 text-sm"
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
					<div
						class="py-3 px-3 rounded flex items-center justify-between gap-4"
						style="background: var(--color-raised); border: 1px solid var(--color-border);"
					>
						<p class="text-sm italic" style="color: var(--color-dim);">
							No decoders in the database for this format yet
						</p>
						<button
							type="button"
							onclick={() => switchToAddDecoder(Number(compatFormatId))}
							class="text-xs font-medium px-3 py-1.5 rounded shrink-0 transition-opacity hover:opacity-80"
							style="background: var(--color-green); color: #fff;"
						>
							Add a decoder
						</button>
					</div>
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
												<SoundIcon class="w-3 h-3" style="color: var(--color-sound);" title="Sound" />
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
					class="w-full rounded px-3 py-2 text-sm"
				/>
			</div>

			<!-- Update Decoder form -->
		{:else if type === 'update_decoder'}
			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="updateDecoderInput">Decoder *</label
				>
				<input
					id="updateDecoderInput"
					type="text"
					list="update-decoder-list"
					bind:value={updateDecoderSearch}
					placeholder="Type brand or model to search…"
					class="w-full rounded px-3 py-2 text-sm"
				/>
				<datalist id="update-decoder-list">
					{#each data.allDecoders as dec}
						<option value="{dec.brandName} {dec.model}"
							>{dec.brandName} {dec.model} — {data.formats.find((f) => f.id === dec.formatId)?.name ?? ''}</option
						>
					{/each}
				</datalist>
				<input
					type="hidden"
					name="decoderId"
					value={data.allDecoders.find((d) => `${d.brandName} ${d.model}` === updateDecoderSearch)?.id ?? ''}
				/>
			</div>

			<div>
				<label
					class="block text-xs font-medium mb-1 tracking-widest uppercase"
					style="color: var(--color-muted);"
					for="updateField">Field to correct *</label
				>
				<select
					id="updateField"
					name="updateField"
					bind:value={updateDecoderField}
					class="w-full rounded px-3 py-2 text-sm"
				>
					<option value="">Select a field…</option>
					<option value="model">Model number</option>
					<option value="capabilities">Capabilities (motor / lights / sound)</option>
					<option value="format">DCC Format</option>
					<option value="notes">Notes</option>
				</select>
			</div>

			{#if updateDecoderField === 'model'}
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="correctedModel">Correct model number *</label
					>
					<input
						id="correctedModel"
						name="correctedValue"
						type="text"
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
			{:else if updateDecoderField === 'capabilities'}
				<div>
					<label class="block text-xs font-medium mb-2 tracking-widest uppercase" style="color: var(--color-muted);"
						>Correct capabilities *</label
					>
					<div class="flex flex-wrap gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" name="motor" class="accent-[var(--color-green)]" checked />
							<span class="flex items-center gap-1 text-sm">
								<MotorIcon class="w-3.5 h-3.5" style="color: var(--color-green);" />
								Motor
							</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" name="lights" class="accent-[var(--color-green)]" checked />
							<span class="flex items-center gap-1 text-sm">
								<LightsIcon class="w-3.5 h-3.5" style="color: var(--color-green);" />
								Lights
							</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" name="soundDecoder" class="accent-[var(--color-green)]" />
							<span class="flex items-center gap-1 text-sm">
								<SoundIcon class="w-3.5 h-3.5" style="color: var(--color-sound);" />
								Sound
							</span>
						</label>
					</div>
				</div>
			{:else if updateDecoderField === 'format'}
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="correctedFormat">Correct DCC format *</label
					>
					<select id="correctedFormat" name="correctedValue" class="w-full rounded px-3 py-2 text-sm">
						<option value="">Select a format…</option>
						{#each data.formats as fmt}
							<option value={String(fmt.id)}>{fmt.name}</option>
						{/each}
					</select>
				</div>
			{:else if updateDecoderField === 'notes'}
				<div>
					<label
						class="block text-xs font-medium mb-1 tracking-widest uppercase"
						style="color: var(--color-muted);"
						for="correctedNotes">Correct notes *</label
					>
					<input
						id="correctedNotes"
						name="correctedValue"
						type="text"
						placeholder="e.g. requires capacitor removal, N-scale only"
						class="w-full rounded px-3 py-2 text-sm"
					/>
				</div>
			{/if}

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
					class="w-full rounded px-3 py-2 text-sm"
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
					class="w-full rounded px-3 py-2 text-sm"
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
						class="w-full rounded px-3 py-2 text-sm"
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
						class="w-full rounded px-3 py-2 text-sm"
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
				class="w-full rounded px-3 py-2 text-sm"
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
				class="w-full rounded px-3 py-2 text-sm"
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
