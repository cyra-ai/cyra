import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import logger from '../utils/logger.ts';

import mcp from '../config/mcp.ts';

const clients: Client[] = [];

logger.info('Connecting to MCP servers...');

await Promise.all(mcp.map(async (serverConfig) => {
	const params = new StdioClientTransport(serverConfig);
	const client = new Client({ name: 'MCP Client', version: '1.0.0' });
	await client.connect(params);
	clients.push(client);
	logger.info('Connected to MCP server with command:', serverConfig.command, serverConfig.args?.join(' '));
}));

export default clients;