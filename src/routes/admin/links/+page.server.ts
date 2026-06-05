import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { trains, trainDecoderCompat } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { decoderLinkStatusForTrain } from '$lib/db/queries';

export const load: PageServerLoad = async ({ url }) => {
	const d = db();
	const allTrains = d
		.select({
			id: trains.id,
			manufacturer: trains.manufacturer,
			scale: trains.scale,
			name: trains.name,
			modelNumber: trains.modelNumber
		})
		.from(trains)
		.orderBy(trains.manufacturer, trains.name)
		.all();

	const trainId = Number(url.searchParams.get('train')) || null;
	if (!trainId) {
		return { trains: allTrains, selectedTrain: null, decoders: [] };
	}

	const [selectedTrain] = d.select().from(trains).where(eq(trains.id, trainId)).all();
	if (!selectedTrain) {
		return { trains: allTrains, selectedTrain: null, decoders: [] };
	}

	return {
		trains: allTrains,
		selectedTrain,
		decoders: decoderLinkStatusForTrain(d, trainId)
	};
};

export const actions: Actions = {
	link: async ({ request }) => {
		const form = await request.formData();
		const trainId = Number(form.get('trainId'));
		if (!trainId) return fail(400, { error: 'No train selected.' });

		const decoderIds = [...new Set(form.getAll('decoderIds').map(Number).filter(Boolean))];
		if (decoderIds.length === 0) {
			return fail(400, { error: 'Select at least one decoder to link.' });
		}

		const d = db();
		const existing = new Set(
			d
				.select({ decoderId: trainDecoderCompat.decoderId })
				.from(trainDecoderCompat)
				.where(eq(trainDecoderCompat.trainId, trainId))
				.all()
				.map((r) => r.decoderId)
		);

		let linked = 0;
		for (const decoderId of decoderIds) {
			if (existing.has(decoderId)) continue;
			d.insert(trainDecoderCompat).values({ trainId, decoderId, confirmed: true }).run();
			linked++;
		}

		return { success: true, linked };
	},

	unlink: async ({ request }) => {
		const form = await request.formData();
		const trainId = Number(form.get('trainId'));
		const decoderId = Number(form.get('decoderId'));
		if (!trainId || !decoderId) return fail(400, { error: 'Missing train or decoder.' });

		db()
			.delete(trainDecoderCompat)
			.where(
				and(eq(trainDecoderCompat.trainId, trainId), eq(trainDecoderCompat.decoderId, decoderId))
			)
			.run();

		return { success: true };
	},

	setConfirmed: async ({ request }) => {
		const form = await request.formData();
		const trainId = Number(form.get('trainId'));
		const decoderId = Number(form.get('decoderId'));
		const confirmed = form.get('confirmed') === 'true';
		if (!trainId || !decoderId) return fail(400, { error: 'Missing train or decoder.' });

		db()
			.update(trainDecoderCompat)
			.set({ confirmed })
			.where(
				and(eq(trainDecoderCompat.trainId, trainId), eq(trainDecoderCompat.decoderId, decoderId))
			)
			.run();

		return { success: true };
	}
};
