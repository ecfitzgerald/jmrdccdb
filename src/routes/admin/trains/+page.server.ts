import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { trains, trainFormatCompat, trainDecoderCompat, dccFormats, decoders, decoderBrands } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const d = db();
	const allTrains = d.select().from(trains).orderBy(trains.manufacturer, trains.name).all();
	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();
	const manufacturers = d.selectDistinct({ v: trains.manufacturer }).from(trains).orderBy(trains.manufacturer).all().map(r => r.v);
	const operators = d.selectDistinct({ v: trains.roadName }).from(trains).orderBy(trains.roadName).all().map(r => r.v).filter(Boolean) as string[];
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
			formatName: dccFormats.name
		})
		.from(trainFormatCompat)
		.innerJoin(dccFormats, eq(trainFormatCompat.formatId, dccFormats.id))
		.all();

	const compatByTrain = new Map<number, string[]>();
	for (const c of compat) {
		if (!compatByTrain.has(c.trainId)) compatByTrain.set(c.trainId, []);
		compatByTrain.get(c.trainId)!.push(c.formatName);
	}

	return {
		trains: allTrains.map((t) => ({ ...t, formats: compatByTrain.get(t.id) ?? [] })),
		formats,
		manufacturers,
		operators,
		scales,
		allDecoders
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const manufacturer = form.get('manufacturer')?.toString() ?? '';
		const scale = form.get('scale')?.toString() ?? '';
		const name = form.get('name')?.toString() ?? '';
		const modelNumber = form.get('modelNumber')?.toString() ?? '';
		const roadName = form.get('roadName')?.toString() ?? '';
		const era = form.get('era')?.toString() ?? '';
		const notes = form.get('notes')?.toString() ?? '';

		if (!manufacturer || !scale || !name || !modelNumber) {
			return fail(400, { error: 'Manufacturer, scale, name, and model number are required.' });
		}
		if (manufacturer.length > 200) return fail(400, { error: 'Manufacturer too long (max 200).' });
		if (scale.length > 50) return fail(400, { error: 'Scale too long (max 50).' });
		if (name.length > 200) return fail(400, { error: 'Name too long (max 200).' });
		if (modelNumber.length > 100) return fail(400, { error: 'Model number too long (max 100).' });
		if (roadName.length > 200) return fail(400, { error: 'Road name too long (max 200).' });
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
				roadName: roadName || null,
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

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400);
		db().delete(trains).where(eq(trains.id, id)).run();
		return { success: true };
	}
};
