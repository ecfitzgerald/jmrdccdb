import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { trains, trainFormatCompat, dccFormats, decoders } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { distinctManufacturers, distinctScales } from '$lib/db/queries';

export const load: PageServerLoad = async () => {
	const d = db();

	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();

	const manufacturers = distinctManufacturers(d);
	const scales = distinctScales(d);

	const allTrains = d
		.select({
			id: trains.id,
			manufacturer: trains.manufacturer,
			scale: trains.scale,
			roadName: trains.roadName,
			modelNumber: trains.modelNumber,
			name: trains.name,
			era: trains.era
		})
		.from(trains)
		.all();

	const trainIds = allTrains.map((t) => t.id);

	const compatRows =
		trainIds.length > 0
			? d
					.select({
						trainId: trainFormatCompat.trainId,
						formatId: trainFormatCompat.formatId,
						formatName: dccFormats.name,
						purpose: trainFormatCompat.purpose,
						compatNotes: trainFormatCompat.notes,
						decoderCount: sql<number>`count(${decoders.id})`,
						soundDecoderCount: sql<number>`count(case when ${decoders.soundDecoder} = 1 then 1 end)`
					})
					.from(trainFormatCompat)
					.innerJoin(dccFormats, eq(trainFormatCompat.formatId, dccFormats.id))
					.leftJoin(decoders, eq(decoders.formatId, trainFormatCompat.formatId))
					.where(
						sql`${trainFormatCompat.trainId} in (${sql.join(
							trainIds.map((id) => sql`${id}`),
							sql`, `
						)})`
					)
					.groupBy(trainFormatCompat.trainId, trainFormatCompat.formatId)
					.all()
			: [];

	const compatByTrain = new Map<number, typeof compatRows>();
	for (const row of compatRows) {
		if (!compatByTrain.has(row.trainId)) compatByTrain.set(row.trainId, []);
		compatByTrain.get(row.trainId)!.push(row);
	}

	const result = allTrains.map((t) => ({
		...t,
		formats: compatByTrain.get(t.id) ?? []
	}));

	return { trains: result, formats, manufacturers, scales };
};
