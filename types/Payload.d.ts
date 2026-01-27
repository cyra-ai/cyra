// Client-to-Server Payloads
interface ClientPayloadMap {
	audio: { audio: string };
	text: { text: string };
};

// Server-to-Client Payloads
interface ServerPayloadMap {
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
	function_call: {};
};

// Combined for internal use
export interface PayloadMap extends ClientPayloadMap, ServerPayloadMap { }

type Payload<K extends keyof PayloadMap = keyof PayloadMap> = {
	[T in K]: {
		type: T;
		payload: PayloadMap[T];
	};
}[K];

export type ClientPayload = Payload<keyof ClientPayloadMap>;
export type ServerPayload = Payload<keyof ServerPayloadMap>;

export default Payload;
