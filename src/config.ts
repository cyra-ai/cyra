import dotenv from 'dotenv';
dotenv.config();

export const config = {
	google: {
		apiKey: process.env.GOOGLE_API_KEY || '',
		model:
			process.env.GEMINI_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025'
	},
	audio: {
		mic: {
			rate: process.env.MIC_RATE || '16000',
			bitwidth: process.env.MIC_BITWIDTH || '16',
			channels: process.env.MIC_CHANNELS || '1',
			device: process.env.MIC_DEVICE || 'plughw:2,0' // Default to the one that was working, but now configurable
		},
		speaker: {
			channels: parseInt(process.env.SPEAKER_CHANNELS || '1', 10),
			bitDepth: parseInt(process.env.SPEAKER_BIT_DEPTH || '16', 10),
			sampleRate: parseInt(process.env.SPEAKER_SAMPLE_RATE || '24000', 10)
		}
	},
	system: {
		functionsPath: process.env.FUNCTIONS_PATH || 'src/functions',
		tmpDir: process.env.TMP_DIR || 'tmp'
	}
};
