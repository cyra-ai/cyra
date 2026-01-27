# Architecture

This document describes the overall architecture and design of cyra, including its core components, data flow, and interaction patterns.

**Related:** [Installation Guide](./Installation.md) | [Payload Standard](./Payload.md) | [Introduction](./Introduction.md)

## System Overview

cyra is built on a modular architecture that separates concerns across multiple layers:

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Transport["Client Transport<br/>(Multiple protocols supported)"]
    end

    subgraph Core["Core Services"]
        Session["Session Manager"]
        MCPClients["MCP Clients"]
    end

    subgraph External["External Services"]
        Gemini["Google Gemini API"]
        MCPServers["MCP Servers"]
        FS["Filesystem Server"]
        Weather["Weather Server"]
        Memory["Memory Server"]
        Thinking["Thinking Server"]
    end

    subgraph Support["Support Layer"]
        Config["Configuration"]
        Logger["Logger"]
    end

    Transport -->|Messages| Session
    Session -->|Events & Messages| Transport
    Session -->|Commands| MCPClients
    MCPClients -->|Tool Calls| MCPServers
    Session -->|Live Requests| Gemini
    Gemini -->|Audio Response| Session
    MCPServers --> FS
    MCPServers --> Weather
    MCPServers --> Memory
    MCPServers --> Thinking
    Session -.->|Uses| Config
    Session -.->|Logs| Logger
```

## Core Components

### 1. Server & Transport Layer (`src/servers/`)

The server layer handles communication with clients through multiple transport protocols using a standardized [Payload format](./Payload.md):

**server.ts**
- Express HTTP server setup
- Creates the base server instance for handling client connections

**WebSocket.ts**
- WebSocket transport implementation
- Handles real-time bidirectional communication
- Serializes Session events into Payloads
- Deserializes client input into Session commands
- Message routing and client connection management

**Future Transport Protocols:**
- Socket.io support
- HTTP long-polling
- gRPC
- Custom protocols

All transport implementations must:
1. Convert incoming client data into Session commands
2. Convert Session events into standardized Payloads
3. Send Payloads to clients using their transport protocol

```mermaid
graph LR
    Clients["Clients"]
    Transport["Transport Layer<br/>(Multiple protocols)"]
    Serializer["Payload<br/>Serialization"]
    Session["Session Manager"]

    Clients -->|Protocol-specific| Transport
    Transport -->|Normalize| Serializer
    Serializer -->|Command| Session
    Session -->|Event| Serializer
    Serializer -->|Payload| Transport
    Transport -->|Protocol-specific| Clients
```

### 2. Session Management (`src/services/Session.ts`)

The Session class is the heart of cyra's functionality. It manages:

- **Connection Lifecycle**: Establishes and maintains connections to Google's Gemini API
- **Audio Handling**: Manages real-time audio input/output
- **Tool Execution**: Coordinates with MCP clients to execute available tools
- **Event Management**: Emits typed events for session state changes

**Key Features:**
- Loads system prompts from `prompts/system_prompt.md`
- Integrates MCP tools into Gemini's tool set
- Supports real-time audio transcription
- Includes affective dialogue and proactive audio features
- Manages multiple concurrent sessions (stored in Set)

### 3. MCP Integration (`src/services/MCPClients.ts` & `src/config/mcp.ts`)

The Model Context Protocol (MCP) integration provides extensible tool capabilities:

**Configuration** (`src/config/mcp.ts`):
- Defines MCP server configurations
- Currently loads 4 standard MCP servers via stdio transport

**Available MCP Servers:**

```mermaid
graph TB
    MCP["MCP Client Manager"]
    
    subgraph Servers["Connected MCP Servers"]
        FS["Filesystem Server<br/>Sandbox: ./sandbox"]
        Weather["Weather Server<br/>Real-time weather data"]
        Memory["Memory Server<br/>Persistent memory store"]
        Thinking["Sequential Thinking<br/>Extended reasoning"]
    end

    MCP -->|Manages| FS
    MCP -->|Manages| Weather
    MCP -->|Manages| Memory
    MCP -->|Manages| Thinking
```

**MCP Client Manager** (`src/services/MCPClients.ts`):
- Initializes all configured MCP servers
- Establishes stdio transport connections
- Lists available tools from each server
- Converts MCP tools to Gemini-compatible tools

### 4. Configuration Layer (`src/config/`)

**index.ts**
- Centralized configuration management
- Loads environment variables and system settings
- Provides configuration access across the application

**mcp.ts**
- MCP server configurations (covered above)

### 5. Utility Layer (`src/utils/`)

**logger.ts**
- Structured logging with color and formatting
- Multiple log levels and output types
- Hierarchical logging for complex operations

## Data Flow

### Session Initialization Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Session as Session Manager
    participant MCP as MCP Clients
    participant Gemini as Gemini API

    App->>Session: new Session()
    Session->>Session: Initialize GoogleGenAI client
    App->>Session: connect()
    Session->>MCP: Load tools from MCP clients
    MCP-->>Session: Available tools
    Session->>Gemini: Establish live connection<br/>with tools + system prompt
    Gemini-->>Session: Connection ready (setupComplete)
    Session->>Session: emit('ready')
    Session-->>App: Ready for interaction
```

