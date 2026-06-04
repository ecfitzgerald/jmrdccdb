import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const auth = cookies.get('admin_auth');
	if (auth !== ADMIN_PASSWORD && url.pathname !== '/admin/login') {
		redirect(303, '/admin/login');
	}
};
