import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface ConversationMessage {
	id: number;
	role: 'user' | 'assistant' | 'system' | 'thought';
	content: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
	memory_type?: 'short-term' | 'long-term';
	is_summarized?: number;
}

export interface MessageSummary {
	id: number;
	start_message_id: number;
	end_message_id: number;
	summary: string;
	timestamp: string;
}

export class DatabaseService {
	private db: Database.Database;
	private dbPath: string;
	private schemaPath: string;

	constructor(dbDir: string = 'db', dbFileName: string = 'conversation.db') {
		this.dbPath = path.join(process.cwd(), dbDir, dbFileName);
		this.schemaPath = path.join(process.cwd(), dbDir, 'schema.sql');

		// Ensure db directory exists
		const dir = path.dirname(this.dbPath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

		// Initialize database
		this.db = new Database(this.dbPath);
		this.db.pragma('journal_mode = WAL');
		this.initializeSchema();
	};

	private initializeSchema(): void {
		try {
			const schema = fs.readFileSync(this.schemaPath, 'utf-8');
			this.db.exec(schema);
		} catch (err) {
			console.error('Error initializing database schema:', err);
			throw err;
		};
	};

	/**
	 * Add a message to the persistent conversation
	 */
	public addMessage(
		role: 'user' | 'assistant' | 'system' | 'thought',
		content: string,
		metadata?: Record<string, unknown>,
		memory_type: 'short-term' | 'long-term' = 'short-term'
	): ConversationMessage {
		const timestamp = new Date().toISOString();
		const stmt = this.db.prepare(`
      INSERT INTO messages (role, content, timestamp, metadata, memory_type)
      VALUES (?, ?, ?, ?, ?)
    `);
		const info = stmt.run(
			role,
			content,
			timestamp,
			metadata ? JSON.stringify(metadata) : null,
			memory_type
		);

		return {
			id: info.lastInsertRowid as number,
			role,
			content,
			timestamp,
			metadata,
			memory_type
		};
	};

	/**
	 * Get all messages in the conversation
	 */
	public getAllMessages(): ConversationMessage[] {
		const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp, metadata FROM messages
      ORDER BY timestamp ASC
    `);
		const messages = stmt.all().map(this.parseMessage);
		return this.mergeConsecutiveMessages(messages);
	};

	/**
	 * Get the last N messages (most recent first)
	 */
	public getRecentMessages(limit: number = 10): ConversationMessage[] {
		const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp, metadata FROM messages
      ORDER BY timestamp DESC
      LIMIT ?
    `);
		const messages = stmt.all(limit).reverse().map(this.parseMessage);
		return this.mergeConsecutiveMessages(messages);
	};

	/**
	 * Get messages of a specific role
	 */
	public getMessagesByRole(
		role: 'user' | 'assistant' | 'system' | 'thought'
	): ConversationMessage[] {
		const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp, metadata FROM messages
      WHERE role = ?
      ORDER BY timestamp ASC
    `);
		const messages = stmt.all(role).map(this.parseMessage);
		return this.mergeConsecutiveMessages(messages);
	};

	/**
	 * Clear all messages (start fresh)
	 */
	public clearMessages(): void {
		const stmt = this.db.prepare('DELETE FROM messages');
		stmt.run();
	};

	/**
	 * Get message count
	 */
	public getMessageCount(): number {
		const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages');
		const result = stmt.get() as { count: number };
		return result.count;
	};

	/**
	 * Get messages by memory type
	 */
	public getMessagesByMemoryType(
		memory_type: 'short-term' | 'long-term'
	): ConversationMessage[] {
		const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp, metadata, memory_type, is_summarized
      FROM messages
      WHERE memory_type = ?
      ORDER BY timestamp ASC
    `);
		const messages = stmt.all(memory_type).map(this.parseMessage);
		return this.mergeConsecutiveMessages(messages);
	};

	/**
	 * Move messages to long-term memory
	 */
	public moveToLongTermMemory(messageIds: number[]): void {
		const placeholders = messageIds.map(() => '?').join(',');
		const stmt = this.db.prepare(`
      UPDATE messages
      SET memory_type = 'long-term'
      WHERE id IN (${placeholders})
    `);
		stmt.run(...messageIds);
	};

	/**
	 * Add a message summary
	 */
	public addSummary(
		start_message_id: number,
		end_message_id: number,
		summary: string
	): MessageSummary {
		const timestamp = new Date().toISOString();
		const stmt = this.db.prepare(`
      INSERT INTO message_summaries (start_message_id, end_message_id, summary, timestamp)
      VALUES (?, ?, ?, ?)
    `);
		const info = stmt.run(
			start_message_id,
			end_message_id,
			summary,
			timestamp
		);

		// Mark messages as summarized
		const updateStmt = this.db.prepare(`
      UPDATE messages
      SET is_summarized = 1
      WHERE id >= ? AND id <= ?
    `);
		updateStmt.run(start_message_id, end_message_id);

		return {
			id: info.lastInsertRowid as number,
			start_message_id,
			end_message_id,
			summary,
			timestamp
		};
	};

	/**
	 * Get summaries in a message range
	 */
	public getSummariesInRange(
		startId: number,
		endId: number
	): MessageSummary[] {
		const stmt = this.db.prepare(`
      SELECT id, start_message_id, end_message_id, summary, timestamp
      FROM message_summaries
      WHERE start_message_id >= ? AND end_message_id <= ?
      ORDER BY timestamp DESC
    `);
		return stmt.all(startId, endId) as MessageSummary[];
	};

	/**
	 * Close the database connection
	 */
	public close(): void {
		this.db.close();
	};

	/* eslint-disable @typescript-eslint/no-explicit-any */
	private parseMessage(msg: any): ConversationMessage {
		return {
			...msg,
			metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined
		};
	};

	/**
	 * Merge consecutive messages from the same role within a time threshold
	 * @param messages Array of messages to merge
	 * @param timeThresholdMs Merge messages within this many milliseconds (default: 30000 = 30 seconds)
	 */
	private mergeConsecutiveMessages(
		messages: ConversationMessage[],
		timeThresholdMs: number = 30000
	): ConversationMessage[] {
		if (messages.length === 0) return messages;

		const merged: ConversationMessage[] = [];
		let currentGroup = messages[0];

		for (let i = 1; i < messages.length; i++) {
			const current = messages[i];
			const timeDiff = new Date(current.timestamp).getTime() -
				new Date(currentGroup.timestamp).getTime();

			// If same role and within time threshold, merge
			if (current.role === currentGroup.role && timeDiff <= timeThresholdMs)
				currentGroup = {
					...currentGroup,
					content: `${currentGroup.content}\n\n${current.content}`
				};
			else {
				// Different role or time threshold exceeded, save and start new group
				merged.push(currentGroup);
				currentGroup = current;
			};
		};

		// Don't forget the last group
		merged.push(currentGroup);

		return merged;
	};
};
