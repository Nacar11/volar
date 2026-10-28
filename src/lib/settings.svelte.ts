// Device-wide settings. Reduced motion follows the system setting unless the
// in-app toggle overrides it.
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
