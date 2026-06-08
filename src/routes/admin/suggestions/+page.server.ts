import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, trainFormatCompat, trainDecoderCompat, dccFormats, decoders, decoderBrands } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? 'pending';
	const d = db();
	const rows = d
		.select()
		.from(suggestions)
		.where(eq(suggestions.status, status))
		.orderBy(desc(suggestions.createdAt))
		.all();

	// Resolve IDs to human-readable summaries
	const enriched = rows.map((s) => {
		const payload = JSON.parse(s.payload);
		let summary = '';

		if (s.type === 'add_train') {
			summary = `Add train: ${payload.manufacturer} — ${payload.name} (${payload.modelNumber})`;
		} else if (s.type === 'add_compat') {
			const train = d.select().from(trains).where(eq(trains.id, payload.trainId)).get();
			const fmt = d.select().from(dccFormats).where(eq(dccFormats.id, payload.formatId)).get();
			const decoderCount = payload.decoderIds?.length ?? 0;
			const decoderStr = decoderCount === 1 ? '1 decoder' : `${decoderCount} decoders`;
			summary = `Add compat: ${train?.name ?? `Train #${payload.trainId}`} → ${fmt?.name ?? `Format #${payload.formatId}`} (${decoderStr})`;
		} else if (s.type === 'add_decoder') {
			const brand = payload.brandId
				? d.select().from(decoderBrands).where(eq(decoderBrands.id, payload.brandId)).get()
				: null;
			const fmt = d.select().from(dccFormats).where(eq(dccFormats.id, payload.formatId)).get();
			const brandName = brand?.name ?? payload.newBrandName ?? `Brand #${payload.brandId}`;
			summary = `Add decoder: ${brandName} ${payload.model} (${fmt?.name ?? `Format #${payload.formatId}`})`;
		} else if (s.type === 'correction') {
			const train = d.select().from(trains).where(eq(trains.id, payload.trainId)).get();
			summary = `Correction: ${train?.name ?? `Train #${payload.trainId}`} — ${payload.field}`;
		}

		return { ...s, summary };
	});

	return { suggestions: enriched, status };
};

export const actions: Actions = {
	approve: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const adminNote = form.get('adminNote')?.toString() ?? '';
		if (!id) return fail(400);

		const d = db();
		const [suggestion] = d.select().from(suggestions).where(eq(suggestions.id, id)).all();
		if (!suggestion) return fail(404);

		const payload = JSON.parse(suggestion.payload);

		if (suggestion.type === 'add_train') {
			const [train] = d
				.insert(trains)
				.values({
					manufacturer: payload.manufacturer,
					scale: payload.scale,
					name: payload.name,
					modelNumber: payload.modelNumber,
					roadName: payload.roadName || null,
					era: payload.era || null
				})
				.returning()
				.all();

			if (payload.formatIds?.length) {
				for (const fid of payload.formatIds) {
					d.insert(trainFormatCompat)
						.values({ trainId: train.id, formatId: Number(fid) })
						.run();
				}
			}
		} else if (suggestion.type === 'add_compat') {
			// Derive purpose from the confirmed decoders' capabilities
			let purpose = 'Motor & Lights';
			if (payload.decoderIds?.length) {
				const decoderRows = d
					.select({ motor: decoders.motor, lights: decoders.lights })
					.from(decoders)
					.all()
					.filter((dec) => (payload.decoderIds as number[]).includes((dec as any).id));
				const anyMotor = decoderRows.some((dec) => dec.motor);
				const anyLights = decoderRows.some((dec) => dec.lights);
				if (anyMotor && anyLights) purpose = 'Motor & Lights';
				else if (anyMotor) purpose = 'Motor Only';
				else if (anyLights) purpose = 'Lights Only';
			}

			d.insert(trainFormatCompat)
				.values({
					trainId: Number(payload.trainId),
					formatId: Number(payload.formatId),
					purpose,
					notes: payload.notes || null
				})
				.run();

			// Write confirmed decoder links
			if (payload.decoderIds?.length) {
				for (const did of payload.decoderIds) {
					d.insert(trainDecoderCompat)
						.values({
							trainId: Number(payload.trainId),
							decoderId: Number(did),
							confirmed: true,
							notes: payload.notes || null
						})
						.run();
				}
			}
		}
		// 'correction' type requires manual admin action — just mark reviewed

		d.update(suggestions).set({ status: 'approved', adminNote }).where(eq(suggestions.id, id)).run();

		return { success: true };
	},

	reject: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const adminNote = form.get('adminNote')?.toString() ?? '';
		if (!id) return fail(400);

		db().update(suggestions).set({ status: 'rejected', adminNote }).where(eq(suggestions.id, id)).run();

		return { success: true };
	}
};
