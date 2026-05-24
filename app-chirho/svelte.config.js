// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import adapterChirho from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const configChirho = {
	kit: {
		adapter: adapterChirho({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			// Local dev (`vite dev`) reads D1/R2 bindings from our non-default
			// config name + persisted miniflare state (.wrangler/state/v3), so the
			// editor renders against a local clone of prod instead of empty bindings.
			platformProxy: {
				configPath: 'wrangler-chirho.toml',
				persist: true
			}
		})
	}
};

export default configChirho;
