import { WebSocketServer } from 'ws';

import Session from '../services/Session.ts';

import server from './server.ts';

import type Payload from '../../types/Payload.d.ts';

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws) => {
	const session = new Session();
	await session.connect();
	console.log('WebSocket client connected and session established.');

	ws.on('message', (message) => {
		try {
			const data: Payload = JSON.parse(message.toString());
			switch (data.type) {
			case 'realTimeInput':
				session.sendRealtimeInput(data.payload);
				break;
			default:
				console.warn('Unknown payload type received:', data.type);
			};
		} catch (err) {
			console.error('Error processing WebSocket message:', err);
		};
	});

	session.on('message', (data) => {
		ws.send(JSON.stringify(data));
	});
});

export default wss;