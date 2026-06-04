import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { checkPassword, createSession, deleteSession, validateSession } from '$lib/server/session';

export const load: PageServerLoad = async ({ cookies }) => {
	if (validateSession(cookies.get('admin_auth'))) {
		redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = form.get('password')?.toString() ?? '';
		if (!checkPassword(password, ADMIN_PASSWORD)) {
			return fail(401, { error: 'Incorrect password.' });
		}
		const token = createSession();
		cookies.set('admin_auth', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		deleteSession(cookies.get('admin_auth'));
		cookies.delete('admin_auth', { path: '/' });
		redirect(303, '/admin/login');
	}
};
