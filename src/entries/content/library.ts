import type { ReplacementSelectorSet } from "@/sites";
import type { IconName } from "@/types";

import { getAssociations } from "@/associations";
import { ATTRIBUTE_PREFIX, CSS_SELECTOR_SELF, IGNORED_ATTRIBUTES } from "@/constants";
import { flavor, monochrome, specificFolders } from "@/storage";
import { flavors } from "@catppuccin/palette";
import icons from '@/icons.json';

export async function injectStyles(stylesEl: HTMLStyleElement, siteStyles: string): Promise<void> {
	stylesEl.textContent = /* css */ `
		:root {
		${flavors[await flavor.getValue()].colorEntries
			.map(([name, { hex }]) => `--ctp-${name}: ${hex};`)
			.join('\n  ')}
		}
	`.trim() + siteStyles;
}


async function createIconElement(
	iconName: IconName,
	fileName: string,
	originalIconEl: HTMLElement
): Promise<SVGSVGElement> {
	const temp = document.createElement('div');
	if (await monochrome.getValue())
		temp.innerHTML = icons[iconName]
			.replaceAll(/var\(--ctp-\w+\)/g, 'var(--ctp-text)');
	else temp.innerHTML = icons[iconName];

	const svg = temp.firstElementChild as SVGSVGElement;
	svg.setAttribute(ATTRIBUTE_PREFIX, '');
	svg.setAttribute(`${ATTRIBUTE_PREFIX}-iconname`, iconName);
	svg.setAttribute(`${ATTRIBUTE_PREFIX}-filenam`, fileName);

	for (const attr of originalIconEl.getAttributeNames())
		if (!(attr.startsWith(ATTRIBUTE_PREFIX) || IGNORED_ATTRIBUTES.includes(attr)))
			svg.setAttribute(attr, originalIconEl.getAttribute(attr)!);

	return svg;
}

async function findIconMatch(
	fileName: string,
	fileExtensions: string[],
	isSubmodule: boolean,
	isDirectory: boolean,
): Promise<IconName> {
	// special parent directory folder icon
	if (fileName === '..') return '_folder';
	const associations = await getAssociations();
	const useSpecificFolders = await specificFolders.getValue();
	if (useSpecificFolders && isSubmodule) return 'folder_git';

	if (isDirectory) {
		if (!useSpecificFolders) return '_folder';
		if (fileName in associations.folderNames)
			return associations.folderNames[fileName];
		if (toLowerCase(fileName) in associations.folderNames)
			return associations.folderNames[toLowerCase(fileName)];
	}

	if (fileName in associations.fileNames)
		return associations.fileNames[fileName];
	if (toLowerCase(fileName) in associations.fileNames)
		return associations.fileNames[toLowerCase(fileName)];

	for (const ext of fileExtensions) {
		if (ext in associations.fileExtensions)
			return associations.fileExtensions[ext];
		if (ext in associations.languageIds)
			return associations.languageIds[ext];
	}

	return '_file';
}

export async function replaceIconRow(rowEl: HTMLElement, sels: ReplacementSelectorSet): Promise<void> {
	const iconEl = rowEl.querySelector<HTMLElement>(sels.icon);
	if (!iconEl || iconEl.hasAttribute(ATTRIBUTE_PREFIX)) return;

	const fileNameSelection = rowEl.querySelector<HTMLElement>(sels.filename.toString());
	const fileNameEl = sels.filename === CSS_SELECTOR_SELF ? rowEl : fileNameSelection;
	if (!fileNameEl) return;

	const passthruFileName = fileNameEl.textContent?.split('/').at(-1)!.trim().replace(/\u200E/g, '');
	const fileName = 'getFilename' in sels ? sels.getFilename!(rowEl, fileNameEl, iconEl) : passthruFileName;
	const fileExtensions: string[] = [];

	// avoid doing a combination of extensions for very long filenames,
	// as much file systems do not allow file names >255 length with lots of `.` characters
	// https://github.com/microsoft/vscode/issues/116199
	if (fileName.length <= 255)
		for (let i = 0; i < fileName.length; i += 1)
			if (fileName[i] === '.')
				fileExtensions.push(fileName.toLowerCase().slice(i + 1));

	const isDirectory = sels.isDirectory(rowEl, fileNameEl, iconEl);
	const isSubmodule = sels.isSubmodule(rowEl, fileNameEl, iconEl);
	const isCollapsable = sels.isCollapsable(rowEl, fileNameEl, iconEl);
	const iconName = await findIconMatch(fileName, fileExtensions, isSubmodule, isDirectory);
	const replacementEl = await createIconElement(iconName, fileName, iconEl);
	const previousEl = iconEl.previousElementSibling;

	// check if the icon element's sibling before the current element was inserted by us,
	// and replace the existing replacement with the newly processed one instead.
	if (previousEl?.hasAttribute(ATTRIBUTE_PREFIX)) replacementEl.replaceWith(previousEl);
	// if the current icon element is an icon from us , replace it with the newly processed icon.
	else if (iconEl.hasAttribute(ATTRIBUTE_PREFIX)) iconEl.replaceWith(replacementEl);
	// if neither of the above are true, prepend the new icon to the original icon element.
	// if we remove the icon, GitHub's code view crashes when you navigate through the tree
	// view. instead, we just hide it via a `style` attribute (not CSS class).
	else dropInReplacement(iconEl, replacementEl);

	if (isCollapsable)
		replacementEl.after(await createIconElement(`${iconName}_open` as IconName, fileName, iconEl));
}

function dropInReplacement(iconEl: HTMLElement, replacementEl: SVGSVGElement) {
	iconEl.style.display = 'none';
	iconEl.before(replacementEl);
}
