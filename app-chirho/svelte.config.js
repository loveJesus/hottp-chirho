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
			}
		})
	}
};

export default configChirho;
