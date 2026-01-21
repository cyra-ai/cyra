await import('dotenv').then(dotenv => dotenv.config());

import { WebSocket } from 'ws';

import speaker from 'speaker';
import mic from 'mic';

import type Payload from '../types/Payload.d.ts';

const ws = new WebSocket('ws://localhost:3000/ws', {
	headers: {
		api_key: process.env.GOOGLE_API_KEY || '',
		model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025'
	}
});
const micInstance = mic({
	rate: '16000',
	channels: '1',
	debug: false,
	exitOnSilence: 6,
	device: 'plughw:2,0'
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

let previousSpeaker: 'input' | 'output' | null = null;
ws.on('message', (data) => {
	const message: Payload = JSON.parse(data.toString());

	if (message.type === 'audio' && message.payload?.audio) {
		const audioBuffer = Buffer.from(message.payload.audio, 'base64');
		speakerInstance.write(audioBuffer);
	};

	if (message.type === 'status')
		if (message.payload.status === 'ready')
			ws.send(JSON.stringify({
				type: 'text',
				payload: {
					text: 'Hello'
				}
			} as Payload));

	if (message.type === 'error') {
		console.error(`Error ${message.payload.code}: ${message.payload.message}`);
		micInstance.stop();
		speakerInstance.end();
		ws.close();
	};

	if (message.type === 'thought')
		console.log(`\n[Thought]: ${message.payload.thought}\n`);

	if (message.type === 'transcription') {
		if (message.payload.type === 'input') {
			if (previousSpeaker !== 'input') {
				process.stdout.write('\nUser: ');
				previousSpeaker = 'input';
			};
		} else if (message.payload.type === 'output') {
			if (previousSpeaker !== 'output') {
				process.stdout.write('\nAI: ');
				previousSpeaker = 'output';
			};
		};
		process.stdout.write(message.payload.transcription + (message.payload.finished ? '\n' : ''));
	};
});

micInputStream.on('data', (data: Buffer) => {
	const audioBase64 = data.toString('base64');
	const payload: Payload = {
		type: 'audio',
		payload: {
			audio: audioBase64
		}
	};
	ws.send(JSON.stringify(payload));
	// const volume = data.reduce((acc, val) => acc + Math.abs(val), 0) / data.length;
	// process.stdout.write(`\r[${'='.repeat(Math.min(Math.floor(volume / 10), 20)).padEnd(20)}]`);
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