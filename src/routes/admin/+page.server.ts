import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { adminCounts } from '$lib/db/queries';

export const load: PageServerLoad = async () => {
	return adminCounts(db());
};
