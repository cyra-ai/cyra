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

type Payload = Status | Error | Audio | Text | Thought;

export default Payload;