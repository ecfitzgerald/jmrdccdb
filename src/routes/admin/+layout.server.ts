import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	if (!validateSession(cookies.get('admin_auth')) && url.pathname !== '/admin/login') {
		redirect(303, '/admin/login');
	}
};
