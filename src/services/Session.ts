import { GoogleGenAI, Modality, mcpToTool, Session as ISession } from '@google/genai';
import type { CallableTool, LiveSendRealtimeInputParameters } from '@google/genai';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import TypedEmitter from 'typed-emitter';

import logger from '../utils/logger.ts';
import MCPClients from './MCPClients.ts';

import type GeminiEvents from '../../types/GeminiEvents.d.ts';

const EvEmitter = EventEmitter as { new(): TypedEmitter<GeminiEvents> };

const sessions = new Set<Session>();

class Session extends EvEmitter {
	private client: GoogleGenAI;
	private connected: boolean = false;
	private session?: ISession;

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
		for (const client of MCPClients)
			tools.push(mcpToTool(client));

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
							{ text: systemPrompt }
						]
					},
					tools: tools
				},
				callbacks: {
					onmessage: async (data) => {
						this.emit('message', data);

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

						if (data.setupComplete) resolve();
					},
					onclose: (e) => {
						this.connected = false;
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
		logger.success('Gemini session ready');
	};

	disconnect(): void {
		if (this.session) {
			this.session.close();
			this.session = undefined;
			this.connected = false;
		};
	};

	isConnected(): boolean {
		return this.connected;
	};

	sendRealtimeInput(params: LiveSendRealtimeInputParameters): void {
		if (!this.session) throw new Error('Session is not connected.');
		this.session.sendRealtimeInput(params);
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