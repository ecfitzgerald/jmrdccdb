import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';

export const load: PageServerLoad = async ({ cookies }) => {
	if (cookies.get('admin_auth') === ADMIN_PASSWORD) {
		redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = form.get('password')?.toString() ?? '';
		if (password !== ADMIN_PASSWORD) {
			return fail(401, { error: 'Incorrect password.' });
		}
		cookies.set('admin_auth', ADMIN_PASSWORD, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		cookies.delete('admin_auth', { path: '/' });
		redirect(303, '/admin/login');
	}
};
