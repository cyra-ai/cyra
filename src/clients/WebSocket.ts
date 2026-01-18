import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';

import Session from '../services/Session.ts';

import server from './server.ts';

import type Payload from '../../types/Payload.d.ts';

const sockets = new Set<WebSocket>();

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws) => {
	const session = new Session();
	await session.connect();
	sockets.add(ws);
	console.log('WebSocket client connected and session established.');

	ws.on('message', (message) => {
		try {
			const data: Payload = JSON.parse(message.toString());
			switch (data.type) {
			case 'audio':
				session.sendRealtimeInput({
					audio: {
						data: data.payload.data,
						mimeType: 'audio/pcm'
					}
				});
				break;
			default:
				console.warn('Unknown payload type received:', data.type);
			};
		} catch (err) {
			console.error('Error processing WebSocket message:', err);
		};
	});

	session.on('message', (data) => {
		for (const part of data.serverContent?.modelTurn?.parts || [])
			if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('audio/'))
				ws.send(JSON.stringify({
					type: 'audio',
					payload: {
						data: part.inlineData.data
					}
				}));
	});
});

export default wss;

// SIGINT
process.on('SIGINT', () => {
	for (const ws of sockets)
		ws.close();
	console.log('WebSocket server closed. Exiting process.');
	process.exit();
});