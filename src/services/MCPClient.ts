/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import { spawn, type ChildProcess } from 'child_process';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MCPServerConfig, MCPConfig } from '../config/mcp.ts';

interface MCPServerInstance {
	config: MCPServerConfig;
	client?: Client;
	transport?: StdioClientTransport;
	process?: ChildProcess;
	tools: Tool[];
	initialized: boolean;
	requestId?: number;
	pendingRequests?: Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>;
};

export class MCPClient extends EventEmitter {
	private servers: Map<string, MCPServerInstance> = new Map();
	private config: MCPConfig;

	constructor(config: MCPConfig) {
		super();
		this.config = config;
	};

	/**
	 * Initialize all configured MCP servers
	 */
	public async initialize(): Promise<void> {
		if (!this.config.enabled) {
			console.log('MCP is disabled in configuration');
			return;
		};

		console.log(`Initializing ${this.config.servers.length} MCP servers...`);

		for (const serverConfig of this.config.servers) {
			try {
				await this.initializeServer(serverConfig);
			} catch (error) {
				console.error(
					`Failed to initialize MCP server "${serverConfig.name}":`,
					error
				);
			};
		};

		console.log(
			`Total MCP servers initialized: ${this.getInitializedServersCount()}`
		);
	};

	/**
	 * Initialize a single MCP server
	 */
	private async initializeServer(serverConfig: MCPServerConfig): Promise<void> {
		const instance: MCPServerInstance = {
			config: serverConfig,
			tools: [],
			initialized: false
		};

		try {
			if (serverConfig.type === 'stdio')
				await this.initializeStdioServer(instance);
			else if (serverConfig.type === 'sse')
				await this.initializeSSEServer(instance);

			this.servers.set(serverConfig.name, instance);
		} catch (error) {
			throw new Error(
				`Failed to initialize ${serverConfig.type} server ${serverConfig.name}: ${error}`
			);
		};
	};

	/**
	 * Initialize a STDIO-based MCP server (local process)
	 */
	private async initializeStdioServer(instance: MCPServerInstance): Promise<void> {
		const { command, args, env } = instance.config;

		if (!command)
			throw new Error('STDIO server requires a command');

		return new Promise((resolve, reject) => {
			try {
				// Spawn the server process
				const spawnedProcess = spawn(command, args || [], {
					env: {
						...process.env,
						...env
					},
					stdio: ['pipe', 'pipe', 'pipe']
				});

				instance.process = spawnedProcess;
				instance.requestId = 0;
				instance.pendingRequests = new Map();

				let stderrOutput = '';

				// Handle stdout for JSON-RPC responses
				spawnedProcess.stdout?.on('data', (data: Buffer) => {
					const lines = data.toString().split('\n');
					for (const line of lines) {
						if (!line.trim()) continue;
						try {
							const response = JSON.parse(line);
							this.handleMCPResponse(instance, response);
						} catch (error) {
							console.error(`Failed to parse MCP response: ${line}`, error);
						};
					};
				});

				// Capture stderr for debugging
				spawnedProcess.stderr?.on('data', (data: Buffer) => {
					stderrOutput += data.toString();
				});

				// Handle process errors
				spawnedProcess.on('error', (error: Error) => {
					console.error(
						`MCP server "${instance.config.name}" process error:`,
						error
					);
					reject(error);
				});

				spawnedProcess.on('exit', (code: number | null) => {
					console.log(
						`MCP server "${instance.config.name}" exited with code ${code}`
					);
					if (stderrOutput)
						console.error(`MCP server stderr: ${stderrOutput}`);
					instance.initialized = false;
				});

				instance.initialized = true;
				console.log(
					`Successfully initialized MCP server: ${instance.config.name}`
				);

				// Discover tools from the server
				this.discoverToolsStdio(instance).catch((error) => {
					console.error(
						`Failed to discover tools for ${instance.config.name}:`,
						error
					);
				});

				resolve();
			} catch (error) {
				reject(error);
			};
		});
	};

	/**
	 * Handle JSON-RPC responses from MCP server
	 */
	private handleMCPResponse(instance: MCPServerInstance, response: any): void {
		if (response.id !== undefined && instance.pendingRequests) {
			const pending = instance.pendingRequests.get(response.id);
			if (pending) {
				instance.pendingRequests.delete(response.id);
				if (response.error)
					pending.reject(new Error(response.error.message || JSON.stringify(response.error)));
				else
					pending.resolve(response.result);
			};
		};
	};

