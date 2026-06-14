import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, dccFormats, decoderBrands, operators } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { decodersWithBrands } from '$lib/db/queries';

const VALID_TYPES = ['add_train', 'add_decoder', 'add_compat', 'correction', 'update_decoder'];

export const load: PageServerLoad = async ({ url }) => {
	const d = db();
	const trainId = url.searchParams.get('trainId');
	const decoderId = url.searchParams.get('decoderId');
	const typeParam = url.searchParams.get('type') ?? '';

	const allTrains = d
		.select({ id: trains.id, name: trains.name, manufacturer: trains.manufacturer, modelNumber: trains.modelNumber })
		.from(trains)
		.orderBy(trains.manufacturer, trains.name)
		.all();

	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();

	const allDecoders = decodersWithBrands(d);

	const allBrands = d.select({ id: decoderBrands.id, name: decoderBrands.name }).from(decoderBrands).orderBy(decoderBrands.name).all();

	// Load full train data for correction pre-population
	let fullTrain = null;
	if (trainId) {
		const fullTrainData = d
			.select()
			.from(trains)
			.where(eq(trains.id, Number(trainId)))
			.get();
		fullTrain = fullTrainData ?? null;
	}

	const preselectedTrain = trainId ? (allTrains.find((t) => t.id === Number(trainId)) ?? null) : null;
	const preselectedDecoder = decoderId ? (allDecoders.find((d) => d.id === Number(decoderId)) ?? null) : null;

	const manufacturers = d.selectDistinct({ v: trains.manufacturer }).from(trains).orderBy(trains.manufacturer).all().map(r => r.v);
	const allOperators = d.select({ id: operators.id, name: operators.name }).from(operators).orderBy(operators.name).all();
	const scales = [...new Set([...d.selectDistinct({ v: trains.scale }).from(trains).orderBy(trains.scale).all().map(r => r.v), 'N', 'HO', 'Z', 'O', 'TT', 'S'])].sort();

	return { allTrains, formats, allDecoders, allBrands, preselectedTrain, preselectedDecoder, fullTrain, typeParam, manufacturers, operators: allOperators, scales };
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
			const scale = form.get('scale')?.toString() ?? '';
			const name = form.get('name')?.toString() ?? '';
			const modelNumber = form.get('modelNumber')?.toString() ?? '';
			const operatorId = Number(form.get('operatorId'));
			const era = form.get('era')?.toString() ?? '';
			const line = form.get('line')?.toString() ?? '';

			if (!manufacturer || !scale || !name || !modelNumber) {
				return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
			}
			if (manufacturer.length > 200) return fail(400, { error: 'Manufacturer too long (max 200).' });
			if (scale.length > 50) return fail(400, { error: 'Scale too long (max 50).' });
			if (name.length > 200) return fail(400, { error: 'Name too long (max 200).' });
			if (modelNumber.length > 100) return fail(400, { error: 'Model number too long (max 100).' });
			if (era.length > 100) return fail(400, { error: 'Era too long (max 100).' });
			if (line.length > 100) return fail(400, { error: 'Line too long (max 100).' });

			payload = {
				manufacturer,
				scale,
				name,
				modelNumber,
				operatorId,
				era,
				line,
				formatIds: form.getAll('formatIds'),
				decoderIds: form.getAll('decoderIds').map(Number).filter(Boolean)
			};
		} else if (type === 'add_compat') {
			const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
			const formatIds = form.getAll('formatId').map(Number).filter(Boolean);
			const notes = form.get('notes')?.toString() ?? '';

			if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });

			payload = {
				trainId: form.get('trainId'),
				formatIds,
				purpose: form.get('purpose'),
				decoderIds,
				notes
			};
			if (!payload.trainId || formatIds.length === 0) {
				return fail(400, { error: 'Train and at least one format are required.' });
			}
			if (decoderIds.length === 0) {
				return fail(400, { error: 'Please select at least one confirmed decoder.' });
			}
		} else if (type === 'add_decoder') {
			const brandName = form.get('brandName')?.toString() ?? '';
			const formatId = form.get('formatId')?.toString() ?? '';
			const model = form.get('model')?.toString() ?? '';
			const notes = form.get('notes')?.toString() ?? '';
			const buyUrl = form.get('buyUrl')?.toString() ?? '';
			const motor = form.get('motor') === 'on';
			const lights = form.get('lights') === 'on';
			const soundDecoder = form.get('soundDecoder') === 'on';

			if (!brandName) return fail(400, { error: 'Brand name is required.' });
			if (!formatId) return fail(400, { error: 'DCC format is required.' });
			if (!model) return fail(400, { error: 'Model number is required.' });
			if (brandName.length > 200) return fail(400, { error: 'Brand name too long (max 200).' });
			if (model.length > 200) return fail(400, { error: 'Model number too long (max 200).' });
			if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });
			if (buyUrl.length > 500) return fail(400, { error: 'Buy URL too long (max 500).' });
			if (buyUrl && !/^https?:\/\/.+/.test(buyUrl)) return fail(400, { error: 'Buy URL must start with http:// or https://.' });

			payload = { brandName, formatId, model, motor, lights, soundDecoder, notes, buyUrl: buyUrl || null };
		} else if (type === 'correction') {
			const currentValue = form.get('currentValue')?.toString() ?? '';
			const suggestedValue = form.get('suggestedValue')?.toString() ?? '';
			const field = form.get('field')?.toString() ?? '';

			if (field.length > 100) return fail(400, { error: 'Field name too long (max 100).' });
			if (currentValue.length > 1000) return fail(400, { error: 'Current value too long (max 1000).' });
			if (suggestedValue.length > 1000) return fail(400, { error: 'Suggested value too long (max 1000).' });

			payload = { trainId: form.get('trainId'), field, currentValue, suggestedValue };
			if (!payload.trainId || !suggestedValue) {
				return fail(400, { error: 'Please specify what to correct.' });
			}
		} else if (type === 'update_decoder') {
			const decoderId = form.get('decoderId')?.toString() ?? '';
			const updateField = form.get('updateField')?.toString() ?? '';
			const VALID_FIELDS = ['model', 'capabilities', 'format', 'notes'];

			if (!decoderId) return fail(400, { error: 'Please select a decoder.' });
			if (!updateField || !VALID_FIELDS.includes(updateField)) {
				return fail(400, { error: 'Please select a valid field to correct.' });
			}

			let correctedValue: unknown;
			if (updateField === 'capabilities') {
				correctedValue = {
					motor: form.get('motor') === 'on',
					lights: form.get('lights') === 'on',
					soundDecoder: form.get('soundDecoder') === 'on'
				};
			} else {
				const raw = form.get('correctedValue')?.toString() ?? '';
				if (!raw) return fail(400, { error: 'Please provide the corrected value.' });
				if (raw.length > 500) return fail(400, { error: 'Value too long (max 500).' });
				correctedValue = raw;
			}

			payload = { decoderId, field: updateField, correctedValue };
		}

		db()
			.insert(suggestions)
			.values({
				type,
				payload: JSON.stringify(payload),
				submitterNote,
				submitterEmail: submitterEmail || null
			})
			.run();

		return { success: true };
	}
};