### Interaction Flow

```mermaid
sequenceDiagram
    participant User as User Input
    participant Transport as Transport Layer
    participant Payload as Payload Handler
    participant Session as Session
    participant Gemini as Gemini API
    participant MCP as MCP Tools

    User->>Transport: Send input (protocol-specific)
    Transport->>Payload: Normalize to Payload
    Payload->>Session: Process input
    Session->>Gemini: Process input
    alt Tool Execution Needed
        Gemini->>Session: Tool call request
        Session->>MCP: Execute tool
        MCP-->>Session: Tool result
        Session->>Gemini: Send tool result
    end
    Gemini->>Session: Generate response
    Session->>Payload: Create response Payload(s)
    Payload->>Transport: Serialize response
    Transport->>User: Send output (protocol-specific)
```

**Payload Types Used:**
- `status` - Session ready/processing state
- `audio` - Audio response data
- `text` - Text response data
- `transcription` - Transcribed input/output
- `thought` - Internal reasoning
- `turn_complete` - Interaction complete
- `error` - Error conditions

See [Payload Standard](./Payload.md) for detailed message types.

### Tool Execution Flow

```mermaid
graph LR
    User["User Request"]
    Gemini["Gemini API"]
    Tool["Tool Selection"]
    MCP["MCP Server"]
    FS["Execute Tool<br/>Filesystem/Weather/etc"]
    Result["Return Result"]
    Response["Generate Response"]

    User -->|Message| Gemini
    Gemini -->|Decides| Tool
    Tool -->|Calls| MCP
    MCP -->|Executes| FS
    FS -->|Returns| Result
    Result -->|Sends back| Gemini
    Gemini -->|Synthesizes| Response
```

## Event System

Session extends TypedEmitter and emits the following events:

- **ready**: Session is connected and ready for interaction
- **close**: Session was closed (with optional reason)
- **error**: An error occurred during the session
- **message**: A message was received (for internal handling)

See [types/SessionEvents.d.ts](../types/SessionEvents.d.ts) for the complete event type definitions.

## Storage & Persistence

- **Memory**: `sandbox/memory.jsonl` - Persistent memory store managed by MCP memory server
- **System Prompt**: `prompts/system_prompt.md` - System instructions for Gemini
- **Configuration**: Environment variables and config files
- **Payload Definitions**: [types/Payload.d.ts](../types/Payload.d.ts) - Standardized message format for all protocols

## Technology Stack

```mermaid
graph TB
    subgraph Runtime["Runtime"]
        Node["Node.js 18+"]
        TS["TypeScript"]
    end

    subgraph Framework["Framework & Libraries"]
        Express["Express.js<br/>HTTP Server"]
        WS["ws<br/>WebSocket"]
        ADK["@google/adk<br/>Audio"]
        GenAI["@google/genai<br/>Gemini API"]
    end

    subgraph Protocol["Protocols"]
        MCP["Model Context Protocol<br/>@modelcontextprotocol/sdk"]
        HTTP["HTTP/WebSocket"]
    end

    subgraph Tools["Tool Integration"]
        FS["Filesystem"]
        Weather["Weather"]
        Memory["Persistent Memory"]
        Thinking["Sequential Thinking"]
    end

    Node -->|Runs| TS
    TS -->|Uses| Express
    TS -->|Uses| WS
    TS -->|Uses| GenAI
    TS -->|Uses| ADK
    Express -->|Serves| HTTP
    WS -->|Implements| HTTP
    GenAI -->|Communicates via| MCP
    MCP -->|Manages| Tools
```

## Directory Structure

```
src/
├── index.ts                 # Entry point - starts server
├── config/
│   ├── index.ts            # Configuration management
│   └── mcp.ts              # MCP server configurations
├── servers/
│   ├── server.ts           # Express HTTP server
│   └── WebSocket.ts        # WebSocket implementation
├── services/
│   ├── Session.ts          # Core session management
│   ├── MCPClients.ts       # MCP client initialization
│   └── spawns/             # Process spawning utilities
├── utils/
│   └── logger.ts           # Logging utilities
└── types/
    ├── Payload.d.ts        # Message payload types
    └── SessionEvents.d.ts  # Session event types
```

## Extension Points

### Adding New MCP Servers

1. Add server configuration to `src/config/mcp.ts`
2. Define the stdio transport parameters
3. MCP clients will automatically connect and discover tools

### Custom Tools

Tools are exposed through MCP servers. Any MCP-compatible server can be added to provide new capabilities.

### System Prompt Customization

Modify `prompts/system_prompt.md` to change Gemini's behavior and instructions.

## Security Considerations

- Filesystem access is sandboxed to `sandbox/` directory
- Transport connections should be restricted based on your deployment
- Tool execution is mediated through MCP, allowing for granular control

## Related Documentation

- **[Introduction](./Introduction.md)** - Feature overview and getting started
- **[Installation Guide](./Installation.md)** - How to set up and run cyra
- **[Payload Standard](./Payload.md)** - Details on the message format used in interactions
