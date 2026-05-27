import { OptionName, OptionType } from "@/types";

export class SentinelOption {
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
