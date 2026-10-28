// Device-wide settings, changed in the grown-ups corner and kept on the
// device. Reduced motion follows the system setting unless a grown-up chooses.
import { db } from './db/index';

class Motion {
	system = $state(false);
	override = $state<boolean | null>(null);

	get reduced() {
		return this.override ?? this.system;
	}

	constructor() {
		if (typeof matchMedia === 'undefined') return;
		const query = matchMedia('(prefers-reduced-motion: reduce)');
		this.system = query.matches;
		query.addEventListener('change', (e) => (this.system = e.matches));
	}
}

export const motion = new Motion();

export interface Preferences {
	/** null: follow the device. */
	reducedMotion: boolean | null;
	sound: boolean;
	bigText: boolean;
	highContrast: boolean;
}

export const DEFAULTS: Preferences = {
	reducedMotion: null,
	sound: true,
	bigText: false,
	highContrast: false
};

class Settings {
	sound = $state(DEFAULTS.sound);
	bigText = $state(DEFAULTS.bigText);
	highContrast = $state(DEFAULTS.highContrast);

	async load() {
		for (const { key, value } of await db.settings.toArray()) this.apply(key as keyof Preferences, value);
	}

	/** Changes a setting now and keeps it for next time. */
	async set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		this.apply(key, value);
		await db.settings.put({ key, value });
	}

	private apply(key: keyof Preferences, value: unknown) {
		if (key === 'reducedMotion') motion.override = value as boolean | null;
		else if (key in DEFAULTS) (this as Record<string, unknown>)[key] = value;
	}
}

export const settings = new Settings();
