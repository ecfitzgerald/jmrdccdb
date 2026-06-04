import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { dccFormats, trainFormatCompat } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const d = db();
	const formats = d
		.select({
			id: dccFormats.id,
			name: dccFormats.name,
			pinCount: dccFormats.pinCount,
			description: dccFormats.description,
			sortOrder: dccFormats.sortOrder,
			trainCount: sql<number>`count(${trainFormatCompat.trainId})`
		})
		.from(dccFormats)
		.leftJoin(trainFormatCompat, eq(trainFormatCompat.formatId, dccFormats.id))
		.groupBy(dccFormats.id)
		.orderBy(dccFormats.sortOrder)
		.all();

	return { formats };
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString() ?? '';
		if (!name) return fail(400, { error: 'Name is required.' });

		db().insert(dccFormats).values({
			name,
			pinCount: Number(form.get('pinCount')) || null,
			description: form.get('description')?.toString() || null,
			sortOrder: Number(form.get('sortOrder')) || 0
		}).run();

		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400);
		db().delete(dccFormats).where(eq(dccFormats.id, id)).run();
		return { success: true };
	}
};
