import type icons from '@/icons.json';
import type { CatppuccinFlavors } from '@catppuccin/palette';

export type OptionType = 'radio' | 'checkbox';
export type OptionName = 'iconAction' | 'iconActionOption';
export type OpenInIINAMode = 'full_screen' | 'pip' | 'enqueue' | 'new_window';
export type Flavor = keyof CatppuccinFlavors;
export type IconName = keyof typeof icons;

export interface Associations {
	languageIds: Record<string, IconName>;
	fileExtensions: Record<string, IconName>;
	fileNames: Record<string, IconName>;
	folderNames: Record<string, IconName>;
}
