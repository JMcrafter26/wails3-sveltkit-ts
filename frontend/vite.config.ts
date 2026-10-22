import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import wails from '@wailsio/runtime/plugins/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// Use normal pathname URLs. main.go provides the SPA fallback in production.
			router: { type: 'pathname' },
			adapter: adapter({
				pages: 'dist',
				assets: 'dist',
				fallback: 'index.html',
				strict: true
			})
		}),
		wails('./bindings')
	],
	server: {
		host: '127.0.0.1',
		port: 9245,
		strictPort: true
	}
});
