import { GoogleGenAI, Modality, Session as ISession } from '@google/genai';
import type { LiveSendRealtimeInputParameters } from '@google/genai';
import { EventEmitter } from 'node:events';
import TypedEmitter from 'typed-emitter';

import logger from '../utils/logger.ts';

import { config } from '../config/index.ts';

import type GeminiEvents from '../../types/GeminiEvents.d.ts';

const EvEmitter = EventEmitter as { new(): TypedEmitter<GeminiEvents> };

const sessions = new Set<Session>();

class Session extends EvEmitter {
	private client: GoogleGenAI;
	private config: typeof config;
	private initialized: boolean = false;
	private session?: ISession;

	constructor() {
		super();
		this.config = config;
		this.client = new GoogleGenAI({ apiKey: this.config.google.apiKey });
		sessions.add(this);
	};

	async connect(): Promise<void> {
		if (this.initialized) return;
		if (this.session) this.disconnect();

		// Wait for setupComplete before declaring the session ready
		// eslint-disable-next-line no-async-promise-executor
		await new Promise<void>(async (resolve) => {
			this.session = await this.client.live.connect({
				model: this.config.google.model,
				config: { responseModalities: [Modality.AUDIO] },
				callbacks: {
					onmessage: (data) => {
						this.emit('message', data);
						if (data.setupComplete) resolve();
					},
					onclose: (e) => {
						this.initialized = false;
						this.emit('close', e);
					},
					onerror: (err) => {
						logger.error('Session error:', err);
						this.emit('error', err);
					}
				}
			});
		});
		this.initialized = true;
		this.emit('ready');
	};

	disconnect(): void {
		if (this.session) {
			this.session.close();
			this.session = undefined;
			this.initialized = false;
		};
	};

	isConnected(): boolean {
		return this.initialized;
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