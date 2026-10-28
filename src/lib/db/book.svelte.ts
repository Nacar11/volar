import { SvelteSet } from 'svelte/reactivity';
import { collect, collectedIds, db } from './index';

/** The kid's Animal Book: which animals they have a sticker for. */
class Book {
	stickers = new SvelteSet<string>();

	async load() {
		for (const id of await collectedIds(db)) this.stickers.add(id);
	}

	/** Visiting an animal adds its sticker (once). */
	async collect(animalId: string) {
		this.stickers.add(animalId);
		await collect(db, animalId);
	}
}

export const book = new Book();
