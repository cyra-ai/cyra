import type { LiveServerMessage } from '@google/genai';

export type GeminiEvents = {
	ready: () => void;
	message: (data: LiveServerMessage) => void;
	close: (e: CloseEvent) => void;
	error: (err: ErrorEvent) => void;
	[key: string]: (...args: any[]) => void;
};