import crypto from 'crypto';

interface Session {
	createdAt: Date;
}

const sessions = new Map<string, Session>();

export function createSession(): string {
	const token = crypto.randomBytes(32).toString('hex');
	sessions.set(token, { createdAt: new Date() });
	return token;
}

export function validateSession(token: string | undefined): boolean {
	if (!token) return false;
	return sessions.has(token);
}

export function deleteSession(token: string | undefined): void {
	if (token) sessions.delete(token);
}

export function checkPassword(submitted: string, expected: string): boolean {
	const a = crypto.createHash('sha256').update(submitted).digest();
	const b = crypto.createHash('sha256').update(expected).digest();
	return crypto.timingSafeEqual(a, b);
}

if (import.meta.vitest) {
	const { it, expect, beforeEach } = import.meta.vitest;

	beforeEach(() => {
		sessions.clear();
	});

	it('createSession returns a 64-char hex token', () => {
		const token = createSession();
		expect(token).toMatch(/^[0-9a-f]{64}$/);
	});

	it('createSession returns unique tokens', () => {
		const tokens = new Set(Array.from({ length: 20 }, () => createSession()));
		expect(tokens.size).toBe(20);
	});

	it('validateSession returns true for a created session', () => {
		const token = createSession();
		expect(validateSession(token)).toBe(true);
	});

	it('validateSession returns false for unknown token', () => {
		expect(validateSession('deadbeef')).toBe(false);
	});

	it('validateSession returns false for undefined', () => {
		expect(validateSession(undefined)).toBe(false);
	});

	it('deleteSession invalidates the token', () => {
		const token = createSession();
		deleteSession(token);
		expect(validateSession(token)).toBe(false);
	});

	it('checkPassword returns true for matching passwords', () => {
		expect(checkPassword('secret', 'secret')).toBe(true);
	});

	it('checkPassword returns false for mismatched passwords', () => {
		expect(checkPassword('wrong', 'secret')).toBe(false);
	});
}
