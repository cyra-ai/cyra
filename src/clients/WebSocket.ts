import { WebSocketServer } from 'ws';

import server from './server.ts';

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
	console.log('New WebSocket connection established.');

	ws.on('message', (message) => {
		console.log('Received message:', message.toString());
		// Echo the message back to the client
		ws.send(`Server received: ${message}`);
	});

	ws.on('close', () => {
		console.log('WebSocket connection closed.');
	});
});

export default wss;