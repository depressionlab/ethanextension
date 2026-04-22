// See https://github.com/fregante/webext-dynamic-content-scripts/blob/main/how-to-add-github-enterprise-support-to-web-extensions.md
import 'webext-dynamic-content-scripts';

import type { OpenInIINAMode } from "@/types";
import addPermissionToggle from 'webext-permission-toggle';

export default defineBackground({
	type: 'module',
	main: () => {
		addPermissionToggle();
		updateBrowserAction();

		const contextMap: Record<string, keyof Browser.contextMenus.OnClickData> = {
			page: 'pageUrl',
			link: 'linkUrl',
			video: 'srcUrl',
			audio: 'srcUrl',
		}

		for (const item in Object.keys(contextMap)) {
			browser.contextMenus.create({
				id: `openiniina_${item}`,
				title: `Open this ${item} in IINA`,
				contexts: [item as Browser.contextMenus.ContextType],
			})
		}

		browser.contextMenus.onClicked.addListener(async (info, tab) => {
			if (!info.menuItemId.toString().startsWith('openiniina')) return;
			const key = info.menuItemId.toString().split('_')[1];
			const url = info[contextMap[key]];
			if (url) await openInIINA(tab?.id!, url as string);
		});

		browser.action.onClicked.addListener(async () => {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			if (tabs.length === 0) return;
			const tab = tabs[0];
			if (tab.id === undefined) return;

			const opts = await getOptions();
			await openInIINA(tab.id, tab.url!, opts.iconActionOption as OpenInIINAMode);
		});
	},
});
