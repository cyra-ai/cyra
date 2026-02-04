import { GoogleGenAI, Modality, mcpToTool, Session as ISession } from '@google/genai';
import type { CallableTool, LiveSendRealtimeInputParameters, LiveServerMessage } from '@google/genai';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import TypedEmitter from 'typed-emitter';

import logger from '../utils/logger.ts';
import MCPClients from './MCPClients.ts';

import type SessionEvents from '../../types/SessionEvents.d.ts';

const EvEmitter = EventEmitter as { new(): TypedEmitter<SessionEvents> };

const sessions = new Set<Session>();

class Session extends EvEmitter {
	private client: GoogleGenAI;
	private connected: boolean = false;
	private session?: ISession;

	private notificationQueue: string[] = [];
	private turnComleted: boolean = false;
	private timeInterval?: NodeJS.Timeout;
	private notificationInterval?: NodeJS.Timeout;

	constructor({
		apiKey
	}: {
		apiKey?: string;
	}) {
		super();
		this.client = new GoogleGenAI({
			apiKey: apiKey,
			httpOptions: { apiVersion: 'v1alpha' }
		});
		sessions.add(this);
	};

	async connect(): Promise<void> {
		if (this.connected) return;
		if (this.session) this.disconnect();

		// Load the system prompt from file
		const systemPromptPath = path.join(
			process.cwd(),
			'prompts',
			'system_prompt.md'
		);
		const systemPrompt = fs.existsSync(systemPromptPath)
			? fs.readFileSync(systemPromptPath, 'utf-8')
			: 'You are a helpful AI assistant.';

		const tools: CallableTool[] = [];
		const toolInfos: string[] = [];
		for (const client of MCPClients) {
			tools.push(mcpToTool(client));
			const MCPTools = (await client.listTools()).tools;

			for (const tool of MCPTools) {
				let info = '';
				info += `### ${tool.name}\n`;
				info += tool.description ? `${tool.description}\n` : '';
				info += '#### Input Schema\n';
				info += '```json\n';
				info += tool.inputSchema
					? JSON.stringify(tool.inputSchema, null, 2)
					: '{ "type": "object", "properties": {} }';
				info += '\n```\n';
				info += '#### Output Schema\n';
				info += '```json\n';
				info += tool.outputSchema
					? JSON.stringify(tool.outputSchema, null, 2)
					: '{ "type": "object", "properties": {} }';
				info += '\n```\n';
				toolInfos.push(info);
			};
		};
		const parsedSystemPrompt = systemPrompt.replace('{{mcp_tools_list}}', toolInfos.join('\n'));

		// Wait for setupComplete before declaring the session ready
		// eslint-disable-next-line no-async-promise-executor
		await new Promise<void>(async (resolve) => {
			this.session = await this.client.live.connect({
				model: 'gemini-2.5-flash-native-audio-preview-12-2025',
				config: {
					responseModalities: [Modality.AUDIO],
					inputAudioTranscription: {},
					outputAudioTranscription: {},
					thinkingConfig: { includeThoughts: true },
					enableAffectiveDialog: true,
					proactivity: { proactiveAudio: true },
					systemInstruction: {
						parts: [
							{ text: parsedSystemPrompt }
						]
					},
					tools: [...tools, { googleSearch: {} }]
				},
				callbacks: {
					onmessage: async (data) => {
						this.handleMessage(data);
						if (data.setupComplete) resolve();
					},
					onclose: (e) => {
						this.connected = false;
						logger.status('warning', 'Gemini session closed');
						logger.label('  Reason', e || 'No reason provided', 'dim');
						this.emit('close', e);
					},
					onerror: (err) => {
						logger.status('error', 'Gemini session error');
						logger.error(`  ${err.message || String(err)}`, 'dim');
						this.emit('error', err);
					}
				}
			});
		});
		this.connected = true;
		this.emit('ready');
		logger.success('Gemini session ready');

		// Time interval
		this.timeInterval = setInterval(() => {
			if (this.session && this.connected)
				this.notificationQueue.push(`[time] ${(new Date()).toString()}`);
		}, 1000 * 60);

		// Notification interval
		this.notificationInterval = setInterval(() => {
			if (this.session && this.connected && this.notificationQueue.length > 0 && this.turnComleted) {
				const notification = this.notificationQueue.shift();
				if (notification) {
					this.session.sendRealtimeInput({
						text: notification
					});
					logger.status('success', `Sent notification: ${notification}`);
				};
			};
		}, 1000);
	};

	disconnect(): void {
		if (this.session) {
			this.session.close();
			this.session = undefined;
			this.connected = false;

			if (this.timeInterval) {
				clearInterval(this.timeInterval);
				this.timeInterval = undefined;
			};
			if (this.notificationInterval) {
				clearInterval(this.notificationInterval);
				this.notificationInterval = undefined;
			};

			logger.success('Gemini session disconnected');
		};
	};

	isConnected(): boolean {
		return this.connected;
	};

	sendRealtimeInput(params: LiveSendRealtimeInputParameters): void {
		if (!this.session) throw new Error('Session is not connected.');

		// Handle Message Tag injection
		const tags = ['task', 'notification', 'system', 'time'];
		for (const tag of tags)
			if (params.text?.trim().toLocaleLowerCase()?.startsWith(`[${tag}]`))
				params.text = params.text.replace(`[${tag}]`, '');

		this.session.sendRealtimeInput(params);
	};

	private async handleMessage(data: LiveServerMessage): Promise<void> {
		this.emit('message', data);
		this.turnComleted = data.serverContent?.turnComplete || false;

		// Handle function calls
		for (const functionCall of data.toolCall?.functionCalls || []) {
			const args = Object.keys(functionCall.args || {}).length > 0
				? JSON.stringify(functionCall.args, null, 2)
				: 'none';
			logger.status('pending', `Executing tool: ${functionCall.name}`);
			logger.label('  Arguments', args, 'dim');

			try {
				// Find the correct MCP client for this tool
				let result: unknown;
				for (const client of MCPClients) {
					const tools = await client.listTools();
					if (tools.tools.some(t => t.name === functionCall.name)) {
						// Execute the tool
						const response = await client.callTool({
							name: functionCall.name || '',
							arguments: functionCall.args
						});
						result = response.content;
						break;
					};
				};

				// Send the result back to Gemini
				if (this.session && result !== undefined) {
					this.session.sendToolResponse({
						functionResponses: [{
							id: functionCall.id,
							name: functionCall.name,
							response: { output: result }
						}]
					});
					logger.status('success', `Tool completed: ${functionCall.name}`);
				};
			} catch (error) {
				logger.status('error', `Tool failed: ${functionCall.name}`);
				logger.error(`  ${(error as Error).message || String(error)}`, 'dim');
				// Send error response
				if (this.session)
					this.session.sendToolResponse({
						functionResponses: [{
							id: functionCall.id,
							name: functionCall.name,
							response: { error: String(error) }
						}]
					});
			};
		};
	};
};

export default Session;

// SIGINT
process.on('SIGINT', () => {
	logger.warn('\nReceived SIGINT signal');
	for (const session of sessions)
		session.disconnect();
	logger.hierarchy.report('success', 'Graceful Shutdown', [
		`${sessions.size} session(s) disconnected`
	], 'Process exiting...');
	process.exit();
});