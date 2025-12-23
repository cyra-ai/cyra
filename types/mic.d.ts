declare module 'mic' {
	export interface MicOptions {
		endian?: 'big' | 'little';
		bitwidth?: string | number;
		encoding?: 'signed-integer' | 'unsigned-integer';
		rate?: string | number;
		channels?: string | number;
		device?: string;
		exitOnSilence?: number;
		debug?: boolean;
		fileType?: string;
	}

	export interface MicInstance {
		getAudioStream(): NodeJS.ReadableStream;
		start(): void;
		stop(): void;
		pause(): void;
		resume(): void;
	}

	function mic(options?: MicOptions): MicInstance;
	export default mic;
}
