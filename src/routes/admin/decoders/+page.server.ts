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
			motor: decoders.motor,
			lights: decoders.lights,
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
		const d = db();
		const model   = form.get('model')?.toString() ?? '';
		const notes   = form.get('notes')?.toString() ?? '';
		const buyUrl  = form.get('buyUrl')?.toString() ?? '';
		if (!model) return fail(400, { error: 'Model is required.' });
		if (model.length > 200)  return fail(400, { error: 'Model too long (max 200).' });
		if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });
		if (buyUrl.length > 500) return fail(400, { error: 'URL too long (max 500).' });

		// Resolve brand — existing or inline new
		let brandId = Number(form.get('brandId'));
		const newBrandName = form.get('newBrandName')?.toString() ?? '';
		if (!brandId && newBrandName) {
			const [brand] = d.insert(decoderBrands).values({
				name: newBrandName,
				website: form.get('newBrandWebsite')?.toString() || null
			}).returning().all();
			brandId = brand.id;
		}
		if (!brandId) return fail(400, { error: 'Brand is required.' });

		// Resolve format — existing or inline new
		let formatId = Number(form.get('formatId'));
		const newFormatName = form.get('newFormatName')?.toString() ?? '';
		if (!formatId && newFormatName) {
			const pinCount = Number(form.get('newFormatPinCount')) || null;
			const [fmt] = d.insert(dccFormats).values({
				name: newFormatName,
				pinCount,
				description: form.get('newFormatDescription')?.toString() || null,
				sortOrder: 99
			}).returning().all();
			formatId = fmt.id;
		}
		if (!formatId) return fail(400, { error: 'Format is required.' });

		d.insert(decoders).values({
			brandId, formatId, model,
			notes: notes || null,
			buyUrl: buyUrl || null,
			motor: form.get('motor') === 'on',
			lights: form.get('lights') === 'on',
			soundDecoder: form.get('soundDecoder') === 'on'
		}).run();

		return { success: true };
	},

	addBrand: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString() ?? '';
		const website = form.get('website')?.toString() ?? '';

		if (!name) return fail(400, { error: 'Brand name is required.' });
		if (name.length > 200) return fail(400, { error: 'Brand name too long (max 200).' });
		if (website.length > 500) return fail(400, { error: 'Website URL too long (max 500).' });

		db()
			.insert(decoderBrands)
			.values({
				name,
				website: website || null
			})
			.run();
		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400);
		db().delete(decoders).where(eq(decoders.id, id)).run();
		return { success: true };
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const model = form.get('model')?.toString() ?? '';
		const notes = form.get('notes')?.toString() ?? '';
		const buyUrl = form.get('buyUrl')?.toString() ?? '';
		const brandId = Number(form.get('brandId'));
		const formatId = Number(form.get('formatId'));

		if (!id || !brandId || !formatId || !model) {
			return fail(400, { error: 'ID, brand, format, and model are required.' });
		}
		if (model.length > 200) return fail(400, { error: 'Model too long (max 200).' });
		if (notes.length > 1000) return fail(400, { error: 'Notes too long (max 1000).' });
		if (buyUrl.length > 500) return fail(400, { error: 'URL too long (max 500).' });

		db()
			.update(decoders)
			.set({
				brandId,
				formatId,
				model,
				notes: notes || null,
				buyUrl: buyUrl || null,
				motor: form.get('motor') === 'on',
				lights: form.get('lights') === 'on',
				soundDecoder: form.get('soundDecoder') === 'on'
			})
			.where(eq(decoders.id, id))
			.run();

		return { success: true };
	}
};
