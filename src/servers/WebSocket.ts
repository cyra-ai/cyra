import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';

import logger from '../utils/logger.ts';

import Session from '../services/Session.ts';

import server from './server.ts';

import type Payload from '../../types/Payload.d.ts';

const sockets = new Set<WebSocket>();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws, req) => {
	logger.status('success', 'WebSocket client connected');

	const apiKey = req.headers['api_key'] as string | undefined;
	if (!apiKey || apiKey.trim() === '') {
		ws.send(JSON.stringify({
			type: 'error',
			payload: {
				code: 401,
				message: 'Missing or invalid API key in "api_key" header.'
			}
		} as Payload));
		logger.status('error', 'Connection rejected: Missing API key');
		req.destroy(new Error('Missing API key'));
		return;
	};

	const session = new Session({
		apiKey
	});

	session.on('ready', () => {
		logger.success('Session ready for client interaction');
		ws.send(JSON.stringify({
			type: 'status',
			payload: {
				status: 'ready'
			}
		} as Payload));
	});

	session.on('message', (message) => {
		for (const part of message.serverContent?.modelTurn?.parts || []) {
			if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/'))
				ws.send(JSON.stringify({
					type: 'audio',
					payload: {
						audio: part.inlineData.data
					}
				} as Payload));
			if (part.text && part.thought)
				ws.send(JSON.stringify({
					type: 'thought',
					payload: {
						thought: part.text
					}
				} as Payload));
			if (part.text && !part.thought)
				ws.send(JSON.stringify({
					type: 'text',
					payload: {
						text: part.text
					}
				} as Payload));
		};

		if (message.serverContent?.outputTranscription)
			ws.send(JSON.stringify({
				type: 'transcription',
				payload: {
					transcription: message.serverContent.outputTranscription.text,
					finished: message.serverContent.outputTranscription.finished,
					type: 'output'
				}
			} as Payload));
		if (message.serverContent?.inputTranscription)
			ws.send(JSON.stringify({
				type: 'transcription',
				payload: {
					transcription: message.serverContent.inputTranscription.text,
					finished: message.serverContent.inputTranscription.finished,
					type: 'input'
				}
			} as Payload));

		if (message.serverContent?.turnComplete)
			ws.send(JSON.stringify({
				type: 'turn_complete',
				payload: {}
			} as Payload));
		if (message.serverContent?.interrupted)
			ws.send(JSON.stringify({
				type: 'interrupted',
				payload: {}
			} as Payload));
	});

	ws.on('message', async (data) => {
		if (!session.isConnected()) return;

		const message: Payload = (() => {
			try {
				return JSON.parse(data.toString());
			} catch (err) {
				ws.send(JSON.stringify({
					type: 'error',
					payload: {
						code: 400,
						message: `Invalid message format received. ${(err as Error).message}`
					}
				} as Payload));
				logger.status('error', 'Failed to parse WebSocket message');
				logger.error(`  ${(err as Error).message}`, 'dim');
				return null;
			};
		})();
		if (!message) return;

		switch (message.type) {
		case 'text':
			session.sendRealtimeInput({
				text: message.payload.text
			});
			break;
		case 'audio':
			session.sendRealtimeInput({
				audio: {
					data: message.payload.audio,
					mimeType: 'audio/pcm;rate=16000'
				}
			});
			break;
		};
	});

	await session.connect();
	sockets.add(ws);
});

export default wss;

// SIGINT
process.on('SIGINT', () => {
	logger.warn('\nClosing WebSocket connections...');
	for (const ws of sockets)
		ws.close();
	logger.success(`${sockets.size} WebSocket connection(s) closed`);
	process.exit();
});