	/**
	 * Send a JSON-RPC request to an MCP server
	 */
	private async sendMCPRequest(instance: MCPServerInstance, method: string, params?: any): Promise<any> {
		if (!instance.process || instance.requestId === undefined)
			throw new Error(`MCP server "${instance.config.name}" is not initialized`);

		const id = ++instance.requestId;
		const request = {
			jsonrpc: '2.0',
			id,
			method,
			...(params && { params })
		};

		return new Promise((resolve, reject) => {
			if (!instance.pendingRequests)
				instance.pendingRequests = new Map();

			// Longer timeout for tool execution (especially long-running operations)
			const timeoutMs = method === 'tools/call' ? 30000 : 5000;
			const timeout = setTimeout(() => {
				instance.pendingRequests?.delete(id);
				reject(new Error(`Request timeout for method ${method}`));
			}, timeoutMs);

			instance.pendingRequests.set(id, {
				resolve: (value) => {
					clearTimeout(timeout);
					resolve(value);
				},
				reject: (error) => {
					clearTimeout(timeout);
					reject(error);
				}
			});

			instance.process?.stdin?.write(JSON.stringify(request) + '\n');
		});
	};

	/**
	 * Initialize a SSE-based MCP server (remote HTTP)
	 */
	private async initializeSSEServer(instance: MCPServerInstance): Promise<void> {
		const { url } = instance.config;

		if (!url)
			throw new Error('SSE server requires a URL');

		try {
			// Placeholder for SSE initialization
			// This would involve making HTTP connections to the SSE endpoint
			instance.initialized = true;
			console.log(
				`Successfully initialized MCP server: ${instance.config.name}`
			);
		} catch (error) {
			throw new Error(`Failed to initialize SSE server: ${error}`);
		};
	};

	/**
	 * Discover available tools from a STDIO server
	 */
	private async discoverToolsStdio(instance: MCPServerInstance): Promise<void> {
		try {
			// Send tools/list request to the MCP server
			const response = await this.sendMCPRequest(instance, 'tools/list');

			if (response && response.tools && Array.isArray(response.tools)) {
				instance.tools = response.tools.map((tool: any) => ({
					name: tool.name,
					description: tool.description || '',
					inputSchema: tool.inputSchema
				} as Tool));
				console.log(
					`Discovered ${instance.tools.length} tools from ${instance.config.name}: ${instance.tools.map((t) => t.name).join(', ')}`
				);
			} else {
				console.log(`No tools found in response from ${instance.config.name}`);
				instance.tools = [];
			};
		} catch (error) {
			console.error(
				`Failed to discover tools from ${instance.config.name}:`,
				error
			);
			instance.tools = [];
		};
	};

	/**
	 * Get all available tools from all initialized servers
	 */
	public getTools(): Tool[] {
		const tools: Tool[] = [];

		for (const server of this.servers.values())
			if (server.initialized)
				tools.push(...server.tools);

		return tools;
	};

	/**
	 * Get tool definitions in Gemini API format
	 */
	public getToolDefinitionsForGemini(): any[] {
		return this.getTools().map((tool) => ({
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema || {
				type: 'object',
				properties: {}
			}
		}));
	};

	/**
	 * Execute a tool call on the appropriate MCP server
	 */
	public async executeTool(
		toolName: string,
		args?: Record<string, unknown>
	): Promise<string> {
		for (const server of this.servers.values()) {
			const tool = server.tools.find((t) => t.name === toolName);
			if (tool) {
				console.log(`Executing tool "${toolName}" on server "${server.config.name}"`);
				try {
					const response = await this.sendMCPRequest(server, 'tools/call', {
						name: toolName,
						arguments: args || {}
					});

					// Return the result as a JSON string
					return JSON.stringify(response);
				} catch (error) {
					throw new Error(`Failed to execute tool ${toolName}: ${(error as Error).message}`);
				};
			};
		};

		throw new Error(`Tool not found: ${toolName}`);
	};

	/**
	 * Get count of initialized servers
	 */
	public getInitializedServersCount(): number {
		return Array.from(this.servers.values()).filter((s) => s.initialized).length;
	};

	/**
	 * Get server by name
	 */
	public getServer(name: string): MCPServerInstance | undefined {
		return this.servers.get(name);
	};

	/**
	 * Get all servers
	 */
	public getAllServers(): MCPServerInstance[] {
		return Array.from(this.servers.values());
	};

	/**
	 * Shutdown all MCP servers
	 */
	public shutdown(): void {
		for (const server of this.servers.values())
			if (server.process)
				server.process.kill();

		this.servers.clear();
		console.log('All MCP servers shut down');
	};
};

export default MCPClient;
