import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { trains, trainFormatCompat, dccFormats, decoders, decoderBrands, trainDecoderCompat, operators, trainTypes } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const id = Number(params.id);
	if (!id) error(404, 'Not found');

	const d = db();

	const [trainRow] = d
		.select({
			id: trains.id,
			manufacturer: trains.manufacturer,
			scale: trains.scale,
			modelNumber: trains.modelNumber,
			name: trains.name,
			line: trains.line,
			era: trains.era,
			notes: trains.notes,
			createdAt: trains.createdAt,
			operatorName: operators.name,
			typeName: trainTypes.name
		})
		.from(trains)
		.leftJoin(operators, eq(trains.operatorId, operators.id))
		.leftJoin(trainTypes, eq(trains.typeId, trainTypes.id))
		.where(eq(trains.id, id))
		.all();
	if (!trainRow) error(404, 'Train not found');
	const train = trainRow;

	const compatFormats = d
		.select({
			formatId: dccFormats.id,
			formatName: dccFormats.name,
			formatDescription: dccFormats.description,
			purpose: trainFormatCompat.purpose,
			notes: trainFormatCompat.notes
		})
		.from(trainFormatCompat)
		.innerJoin(dccFormats, eq(trainFormatCompat.formatId, dccFormats.id))
		.where(eq(trainFormatCompat.trainId, id))
		.all();

	const formatIds = compatFormats.map((f) => f.formatId);

	// All decoders for compatible formats (format-level fallback)
	const formatDecoders =
		formatIds.length > 0
			? d
					.select({
						id: decoders.id,
						brandName: decoderBrands.name,
						brandWebsite: decoderBrands.website,
						model: decoders.model,
						formatId: decoders.formatId,
						motor: decoders.motor,
						lights: decoders.lights,
						notes: decoders.notes,
						buyUrl: decoders.buyUrl,
						soundDecoder: decoders.soundDecoder
					})
					.from(decoders)
					.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
					.all()
					.filter((dec) => formatIds.includes(dec.formatId))
			: [];

	// Confirmed decoders specifically linked to this train
	const confirmedDecoders = d
		.select({
			id: decoders.id,
			brandName: decoderBrands.name,
			brandWebsite: decoderBrands.website,
			model: decoders.model,
			formatId: decoders.formatId,
			motor: decoders.motor,
			lights: decoders.lights,
			notes: decoders.notes,
			buyUrl: decoders.buyUrl,
			soundDecoder: decoders.soundDecoder,
			compatNotes: trainDecoderCompat.notes,
			confirmed: trainDecoderCompat.confirmed
		})
		.from(trainDecoderCompat)
		.innerJoin(decoders, eq(trainDecoderCompat.decoderId, decoders.id))
		.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
		.where(eq(trainDecoderCompat.trainId, id))
		.all();

	const isAdmin = validateSession(cookies.get('admin_auth'));

	return { train, compatFormats, formatDecoders, confirmedDecoders, isAdmin };
};
