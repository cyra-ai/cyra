import type { LiveServerMessage } from '@google/genai';

type GeminiEvents = {
	ready: () => void;
	message: (data: LiveServerMessage) => void;
	close: (e: CloseEvent) => void;
	error: (err: ErrorEvent) => void;
};

export default GeminiEvents;