import dotenv from 'dotenv';

dotenv.config();

interface SystemConfig {
	port: number;
};

export interface AppConfig {
	system: SystemConfig;
};

/**
 * Validates and returns application configuration
 * Throws error if required values are missing or invalid
 */
const validateConfig = (): AppConfig => {
	const port = parseInt(process.env.PORT || '3000', 10);

	// Validate numeric values
	if (isNaN(port) || port < 1000)
		throw new Error('PORT must be a positive integer >= 1000');

	return {
		system: {
			port
		}
	};
};

export const config = validateConfig();