import { join } from 'node:path';
import { defineConfig } from 'wxt';
import { hfs } from '@humanfs/node';
import { createJiti } from 'jiti';
import { matches } from './src/sites';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	targetBrowsers: ['chrome', 'firefox', 'safari'],
	entrypointsDir: 'entries',
	outDir: 'dist',
	manifestVersion: 3,
	manifest: {
		action: {
			default_icon: "iina.png",
			default_title: 'Open In IINA'
		},
		permissions: ['tabs', 'activeTab', 'contextMenus', 'storage', 'scripting', 'notifications', 'alarms', 'webRequest', 'webRequestBlocking'],
		host_permissions: ['*://claude.ai/*', 'https://raw.githubusercontent.com/*', 'https://github.com/*', 'https://api.anthropic.com/*'],
		optional_host_permissions: ['*://*/*'],
	},
	hooks: {
		'build:before': async () => {
			const ICON_DIR = join(__dirname, './vscode-icons/icons/css-variables/');
			const icons: Record<string, string> = {};
			const defaults: typeof import('./vscode-icons/src/defaults/index') = await createJiti(__dirname)
				.import('./vscode-icons/src/defaults/index.ts');

			for await (const entry of hfs.list(ICON_DIR)) {
				icons[entry.name.replace('.svg', '')] = await hfs
					.text(join(ICON_DIR, entry.name))
					.then(text => text!.replaceAll('--vscode-ctp', '--ctp').replaceAll('\n\t', ''));
			}

			await hfs.write(join(__dirname, './src/icons.json'), JSON.stringify(icons));
			await hfs.write(join(__dirname, './src/associations.json'), JSON.stringify(defaults.defaultConfig.associations));
		},
		'build:manifestGenerated': (wxt, manifest) => {
			if (wxt.config.command === 'serve') {
				// during deployment, content scripts are not listed in the manifest.json,
				// causing `webext-dynamic-content-scripts` to throw an error. so we need to add it manually
				manifest.content_scripts ??= [];
				manifest.content_scripts.push({
					// ensure `matches` urls are updated in src/entries/content/index.ts as well.
					matches,
					run_at: 'document_start',
					js: ['content-scripts/content.js'],
				});
			}
		},
	},
	modules: [
		'@wxt-dev/auto-icons',
		'@wxt-dev/unocss',
	],
	analysis: {
		enabled: true
	},
	webExt: {
		startUrls: [
			'https://github.com/catppuccin/catppuccin',
			'https://gitlab.com/gitlab-org/gitlab',
			'https://codeberg.org/forgejo/forgejo',
			'https://gitea.com/gitea/gitea-mirror',
			'https://gitea.catppuccin.com/catppuccin/catppuccin',
			'https://bitbucket.org/atlassian/atlassian-frontend-mirror',
			'https://tangled.org/@tangled.org/core',
		]
	}
});
