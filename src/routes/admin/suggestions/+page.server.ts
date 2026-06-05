import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, trainFormatCompat, trainDecoderCompat, dccFormats, decoders } from '$lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? 'pending';
	const rows = db()
		.select()
		.from(suggestions)
		.where(eq(suggestions.status, status))
		.orderBy(desc(suggestions.createdAt))
		.all();
	return { suggestions: rows, status };
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

		let payload: Record<string, unknown>;
		try {
			const raw = JSON.parse(suggestion.payload);
			if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
				return fail(500, { error: 'Suggestion payload is corrupt.' });
			}
			payload = raw as Record<string, unknown>;
		} catch {
			return fail(500, { error: 'Suggestion payload is corrupt.' });
		}

		if (suggestion.type === 'add_train') {
			if (
				typeof payload.manufacturer !== 'string' ||
				typeof payload.scale !== 'string' ||
				typeof payload.name !== 'string' ||
				typeof payload.modelNumber !== 'string'
			) {
				return fail(500, { error: 'Suggestion payload missing required train fields.' });
			}
			const [train] = d
				.insert(trains)
				.values({
					manufacturer: payload.manufacturer,
					scale: payload.scale,
					name: payload.name,
					modelNumber: payload.modelNumber,
					roadName: typeof payload.roadName === 'string' ? payload.roadName || null : null,
					era: typeof payload.era === 'string' ? payload.era || null : null
				})
				.returning()
				.all();

			if (Array.isArray(payload.formatIds) && payload.formatIds.length) {
				for (const fid of payload.formatIds) {
					d.insert(trainFormatCompat)
						.values({ trainId: train.id, formatId: Number(fid) })
						.run();
				}
			}
		} else if (suggestion.type === 'add_compat') {
			if (!payload.trainId || !payload.formatId) {
				return fail(500, { error: 'Suggestion payload missing required compat fields.' });
			}
			const notes = typeof payload.notes === 'string' ? payload.notes || null : null;
			// Derive purpose from the confirmed decoders' capabilities
			let purpose = 'Motor & Lights';
			if (Array.isArray(payload.decoderIds) && payload.decoderIds.length) {
				const decoderIds = (payload.decoderIds as unknown[]).map(Number).filter(Boolean);
				const decoderRows = d
					.select({ motor: decoders.motor, lights: decoders.lights })
					.from(decoders)
					.where(inArray(decoders.id, decoderIds))
					.all();
				const anyMotor = decoderRows.some((dec) => dec.motor);
				const anyLights = decoderRows.some((dec) => dec.lights);
				if (anyMotor && anyLights) purpose = 'Motor & Lights';
				else if (anyMotor) purpose = 'Motor Only';
				else if (anyLights) purpose = 'Lights Only';
			}

			d.insert(trainFormatCompat)
				.values({ trainId: Number(payload.trainId), formatId: Number(payload.formatId), purpose, notes })
				.run();

			// Write confirmed decoder links
			if (Array.isArray(payload.decoderIds) && payload.decoderIds.length) {
				for (const did of payload.decoderIds) {
					d.insert(trainDecoderCompat)
						.values({ trainId: Number(payload.trainId), decoderId: Number(did), confirmed: true, notes })
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
