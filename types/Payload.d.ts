type Audio = {
	type: 'audio';
	payload: {
		data: string; // Base64-encoded audio data
	};
};

type Payload = Audio;

export default Payload;