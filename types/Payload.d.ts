export interface PayloadMap {
	status: { status: 'ready' | 'processing' };
	error: { code: number; message: string };
	audio: { audio: string };
	text: { text: string };
	thought: { thought: string };
	transcription: {
		transcription: string;
		type: 'input' | 'output';
		finished?: boolean;
	};
	turn_complete: Record<string, never>;
	interrupted: Record<string, never>;
}

type Payload<K extends keyof PayloadMap = keyof PayloadMap> = {
	[T in K]: {
		type: T;
		payload: PayloadMap[T];
	};
}[K];

export default Payload;
