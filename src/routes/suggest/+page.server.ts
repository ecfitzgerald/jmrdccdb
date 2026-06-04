import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, dccFormats, decoders, decoderBrands } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const d = db();
	const trainId = url.searchParams.get('trainId');
	const typeParam = url.searchParams.get('type') ?? '';

	const allTrains = d
		.select({ id: trains.id, name: trains.name, manufacturer: trains.manufacturer, modelNumber: trains.modelNumber })
		.from(trains).orderBy(trains.manufacturer, trains.name).all();

	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();

	const allDecoders = d
		.select({
			id: decoders.id,
			brandName: decoderBrands.name,
			model: decoders.model,
			formatId: decoders.formatId,
			motor: decoders.motor,
			lights: decoders.lights,
			soundDecoder: decoders.soundDecoder,
			notes: decoders.notes
		})
		.from(decoders)
		.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
		.orderBy(decoderBrands.name, decoders.model)
		.all();

	const preselectedTrain = trainId ? allTrains.find(t => t.id === Number(trainId)) ?? null : null;

	return { allTrains, formats, allDecoders, preselectedTrain, typeParam };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const type = form.get('type')?.toString() ?? '';
		const submitterNote = form.get('submitterNote')?.toString() ?? '';
		const submitterEmail = form.get('submitterEmail')?.toString() ?? '';

		if (!type) return fail(400, { error: 'Suggestion type is required.' });

		let payload: Record<string, unknown> = {};

		if (type === 'add_train') {
			payload = {
				manufacturer: form.get('manufacturer'),
				scale: form.get('scale'),
				name: form.get('name'),
				modelNumber: form.get('modelNumber'),
				roadName: form.get('roadName'),
				era: form.get('era'),
				formatIds: form.getAll('formatIds')
			};
			if (!payload.manufacturer || !payload.scale || !payload.name || !payload.modelNumber) {
				return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
			}
		} else if (type === 'add_compat') {
			const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
			payload = {
				trainId: form.get('trainId'),
				formatId: form.get('formatId'),
				purpose: form.get('purpose'),
				decoderIds,
				notes: form.get('notes')
			};
			if (!payload.trainId || !payload.formatId) {
				return fail(400, { error: 'Train and format are required.' });
			}
			if (decoderIds.length === 0) {
				return fail(400, { error: 'Please select at least one confirmed decoder.' });
			}
		} else if (type === 'correction') {
			payload = {
				trainId: form.get('trainId'),
				field: form.get('field'),
				currentValue: form.get('currentValue'),
				suggestedValue: form.get('suggestedValue')
			};
			if (!payload.trainId || !payload.suggestedValue) {
				return fail(400, { error: 'Please specify what to correct.' });
			}
		}

		db().insert(suggestions).values({
			type,
			payload: JSON.stringify(payload),
			submitterNote,
			submitterEmail: submitterEmail || null
		}).run();

		return { success: true };
	}
};
