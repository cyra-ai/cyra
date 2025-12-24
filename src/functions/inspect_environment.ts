import { exec } from 'child_process';
import { promisify } from 'util';
import { Type, Behavior } from '@google/genai';

import type { CyraTool } from '../../types/index.d.ts';

const execAsync = promisify(exec);

const tool: CyraTool = {
	name: 'inspect_environment',
	description:
		'Inspects the current environment and returns information about available terminal commands, shell, and system details.',
	behavior: Behavior.BLOCKING,
	response: {
		type: Type.OBJECT,
		description:
			'Information about the environment including shell, available commands, and system details.'
	},
	parameters: {
		type: Type.OBJECT,
		properties: {
			check_commands: {
				type: Type.ARRAY,
				description:
					'Optional: Specific commands to check availability for (e.g., ["python", "node", "git"]). If not provided, checks common commands.',
				items: {
					type: Type.STRING
				}
			}
		}
	},
	execute: async (args?: Record<string, unknown>) => {
		try {
			const checkCommands = (
				Array.isArray(args?.check_commands)
					? args?.check_commands
					: [
						'node',
						'npm',
						'python',
						'python3',
						'git',
						'docker',
						'curl',
						'wget',
						'grep',
						'sed',
						'awk',
						'jq',
						'make',
						'gcc',
						'java'
					]
			) as string[];

			// Get shell info
			let shellInfo = 'Unknown';
			try {
				const { stdout } = await execAsync('echo $SHELL');
				shellInfo = stdout.trim();
			} catch {
				// Fallback if SHELL env var is not set
				shellInfo = 'Unable to determine';
			};

			// Get OS info
			let osInfo = 'Unknown';
			try {
				const { stdout } = await execAsync('uname -s');
				osInfo = stdout.trim();
			} catch {
				osInfo = 'Unknown';
			};

			// Get PATH
			let pathDirs: string[] = [];
			try {
				const pathEnv = process.env.PATH || '';
				pathDirs = pathEnv.split(':').filter((p) => p.length > 0);
			} catch {
				pathDirs = [];
			};

			// Check availability of specified commands
			const availableCommands: Record<string, boolean> = {};
			for (const cmd of checkCommands)
				try {
					await execAsync(`command -v ${cmd}`, { shell: '/bin/bash' });
					availableCommands[cmd] = true;
				} catch {
					availableCommands[cmd] = false;
				};

			// Get list of all executables in PATH
			let allExecutables: string[] = [];
			try {
				const { stdout } = await execAsync('compgen -c', { shell: '/bin/bash' });
				allExecutables = stdout
					.split('\n')
					.filter((cmd) => cmd.length > 0)
					.slice(0, 100); // Limit to first 100 to avoid too much output
			} catch {
				// If compgen is not available, try an alternative approach
				try {
					const pathCommands: Set<string> = new Set();
					for (const dir of pathDirs)
						try {
							const { stdout } = await execAsync(`ls -1 ${dir} 2>/dev/null || true`);
							stdout.split('\n').forEach((f) => {
								if (f.length > 0) pathCommands.add(f);
							});
						} catch {
							// Skip directories we can't read
						};

					allExecutables = Array.from(pathCommands).slice(0, 100);
				} catch {
					allExecutables = [];
				};
			};

			// Get environment variables count
			const envVarCount = Object.keys(process.env).length;

			// Get current working directory
			const cwd = process.cwd();

			// Get Node.js version
			let nodeVersion = 'Unknown';
			try {
				const { stdout } = await execAsync('node --version');
				nodeVersion = stdout.trim();
			} catch {
				nodeVersion = 'Node.js not available';
			};

			// Get npm version if available
			let npmVersion = 'Unknown';
			try {
				const { stdout } = await execAsync('npm --version');
				npmVersion = stdout.trim();
			} catch {
				npmVersion = 'npm not available';
			};

			// Get globally installed npm CLIs
			let npmGlobalClis: string[] = [];
			try {
				const { stdout } = await execAsync('npm list -g --depth=0 --parseable');
				npmGlobalClis = stdout
					.split('\n')
					.filter((line) => line.length > 0)
					.map((line) => {
						// Extract package name from path (last part of the path)
						const parts = line.split('/');
						return parts[parts.length - 1] || '';
					})
					.filter((pkg) => pkg.length > 0 && !pkg.includes('@'))
					.slice(0, 50); // Limit to first 50 packages
			} catch {
				// npm not available or error occurred
				npmGlobalClis = [];
			};

			const output = JSON.stringify(
				{
					shell: shellInfo,
					os: osInfo,
					nodeVersion,
					npmVersion,
					currentWorkingDirectory: cwd,
					environmentVariablesCount: envVarCount,
					pathDirectories: pathDirs.length,
					availableCommands,
					availableCommandsList: allExecutables,
					npmGlobalClis,
					summary: {
						total: allExecutables.length,
						npmCliCount: npmGlobalClis.length,
						description: `${allExecutables.length} commands found in PATH (limited to first 100), ${npmGlobalClis.length} npm global CLIs available`
					}
				},
				null,
				2
			);

			return { output };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return { error: `Failed to inspect environment: ${errorMessage}` };
		};
	}
};

export default tool;
