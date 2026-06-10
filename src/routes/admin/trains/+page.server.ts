import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { trains, trainFormatCompat, trainDecoderCompat, dccFormats, decoders, decoderBrands, operators } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const d = db();
	const allTrains = d.select().from(trains).orderBy(trains.manufacturer, trains.name).all();
	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();
	const manufacturers = d.selectDistinct({ v: trains.manufacturer }).from(trains).orderBy(trains.manufacturer).all().map(r => r.v);
	const allOperators = d.select({ id: operators.id, name: operators.name }).from(operators).orderBy(operators.name).all();
	const scales = [...new Set([...d.selectDistinct({ v: trains.scale }).from(trains).orderBy(trains.scale).all().map(r => r.v), 'N', 'HO', 'Z', 'O', 'TT', 'S'])].sort();
	const allDecoders = d
		.select({ id: decoders.id, brandName: decoderBrands.name, model: decoders.model, formatId: decoders.formatId, motor: decoders.motor, lights: decoders.lights, soundDecoder: decoders.soundDecoder, notes: decoders.notes })
		.from(decoders)
		.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
		.orderBy(decoderBrands.name, decoders.model)
		.all();
	const compat = d
		.select({
			trainId: trainFormatCompat.trainId,
			formatId: trainFormatCompat.formatId,
			formatName: dccFormats.name,
			purpose: trainFormatCompat.purpose
		})
		.from(trainFormatCompat)
		.innerJoin(dccFormats, eq(trainFormatCompat.formatId, dccFormats.id))
		.all();
	const decoderCompat = d
		.select({ trainId: trainDecoderCompat.trainId, decoderId: trainDecoderCompat.decoderId })
		.from(trainDecoderCompat)
		.all();

	const compatByTrain = new Map<number, string[]>();
	const formatCompatByTrain = new Map<number, Array<{ formatId: number; purpose: string }>>();
	for (const c of compat) {
		if (!compatByTrain.has(c.trainId)) compatByTrain.set(c.trainId, []);
		compatByTrain.get(c.trainId)!.push(c.formatName);
		if (!formatCompatByTrain.has(c.trainId)) formatCompatByTrain.set(c.trainId, []);
		formatCompatByTrain.get(c.trainId)!.push({ formatId: c.formatId, purpose: c.purpose });
	}
	const decoderCompatByTrain = new Map<number, number[]>();
	for (const dc of decoderCompat) {
		if (!decoderCompatByTrain.has(dc.trainId)) decoderCompatByTrain.set(dc.trainId, []);
		decoderCompatByTrain.get(dc.trainId)!.push(dc.decoderId);
	}

	const editId = url.searchParams.get('edit') ? Number(url.searchParams.get('edit')) : null;

	return {
		trains: allTrains.map((t) => ({
			...t,
			formats: compatByTrain.get(t.id) ?? [],
			formatCompat: formatCompatByTrain.get(t.id) ?? [],
			decoderIds: decoderCompatByTrain.get(t.id) ?? []
		})),
		formats,
		manufacturers,
		operators: allOperators,
		scales,
		allDecoders,
		editId
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const manufacturer = form.get('manufacturer')?.toString() ?? '';
		const scale = form.get('scale')?.toString() ?? '';
		const name = form.get('name')?.toString() ?? '';
		const modelNumber = form.get('modelNumber')?.toString() ?? '';
		const operatorId = Number(form.get('operatorId'));
		const line = form.get('line')?.toString() ?? '';
		const era = form.get('era')?.toString() ?? '';
		const notes = form.get('notes')?.toString() ?? '';

		if (!manufacturer || !scale || !name || !modelNumber) {
			return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
		}
		if (manufacturer.length > 200) return fail(400, { error: 'Manufacturer too long (max 200).' });
		if (scale.length > 50) return fail(400, { error: 'Scale too long (max 50).' });
		if (name.length > 200) return fail(400, { error: 'Name too long (max 200).' });
		if (modelNumber.length > 100) return fail(400, { error: 'Model number too long (max 100).' });
		if (line.length > 200) return fail(400, { error: 'Line too long (max 200).' });
		if (era.length > 100) return fail(400, { error: 'Era too long (max 100).' });
		if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });

		const d = db();
		const [train] = d
			.insert(trains)
			.values({
				manufacturer,
				scale,
				name,
				modelNumber,
				operatorId: operatorId || null,
				line: line || null,
				era: era || null,
				notes: notes || null
			})
			.returning()
			.all();

		const formatIds = form.getAll('formatIds').map(Number).filter(Boolean);
		const formatPurposes = form.getAll('formatPurposes');
		for (let i = 0; i < formatIds.length; i++) {
			d.insert(trainFormatCompat)
				.values({
					trainId: train.id,
					formatId: formatIds[i],
					purpose: (formatPurposes[i] as string) || 'Motor & Lights'
				})
				.run();
		}

		const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
		for (const did of decoderIds) {
			d.insert(trainDecoderCompat).values({ trainId: train.id, decoderId: did, confirmed: true }).run();
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'Invalid train ID.' });

		const manufacturer = form.get('manufacturer')?.toString() ?? '';
		const scale = form.get('scale')?.toString() ?? '';
		const name = form.get('name')?.toString() ?? '';
		const modelNumber = form.get('modelNumber')?.toString() ?? '';
		const operatorId = Number(form.get('operatorId'));
		const line = form.get('line')?.toString() ?? '';
		const era = form.get('era')?.toString() ?? '';
		const notes = form.get('notes')?.toString() ?? '';

		if (!manufacturer || !scale || !name || !modelNumber) {
			return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
		}
		if (manufacturer.length > 200) return fail(400, { error: 'Manufacturer too long (max 200).' });
		if (scale.length > 50) return fail(400, { error: 'Scale too long (max 50).' });
		if (name.length > 200) return fail(400, { error: 'Name too long (max 200).' });
		if (modelNumber.length > 100) return fail(400, { error: 'Model number too long (max 100).' });
		if (line.length > 200) return fail(400, { error: 'Line too long (max 200).' });
		if (era.length > 100) return fail(400, { error: 'Era too long (max 100).' });
		if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });

		const d = db();
		d.update(trains)
			.set({
				manufacturer,
				scale,
				name,
				modelNumber,
				operatorId: operatorId || null,
				line: line || null,
				era: era || null,
				notes: notes || null
			})
			.where(eq(trains.id, id))
			.run();

		d.delete(trainFormatCompat).where(eq(trainFormatCompat.trainId, id)).run();
		const formatIds = form.getAll('formatIds').map(Number).filter(Boolean);
		const formatPurposes = form.getAll('formatPurposes');
		for (let i = 0; i < formatIds.length; i++) {
			d.insert(trainFormatCompat)
				.values({ trainId: id, formatId: formatIds[i], purpose: (formatPurposes[i] as string) || 'Motor & Lights' })
				.run();
		}

		d.delete(trainDecoderCompat).where(eq(trainDecoderCompat.trainId, id)).run();
		const decoderIds = form.getAll('decoderIds').map(Number).filter(Boolean);
		for (const did of decoderIds) {
			d.insert(trainDecoderCompat).values({ trainId: id, decoderId: did, confirmed: true }).run();
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
