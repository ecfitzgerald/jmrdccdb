import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { suggestions, trains, decoders } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const d = db();
	const pendingCount = d.select({ count: sql<number>`count(*)` })
		.from(suggestions).where(eq(suggestions.status, 'pending')).get()?.count ?? 0;
	const trainCount = d.select({ count: sql<number>`count(*)` }).from(trains).get()?.count ?? 0;
	const decoderCount = d.select({ count: sql<number>`count(*)` }).from(decoders).get()?.count ?? 0;
	return { pendingCount, trainCount, decoderCount };
};
