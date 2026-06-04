export function shortFormat(name: string): string {
	return name.replace(/\s*\(.*?\)$/, '').trim();
}

if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it('shortFormat strips trailing parenthetical', () => {
		expect(shortFormat('NMRA DCC (S-9.1)')).toBe('NMRA DCC');
	});

	it('shortFormat strips parenthetical with spaces', () => {
		expect(shortFormat('DCC (some note)')).toBe('DCC');
	});

	it('shortFormat leaves names without parentheticals unchanged', () => {
		expect(shortFormat('Selectrix')).toBe('Selectrix');
	});

	it('shortFormat does not strip mid-string parentheticals', () => {
		expect(shortFormat('DCC (EXT) Extended')).toBe('DCC (EXT) Extended');
	});

	it('shortFormat trims surrounding whitespace', () => {
		expect(shortFormat('  DCC  ')).toBe('DCC');
	});
}
