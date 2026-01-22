/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';

type ColorIntensity = 'dim' | 'normal' | 'bright';

const getColorByIntensity = (baseColor: string, intensity: ColorIntensity = 'normal'): ((text: string) => string) => {
	const colors: Record<string, Record<ColorIntensity, (text: string) => string>> = {
		blue: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.blue(text),
			bright: (text) => chalk.blueBright(text)
		},
		green: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.green(text),
			bright: (text) => chalk.greenBright(text)
		},
		red: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.red(text),
			bright: (text) => chalk.redBright(text)
		},
		yellow: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.yellow(text),
			bright: (text) => chalk.yellowBright(text)
		},
		cyan: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.cyan(text),
			bright: (text) => chalk.cyanBright(text)
		},
		magenta: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.magenta(text),
			bright: (text) => chalk.magentaBright(text)
		},
		white: {
			dim: (text) => chalk.gray(text),
			normal: (text) => chalk.white(text),
			bright: (text) => chalk.whiteBright(text)
		}
	};

	return colors[baseColor]?.[intensity] || chalk.white;
};

const logger = {
	// ============ BASIC LOGGING WITH INTENSITY ============
	log: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('blue', actualIntensity as ColorIntensity);
		console.log(color('ℹ'), message, ...actualArgs);
	},

	success: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('green', actualIntensity as ColorIntensity);
		console.log(color('✓'), message, ...actualArgs);
	},

	warn: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('yellow', actualIntensity as ColorIntensity);
		console.warn(color('⚠'), message, ...actualArgs);
	},

	error: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('red', actualIntensity as ColorIntensity);
		console.error(color('✗'), message, ...actualArgs);
	},

	info: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		console.log(color('→'), message, ...actualArgs);
	},

	debug: (message: string, intensity?: ColorIntensity | any, ...args: any[]): void => {
		const actualIntensity = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? intensity : 'normal';
		const actualArgs = typeof intensity === 'string' && ['dim', 'normal', 'bright'].includes(intensity) ? args : (intensity !== undefined ? [intensity, ...args] : args);
		const color = getColorByIntensity('white', actualIntensity as ColorIntensity);
		console.log(color('◆'), message, ...actualArgs);
	},

	// ============ HIGHLIGHT VARIANTS ============
	highlight: (message: string, color: 'red' | 'green' | 'yellow' | 'cyan' | 'magenta' = 'cyan'): void => {
		const bgColors = {
			red: chalk.bgRed.white.bold,
			green: chalk.bgGreen.black.bold,
			yellow: chalk.bgYellow.black.bold,
			cyan: chalk.bgCyan.black.bold,
			magenta: chalk.bgMagenta.white.bold
		};
		console.log(bgColors[color](` ${message} `));
	},

	critical: (message: string): void => {
		console.error(chalk.bgRed.whiteBright.bold(`\n  ✗ CRITICAL: ${message}  \n`));
	},

	success_highlight: (message: string): void => {
		console.log(chalk.bgGreen.black.bold(`\n  ✓ ${message}  \n`));
	},

	// ============ TITLE & DESCRIPTION ============
	section: (title: string, description?: string | ColorIntensity, intensity?: ColorIntensity): void => {
		const actualIntensity = typeof description === 'string' && ['dim', 'normal', 'bright'].includes(description) ? description : intensity || 'normal';
		const actualDescription = typeof description === 'string' && !['dim', 'normal', 'bright'].includes(description) ? description : undefined;
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		console.log(color('\n' + '='.repeat(50)));
		console.log(color(title));
		console.log(color('='.repeat(50)));
		if (actualDescription)
			console.log(chalk.gray(actualDescription));
		console.log();
	},

	title: (message: string, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		console.log(color('\n' + '='.repeat(50)));
		console.log(color(message));
		console.log(color('='.repeat(50) + '\n'));
	},

	subtitle: (message: string, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('magenta', actualIntensity as ColorIntensity);
		console.log(color(`\n▶ ${message}`));
	},

	// ============ LABEL & VALUE LOGGING ============
	label: (label: string, value: any, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
		console.log(color(label.padEnd(20)) + chalk.white(formattedValue));
	},

	labels: (data: Record<string, any>, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		for (const [key, value] of Object.entries(data)) {
			const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
			console.log(color(key.padEnd(20)) + chalk.white(formattedValue));
		};
	},

	// ============ LIST/ITEMS LOGGING ============
	list: (items: string[] | Record<string, any>[], title?: string | ColorIntensity, intensity?: ColorIntensity): void => {
		const actualTitle = typeof title === 'string' && !['dim', 'normal', 'bright'].includes(title) ? title : undefined;
		const actualIntensity = typeof title === 'string' && ['dim', 'normal', 'bright'].includes(title) ? title : intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		if (actualTitle)
			console.log(color(`\n${actualTitle}:`));
		if (Array.isArray(items))
			items.forEach((item, index): void => {
				const prefix = chalk.gray(`  ${index + 1}. `);
				const content = typeof item === 'string' ? item : JSON.stringify(item, null, 2);
				console.log(prefix + chalk.white(content));
			});
		console.log();
	},

	// ============ BULLET POINTS ============
	bullets: (items: string[], title?: string, color?: 'green' | 'cyan' | 'yellow', intensity?: ColorIntensity): void => {
		const actualColor = color || 'cyan';
		const actualIntensity = intensity || 'normal';
		const titleColor = getColorByIntensity(actualColor, actualIntensity as ColorIntensity);
		if (title) console.log(titleColor(`\n${title}:`));
		for (const item of items)
			console.log(chalk.gray('  • ') + chalk.white(item));
		console.log();
	},

	// ============ STEP-BY-STEP LOGGING ============
	step: (stepNumber: number, description: string, details?: string, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		console.log(color(`\nStep ${stepNumber}: `) + chalk.bold(description));
		if (details)
			console.log(chalk.gray(`  ${details}`));
	},

	// ============ STATUS WITH PROGRESS ============
	status: (status: 'pending' | 'success' | 'error' | 'warning', message: string, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const icons = {
			pending: chalk.yellow('⧗'),
			success: getColorByIntensity('green', actualIntensity as ColorIntensity)('✓'),
			error: getColorByIntensity('red', actualIntensity as ColorIntensity)('✗'),
			warning: getColorByIntensity('yellow', actualIntensity as ColorIntensity)('⚠')
		};
		console.log(icons[status] + ' ' + chalk.white(message));
	},

	// ============ TABLE-LIKE OUTPUT ============
	table: (headers: string[], rows: (string | number)[][][], intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const colWidths = headers.map((h) => Math.max(h.length, 10));
		const headerColor = getColorByIntensity('cyan', actualIntensity as ColorIntensity);

		// Print headers
		const headerRow = headers
			.map((h, i) => chalk.bold(headerColor(h.padEnd(colWidths[i]))))
			.join(' | ');
		console.log(headerRow);
		console.log(chalk.gray('-'.repeat(headerRow.length)));

		// Print rows
		for (const row of rows) {
			const dataRow = row
				.map((cell, i) => String(cell).padEnd(colWidths[i]))
				.join(' | ');
			console.log(dataRow);
		};
		console.log();
	},

	// ============ GROUPED OUTPUT ============
	group: (title: string, content: () => void, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('magenta', actualIntensity as ColorIntensity);
		console.log(color(`\n▼ ${title}`));
		content();
		console.log();
	},

	// ============ TREE STRUCTURE ============
	tree: (items: Array<{ name: string; children?: string[] }>, prefix?: string | ColorIntensity, intensity?: ColorIntensity): void => {
		const actualPrefix = typeof prefix === 'string' && !['dim', 'normal', 'bright'].includes(prefix) ? prefix : '';
		const actualIntensity = typeof prefix === 'string' && ['dim', 'normal', 'bright'].includes(prefix) ? prefix : intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);

		items.forEach((item, index): void => {
			const isLast = index === items.length - 1;
			const connector = isLast ? '└─' : '├─';
			console.log(actualPrefix + color(connector) + ' ' + chalk.white(item.name));

			if (item.children) {
				const nextPrefix = actualPrefix + (isLast ? '  ' : '│ ');
				item.children.forEach((child, childIndex): void => {
					const childIsLast = childIndex === item.children!.length - 1;
					const childConnector = childIsLast ? '└─' : '├─';
					console.log(nextPrefix + chalk.gray(childConnector) + ' ' + chalk.gray(child));
				});
			};
		});
		console.log();
	},

	// ============ KEY-VALUE PAIRS ============
	pairs: (pairs: Array<[string, any]>, title?: string, intensity?: ColorIntensity): void => {
		const actualIntensity = intensity || 'normal';
		const color = getColorByIntensity('cyan', actualIntensity as ColorIntensity);
		if (title) console.log(chalk.bold(color(`\n${title}`)));
		const maxKeyLength = Math.max(...pairs.map(([key]) => key.length));
		for (const [key, value] of pairs) {
			const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
			console.log(
				color(key.padEnd(maxKeyLength)) +
				' : ' +
				chalk.white(formattedValue)
			);
		};
		console.log();
	},

	// ============ DIVIDER ============
	divider: (char?: string | ColorIntensity, intensity?: ColorIntensity): void => {
		const actualChar = typeof char === 'string' && !['dim', 'normal', 'bright'].includes(char) ? char : '─';
		const actualIntensity = typeof char === 'string' && ['dim', 'normal', 'bright'].includes(char) ? char : intensity || 'normal';
		const color = getColorByIntensity('white', actualIntensity as ColorIntensity);
		console.log(color(actualChar.repeat(50)));
	},

	// ============ COLORED TEXT HELPERS ============
	text: (message: string, color?: 'red' | 'green' | 'yellow' | 'cyan' | 'magenta' | 'blue' | 'white', intensity?: ColorIntensity): void => {
		const actualColor = color || 'white';
		const actualIntensity = intensity || 'normal';
		const colorFn = getColorByIntensity(actualColor, actualIntensity as ColorIntensity);
		console.log(colorFn(message));
	},

	line: (color?: 'red' | 'green' | 'yellow' | 'cyan' | 'magenta' | 'blue' | 'white', intensity?: ColorIntensity): void => {
		const actualColor = color || 'white';
		const actualIntensity = intensity || 'normal';
		const colorFn = getColorByIntensity(actualColor, actualIntensity as ColorIntensity);
		console.log(colorFn('─'.repeat(50)));
	},

	// ============ HIERARCHICAL LOGGING (Label → Items → Results) ============
	// This pattern uses:
	// - Labels: normal intensity (main message)
	// - Items: dim intensity (list details)
	// - Results: bright intensity (output/highlights)

	hierarchy: {
		// Label with items and optional results
		section: (label: string, items?: string[], results?: string | string[]): void => {
			// Label (normal)
			const labelColor = getColorByIntensity('cyan', 'normal');
			console.log(labelColor(`\n▶ ${label}`));

			// Items (dim)
			if (items && items.length > 0)
				for (const item of items) {
					const itemColor = getColorByIntensity('white', 'dim');
					console.log('  ' + itemColor(`• ${item}`));
				};

			// Results (bright)
			if (results) {
				const resultColor = getColorByIntensity('green', 'bright');
				if (Array.isArray(results))
					for (const result of results)
						console.log(resultColor(`  ✓ ${result}`));
				else
					console.log(resultColor(`  ✓ ${results}`));
			};
			console.log();
		},

		// List with label, items, and optional total/summary
		list: (label: string, items: string[], summary?: string): void => {
			// Label (normal)
			const labelColor = getColorByIntensity('cyan', 'normal');
			console.log(labelColor(`\n${label}:`));

			// Items (dim)
			items.forEach((item, index): void => {
				const itemColor = getColorByIntensity('white', 'dim');
				console.log(`  ${index + 1}. ` + itemColor(item));
			});

			// Summary/Result (bright)
			if (summary) {
				const summaryColor = getColorByIntensity('green', 'bright');
				console.log(summaryColor(`\n  ${summary}`));
			};
			console.log();
		},

		// Process with steps and results
		process: (processName: string, steps: string[], result?: { status: 'success' | 'error'; message: string }): void => {
			// Process name (normal)
			const nameColor = getColorByIntensity('cyan', 'normal');
			console.log(nameColor(`\n▶ ${processName}`));

			// Steps (dim)
			for (const step of steps) {
				const stepColor = getColorByIntensity('white', 'dim');
				console.log('  ' + stepColor(`→ ${step}`));
			};

			// Result (bright or error)
			if (result) {
				const resultColor = getColorByIntensity(result.status === 'success' ? 'green' : 'red', 'bright');
				const icon = result.status === 'success' ? '✓' : '✗';
				console.log(resultColor(`  ${icon} ${result.message}`));
			};
			console.log();
		},

		// Key-value display with hierarchy
		details: (label: string, data: Record<string, any>, highlight?: { key: string; color: 'green' | 'yellow' | 'red' }): void => {
			// Label (normal)
			const labelColor = getColorByIntensity('cyan', 'normal');
			console.log(labelColor(`\n${label}:`));

			// Data items (dim)
			const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));
			for (const [key, value] of Object.entries(data)) {
				const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;

				if (highlight && highlight.key === key) {
					// Highlighted item (bright)
					const highlightColor = getColorByIntensity(highlight.color, 'bright');
					console.log('  ' + chalk.cyan(key.padEnd(maxKeyLength)) + ' : ' + highlightColor(formattedValue));
				} else {
					// Normal item (dim)
					const itemColor = getColorByIntensity('white', 'dim');
					console.log('  ' + chalk.cyan(key.padEnd(maxKeyLength)) + ' : ' + itemColor(formattedValue));
				};
			};
			console.log();
		},

		// Status reporting with items and final result
		report: (status: 'pending' | 'success' | 'error' | 'warning', title: string, items?: string[], finalMessage?: string): void => {
			const statusIcons = {
				pending: chalk.yellow('⏳'),
				success: chalk.green('✓'),
				error: chalk.red('✗'),
				warning: chalk.yellow('⚠')
			};

			// Title (normal)
			const titleColor = getColorByIntensity('cyan', 'normal');
			console.log(titleColor(`\n${statusIcons[status]} ${title}`));

			// Items (dim)
			if (items && items.length > 0)
				for (const item of items) {
					const itemColor = getColorByIntensity('white', 'dim');
					console.log('  ' + itemColor(`• ${item}`));
				};

			// Final message (bright)
			if (finalMessage) {
				const messageColor = getColorByIntensity(status === 'success' ? 'green' : status === 'error' ? 'red' : 'yellow', 'bright');
				console.log(messageColor(`  → ${finalMessage}`));
			};
			console.log();
		}
	},

	// ============ CLEAR FORMATTING HELPER ============
	raw: (message: string, ...args: any[]): void => {
		console.log(message, ...args);
	}
};


export default logger;