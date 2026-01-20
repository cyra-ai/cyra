import { GoogleGenAI, Modality, Session as ISession } from '@google/genai';
import type { LiveSendRealtimeInputParameters } from '@google/genai';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import TypedEmitter from 'typed-emitter';

import logger from '../utils/logger.ts';

import type GeminiEvents from '../../types/GeminiEvents.d.ts';

const EvEmitter = EventEmitter as { new(): TypedEmitter<GeminiEvents> };

const sessions = new Set<Session>();

class Session extends EvEmitter {
	private client: GoogleGenAI;
	private connected: boolean = false;
	private session?: ISession;
	private model?: string;

	constructor({
		apiKey,
		model
	}: {
		apiKey?: string;
		model?: string;
	}) {
		super();
		this.client = new GoogleGenAI({
			apiKey: apiKey
		});
		this.model = model;
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

		// Wait for setupComplete before declaring the session ready
		// eslint-disable-next-line no-async-promise-executor
		await new Promise<void>(async (resolve) => {
			this.session = await this.client.live.connect({
				model: this.model || 'gemini-2.5-flash-native-audio-preview-12-2025',
				config: {
					responseModalities: [Modality.AUDIO],
					inputAudioTranscription: {},
					outputAudioTranscription: {},
					thinkingConfig: { includeThoughts: true },
					systemInstruction: {
						parts: [
							{ text: systemPrompt }
						]
					}
				},
				callbacks: {
					onmessage: (data) => {
						this.emit('message', data);
						if (data.setupComplete) resolve();
					},
					onclose: (e) => {
						this.connected = false;
						this.emit('close', e);
					},
					onerror: (err) => {
						logger.error('Session error:', err);
						this.emit('error', err);
					}
				}
			});
		});
		this.connected = true;
		this.emit('ready');
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
	for (const session of sessions)
		session.disconnect();
	logger.info('All sessions disconnected. Exiting process.');
	process.exit();
});