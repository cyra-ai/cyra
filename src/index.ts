import GeminiSession from './services/Gemini.ts';

const geminiSession = new GeminiSession();

geminiSession.on('ready', () => {
	console.log('Gemini session is ready.');
});

geminiSession.on('message', (data) => {
	console.log('Received Gemini message:', data);
});

await geminiSession.connect();