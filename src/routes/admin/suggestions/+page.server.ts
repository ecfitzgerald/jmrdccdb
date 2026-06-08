import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, trainFormatCompat, trainDecoderCompat, dccFormats, decoders } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

function getSummary(type: string, payload: Record<string, any>): string {
	const d = db();

	if (type === 'add_train') {
		return `Add train: ${payload.manufacturer} ${payload.name} (${payload.scale})`;
	}

	if (type === 'add_compat') {
		const train = d
			.select({ name: trains.name })
			.from(trains)
			.where(eq(trains.id, Number(payload.trainId)))
			.get();
		const format = d
			.select({ name: dccFormats.name })
			.from(dccFormats)
			.where(eq(dccFormats.id, Number(payload.formatId)))
			.get();
		const trainName = train?.name || `train #${payload.trainId}`;
		const formatName = format?.name || `format #${payload.formatId}`;
		const decoderCount = payload.decoderIds?.length || 0;
		return `Add compat: ${trainName} → ${formatName}${decoderCount > 0 ? ` (${decoderCount} decoder${decoderCount !== 1 ? 's' : ''})` : ''}`;
	}

	if (type === 'add_decoder') {
		return `Add decoder: ${payload.model} (${payload.brand})`;
	}

	if (type === 'update_decoder') {
		const decoder = d
			.select({ model: decoders.model })
			.from(decoders)
			.where(eq(decoders.id, Number(payload.decoderId)))
			.get();
		const name = decoder?.model || `decoder #${payload.decoderId}`;
		return `Update decoder: ${name}`;
	}

	if (type === 'correction') {
		return `Correction: ${payload.description || 'See details'}`;
	}

	return `Unknown type: ${type}`;
}

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? 'pending';
	const d = db();
	const rows = d
		.select()
		.from(suggestions)
		.where(eq(suggestions.status, status))
		.orderBy(desc(suggestions.createdAt))
		.all();

	const enriched = rows.map((row) => ({
		...row,
		summary: getSummary(row.type, JSON.parse(row.payload))
	}));

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
