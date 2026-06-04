import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';

export default [
	// Global ignores
	{
		ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'node_modules/**', 'drizzle/**']
	},

	// TypeScript source files
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { extraFileExtensions: ['.svelte'] }
		},
		plugins: { '@typescript-eslint': tsPlugin },
		rules: {
			...tsPlugin.configs['flat/recommended'][1].rules,
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},

	// Svelte component files
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: { parser: tsParser }
		},
		plugins: {
			svelte: sveltePlugin,
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...sveltePlugin.configs['flat/recommended'][1].rules,
			...sveltePlugin.configs['flat/recommended'][2]?.rules,
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},

	// Prettier must be last to disable conflicting formatting rules
	prettierConfig
];
