import { execSync } from 'child_process';
import { Type, Behavior } from '@google/genai';

import type { CyraTool } from '../../types';

const tool: CyraTool = {
	name: 'execute_command',
	description:
		'Executes terminal commands or code in the current environment. Supports shell commands, Node.js, Python, and other executables.',
	behavior: Behavior.NON_BLOCKING,
	response: {
		type: Type.OBJECT,
		description: 'Output or error from the executed command.'
	},
	parameters: {
		type: Type.OBJECT,
		properties: {
			command: {
				type: Type.STRING,
				description:
					'The terminal command or code to execute. (e.g., "npm install" or "node -v")'
			},
			language: {
				type: Type.STRING,
				description:
					'Optional: Specify the language/environment for code execution: "bash", "node", "python", etc. Default is "bash".'
			},
			cwd: {
				type: Type.STRING,
				description:
					'Optional: The working directory to execute the command in. Default is the current working directory.'
			}
		}
	},
	execute: async (args) => {
		const command = args?.command;
		const language = (args?.language || 'bash').toLowerCase();
		const cwd = args?.cwd || process.cwd();

		if (!command) return { error: 'No command argument provided.' };

		try {
			let finalCommand = command;

			// Wrap code in appropriate language syntax if needed
			if (language === 'node')
				finalCommand = `node -e "${command.replace(/"/g, '\\"')}"`;
			else if (language === 'python')
				finalCommand = `python -c "${command.replace(/"/g, '\\"')}"`;

			const output = execSync(finalCommand, {
				cwd,
				encoding: 'utf-8',
				maxBuffer: 10 * 1024 * 1024 // 10MB buffer
			});

			return { output: output.trim() };
		} catch (err) {
			const errorMsg = (err as Error).message;
			return {
				error: `Error executing command: ${errorMsg}`
			};
		};
	}
};

export default tool;
