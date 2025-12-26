import type { FunctionDeclaration } from '@google/genai';

/**
 * Extended tool interface combining Gemini's FunctionDeclaration with execute method
 * Using @google/genai's FunctionDeclaration type as the base
 */
export interface CyraTool extends FunctionDeclaration {
	/**
	 * Execute the tool with provided arguments
	 * Returns either output or error
	 */
	execute: (
		args?: Record<string, unknown>
	) => Promise<{ output: string } | { error: string }>;

	/**
	 * Whether this tool is required for core functionality
	 * If false, tool failures will be handled gracefully
	 * @default true
	 */
	required?: boolean;

	/**
	 * Timeout in milliseconds for this specific tool
	 * If not set, uses default from config
	 */
	timeoutMs?: number;
}
