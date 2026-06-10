import { building } from '$app/environment';

// Sliding-window login rate limiter keyed by client IP.
//
// CLIENT IP NOTE: the key comes from event.getClientAddress() in the login
// action, which the SvelteKit Node adapter resolves from the header named by
// the ADDRESS_HEADER environment variable. On a NAS behind nginx/HAProxy:
//
//   ADDRESS_HEADER=X-Real-IP        (if nginx sets proxy_set_header X-Real-IP)
//   ADDRESS_HEADER=X-Forwarded-For  (take the leftmost hop)
//
// Without ADDRESS_HEADER every request keys to the proxy's LAN IP, collapsing
// all clients into one bucket — any attacker can lock out the real admin.
// The startup warning below (see bottom of file) flags this misconfiguration.

const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const MAX_FAILURES = 10;
const MAX_TRACKED_IPS = 500; // bound memory under IP rotation

interface Attempt {
	failures: number;
	windowStart: number;
}

const attempts = new Map<string, Attempt>();

function evictIfNeeded(now: number): void {
	if (attempts.size < MAX_TRACKED_IPS) return;
	// Sweep expired windows first — avoids unnecessary eviction of live entries.
	for (const [ip, entry] of attempts) {
		if (now - entry.windowStart >= WINDOW_MS) attempts.delete(ip);
	}
	// If still at the cap after the sweep, evict the single oldest live entry.
	if (attempts.size >= MAX_TRACKED_IPS) {
		let oldestIp = '';
		let oldestTime = Infinity;
		for (const [ip, entry] of attempts) {
			if (entry.windowStart < oldestTime) {
				oldestTime = entry.windowStart;
				oldestIp = ip;
			}
		}
		if (oldestIp) attempts.delete(oldestIp);
	}
}

export interface RateLimitResult {
	limited: boolean;
	/** Seconds until the window resets (0 when not limited). */
	retryAfterSeconds: number;
}

/** Reports whether the IP has exceeded the failure threshold. */
export function checkRateLimit(ip: string, now = Date.now()): RateLimitResult {
	const entry = attempts.get(ip);
	if (!entry || now - entry.windowStart >= WINDOW_MS) {
		return { limited: false, retryAfterSeconds: 0 };
	}
	if (entry.failures >= MAX_FAILURES) {
		const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
		return { limited: true, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
	}
	return { limited: false, retryAfterSeconds: 0 };
}

/** Record a failed login attempt for the given IP. */
export function recordFailure(ip: string, now = Date.now()): void {
	evictIfNeeded(now);
	const entry = attempts.get(ip);
	if (!entry || now - entry.windowStart >= WINDOW_MS) {
		attempts.set(ip, { failures: 1, windowStart: now });
	} else {
		entry.failures++;
	}
}

/** Clear the rate-limit record on a successful login. */
export function clearRateLimit(ip: string): void {
	attempts.delete(ip);
}

// Warn at startup if ADDRESS_HEADER is not set, because without it
// getClientAddress() returns the proxy LAN IP and the rate limiter is useless.
if (!building && typeof process !== 'undefined') {
	if (!process.env.ADDRESS_HEADER) {
		console.warn(
			'⚠️  ADDRESS_HEADER is not set. Login rate-limiting keys on getClientAddress(), ' +
				'which will collapse to the reverse-proxy IP behind a proxy. ' +
				'Set ADDRESS_HEADER=X-Real-IP (or equivalent) in your environment.'
		);
	}
}

if (import.meta.vitest) {
	const { it, expect, beforeEach } = import.meta.vitest;

	beforeEach(() => {
		attempts.clear();
	});

	it('allows requests below the threshold', () => {
		for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure('1.2.3.4');
		expect(checkRateLimit('1.2.3.4').limited).toBe(false);
	});

	it('blocks after MAX_FAILURES failures', () => {
		for (let i = 0; i < MAX_FAILURES; i++) recordFailure('1.2.3.4');
		expect(checkRateLimit('1.2.3.4').limited).toBe(true);
	});

	it('does not affect a different IP', () => {
		for (let i = 0; i < MAX_FAILURES; i++) recordFailure('1.2.3.4');
		expect(checkRateLimit('5.6.7.8').limited).toBe(false);
	});

	it('resets after the window expires', () => {
		const t0 = Date.now();
		for (let i = 0; i < MAX_FAILURES; i++) recordFailure('1.2.3.4', t0);
		expect(checkRateLimit('1.2.3.4', t0 + WINDOW_MS).limited).toBe(false);
	});

	it('clearRateLimit removes the block', () => {
		for (let i = 0; i < MAX_FAILURES; i++) recordFailure('1.2.3.4');
		clearRateLimit('1.2.3.4');
		expect(checkRateLimit('1.2.3.4').limited).toBe(false);
	});

	it('reports a shrinking retry-after as the window elapses', () => {
		const t0 = Date.now();
		for (let i = 0; i < MAX_FAILURES; i++) recordFailure('1.2.3.4', t0);
		expect(checkRateLimit('1.2.3.4', t0).retryAfterSeconds).toBe(WINDOW_MS / 1000);
		const half = checkRateLimit('1.2.3.4', t0 + WINDOW_MS / 2);
		expect(half.retryAfterSeconds).toBe(WINDOW_MS / 2 / 1000);
	});

	it('evicts entries when the map reaches MAX_TRACKED_IPS', () => {
		const t0 = 1000;
		// Fill map to capacity with IPs that have unexpired windows
		for (let i = 0; i < MAX_TRACKED_IPS; i++) {
			recordFailure(`10.0.${Math.floor(i / 256)}.${i % 256}`, t0 + i);
		}
		expect(attempts.size).toBe(MAX_TRACKED_IPS);
		// Adding one more should evict the oldest, keeping size bounded
		recordFailure('192.168.1.1', t0 + MAX_TRACKED_IPS);
		expect(attempts.size).toBeLessThanOrEqual(MAX_TRACKED_IPS);
	});
}
