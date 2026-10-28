import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { collect, collectedIds, VolarDb } from './index';

let n = 0;
let store: VolarDb;
const fresh = () => (store = new VolarDb(`test-${++n}`));

afterEach(() => store?.delete());

describe('stickers', () => {
	it('starts with an empty book', async () => {
		expect(await collectedIds(fresh())).toEqual([]);
	});

	it('gives a sticker on the first visit and keeps the first date', async () => {
		fresh();
		await collect(store, 'philippine-tarsier', 1000);
		await collect(store, 'philippine-tarsier', 2000);
		expect(await collectedIds(store)).toEqual(['philippine-tarsier']);
		expect((await store.stickers.get('philippine-tarsier'))?.collectedAt).toBe(1000);
	});

	it('survives reopening the database (a reload)', async () => {
		fresh();
		await collect(store, 'scarlet-macaw');
		store.close();
		const reopened = new VolarDb(store.name);
		expect(await collectedIds(reopened)).toEqual(['scarlet-macaw']);
		reopened.close();
	});
});
