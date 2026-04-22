import { OptionName, OptionType, OpenInIINAMode } from "@/types";

class SentinelOption {
	name: OptionName;
	type: OptionType;
	defaultValue: string | boolean;

	public constructor(name: OptionName, type: OptionType, defaultValue: string | boolean) {
		this.name = name;
		this.type = type;
		this.defaultValue = defaultValue;
	}

	public setValue(value: string | boolean) {
		switch (this.type) {
			case "radio": return (document.getElementsByName(this.name) as NodeListOf<HTMLInputElement>)
				.forEach(el => el.checked = el.value === value);
			case "checkbox":
				const checkbox = document.getElementById(this.name) as HTMLInputElement | null;
				if (checkbox) checkbox.checked = Boolean(value);
				break;
		}
	}

	public getValue(): string | boolean {
		switch (this.type) {
			case "radio":
				const selected = document.querySelector<HTMLInputElement>(`input[name="${this.name}"]:checked`);
				return selected ? selected.value : this.defaultValue;
			case "checkbox":
				const checkbox = document.getElementById(this.name) as HTMLInputElement | null;
				return checkbox ? checkbox.checked : Boolean(this.defaultValue);
		}
	}
}

const sentinelOptions: SentinelOption[] = [
	new SentinelOption('iconAction', 'radio', 'clickOnly'),
	new SentinelOption('iconActionOption', 'radio', 'direct'),
];

export async function getOptions(): Promise<Record<OptionName, string | boolean>> {
	const defaults: Record<string, string | boolean> = {};
	sentinelOptions.forEach(opt => defaults[opt.name] = opt.defaultValue);
	const result = await browser.storage.sync.get<Record<OptionName, string | boolean>>(defaults);
	return result;
}

export async function saveOptions(): Promise<void> {
	const saveData: Record<string, string | boolean> = {};
	sentinelOptions.forEach(opt => saveData[opt.name] = opt.getValue());
	await browser.storage.sync.set(saveData);
}

export async function restoreOptions(): Promise<void> {
	const storedOptions = await getOptions();
	sentinelOptions.forEach(opt => opt.setValue(storedOptions[opt.name]));
}

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
