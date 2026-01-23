import fs from 'fs';
import path from 'path';
import type { StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';

// if sandbox folder doesn't exist, create it
const sandboxPath = path.join(process.cwd(), 'sandbox');
if (!fs.existsSync(sandboxPath))
	fs.mkdirSync(sandboxPath);

// if memory file doesn't exist, create it
const memoryFilePath = path.join(process.cwd(), 'sandbox', 'memory.jsonl');
if (!fs.existsSync(memoryFilePath))
	fs.writeFileSync(memoryFilePath, '');

const config: StdioServerParameters[] = [
	{
		command: 'npx',
		args: [
			'-y',
			'@philschmid/weather-mcp'
		]
	},
	{
		command: 'npx',
		args: [
			'-y',
			'@modelcontextprotocol/server-filesystem',
			path.join(process.cwd(), 'sandbox')
		],
		cwd: process.cwd()
	},
	{
		command: 'npx',
		args: [
			'-y',
			'@modelcontextprotocol/server-sequential-thinking'
		]
	},
	{
		command: 'npx',
		args: [
			'-y',
			'@modelcontextprotocol/server-memory'
		],
		env: {
			MEMORY_FILE_PATH: path.join(process.cwd(), 'sandbox', 'memory.jsonl')
		}
	}
];

export default config;