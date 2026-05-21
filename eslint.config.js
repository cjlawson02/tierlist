import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const testingLibraryReactConfig = testingLibrary.configs['flat/react'];

export default tseslint.config(
	{ ignores: ['dist', 'coverage', '__mocks__'] },
	{
		extends: [
			js.configs.recommended,
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
		],
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		...reactPlugin.configs.flat.recommended,
		...reactPlugin.configs.flat['jsx-runtime'],
	},
	{
		files: ['**/*.{ts,tsx}'],
		...reactHooks.configs.flat.recommended,
	},
	reactRefresh.configs.vite(),
	{
		files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
		...testingLibraryReactConfig,
		plugins: {
			...testingLibraryReactConfig.plugins,
			vitest,
		},
		languageOptions: {
			globals: {
				...vitest.environments.env.globals,
			},
		},
		rules: {
			...testingLibraryReactConfig.rules,
			...vitest.configs.recommended.rules,
			'testing-library/no-manual-cleanup': 'off',
			'testing-library/prefer-user-event': 'error',
			'testing-library/prefer-user-event-setup': 'error',
			'vitest/prefer-lowercase-title': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off',
			'@typescript-eslint/no-deprecated': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'react-refresh/only-export-components': 'off',
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: '@testing-library/react',
							importNames: ['fireEvent'],
							message:
								'Use userEvent from src/test/render instead of fireEvent.',
						},
						{
							name: '@testing-library/dom',
							message: 'Import testing utilities from src/test/render instead.',
						},
					],
				},
			],
		},
	},
	eslintConfigPrettier,
);
