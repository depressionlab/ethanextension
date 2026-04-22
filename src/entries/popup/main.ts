import './style.css';

import { OpenInIINAMode, Associations, Flavor, IconName } from '@/types';
import { customAssociations, flavor, monochrome, specificFolders } from '@/storage';
import { CatppuccinFlavor, flavorEntries } from '@catppuccin/palette';
import { icons } from '@/constants';

function injectPopupStyles() {
	const styles = createStylesElement();
	const processColorEntries = (colorEntries: CatppuccinFlavor['colorEntries']) =>
		colorEntries.map(([name, { hex }]) => `  --ctp-${name}: ${hex};`).join('\n');

	styles.textContent = flavorEntries.map(([flavor, { colorEntries }]) =>
		`:root[theme="${flavor}"] {\n${processColorEntries(colorEntries)}\n}`
	).join('\n');
	document.documentElement.appendChild(styles);
}

async function init() {
	injectPopupStyles();

	const flavorEl = document.querySelector<HTMLSelectElement>('#flavor')!;
	flavorEl.value = await flavor.getValue();
	document.documentElement.setAttribute('theme', flavorEl.value);

	flavorEl.addEventListener('change', async () => {
		await flavor.setValue(flavorEl.value as Flavor);
		document.documentElement.setAttribute('theme', flavorEl.value);
	});

	for (const [selector, storage] of Object.entries({ specificFolders, monochrome })) {
		const el = document.querySelector<HTMLInputElement>(`#${selector}`)!;
		el.checked = await storage.getValue();
		el.addEventListener('change', async () => await storage.setValue(el.checked));
	}

	const associations = await customAssociations.getValue();

	for (const [key, el] of Object.entries({
		fileExtensions: document.querySelector<HTMLUListElement>('ul#associations-file-extensions')!,
		fileNames: document.querySelector<HTMLUListElement>('ul#associations-file-names')!,
		folderNames: document.querySelector<HTMLUListElement>('ul#associations-folder-names')!,
	} as Record<keyof Associations, HTMLUListElement>) as Array<[keyof Associations, HTMLUListElement]>) {
		for (const [association, icon] of Object.entries(associations[key])) {
			const li = document.createElement('li');
			const inputA = document.createElement('input');
			const inputB = document.createElement('input');
			const del = document.createElement('button');

			del.className = 'delete';
			del.innerHTML = icons.x;

			inputA.value = association;
			inputA.setAttribute('required', 'true');

			inputB.value = icon;
			inputB.setAttribute('required', 'true');

			li.appendChild(inputA);
			li.appendChild(inputB);
			li.appendChild(del);
			el.appendChild(li);

			del.addEventListener('click', async () => {
				if (inputA.checkValidity()) {
					delete associations[key][association];
					await customAssociations.setValue(associations);
					li.remove();
				}
			});

			inputA.addEventListener('change', async () => {
				if (inputA.checkValidity()) {
					delete associations[key][association];
					associations[key][inputA.value] = icon;
					await customAssociations.setValue(associations);
				}
			});

			inputB.addEventListener('change', async () => {
				if (inputB.checkValidity()) {
					associations[key][association] = inputB.value as IconName;
					await customAssociations.setValue(associations);
				}
			});
		}

		function addEmpty() {
			const li = document.createElement('li');
			const inputA = document.createElement('input');
			const inputB = document.createElement('input');
			const del = document.createElement('button');

			del.className = 'delete';
			del.innerHTML = icons.x;

			inputA.setAttribute('required', 'true');
			inputB.setAttribute('required', 'true');

			li.appendChild(inputA);
			li.appendChild(inputB);
			li.appendChild(del);
			el.appendChild(li);

			del.addEventListener('click', async () => {
				if (inputA.checkValidity()) {
					delete associations[key][inputA.value];
					await customAssociations.setValue(associations);
					li.remove();
				}
			});

			let addedEmpty = false;

			inputA.addEventListener('change', async () => {
				if (inputA.checkValidity()) {
					delete associations[key][inputA.value];
					associations[key][inputA.value] = inputB.value as IconName;
					await customAssociations.setValue(associations);
				}

				if (!addedEmpty && inputA.checkValidity() && inputB.checkValidity()) {
					addEmpty();
					addedEmpty = true;
				}
			});

			inputB.addEventListener('change', async () => {
				if (inputB.checkValidity()) {
					associations[key][inputA.value] = inputB.value as IconName;
					await customAssociations.setValue(associations);
				}
				if (!addedEmpty && inputA.checkValidity() && inputB.checkValidity()) {
					addEmpty();
					addedEmpty = true;
				}
			});
		}

		addEmpty();
	}
}

document.querySelectorAll<HTMLDivElement>('.menu-item').forEach(el => {
	const mode = el.id.split('-')[1] as OpenInIINAMode;
	el.addEventListener('click', async () => {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		if (!tabs[0]?.id) return;

		await openInIINA(tabs[0].id, tabs[0].url ?? '', mode);
	});
});

init();
