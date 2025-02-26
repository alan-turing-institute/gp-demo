import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess()],

	kit: {
		adapter: adapter({
		  pages: 'build',  // directory for built pages
		  assets: 'build', // directory for built assets
		  fallback: null   // if you need a fallback (like for SPAs), set it here
		}),
		prerender: {
			// This tells SvelteKit to prerender every route it finds.
			entries: ['*']
		  },
	},
	extensions: ['.svelte', '.svx']
};

export default config;