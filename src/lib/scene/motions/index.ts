import type { RigName } from '../rigs';
import { bird } from './bird';
import { mammalSmall } from './mammal-small';
import { quadruped } from './quadruped';
import type { Rig, RigOptions } from './types';

const templates: Record<RigName, (svg: SVGSVGElement, opts: RigOptions) => Rig> = {
	'mammal-small': mammalSmall,
	bird,
	quadruped
};

export const createRig = (name: RigName, svg: SVGSVGElement, opts: RigOptions) =>
	templates[name](svg, opts);

export type { Rig } from './types';
