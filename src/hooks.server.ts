import crypto from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';

// Importing the env module executes the ADMIN_PASSWORD boot-time guard at
// server startup. Route modules load lazily, so hooks.server.ts is the earliest
// reliable point to fail fast on an insecure/missing admin password.
import '$lib/server/env';

/**
 * Build the Content-Security-Policy for a request.
 *
 * SvelteKit emits a small inline hydration <script>, so script-src uses a
 * per-request nonce (injected into inline scripts via transformPageChunk)
 * rather than 'unsafe-inline'. Styles allow 'unsafe-inline' because Svelte and
 * inline style="" attributes (e.g. in app.html) emit inline CSS; the XSS risk
 * of style injection is far lower than scripts. The Google Fonts origins are
 * whitelisted for the Noto Sans JP / Mono stylesheet and font files.
 */
function buildCsp(nonce: string): string {
	return [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}'`,
		`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
		`font-src 'self' https://fonts.gstatic.com`,
		`img-src 'self' data:`,
		`connect-src 'self'`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`frame-ancestors 'none'`
	].join('; ');
}

export const handle: Handle = async ({ event, resolve }) => {
	// Guard every /admin request except the login page itself. This runs before
	// resolve so it protects form actions (POST), not just load() functions.
	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
		if (!validateSession(event.cookies.get('admin_auth'))) {
			if (event.request.method === 'GET') {
				return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
			}
			return new Response('Forbidden', { status: 403 });
		}
	}

	const nonce = crypto.randomBytes(16).toString('base64');

	const response = await resolve(event, {
		// Tag SvelteKit's inline scripts with the request nonce so they pass the
		// strict script-src above.
		transformPageChunk: ({ html }) => html.replace(/<script/g, `<script nonce="${nonce}"`)
	});

	const headers = response.headers;
	headers.set('Content-Security-Policy', buildCsp(nonce));
	headers.set('X-Frame-Options', 'DENY');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
	// Disable the legacy XSS auditor (modern guidance — CSP is the real defense).
	headers.set('X-XSS-Protection', '0');
	headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	// Only assert HSTS over HTTPS; the app may also be reached over plain HTTP on
	// a LAN/NAS, where forcing HTTPS would break access.
	if (event.url.protocol === 'https:') {
		headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
	}

	return response;
};
