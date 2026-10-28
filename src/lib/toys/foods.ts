// Things a kid can offer an animal in "What's for dinner".

export const FOODS = {
	bamboo: { label: 'Bamboo', icon: '🎋' },
	grass: { label: 'Grass', icon: '🌾' },
	leaves: { label: 'Leaves', icon: '🍃' },
	fruit: { label: 'Fruit', icon: '🍎' },
	fish: { label: 'Fish', icon: '🐟' },
	burger: { label: 'Burger', icon: '🍔' },
	candy: { label: 'Candy', icon: '🍬' },
	pizza: { label: 'Pizza', icon: '🍕' }
} as const;

export type Food = keyof typeof FOODS;
export const foodNames = Object.keys(FOODS) as [Food, ...Food[]];
