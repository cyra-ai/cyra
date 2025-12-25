import {
	DatabaseService,
	type ConversationMessage,
	type MessageSummary
} from './DatabaseService.ts';

export class MemoryService {
	private db: DatabaseService;
	private contextWindowSize: number = 20; // Max messages to inject for context
	private summarizationThreshold: number = 100; // Summarize after N messages
	private assistantStreamBuffer: string = ''; // Buffer for streaming assistant messages
	private assistantStreamTimer: NodeJS.Timeout | null = null;
	private readonly STREAM_FLUSH_DELAY = 1000; // Flush buffer after 1 second of inactivity

	constructor(
		contextWindowSize: number = 20,
		summarizationThreshold: number = 100
	) {
		this.db = new DatabaseService();
		this.contextWindowSize = contextWindowSize;
		this.summarizationThreshold = summarizationThreshold;
	};

	/**
	 * Add a user message to persistent storage
	 */
	public addUserMessage(content: string): ConversationMessage {
		return this.db.addMessage('user', content);
	};

	/**
	 * Add an assistant message to persistent storage
	 * Uses a buffer to avoid saving individual streaming chunks
	 */
	public addAssistantMessage(content: string): ConversationMessage {
		// Add to stream buffer
		this.assistantStreamBuffer += content;

		// Clear existing timer
		if (this.assistantStreamTimer) clearTimeout(this.assistantStreamTimer);

		// Set new timer to flush after inactivity
		this.assistantStreamTimer = setTimeout(() => {
			if (this.assistantStreamBuffer.trim()) {
				this.db.addMessage('assistant', this.assistantStreamBuffer.trim());
				this.assistantStreamBuffer = '';
				this.assistantStreamTimer = null;
			};
		}, this.STREAM_FLUSH_DELAY);

		// Return a temporary object (the real save happens on flush)
		return {
			id: -1, // Temporary ID
			role: 'assistant',
			content: this.assistantStreamBuffer,
			timestamp: new Date().toISOString()
		};
	};

	/**
	 * Add an AI thought/reasoning to persistent storage
	 */
	public addThought(content: string): ConversationMessage {
		return this.db.addMessage('thought', content);
	};

	/**
	 * Get the full conversation history for context injection
	 */
	public getConversationHistory(): ConversationMessage[] {
		this.flushAssistantBuffer();
		return this.db.getAllMessages();
	};

	/**
	 * Get recent messages for context (limit to last N)
	 */
	public getRecentContext(limit: number = 20): ConversationMessage[] {
		this.flushAssistantBuffer();
		return this.db.getRecentMessages(limit);
	};

	/**
	 * Get statistics about the conversation
	 */
	public getStats(): {
		totalMessages: number;
		userMessages: number;
		assistantMessages: number;
		thoughts: number;
		} {
		this.flushAssistantBuffer();
		const messages = this.db.getAllMessages();
		return {
			totalMessages: messages.length,
			userMessages: messages.filter((m) => m.role === 'user').length,
			assistantMessages: messages.filter((m) => m.role === 'assistant').length,
			thoughts: messages.filter((m) => m.role === 'thought').length
		};
	};

	/**
	 * Close database connection
	 */
	public close(): void {
		// Flush any remaining buffered assistant message
		this.flushAssistantBuffer();
		this.db.close();
	};

	/**
	 * Force flush the assistant message buffer
	 * Called when closing or before retrieving conversation history
	 */
	private flushAssistantBuffer(): void {
		if (this.assistantStreamTimer) {
			clearTimeout(this.assistantStreamTimer);
			this.assistantStreamTimer = null;
		};

		if (this.assistantStreamBuffer.trim()) {
			this.db.addMessage('assistant', this.assistantStreamBuffer.trim());
			this.assistantStreamBuffer = '';
		};
	};

	/**
	 * Get short-term memory (current session)
	 */
	public getShortTermMemory(): ConversationMessage[] {
		return this.db.getMessagesByMemoryType('short-term');
	};

	/**
	 * Get long-term memory (persistent storage)
	 */
	public getLongTermMemory(): ConversationMessage[] {
		return this.db.getMessagesByMemoryType('long-term');
	};

	/**
	 * Archive old messages to long-term memory when context window is exceeded
	 * Automatically called when message count exceeds threshold
	 */
	public archiveToLongTermMemory(): void {
		const totalMessages = this.db.getMessageCount();

		if (totalMessages > this.summarizationThreshold) {
			// Get messages beyond context window that haven't been archived
			const allMessages = this.db.getAllMessages();
			const archiveThreshold = allMessages.length - this.contextWindowSize;

			if (archiveThreshold > 0) {
				const messagesToArchive = allMessages
					.slice(0, archiveThreshold)
					.map((m) => m.id);
				this.db.moveToLongTermMemory(messagesToArchive);
			};
		};
	};

	/**
	 * Add a summary of message range when context window exceeds limit
	 * Called automatically before archiving
	 */
	public async summarizeMessages(
		startId: number,
		endId: number,
		summaryText: string
	): Promise<MessageSummary> {
		return this.db.addSummary(startId, endId, summaryText);
	};

	/**
	 * Get all summaries in a message range
	 */
	public getSummariesForRange(startId: number, endId: number): MessageSummary[] {
		return this.db.getSummariesInRange(startId, endId);
	};

	/**
	 * Format conversation history for Gemini context injection
	 * Intelligently includes recent messages and summaries of archived content
	 */
	public formatHistoryForContext(): string {
		const recentMessages = this.getRecentContext(this.contextWindowSize);
		const longTermMessages = this.getLongTermMemory();

		let formatted = '';

		// Add long-term memory summaries if they exist
		if (longTermMessages.length > 0) {
			const summaries = this.getSummariesForRange(
				longTermMessages[0].id,
				longTermMessages[longTermMessages.length - 1].id
			);

			if (summaries.length > 0) {
				formatted += '## Long-term Memory (Summaries)\n\n';
				for (const summary of summaries)
					formatted += `[Summary of messages ${summary.start_message_id}-${summary.end_message_id}]\n${summary.summary}\n\n`;
			};
		};

		// Add recent short-term messages
		if (recentMessages.length > 0) {
			formatted += '## Recent Conversation\n\n';
			for (const msg of recentMessages) {
				const role = msg.role === 'thought' ? 'internal_thought' : msg.role;
				formatted += `[${role.toUpperCase()}]\n${msg.content}\n\n`;
			};
		};

		return formatted;
	};
};
