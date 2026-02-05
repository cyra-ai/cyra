type Model = {
	id: string;
	name: string;
	description: string;
	parameters: string; // 1b, 2b, 3b, 4b, 8b, 13b, 70b, etc.
	limits: {
		rpm: number; // requests per minute
		tpm: number; // tokens per minute
		rpd: number; // requests per day
	};
	contextWindow: number; // context window size in tokens
};

export default Model;