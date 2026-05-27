import { OptionName } from "@/types";
import { SentinelOption } from "./SentinelOption";

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
