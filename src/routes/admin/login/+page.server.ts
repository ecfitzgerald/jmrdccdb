import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$lib/server/env';
import { checkPassword, createSession, deleteSession, validateSession } from '$lib/server/session';
import { checkRateLimit, recordFailure, clearRateLimit } from '$lib/server/rate-limit';

export const load: PageServerLoad = async ({ cookies }) => {
	if (validateSession(cookies.get('admin_auth'))) {
		redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		if (checkRateLimit(ip)) {
			return fail(429, { error: 'Too many failed attempts. Try again later.' });
		}
		const form = await request.formData();
		const password = form.get('password')?.toString() ?? '';
		// Cap input length to reject oversized payloads before hashing. Same
		// generic response as a wrong password so length isn't an oracle.
		if (password.length > 256 || !checkPassword(password, ADMIN_PASSWORD ?? '')) {
			recordFailure(ip);
			return fail(401, { error: 'Incorrect password.' });
		}
		clearRateLimit(ip);
		const token = createSession();
		cookies.set('admin_auth', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 8 // 8 hours
		});
		redirect(303, '/admin');
	},
	logout: async ({ cookies }) => {
		deleteSession(cookies.get('admin_auth'));
		cookies.delete('admin_auth', { path: '/' });
		redirect(303, '/admin/login');
	}
};
