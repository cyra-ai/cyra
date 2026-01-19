import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';

import logger from '../utils/logger.ts';

import Session from '../services/Session.ts';

import server from './server.ts';

import type Payload from '../../types/Payload.d.ts';

const sockets = new Set<WebSocket>();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws) => {
	logger.info('WebSocket client connected.');
	const session = new Session();

	session.on('ready', () => {
		logger.info('Session is ready to receive messages.');
		ws.send(JSON.stringify({
			type: 'status',
			payload: {
				status: 'ready'
			}
		} as Payload));
	});

	session.on('message', (message) => {
		for (const part of message.serverContent?.modelTurn?.parts || [])
			if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/'))
				ws.send(JSON.stringify({
					type: 'audio',
					payload: {
						audio: part.inlineData.data
					}
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
				logger.error('Failed to parse incoming WebSocket message:', err);
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
	logger.info('Gemini session connected for WebSocket client.');
	sockets.add(ws);
});

export default wss;

// SIGINT
process.on('SIGINT', () => {
	for (const ws of sockets)
		ws.close();
	logger.info('WebSocket server closed. Exiting process.');
	process.exit();
});