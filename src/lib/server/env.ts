import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

/**
 * Returns a human-readable problem description if the admin password is unsafe
 * (missing or left at the default placeholder), otherwise `null`.
 *
 * Kept as a pure function so it can be unit-tested without touching the
 * environment or process state.
 */
export function validateAdminPassword(value: string | undefined): string | null {
	if (!value || value === 'changeme') {
		return 'ADMIN_PASSWORD is missing or still set to the default "changeme".';
	}
	return null;
}

// Boot-time guard: in production a weak/missing admin password is fatal; in
// development it is only a warning so local builds and `npm run dev` still work.
// Skipped while `building` (vite build / prerender analysis imports server
// modules with NODE_ENV=production but is not a real server boot).
if (!building) {
	const problem = validateAdminPassword(env.ADMIN_PASSWORD);
	if (problem) {
		const guidance = `${problem} Set a strong value in your environment (e.g. .env) before deploying.`;
		if (process.env.NODE_ENV === 'production') {
			throw new Error(`Refusing to start: ${guidance}`);
		}
		console.warn(`⚠️  ${guidance}`);
	}
}

export const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it('validateAdminPassword flags a missing password', () => {
		expect(validateAdminPassword(undefined)).toMatch(/missing or still set/);
		expect(validateAdminPassword('')).toMatch(/missing or still set/);
	});

	it('validateAdminPassword flags the default placeholder', () => {
		expect(validateAdminPassword('changeme')).toMatch(/missing or still set/);
	});

	it('validateAdminPassword accepts a real password', () => {
		expect(validateAdminPassword('a-strong-secret')).toBeNull();
	});
}
