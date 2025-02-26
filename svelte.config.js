import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		adapter: adapter({
		  // Provide a fallback page name (e.g. 'index.html' or '200.html')
		  fallback: 'index.html',
	
		  // 'strict: false' will ignore any routes that can't be prerendered
		  // (or were never explicitly generated). They will rely on the fallback.
		  // If you prefer the build to fail when it sees “dynamic” routes,
		  // you can leave strict: true (the default) and rely solely on the fallback.
		  strict: false
		})
	},

	extensions: ['.svelte', '.svx']
};

export default config;
