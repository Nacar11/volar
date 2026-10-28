import { describe, expect, it } from 'vitest';
import { globeSvg, landPath, ringPath, wavyBand, type LandCollection } from './globe-svg';

const square: LandCollection = {
	features: [
		{
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[120, 10],
						[125, 10],
						[125, 5],
						[120, 10]
					]
				]
			}
		}
	]
};

describe('globe texture', () => {
	it('puts north at the top: latitude becomes negative y', () => {
		expect(ringPath([[124.15, 9.85]])).toBe('M124.15,-9.85Z');
	});

	it('draws every ring of every polygon', () => {
		expect(landPath(square)).toBe('M120,-10L125,-10L125,-5L120,-10Z');
	});

	it('repeats the world either side so coasts wrap across the date line', () => {
		const svg = globeSvg(square, 2048, 1024);
		expect(svg).toContain('width="2048" height="1024"');
		expect(svg.match(/xlink:href="#world"/g)).toHaveLength(3);
	});
});

describe('wavyBand', () => {
	it('closes on the north pole for a northern band', () => {
		const d = wavyBand(84, 1, -180, 180);
		expect(d.startsWith('M-180,-90L-180,-84')).toBe(true);
		expect(d.endsWith('L180,-90Z')).toBe(true);
	});

	it('closes on the south pole for a southern band', () => {
		expect(wavyBand(-85, 1).startsWith('M-180,90L-180,85')).toBe(true);
	});
});
