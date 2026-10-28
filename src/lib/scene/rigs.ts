// The part ids and actions each body-type rig provides. Plain data with no
// GSAP import, so the content validator can check packs against it in Node.

export const rigs = {
	'mammal-small': {
		parts: [
			'puppet',
			'animal',
			'body',
			'tail',
			'leg-l',
			'leg-r',
			'arm-l',
			'arm-r',
			'head',
			'ear-l',
			'ear-r',
			'face',
			'eyes',
			'pupil-l',
			'pupil-r',
			'lid-l',
			'lid-r'
		],
		actions: ['leap', 'turnHead']
	},
	bird: {
		parts: [
			'puppet',
			'animal',
			'body',
			'head',
			'eye',
			'lid',
			'beak-top',
			'beak-bottom',
			'wing',
			'tail',
			'feet'
		],
		actions: ['flap', 'dance', 'squawk']
	}
} as const;

export type RigName = keyof typeof rigs;
export const rigNames = Object.keys(rigs) as [RigName, ...RigName[]];
