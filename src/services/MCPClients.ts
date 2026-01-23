import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import logger from '../utils/logger.ts';

import mcp from '../config/mcp.ts';

const clients: Client[] = [];

logger.subtitle('Initializing MCP Servers');

await Promise.all(mcp.map(async (serverConfig) => {
	const params = new StdioClientTransport(serverConfig);
	const client = new Client({ name: 'MCP Client', version: '1.0.0' });
	await client.connect(params);
	clients.push(client);
	const serverName = serverConfig.args?.[1] || serverConfig.args?.[0] || serverConfig.command;
	const tools = (await client.listTools()).tools;
	logger.success(`Connected to MCP: ${serverName}`);
	logger.list(tools.map(tool => tool.name), 'Available Tools', 'dim');
}));

logger.hierarchy.report('success', 'MCP Initialization Complete', undefined, `${clients.length} server(s) ready`);

export default clients;