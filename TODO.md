# cyra Development Roadmap

Priority improvements for transitioning from prototype to production-grade agentic AI assistant.

---

## 1. Conversation Memory

### 1.1 Session Persistence with SQLite
- [ ] Set up SQLite database infrastructure
  - [ ] Install dependencies: `better-sqlite3` (sync) or `sqlite3` (async)
  - [ ] Create database schema file: `db/schema.sql`
  - [ ] Create `src/services/DatabaseService.ts` to manage SQLite connection
  - [ ] Auto-initialize database on first run (create tables if they don't exist)
- [ ] Create database schema
  - [ ] `sessions` table: `id (PRIMARY KEY), createdAt, updatedAt, title`
  - [ ] `messages` table: `id (PRIMARY KEY), sessionId (FK), role, content, timestamp, metadata`
  - [ ] Add indexes on `sessionId` and `timestamp` for fast queries
- [ ] Create `MemoryService` class to manage conversation history
  - [ ] Implement CRUD operations for sessions and messages
  - [ ] Store message pairs: `{ role: 'user'|'assistant', content: string, timestamp }`
  - [ ] Auto-save messages after each user-AI exchange
- [ ] Capture full conversation transcript (currently only AI thoughts are logged)
  - [ ] Transcribe user audio input to text (via Gemini's transcription or separate API)
  - [ ] Extract/capture AI's spoken responses from audio output
  - [ ] Insert into `messages` table with role and timestamp
- [ ] Extend `GeminiService` to load/inject previous messages
  - [ ] Add `loadSessionHistory(sessionId)` method
  - [ ] Query SQLite for previous messages
  - [ ] Format previous messages for Gemini context injection
  - [ ] Include context window size limits (e.g., last 10 messages to stay within token limits)
- [ ] Create session management CLI commands
  - [ ] Generate unique session IDs: `${Date.now()}`
  - [ ] Resume conversation: `npm run dev -- --session <sessionId>`
  - [ ] List sessions: `npm run dev -- --list-sessions`
  - [ ] Show session details: `npm run dev -- --session-info <sessionId>`
  - [ ] Delete old sessions: `npm run dev -- --delete-session <sessionId>`

### 1.2 Semantic Search & Retrieval
- [ ] Integrate vector embeddings for conversation search
  - [ ] Research lightweight embeddings (local or API-based)
  - [ ] Store embeddings alongside message history
- [ ] Implement `searchMemory(query)` for retrieval
  - [ ] Find relevant past interactions
  - [ ] Include in system prompt for context

### 1.3 Memory Types
- [ ] Implement short-term memory (current session)
- [ ] Implement long-term memory (persistent storage)
- [ ] Add memory summarization for large conversations
  - [ ] Summarize old messages when context window exceeds limit

---

## 2. Error Handling & Resilience

### 2.1 Retry Logic
- [ ] Create `RetryPolicy` interface
  - [ ] Exponential backoff strategy
  - [ ] Max retry attempts configuration
  - [ ] Backoff delay customization
- [ ] Wrap tool execution with retry wrapper
  - [ ] Create `withRetry()` utility function
  - [ ] Apply to all tool invocations in `GeminiService.handleToolCalls()`
- [ ] Add retry configuration to `config.ts`
  ```typescript
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2
  }
  ```

### 2.2 Timeout Handling
- [ ] Create `TimeoutError` exception class
- [ ] Add timeout wrapper for tool execution
  - [ ] Default timeout: 30 seconds per tool
  - [ ] Configurable per tool via tool metadata
- [ ] Implement timeout for audio operations
  - [ ] Gracefully handle silent microphone periods
- [ ] Add timeout configuration to `config.ts`

### 2.3 Error Recovery
- [ ] Implement tool execution error catching in `handleToolCalls()`
  - [ ] Log detailed error information
  - [ ] Notify Gemini of failure with error context
  - [ ] Provide user-friendly error messages
- [ ] Add session recovery on crash
  - [ ] Save session state before potential failure points
  - [ ] Offer to resume on restart
- [ ] Create `ErrorRecoveryStrategy` for different error types
  - [ ] Network errors: retry
  - [ ] Permission errors: skip tool, inform user
  - [ ] Timeout: abort tool, try alternative

### 2.4 Graceful Degradation
- [ ] Make individual tools optional
  - [ ] Mark tools as `required` vs `optional`
  - [ ] Continue if optional tools fail
- [ ] Implement fallback responses when tool fails
  - [ ] "I tried to execute X, but it failed. Would you like me to try something else?"

---

## 3. Hot Reload

### 3.1 Fix Cache Busting
- [ ] Investigate and fix query parameter cache busting in `ToolManager.loadTools()`
  - [ ] Current: `file://${modulePath}?update=${Date.now()}`
  - [ ] May not work with ES modules; test alternatives
  - [ ] Consider using `delete require.cache[modulePath]`

### 3.2 Tool Validation
- [ ] Create `validateTool()` function
  - [ ] Check tool has required properties (name, description, execute)
  - [ ] Validate parameter schema
  - [ ] Test execute function with mock args
- [ ] Run validation before adding tool to registry
  - [ ] Log warnings for invalid tools instead of crashing

### 3.3 Safe Reloading
- [ ] Prevent tool reloading mid-execution
  - [ ] Flag when a tool is currently executing
  - [ ] Queue reload requests
- [ ] Implement graceful session reconnection
  - [ ] Close old session before reload
  - [ ] Create new session with updated tools
  - [ ] Notify user: "Tools updated, session restarted"

### 3.4 Development CLI Tools
- [ ] Add `npm run tool:test <tool-name>` command
  - [ ] Load specific tool and test with sample args
  - [ ] Show execution result and timing
- [ ] Add `npm run tool:list` command
  - [ ] Display all loaded tools with descriptions
  - [ ] Show parameter schemas
- [ ] Add `npm run tool:watch` for development mode
  - [ ] Auto-reload and test tools on save

---

## 4. Testing Support

### 4.1 Unit Tests
- [ ] Set up testing framework (Jest or Vitest)
  - [ ] Install dependencies: `jest`, `@types/jest`, `ts-jest`
  - [ ] Create `jest.config.ts`
  - [ ] Add test script: `npm test`
- [ ] Create test files for each tool
  - [ ] `src/functions/__tests__/execute.test.ts`
  - [ ] `src/functions/__tests__/file_operations.test.ts`
  - [ ] `src/functions/__tests__/inspect_environment.test.ts`
  - [ ] `src/functions/__tests__/read_repository.test.ts`
- [ ] Write tool tests covering:
  - [ ] Valid inputs
  - [ ] Invalid inputs (missing args, wrong types)
  - [ ] Error conditions
  - [ ] Edge cases (empty files, large files, etc.)

### 4.2 Service Tests
- [ ] Create tests for service classes
  - [ ] `src/services/__tests__/AudioService.test.ts`
  - [ ] `src/services/__tests__/ToolManager.test.ts`
  - [ ] `src/services/__tests__/GeminiService.test.ts`
- [ ] Mock external dependencies
  - [ ] Mock `@google/genai` client
  - [ ] Mock `mic` and `speaker` modules
  - [ ] Mock file system operations

### 4.3 Integration Tests
- [ ] Create integration test suite
  - [ ] Test tool execution with mocked Gemini
  - [ ] Test hot reload flow
  - [ ] Test error recovery
- [ ] Add test script: `npm run test:integration`

### 4.4 Mock Utilities
- [ ] Create `__mocks__` directory with:
  - [ ] Mock Gemini client and responses
  - [ ] Mock AudioService
  - [ ] Mock file system
- [ ] Build test helpers
  - [ ] Factory functions for test data
  - [ ] Assertion helpers

### 4.5 Documentation
- [ ] Create `TESTING.md` guide
  - [ ] How to run tests
  - [ ] How to write new tests
  - [ ] Testing best practices for the project

---

## 5. Type Safety

### 5.1 Remove `any` Types
- [x] Audit `GeminiService.ts` for `any` usage
  - [x] Remove `any` from `handleMessage()` parameter
  - [x] Remove `any` from `handleToolCalls()` parameter
  - [x] Create proper types for Gemini message/toolCall objects
- [x] Remove eslint disable comments
  - [x] Remove `@typescript-eslint/no-explicit-any` disable
  - [x] Remove `@typescript-eslint/explicit-module-boundary-types` disable

### 5.2 Gemini API Types
- [x] Extract Gemini types into `types/gemini.d.ts`
  - [x] Define `GeminiMessagePart` type
  - [x] Define `GeminiModelTurn` type
  - [x] Define `GeminiServerContent` type
  - [x] Define `GeminiFunctionCall` type
  - [x] Define `GeminiToolCall` type
  - [x] Define `GeminiMessage` type
  - [x] Define `ConversationEntry` type
  - [x] Define `AudioDataCallback` type
- [x] Use these types throughout `GeminiService`

### 5.3 Configuration Validation
- [x] Create `ConfigSchema` with validation in `config.ts`
  - [x] Define interface types for all config sections
  - [x] Add validation function for environment variables
  - [x] Validate numeric configs (sample rate, bit depth, channels)
  - [x] Throw helpful error if required values missing
  - [x] Export `AppConfig` interface for type safety
- [x] Add type guards for environment variables
  - [x] Ensure `GOOGLE_API_KEY` is present
  - [x] Validate numeric configs before converting

### 5.4 tsconfig.json Strictness
- [x] Increase TypeScript strictness
  - [x] Enable `strictNullChecks: true`
  - [x] Enable `noUnusedLocals: true`
  - [x] Enable `noImplicitReturns: true`
  - [x] Verify `strict: true` and `noImplicitAny: true` already enabled

### 5.5 Utility Types
- [x] Create `types/utils.d.ts` with utility types
  - [x] Define `Success<T>` type
  - [x] Define `ErrorResult` type
  - [x] Define `Result<T>` union type
  - [x] Define `RetryPolicy` interface
  - [x] Define `TimeoutConfig` interface
  - [x] Define `ErrorHandlingConfig` interface

### 5.6 Generics & Interfaces (In Progress)
- [ ] Create generic types for common patterns
  - [ ] Use `Result<T>` type for tool execution responses
  - [ ] Create `AsyncFunction<Args, Returns>` for tool execution
- [ ] Define clear interfaces
  - [ ] Review `CyraTool` interface in `types/index.d.ts`
  - [ ] Create `ServiceInterface` base for service classes
- [ ] Update tool files to use `Result<T>` pattern
  - [ ] Update `execute.ts` to return `Result<string>`
  - [ ] Update `file_operations.ts` to return `Result<string>`
  - [ ] Update `inspect_environment.ts` to return `Result<string>`
  - [ ] Update `read_repository.ts` to return `Result<string>`

---

## Implementation Priority

### Phase 1 (Weeks 1-2): Foundations
1. Fix Hot Reload issues
2. Add Conversation Memory (basic file-based)
3. Implement Error Handling basics (try/catch, logging)

### Phase 2 (Weeks 3-4): Quality
1. Remove `any` types
2. Add unit tests for tools
3. Implement retry logic

### Phase 3 (Weeks 5-6): Robustness
1. Advanced error recovery
2. Integration tests
3. Configuration validation

### Phase 4 (Weeks 7+): Polish
1. Semantic memory search
2. Advanced testing (E2E)
3. Performance optimization

---

## Tracking

Use this format to track progress:
```markdown
### 1.1 Session Persistence
- [x] Create MemoryService class
- [ ] Implement JSON-based persistence
- [ ] Extend GeminiService
```

Update completed items to `[x]` as you finish them.
