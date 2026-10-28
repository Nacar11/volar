import type { RigName } from '../rigs';
import { bird } from './bird';
import { climber } from './climber';
import { mammalSmall } from './mammal-small';
import { quadruped } from './quadruped';
import { seaMammal } from './sea-mammal';
import type { Rig, RigOptions } from './types';

const templates: Record<RigName, (svg: SVGSVGElement, opts: RigOptions) => Rig> = {
	'mammal-small': mammalSmall,
	bird,
	quadruped,
	'sea-mammal': seaMammal,
	climber
};

export const createRig = (name: RigName, svg: SVGSVGElement, opts: RigOptions) =>
	templates[name](svg, opts);

export type { Rig } from './types';
