import * as path from 'path';
import * as fs from 'fs/promises';
import { Type, Behavior } from '@google/genai';

import type { CyraTool } from '../../types';

const tool: CyraTool = {
	name: 'update_file',
	description: 'Updates the content of an existing file in the repository.',
	behavior: Behavior.NON_BLOCKING,
	response: {
		type: Type.OBJECT,
		description: 'Confirmation of file update.'
	},
	parameters: {
		type: Type.OBJECT,
		properties: {
			file_path: {
				type: Type.STRING,
				description:
					'The relative path to the file to be updated. (e.g., src/utils/helper.ts)'
			},
			content: {
				type: Type.STRING,
				description: 'The new content to write to the file.'
			}
		}
	},
	execute: async (args) => {
		const filePath = args?.file_path;
		const content = args?.content;

		if (!filePath) return { error: 'No file_path argument provided.' };
		if (content === undefined) return { error: 'No content argument provided.' };

		const resolvedPath = path.resolve(process.cwd(), filePath);

		try {
			// Check if file exists before updating
			await fs.access(resolvedPath);
			// Write the file, which updates it if it exists
			await fs.writeFile(resolvedPath, content, 'utf-8');
			return { output: `File updated successfully at ${filePath}` };
		} catch (err) {
			// eslint-disable-next-line no-undef
			if ((err as NodeJS.ErrnoException).code === 'ENOENT')
				return { error: `Error updating file at ${filePath}: File not found.` };
			return {
				error: `Error updating file at ${filePath}: ${(err as Error).message}`
			};
		};
	}
};

export default tool;
