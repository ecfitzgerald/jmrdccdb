import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { decoders, decoderBrands, dccFormats } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const d = db();
	const allDecoders = d
		.select({
			id: decoders.id,
			brandName: decoderBrands.name,
			model: decoders.model,
			formatName: dccFormats.name,
			formatId: decoders.formatId,
			brandId: decoders.brandId,
			notes: decoders.notes,
			buyUrl: decoders.buyUrl,
			soundDecoder: decoders.soundDecoder
		})
		.from(decoders)
		.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
		.innerJoin(dccFormats, eq(decoders.formatId, dccFormats.id))
		.orderBy(decoderBrands.name, dccFormats.name)
		.all();

	const brands = d.select().from(decoderBrands).orderBy(decoderBrands.name).all();
	const formats = d.select().from(dccFormats).orderBy(dccFormats.sortOrder).all();

	return { decoders: allDecoders, brands, formats };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const brandId = Number(form.get('brandId'));
		const formatId = Number(form.get('formatId'));
		const model = form.get('model')?.toString() ?? '';

		if (!brandId || !formatId || !model) {
			return fail(400, { error: 'Brand, format, and model are required.' });
		}

		db().insert(decoders).values({
			brandId, formatId, model,
			notes: form.get('notes')?.toString() || null,
			buyUrl: form.get('buyUrl')?.toString() || null,
			motor: form.get('motor') === 'on',
			lights: form.get('lights') === 'on',
			soundDecoder: form.get('soundDecoder') === 'on'
		}).run();

		return { success: true };
	},

	addBrand: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString() ?? '';
		if (!name) return fail(400, { error: 'Brand name is required.' });
		db().insert(decoderBrands).values({
			name,
			website: form.get('website')?.toString() || null
		}).run();
		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400);
		db().delete(decoders).where(eq(decoders.id, id)).run();
		return { success: true };
	}
};
