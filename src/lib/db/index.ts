// Everything Volar remembers lives on the device, in IndexedDB: no account,
// nothing sent anywhere.
import Dexie, { type EntityTable } from 'dexie';

export interface Sticker {
	animalId: string;
	/** When the kid first visited (ms since epoch). */
	collectedAt: number;
}

export interface Setting {
	key: string;
	value: unknown;
}

export class VolarDb extends Dexie {
	stickers!: EntityTable<Sticker, 'animalId'>;
	settings!: EntityTable<Setting, 'key'>;

	constructor(name = 'volar') {
		super(name);
		this.version(1).stores({ stickers: 'animalId', settings: 'key' });
	}
}

export const db = new VolarDb();

/** Gives the animal's sticker on the first visit; later visits keep the first date. */
export function collect(store: VolarDb, animalId: string, now = Date.now()) {
	return store.transaction('rw', store.stickers, async () => {
		if (!(await store.stickers.get(animalId))) await store.stickers.add({ animalId, collectedAt: now });
	});
}

/** The ids of every animal with a sticker. */
export async function collectedIds(store: VolarDb): Promise<string[]> {
	return (await store.stickers.toArray()).map((s) => s.animalId);
}
