type Status = {
	type: 'status',
	payload: {
		status: 'ready' | 'processing';
	}
};

type Error = {
	type: 'error',
	payload: {
		code: number;
		message: string;
	}
};

type Audio = {
	type: 'audio';
	payload: {
		audio: string; // Base64-encoded audio data
	};
};

type Text = {
	type: 'text';
	payload: {
		text: string; // Text data
	};
};

type Thought = {
	type: 'thought';
	payload: {
		thought: string; // Thought data
	};
};

type Transcription = {
	type: 'transcription';
	payload: {
		transcription: string; // Transcription text
		type: 'input' | 'output';
		finished?: boolean;
	};
};

type TurnComplete = {
	type: 'turn_complete';
	payload: {};
};

type Interrupted = {
	type: 'interrupted';
	payload: {};
};

type Payload = Status | Error | Audio | Text | Thought | Transcription | TurnComplete | Interrupted;
export default Payload;