/**
 * Timeout wrapper for async operations
 */

/**
 * Wraps a promise with a timeout
 */
export const withTimeout = async <T>(
	promise: Promise<T>,
	timeoutMs: number,
	timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
	let timeoutId: NodeJS.Timeout | null = null;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`${timeoutMessage} after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	};
};

/**
 * Wraps an async function with a timeout
 */
export const withTimeoutFn = async <T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	timeoutMessage: string = 'Operation timed out'
): Promise<T> => withTimeout(fn(), timeoutMs, timeoutMessage);

/**
 * Wraps an async function with timeout and returns Result type
 */
export const withTimeoutResult = async <T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	timeoutMessage: string = 'Operation timed out'
): Promise<{
	success: boolean;
	data?: T;
	error?: string;
	timedOut?: boolean;
}> => {
	try {
		const data = await withTimeoutFn(fn, timeoutMs, timeoutMessage);
		return { success: true, data };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const timedOut = message.includes('timed out');
		return { success: false, error: message, timedOut };
	};
};
