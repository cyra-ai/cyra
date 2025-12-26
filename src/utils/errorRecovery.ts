/**
 * Error recovery strategy for different error types
 */

export type ErrorType =
	| 'network'
	| 'permission'
	| 'timeout'
	| 'not_found'
	| 'validation'
	| 'unknown';

export interface ErrorRecoveryStrategy {
	shouldRetry: boolean;
	userMessage: string;
	shouldContinue: boolean;
	fallbackAction?: string;
};

/**
 * Classify error by type
 */
export const classifyError = (error: Error | unknown): ErrorType => {
	const message = error instanceof Error ? error.message : String(error);
	const msgLower = message.toLowerCase();

	if (
		msgLower.includes('timeout') ||
		msgLower.includes('timed out') ||
		msgLower.includes('no response')
	)
		return 'timeout';

	if (
		msgLower.includes('network') ||
		msgLower.includes('econnrefused') ||
		msgLower.includes('enotfound') ||
		msgLower.includes('socket')
	)
		return 'network';

	if (
		msgLower.includes('permission') ||
		msgLower.includes('denied') ||
		msgLower.includes('eacces') ||
		msgLower.includes('forbidden')
	)
		return 'permission';

	if (
		msgLower.includes('not found') ||
		msgLower.includes('enoent') ||
		msgLower.includes('404')
	)
		return 'not_found';

	if (
		msgLower.includes('invalid') ||
		msgLower.includes('validation') ||
		msgLower.includes('schema')
	)
		return 'validation';

	return 'unknown';
};

/**
 * Determine recovery strategy based on error type
 */
export const getRecoveryStrategy = (
	errorType: ErrorType,
	toolName: string,
	isRequired: boolean = true
): ErrorRecoveryStrategy => {
	switch (errorType) {
	case 'network':
		return {
			shouldRetry: true,
			userMessage: `Network error accessing ${toolName}. I'll try again in a moment.`,
			shouldContinue: !isRequired,
			fallbackAction: 'retry'
		};

	case 'timeout':
		return {
			shouldRetry: false,
			userMessage: `The ${toolName} operation timed out. It may have completed anyway. Would you like me to try a different approach?`,
			shouldContinue: !isRequired,
			fallbackAction: 'alternative'
		};

	case 'permission':
		return {
			shouldRetry: false,
			userMessage: `I don't have permission to execute ${toolName}. Please check your access rights.`,
			shouldContinue: !isRequired,
			fallbackAction: isRequired ? undefined : 'skip'
		};

	case 'not_found':
		return {
			shouldRetry: false,
			userMessage: `${toolName} couldn't find the requested resource. Please verify the path or name.`,
			shouldContinue: !isRequired,
			fallbackAction: isRequired ? undefined : 'skip'
		};

	case 'validation':
		return {
			shouldRetry: false,
			userMessage: `Invalid input for ${toolName}. ${isRequired ? 'This is a required tool, so I cannot continue.' : 'I can try a different approach.'}`,
			shouldContinue: !isRequired,
			fallbackAction: isRequired ? undefined : 'alternative'
		};

	case 'unknown':
	default:
		return {
			shouldRetry: true,
			userMessage: `An unexpected error occurred with ${toolName}. Let me try again.`,
			shouldContinue: !isRequired,
			fallbackAction: 'retry'
		};
	}
};

/**
 * Format error for user-friendly display
 */
export const formatErrorForUser = (
	error: Error | unknown,
	toolName: string,
	isRequired: boolean = true
): { message: string; shouldContinue: boolean } => {
	const errorType = classifyError(error);
	const strategy = getRecoveryStrategy(errorType, toolName, isRequired);

	return {
		message: strategy.userMessage,
		shouldContinue: strategy.shouldContinue
	};
};
