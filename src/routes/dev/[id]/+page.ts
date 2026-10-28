import { dev } from '$app/env';
import { error } from '@sveltejs/kit';
import { loadScene } from '#lib/content/animals.ts';
import type { PageLoad } from './$types';

// The scene previewer exists only on the dev server.
export const load: PageLoad = ({ params }) => {
	if (!dev) error(404, 'Not found');
	return loadScene(params.id);
};
