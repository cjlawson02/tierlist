import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	base: './',
	server: {
		proxy: {
			'/tpaas-proxy': {
				target: 'https://tpaas.chrislawson.dev',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/tpaas-proxy/, ''),
			},
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['src/test/setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		clearMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
		},
	},
});
