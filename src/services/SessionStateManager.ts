/**
 * Session state management for crash recovery
 */

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

export interface SessionState {
	timestamp: string;
	toolsLoaded: string[];
	messageCount: number;
	lastActivity: string;
};

export class SessionStateManager {
	private stateFile: string;

	constructor(tmpDir: string) {
		this.stateFile = path.join(tmpDir, 'session_state.json');
	};

	/**
	 * Save current session state
	 */
	public async saveState(state: SessionState): Promise<void> {
		try {
			const dir = path.dirname(this.stateFile);
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

			await fsp.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
		} catch (error) {
			console.error('Failed to save session state:', error);
		};
	};

	/**
	 * Load previous session state if it exists
	 */
	public async loadState(): Promise<SessionState | null> {
		try {
			if (!fs.existsSync(this.stateFile)) return null;

			const content = await fsp.readFile(this.stateFile, 'utf-8');
			return JSON.parse(content) as SessionState;
		} catch (error) {
			console.error('Failed to load session state:', error);
			return null;
		};
	};

	/**
	 * Clear session state (called on successful shutdown)
	 */
	public async clearState(): Promise<void> {
		try {
			if (fs.existsSync(this.stateFile)) await fsp.unlink(this.stateFile);
		} catch (error) {
			console.error('Failed to clear session state:', error);
		};
	};

	/**
	 * Check if session was interrupted (state file exists but not cleared)
	 */
	public async wasInterrupted(): Promise<boolean> {
		return fs.existsSync(this.stateFile);
	};
};
