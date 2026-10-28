import en from './en.json';

export const t = en;

/** Fills `{name}`-style holes in a string. */
export const fill = (text: string, values: Record<string, string>) =>
	text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
