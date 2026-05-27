import { OpenInIINAMode } from "@/types";
import { getOptions } from "./options";

export async function openInIINA(tabId: number, url: string, mode?: OpenInIINAMode) {
	const params: `${string}=${string}`[] = [`url=${encodeURIComponent(url).replace(/'/g, "%27")}`];
	if (mode) params.push(`${mode}=1`);
	await browser.scripting.executeScript({
		target: { tabId },
		func: (p: string[]) => {
			const link = document.createElement('a');
			link.href = `iina://open?${p.join('&')}`;
			document.body.appendChild(link);
			link.click();
			link.remove();
		},
		args: [params],
	});
}

export async function updateBrowserAction(): Promise<void> {
	const opts = await getOptions();
	if (opts.iconAction === 'clickOnly')
		await browser.action.setPopup({ popup: '' });
	else await browser.action.setPopup({ popup: 'popup.html' });
}

export function createStylesElement(): HTMLStyleElement {
	const id = 'catppuccin-icons-css-variables';
	let styles = document.querySelector<HTMLStyleElement>(`#${id}`);

	if (!styles) {
		styles = document.createElement('style');
		styles.setAttribute('id', id);
		document.documentElement.appendChild(styles);
	}

	return styles;
}

export const toLowerCase = <S extends string>(str: S): Lowercase<S> => str.toLowerCase() as Lowercase<S>;
