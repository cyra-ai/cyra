import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI, Modality } from '@google/genai';
// @ts-expect-error no types
import mic from 'mic';
import Speaker from 'speaker';

import * as readline from 'readline';
import * as path from 'path';
import * as fsp from 'fs/promises';
import * as fs from 'fs';

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

const ai = new GoogleGenAI({
	apiKey: process.env.GOOGLE_API_KEY || ''
});

import type { CyraTool } from '../types';
const functions: CyraTool[] = [];
const functionsPath = path.resolve(process.cwd(), 'src', 'functions');

const loadFunctions = async () => {
	console.log('Reloading functions...');
	functions.length = 0;
	const functionFiles = await fsp.readdir(functionsPath);
	for (const file of functionFiles)
		if (file.endsWith('.ts') || file.endsWith('.js')) {
			const modulePath = path.join(functionsPath, file);
			// NOTE: Dynamic import cache busting is complex in Node.js ESM.
			// New files will be detected and imported. Updates to existing files might require application restart due to module caching.
			try {
				const module = await import(modulePath);
				if (module.default) {
					functions.push(module.default);
					console.log(`Loaded function: ${module.default.name}`);
				};
			} catch (error) {
				console.error(`Error loading function ${file}:`, error);
			};
		};

	console.log(`Total functions: ${functions.length}`);
};

await loadFunctions();

// -- Set up microphone input --
const micInstance = mic({
	rate: '16000',
	bitwidth: '16',
	channels: '1',
	device: 'plughw:2,0' // Use Plugged In USB Audio Device; change as needed
});
let listening = false;
const micInputStream = micInstance.getAudioStream();
console.log('Microphone initialized.');

// -- Set up speaker for audio output --
const speaker = new Speaker({
	channels: 1,
	bitDepth: 16,
	sampleRate: 24000
});
console.log('Speaker initialized.');

// -- Set up session with Gemini --
const session = await ai.live.connect({
	model: 'gemini-2.5-flash-native-audio-preview-12-2025',
	config: {
		responseModalities: [Modality.AUDIO],
		tools: [
			{
				functionDeclarations: functions
			}
		]
	},
	callbacks: {
		onopen: () => {
			listening = true;
			console.log(
				'Listening... Press p to pause/play, q to quit, s to save recorded audio.'
			);
		},
		onmessage: (message) => {
			// Check for tool calls at the top level
			if (message.toolCall)
				for (const functionCall of message.toolCall.functionCalls || []) {
					const tool = functions.find((f) => f.name === functionCall.name);
					if (tool)
						tool
							.execute(functionCall.args || {})
							.then((result) => {
								console.log(`Tool ${tool.name} executed.`);
								session.sendToolResponse({
									functionResponses: {
										id: functionCall.id || '',
										name: tool.name,
										response: result
									}
								});
							})
							.catch((err) => {
								console.error(`Error executing tool ${tool.name}:`, err);
							});
				};

			if (message.serverContent?.modelTurn?.parts)
				for (const part of message.serverContent.modelTurn.parts)
					if (
						part.inlineData?.mimeType === 'audio/pcm;rate=24000' &&
						part.inlineData.data
					) {
						// eslint-disable-next-line no-undef
						const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
						speaker.write(audioBuffer);
					};
		},
		onerror: (err) => {
			console.error('Session error:', err);
		},
		onclose: (e) => {
			console.log('Session closed.', e);
			process.exit();
		}
	}
});

// -- Start sending microphone input to Gemini --
// eslint-disable-next-line no-undef
micInputStream.on('data', (data: Buffer) => {
	// Debug: Show volume level
	const volume = data.reduce((acc, val) => acc + Math.abs(val), 0) / data.length; // 0-255
	const volumeBar = '█'.repeat(Math.min(20, Math.floor(volume / 255)));
	process.stdout.write(
		`\rVolume: [${volumeBar.padEnd(20)}] ${Math.round(volume)}`
	);

	if (!listening) return;
	session.sendRealtimeInput({
		media: {
			data: data.toString('base64'),
			mimeType: 'audio/pcm;rate=16000'
		}
	});
});
micInstance.start();

// -- Handle keyboard input --
process.stdin.on('keypress', (str, key) => {
	if (key.name === 'p') {
		listening = !listening;
		console.log(listening ? '\nResumed listening.' : '\nPaused listening.');
	} else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
		console.log('\nExiting...');
		session.close();
		process.exit();
	};
});
process.on('exit', () => {
	micInstance.stop();
});

fs.watch(functionsPath, async (eventType, filename) => {
	if (filename) {
		console.log(`\nDetected ${eventType} in ${filename}, reloading functions...`);
		await loadFunctions();
		session.conn.close();
		session.conn.connect();
	};
});
console.log('Setup complete.');
