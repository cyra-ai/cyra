import { execSync } from 'child_process';
import * as path from 'path';
import { Type, Behavior } from '@google/genai';

import type { CyraTool } from '../../types';

const tool: CyraTool = {
	name: 'execute',
	description:
		'Executes any command or script on the command-line in any repository or directory. Supports shell commands, TypeScript, JavaScript, Python, and any executable.',
	behavior: Behavior.NON_BLOCKING,
	response: {
		type: Type.OBJECT,
		description: 'Output or error from the executed command.'
	},
	parameters: {
		type: Type.OBJECT,
		properties: {
			directory: {
				type: Type.STRING,
				description:
					'The working directory to execute the command in. (e.g., "." or "src/")'
			},
			command: {
				type: Type.STRING,
				description:
					'The command to execute. (e.g., "node script.js arg1 arg2" or "npm run build" or "python analyze.py")'
			}
		}
	},
	execute: async (args) => {
		const directory = args?.directory || '.';
		const command = args?.command;

		if (!command) return { error: 'No command argument provided.' };

		const resolvedPath = path.resolve(process.cwd(), directory);

		try {
			// Execute the command directly in the specified directory
			const output = execSync(command, {
				encoding: 'utf-8',
				cwd: resolvedPath,
				stdio: ['pipe', 'pipe', 'pipe'],
				maxBuffer: 1024 * 1024 * 10 // 10MB buffer
			});

			return { output: output.trim() };
		} catch (error) {
			const stderr = error instanceof Error ? error.message : String(error);
			return { error: `Failed to execute command: ${stderr}` };
		};
	}
};

export default tool;
