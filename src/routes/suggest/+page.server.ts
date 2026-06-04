import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, dccFormats } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { decodersWithBrands } from '$lib/db/queries';

const VALID_TYPES = ['add_train', 'add_compat', 'correction'];

export const load: PageServerLoad = async ({ url }) => {
	const d = db();
	const trainId = url.searchParams.get('trainId');
	const typeParam = url.searchParams.get('type') ?? '';

	const allTrains = d
		.select({ id: trains.id, name: trains.name, manufacturer: trains.manufacturer, modelNumber: trains.modelNumber })
		.from(trains).orderBy(trains.manufacturer, trains.name).all();

	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();

	const allDecoders = decodersWithBrands(d);

	const preselectedTrain = trainId ? allTrains.find(t => t.id === Number(trainId)) ?? null : null;

	return { allTrains, formats, allDecoders, preselectedTrain, typeParam };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const type = form.get('type')?.toString() ?? '';
		const submitterNote = form.get('submitterNote')?.toString() ?? '';
		const submitterEmail = form.get('submitterEmail')?.toString() ?? '';

		if (!VALID_TYPES.includes(type)) return fail(400, { error: 'Invalid suggestion type.' });
		if (submitterNote.length > 1000) return fail(400, { error: 'Note too long (max 1000 characters).' });
		if (submitterEmail.length > 254) return fail(400, { error: 'Email too long.' });
		if (submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
			return fail(400, { error: 'Invalid email address.' });
		}

		let payload: Record<string, unknown> = {};

		if (type === 'add_train') {
			const manufacturer = form.get('manufacturer')?.toString() ?? '';
			const scale        = form.get('scale')?.toString() ?? '';
			const name         = form.get('name')?.toString() ?? '';
			const modelNumber  = form.get('modelNumber')?.toString() ?? '';
			const roadName     = form.get('roadName')?.toString() ?? '';
			const era          = form.get('era')?.toString() ?? '';

			if (!manufacturer || !scale || !name || !modelNumber) {
				return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
			}
			if (manufacturer.length > 200) return fail(400, { error: 'Manufacturer too long (max 200).' });
			if (scale.length > 50)         return fail(400, { error: 'Scale too long (max 50).' });
			if (name.length > 200)         return fail(400, { error: 'Name too long (max 200).' });
			if (modelNumber.length > 100)  return fail(400, { error: 'Model number too long (max 100).' });
			if (roadName.length > 200)     return fail(400, { error: 'Road name too long (max 200).' });
			if (era.length > 100)          return fail(400, { error: 'Era too long (max 100).' });

			payload = { manufacturer, scale, name, modelNumber, roadName, era, formatIds: form.getAll('formatIds') };

		} else if (type === 'add_compat') {
			const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
			const notes = form.get('notes')?.toString() ?? '';

			if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });

			payload = {
				trainId: form.get('trainId'),
				formatId: form.get('formatId'),
				purpose: form.get('purpose'),
				decoderIds,
				notes
			};
			if (!payload.trainId || !payload.formatId) {
				return fail(400, { error: 'Train and format are required.' });
			}
			if (decoderIds.length === 0) {
				return fail(400, { error: 'Please select at least one confirmed decoder.' });
			}

		} else if (type === 'correction') {
			const currentValue  = form.get('currentValue')?.toString() ?? '';
			const suggestedValue = form.get('suggestedValue')?.toString() ?? '';
			const field         = form.get('field')?.toString() ?? '';

			if (field.length > 100)          return fail(400, { error: 'Field name too long (max 100).' });
			if (currentValue.length > 1000)  return fail(400, { error: 'Current value too long (max 1000).' });
			if (suggestedValue.length > 1000) return fail(400, { error: 'Suggested value too long (max 1000).' });

			payload = { trainId: form.get('trainId'), field, currentValue, suggestedValue };
			if (!payload.trainId || !suggestedValue) {
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
