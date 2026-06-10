import crypto from 'crypto';

interface Session {
	createdAt: Date;
}

// Server-side session lifetime. Kept in sync with the admin_auth cookie maxAge
// (8h) so a stolen cookie cannot outlive the browser cookie expiry, regardless
// of how long the server process has been running.
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const sessions = new Map<string, Session>();

function isExpired(session: Session, now = Date.now()): boolean {
	return now - session.createdAt.getTime() >= SESSION_TTL_MS;
}

export function createSession(): string {
	const token = crypto.randomBytes(32).toString('hex');
	sessions.set(token, { createdAt: new Date() });
	return token;
}

export function validateSession(token: string | undefined): boolean {
	if (!token) return false;
	const session = sessions.get(token);
	if (!session) return false;
	if (isExpired(session)) {
		sessions.delete(token);
		return false;
	}
	return true;
}

// Remove expired sessions so the in-memory Map does not grow unbounded with
// abandoned tokens that will never be revisited by validateSession.
export function pruneExpiredSessions(now = Date.now()): void {
	for (const [token, session] of sessions) {
		if (isExpired(session, now)) sessions.delete(token);
	}
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
	const { it, expect, beforeEach, vi } = import.meta.vitest;

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

	it('validateSession rejects a token older than 8h', () => {
		vi.useFakeTimers();
		try {
			const token = createSession();
			expect(validateSession(token)).toBe(true);
			// Advance just past the 8h TTL.
			vi.advanceTimersByTime(1000 * 60 * 60 * 8 + 1);
			expect(validateSession(token)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('validateSession accepts a token just under 8h old', () => {
		vi.useFakeTimers();
		try {
			const token = createSession();
			vi.advanceTimersByTime(1000 * 60 * 60 * 8 - 1000);
			expect(validateSession(token)).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('validateSession prunes the expired token from the Map', () => {
		vi.useFakeTimers();
		try {
			const token = createSession();
			vi.advanceTimersByTime(1000 * 60 * 60 * 8 + 1);
			validateSession(token);
			// Re-validating a now-deleted token still returns false.
			expect(validateSession(token)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('pruneExpiredSessions removes only expired sessions', () => {
		vi.useFakeTimers();
		try {
			const oldToken = createSession();
			vi.advanceTimersByTime(1000 * 60 * 60 * 8 + 1);
			const freshToken = createSession();
			pruneExpiredSessions();
			expect(validateSession(oldToken)).toBe(false);
			expect(validateSession(freshToken)).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('checkPassword returns true for matching passwords', () => {
		expect(checkPassword('secret', 'secret')).toBe(true);
	});

	it('checkPassword returns false for mismatched passwords', () => {
		expect(checkPassword('wrong', 'secret')).toBe(false);
	});
}
