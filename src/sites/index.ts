import { bitbucket } from "./bitbucket";
import { forgejo } from "./forgejo";
import { gitea } from "./gitea";
import { github } from "./github";
import { gitlab } from "./gitlab";
import { tangled } from "./tangled";

export type FunctionWithContext<T> = (rowEl: HTMLElement, fileNameEl: HTMLElement, iconEl: HTMLElement) => T;

export interface ReplacementSelectorSet {
	row: string;
	filename: string | symbol;
	icon: string;
	isDirectory: FunctionWithContext<boolean>;
	isSubmodule: FunctionWithContext<boolean>;
	isCollapsable: FunctionWithContext<boolean>;
	getFilename?: FunctionWithContext<string>;
	styles?: string;
}

export interface Site {
	domains: string[];
	replacements: ReplacementSelectorSet[];
}

export const sites: Site[] = [github, gitlab, gitea, forgejo, bitbucket, tangled];
export const matches: string[] = sites.flatMap(s => s.domains).map(d => `*://${d}/*`);
