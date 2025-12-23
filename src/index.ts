/* eslint-disable no-undef */
import * as readline from 'readline';
import { AudioService } from './services/AudioService.ts';
import { ToolManager } from './services/ToolManager.ts';
import { GeminiService } from './services/GeminiService.ts';

// Initialize services
const audioService = new AudioService();
const toolManager = new ToolManager();
const geminiService = new GeminiService(toolManager);

// Load tools
await toolManager.loadTools();

// Setup hot reload
toolManager.watch(async () => {
	console.log('Tools reloaded, reconnecting session...');
	// Reconnect session to update tools
	await geminiService.connect((data) => audioService.play(data));
});

// Connect session
let listening = false;

const startSession = async () => {
	await geminiService.connect((data) => {
		audioService.play(data);
	});
	listening = true;
	audioService.start();
	console.log('Listening... Press p to pause/play, q to quit.');
};

await startSession();

// Handle Audio Input
audioService.on('input', (data: Buffer) => {
	// Debug: Volume level
	const volume = data.reduce((acc, val) => acc + Math.abs(val), 0) / data.length;
	process.stdout.write(`\rMic volume: ${volume.toFixed(2)}   `);

	if (listening) geminiService.sendAudio(data);
});

// Handle Keyboard Input
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
	if (key.name === 'p') {
		listening = !listening;
		console.log(listening ? '\nResumed listening.' : '\nPaused listening.');
	} else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
		console.log('\nExiting...');
		geminiService.disconnect();
		audioService.stop();
		toolManager.stopWatching();
		process.exit();
	}
});
