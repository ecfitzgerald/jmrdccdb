import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import {
	suggestions, trains, trainFormatCompat, trainDecoderCompat,
	dccFormats, decoders, decoderBrands
} from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!id) error(404, 'Not found');

	const d = db();
	const [suggestion] = d.select().from(suggestions).where(eq(suggestions.id, id)).all();
	if (!suggestion) error(404, 'Suggestion not found');

	const payload = JSON.parse(suggestion.payload);

	// Load reference data based on type
	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();
	const brands  = d.select().from(decoderBrands).orderBy(decoderBrands.name).all();

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

	const allTrains = d
		.select({ id: trains.id, manufacturer: trains.manufacturer, name: trains.name, modelNumber: trains.modelNumber })
		.from(trains)
		.orderBy(trains.manufacturer, trains.name)
		.all();

	const manufacturers = d.selectDistinct({ v: trains.manufacturer }).from(trains).orderBy(trains.manufacturer).all().map(r => r.v);
	const operators     = d.selectDistinct({ v: trains.roadName }).from(trains).orderBy(trains.roadName).all().map(r => r.v).filter(Boolean) as string[];
	const scales        = d.selectDistinct({ v: trains.scale }).from(trains).orderBy(trains.scale).all().map(r => r.v);

	return { suggestion, payload, formats, brands, allDecoders, allTrains, manufacturers, operators, scales };
};

export const actions: Actions = {
	approve: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const d = db();

		const [suggestion] = d.select().from(suggestions).where(eq(suggestions.id, id)).all();
		if (!suggestion) return fail(404);

		const adminNote = form.get('adminNote')?.toString() ?? '';

		if (suggestion.type === 'add_train') {
			const manufacturer = form.get('manufacturer')?.toString() ?? '';
			const scale        = form.get('scale')?.toString() ?? '';
			const name         = form.get('name')?.toString() ?? '';
			const modelNumber  = form.get('modelNumber')?.toString() ?? '';

			if (!manufacturer || !scale || !name || !modelNumber) {
				return fail(400, { error: 'Manufacturer, scale, name and model number are required.' });
			}

			const [train] = d.insert(trains).values({
				manufacturer, scale, name, modelNumber,
				roadName: form.get('roadName')?.toString() || null,
				era:      form.get('era')?.toString()      || null,
				notes:    form.get('notes')?.toString()    || null
			}).returning().all();

			const formatIds     = form.getAll('formatIds').map(Number).filter(Boolean);
			const formatPurposes = form.getAll('formatPurposes');
			for (let i = 0; i < formatIds.length; i++) {
				d.insert(trainFormatCompat).values({
					trainId: train.id, formatId: formatIds[i],
					purpose: (formatPurposes[i] as string) || 'Motor & Lights'
				}).run();
			}

			const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
			for (const did of decoderIds) {
				d.insert(trainDecoderCompat).values({ trainId: train.id, decoderId: did, confirmed: true }).run();
			}

		} else if (suggestion.type === 'add_compat') {
			const trainId  = Number(form.get('trainId'));
			const formatId = Number(form.get('formatId'));
			if (!trainId || !formatId) return fail(400, { error: 'Train and format required.' });

			// Derive purpose from selected decoders
			const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
			let purpose = (form.get('purpose')?.toString()) || 'Motor & Lights';

			if (decoderIds.length) {
				const rows = d.select({ motor: decoders.motor, lights: decoders.lights })
					.from(decoders).all()
					.filter((dec: any) => decoderIds.includes(dec.id));
				const m = rows.some((r: any) => r.motor);
				const l = rows.some((r: any) => r.lights);
				purpose = m && l ? 'Motor & Lights' : m ? 'Motor Only' : 'Lights Only';
			}

			d.insert(trainFormatCompat).values({
				trainId, formatId, purpose,
				notes: form.get('notes')?.toString() || null
			}).run();

			for (const did of decoderIds) {
				d.insert(trainDecoderCompat).values({
					trainId, decoderId: did, confirmed: true,
					notes: form.get('notes')?.toString() || null
				}).run();
			}

		} else if (suggestion.type === 'add_decoder') {
			const brandId    = Number(form.get('brandId'));
			const newBrand   = form.get('newBrandName')?.toString() ?? '';
			const formatId   = Number(form.get('formatId'));
			const model      = form.get('model')?.toString() ?? '';
			if ((!brandId && !newBrand) || !formatId || !model) {
				return fail(400, { error: 'Brand, format and model are required.' });
			}

			let resolvedBrandId = brandId;
			if (!brandId && newBrand) {
				const [brand] = d.insert(decoderBrands).values({
					name: newBrand,
					website: form.get('newBrandWebsite')?.toString() || null
				}).returning().all();
				resolvedBrandId = brand.id;
			}

			d.insert(decoders).values({
				brandId:      resolvedBrandId,
				formatId,
				model,
				motor:        form.get('motor')       === 'on',
				lights:       form.get('lights')      === 'on',
				soundDecoder: form.get('sound')       === 'on',
				notes:        form.get('notes')?.toString()  || null,
				buyUrl:       form.get('buyUrl')?.toString() || null
			}).run();

		} else if (suggestion.type === 'correction') {
			// Correction: admin manually applies the change — just mark approved
		}

		d.update(suggestions)
			.set({ status: 'approved', adminNote })
			.where(eq(suggestions.id, id))
			.run();

		redirect(303, '/admin/suggestions');
	},

	reject: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();
		db().update(suggestions)
			.set({ status: 'rejected', adminNote: form.get('adminNote')?.toString() ?? '' })
			.where(eq(suggestions.id, id))
			.run();
		redirect(303, '/admin/suggestions');
	}
};
