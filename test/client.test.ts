import { WebSocket } from 'ws';

import speaker from 'speaker';
import mic from 'mic';

import type Payload from '../types/Payload.d.ts';

const ws = new WebSocket('ws://localhost:3000/ws');
const micInstance = mic({
	rate: '16000',
	channels: '1',
	debug: false,
	exitOnSilence: 6,
	device: 'plughw:2,0',
});
const micInputStream = micInstance.getAudioStream();

const speakerInstance = new speaker({
	channels: 1,
	bitDepth: 16,
	sampleRate: 24000
});

ws.on('open', () => {
	console.log('WebSocket connection established.');
	micInstance.start();
});

ws.on('message', (data) => {
	const message: Payload = JSON.parse(data.toString());
	if (message.type === 'audio' && message.payload?.data) {
		const audioBuffer = Buffer.from(message.payload.data, 'base64');
		speakerInstance.write(audioBuffer);
	};
});

micInputStream.on('data', (data: Buffer) => {
	const audioBase64 = data.toString('base64');
	const payload: Payload = {
		type: 'audio',
		payload: {
			data: audioBase64
		}
	};
	ws.send(JSON.stringify(payload));
});

micInputStream.on('error', (err: Error) => {
	console.error('Error in microphone input stream:', err);
});

ws.on('close', () => {
	console.log('WebSocket connection closed.');
	micInstance.stop();
	speakerInstance.end();
});

ws.on('error', (err) => {
	console.error('WebSocket error:', err);
});