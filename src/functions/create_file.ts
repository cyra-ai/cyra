import * as path from 'path';
import * as fs from 'fs/promises';
import { Type, Behavior } from '@google/genai';

import type { CyraTool } from '../../types';

const tool: CyraTool = {
	name: 'create_file',
	description:
		'Creates a new file in the repository with the specified content.',
	behavior: Behavior.NON_BLOCKING,
	response: {
		type: Type.OBJECT,
		description: 'Confirmation of file creation.'
	},
	parameters: {
		type: Type.OBJECT,
		properties: {
			file_path: {
				type: Type.STRING,
				description:
					'The relative path where the file should be created. (e.g., src/utils/helper.ts)'
			},
			content: {
				type: Type.STRING,
				description: 'The content to write to the file.'
			}
		}
	},
	execute: async (args) => {
		const filePath = args?.file_path;
		const content = args?.content;

		if (!filePath) return { error: 'No file_path argument provided.' };
		if (content === undefined) return { error: 'No content argument provided.' };

		const resolvedPath = path.resolve(process.cwd(), filePath);
		const dirPath = path.dirname(resolvedPath);

		try {
			// Create directories if they don't exist
			await fs.mkdir(dirPath, { recursive: true });
			// Write the file
			await fs.writeFile(resolvedPath, content, 'utf-8');
			return { output: `File created successfully at ${filePath}` };
		} catch (err) {
			return {
				error: `Error creating file at ${filePath}: ${(err as Error).message}`
			};
		};
	}
};

export default tool;
