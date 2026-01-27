# Installation Guide

This guide will walk you through setting up cyra for either development or production deployment.

## Prerequisites

Before installing cyra, ensure you have:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js (or use [yarn](https://yarnpkg.com/) as an alternative)
- **Git** - For cloning the repository

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/cyra-ai/cyra.git
cd cyra
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Google Gemini API client (`@google/genai`)
- Model Context Protocol SDK (`@modelcontextprotocol/sdk`)
- Express.js for HTTP server
- TypeScript and development tools

### 3. Build the Project

```bash
npm run build
```

This compiles the TypeScript code to JavaScript.

---

## Configuration

### Development & Testing Setup

If you're developing cyra or want to test it locally, you need to configure the Google Gemini API key:

#### Create `.env` File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or create it manually:

```
GOOGLE_API_KEY=your_gemini_api_key_here
```

#### Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/api-keys)
2. Click "Get API Key"
3. Create a new project or select an existing one
4. Copy your API key
5. Paste it into your `.env` file

### Production Deployment

In production, the API key is typically provided by clients when connecting to cyra. The server does not require a `.env` file configured since:

- API keys come from client connections
- Environment variables can be managed through your deployment platform (Docker, Kubernetes, etc.)
- No local `.env` is necessary

To use cyra in production without `.env`:
- The application handles API key injection from client requests
- Deploy with proper API key management (secrets manager, environment variables, etc.)

---

## Running cyra

### Development Mode

Run cyra in development mode with auto-reload:

```bash
npm run dev
```

This starts the server with:
- TypeScript compilation
- Hot reloading on file changes
- Nodemon for process management

### Production Mode

Start cyra in production:

```bash
npm start
```

Or using Node directly:

```bash
node --require ts-node/register src/index.ts
```

---

## Testing with the Test Client

To test cyra locally, use the included test client:

```bash
npm run test:client
```

**Requirements for testing:**
- `.env` file configured with `GOOGLE_API_KEY`
- Development server running (`npm run dev`)
- The test client will connect via the configured transport protocol

---

## Verify Installation

Once running, you should see output similar to:

```
═══════════════════════════════════════════════════════════════
✓ cyra Server Online
  Port: 3000
  WebSocket: /ws
═══════════════════════════════════════════════════════════════
```

---

## Project Structure After Installation

```
cyra/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/               # Configuration management
│   ├── servers/              # HTTP & transport servers
│   ├── services/             # Core services (Session, MCP)
│   ├── utils/                # Utilities (logging, etc.)
│   └── types/                # TypeScript type definitions
├── docs/                      # Documentation
│   ├── Introduction.md
│   ├── Architecture.md
│   ├── Payload.md
│   └── Installation.md        # This file
├── prompts/
│   └── system_prompt.md       # System instructions for Gemini
├── sandbox/                   # Isolated filesystem access
│   └── memory.jsonl          # Persistent memory storage
├── test/
│   └── client.test.ts        # Test client
├── .env                       # (Development only) API key configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

### "GOOGLE_API_KEY is not set"

**Solution:**
- Ensure `.env` file exists in project root
- Verify the file contains: `GOOGLE_API_KEY=your_key_here`
- Check the API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikeys)

### Port Already in Use

If port 3000 is already in use, change it in your `.env` file:

```
PORT=3001
```

Then restart the server with `npm run dev` or `npm start`.

### MCP Server Connection Errors

- Ensure NPM cache is up to date: `npm cache clean --force`
- Try reinstalling dependencies: `rm -rf node_modules && npm install`
- Check that all required MCP packages can be downloaded via npx

### TypeScript Compilation Errors

Update dependencies and rebuild:

```bash
npm update
npm run build
```

---

## Related Documentation

- **[Introduction](./Introduction.md)** - Overview of cyra's features and capabilities
- **[Architecture](./Architecture.md)** - Deep dive into system design and components
- **[Payload Standard](./Payload.md)** - Message format specification for developers
