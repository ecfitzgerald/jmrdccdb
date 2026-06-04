import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { trains, trainFormatCompat, dccFormats } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const d = db();
	const allTrains = d.select().from(trains).orderBy(trains.manufacturer, trains.name).all();
	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();
	const compat = d.select({
		trainId: trainFormatCompat.trainId,
		formatId: trainFormatCompat.formatId,
		formatName: dccFormats.name
	}).from(trainFormatCompat).innerJoin(dccFormats, eq(trainFormatCompat.formatId, dccFormats.id)).all();

	const compatByTrain = new Map<number, string[]>();
	for (const c of compat) {
		if (!compatByTrain.has(c.trainId)) compatByTrain.set(c.trainId, []);
		compatByTrain.get(c.trainId)!.push(c.formatName);
	}

	return {
		trains: allTrains.map(t => ({ ...t, formats: compatByTrain.get(t.id) ?? [] })),
		formats
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const manufacturer = form.get('manufacturer')?.toString() ?? '';
		const scale = form.get('scale')?.toString() ?? '';
		const name = form.get('name')?.toString() ?? '';
		const modelNumber = form.get('modelNumber')?.toString() ?? '';

		if (!manufacturer || !scale || !name || !modelNumber) {
			return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
		}

		const d = db();
		const [train] = d.insert(trains).values({
			manufacturer, scale, name, modelNumber,
			roadName: form.get('roadName')?.toString() || null,
			era: form.get('era')?.toString() || null,
			notes: form.get('notes')?.toString() || null
		}).returning().all();

		const formatIds = form.getAll('formatIds').map(Number).filter(Boolean);
		const formatPurposes = form.getAll('formatPurposes');
		for (let i = 0; i < formatIds.length; i++) {
			d.insert(trainFormatCompat).values({
				trainId: train.id,
				formatId: formatIds[i],
				purpose: (formatPurposes[i] as string) || 'Motor & Lights'
			}).run();
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400);
		db().delete(trains).where(eq(trains.id, id)).run();
		return { success: true };
	}
};
