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

	ws.on('message', (message) => {
		try {
			const data: Payload = JSON.parse(message.toString());
			if (data.type === 'audio' && data.payload?.audio)
				session.sendRealtimeInput({
					audio: {
						data: data.payload.audio,
						mimeType: 'audio/pcm'
					}
				});
			else if (data.type === 'text' && data.payload?.text)
				session.sendRealtimeInput({
					text: data.payload.text
				});
			else
				logger.warn(`Unknown payload type received: ${data.type}`);
		} catch (err) {
			logger.error('Error processing WebSocket message:', err);
		};
	});

	session.on('message', (data) => {
		for (const part of data.serverContent?.modelTurn?.parts || [])
			if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('audio/'))
				ws.send(JSON.stringify({
					type: 'audio',
					payload: {
						audio: part.inlineData.data
					}
				}));
	});
	session.on('ready', () => {
		console.log('Session is ready, sending ready status to client.');
		ws.send(JSON.stringify({
			type: 'status',
			payload: {
				status: 'ready'
			}
		}));
	});

	ws.on('close', () => {
		sockets.delete(ws);
		session.disconnect();
		logger.info('WebSocket client disconnected.');
	});

	ws.on('error', (err) => {
		logger.error('WebSocket error:', err);
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