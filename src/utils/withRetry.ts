/**
 * Retry wrapper with exponential backoff
 */

import type { RetryPolicy } from '../../types/utils.d.ts';

/**
 * Wraps an async function with retry logic using exponential backoff
 */
export const withRetry = async <T>(
	fn: () => Promise<T>,
	policy: RetryPolicy,
	context: string = 'operation'
): Promise<T> => {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (attempt === policy.maxAttempts) {
				// Last attempt failed, throw the error
				console.error(
					`${context} failed after ${policy.maxAttempts} attempts:`,
					lastError.message
				);
				throw lastError;
			};

			// Calculate delay with exponential backoff
			const delayMs =
				policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);

			console.warn(
				`${context} failed (attempt ${attempt}/${policy.maxAttempts}), retrying in ${delayMs}ms:`,
				lastError.message
			);

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		};
	};

	// Should never reach here, but satisfy TypeScript
	throw (
		lastError ||
		new Error(`${context} failed after ${policy.maxAttempts} attempts`)
	);
};

/**
 * Wraps a function with retry logic and returns Result type
 */
export const withRetryResult = async <T>(
	fn: () => Promise<T>,
	policy: RetryPolicy,
	context: string = 'operation'
): Promise<{ success: boolean; data?: T; error?: string }> => {
	try {
		const data = await withRetry(fn, policy, context);
		return { success: true, data };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { success: false, error: message };
	};
};
