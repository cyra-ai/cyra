import type { LiveSendRealtimeInputParameters } from '@google/genai';

type RealTime = {
	type: 'realTimeInput';
	payload: LiveSendRealtimeInputParameters;
};

type Payload = RealTime;

export default Payload;