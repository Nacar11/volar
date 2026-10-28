import { loadScene } from '#lib/content/animals.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => loadScene(params.id);
