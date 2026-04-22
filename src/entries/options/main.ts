document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelectorAll('input')
	.forEach(el => el.addEventListener('change', () => {
		saveOptions();
		updateBrowserAction();
	}));
