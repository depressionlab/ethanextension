import { matches, ReplacementSelectorSet, sites } from "@/sites";
import { observe } from "selector-observer";
import { injectStyles, replaceIconRow } from "./library";
import { flavor } from "@/storage";
import { REPLACEMENT_WORD, TARGET_WORDS } from "@/constants";

export default defineContentScript({
	matches,
	runAt: 'document_start',
	main: () => {
		const stylesEl = createStylesElement();

		for (const site of sites)
			if (site.domains.includes(window.location.hostname))
				return replacementPreprocessor(site.replacements, stylesEl);

		// no matching domains
		const replacements = sites.flatMap(site => site.replacements);
		replacementPreprocessor(replacements, stylesEl);
		rmWords(document.body);
	},
});

function rmWords(node: Node) {
	switch (node.nodeType) {
		case Node.TEXT_NODE:
			const text = node.nodeValue;
			if (text && TARGET_WORDS.test(text))
				node.nodeValue = text.replaceAll(TARGET_WORDS, REPLACEMENT_WORD);
			break;
		case Node.ELEMENT_NODE:
			node.childNodes.forEach(child => rmWords(child));
			break;
		default: break;
	}
}

function replacementPreprocessor(replacements: ReplacementSelectorSet[], stylesEl: HTMLStyleElement): void {
	for (const replacement of replacements) observe(replacement.row, {
		add: async (rowEl) => await replaceIconRow(rowEl as HTMLElement, replacement)
	});

	const rawStyles = replacements.map(({ styles }) => styles || '').join('\n');
	flavor.watch(_ => injectStyles(stylesEl, rawStyles));
	injectStyles(stylesEl, rawStyles);
}
