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
