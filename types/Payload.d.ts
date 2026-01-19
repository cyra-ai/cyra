type Status = {
	type: 'status',
	payload: {
		status: 'ready' | 'processing' | 'error';
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

type Payload = Status | Audio | Text;

export default Payload;