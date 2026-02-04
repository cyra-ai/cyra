# Introduction

Welcome to the documentation! This guide will help you get started with cyra and understand its core features and functionalities.

## What is cyra?

**cyra** (pronounced "Sigh-ra") stands for **"Can You Really Assist?"** - a real-time voice assistant powered by Google's Gemini AI. It's a TypeScript-based application that enables natural, conversational interactions with AI while seamlessly integrating with your file system through dynamic tool execution.

## Key Features

- [X] **Real-time Voice Interaction** - Communicate naturally with Gemini AI using voice input and output
- [X] **MCP Integration** - Leverage the power of Google's Gemini models for advanced conversational capabilities
- [X] **Advanced Tool Execution** - Dynamically execute tools and commands based on conversational context
- [X] **Audio Streaming** - Full-duplex audio support with real-time microphone input and speaker output
- [X] **Type-Safe** - Built entirely in TypeScript for enhanced reliability and developer experience
- [X] **File System Access** - Interact with your local file system through AI-driven commands
- [X] **Multi-Session Support** - Handle multiple concurrent user sessions with isolated contexts
- [ ] **Recursive Agents** - Enable cyra to create sub-agents for complex tasks
- [ ] **Human-in-the-Loop** - Allow human oversight and intervention in AI decision-making
- [ ] **Transport Protocols**:
  - [X] **WebSocket** - Real-time communication using WebSockets
  - [ ] **HTTP/REST** - Interact with cyra via standard HTTP requests
  - [ ] **gRPC** - High-performance communication using gRPC
  - [ ] **Socket.io** - Real-time communication using Socket.io
- [ ] **Plugin System** - Extend cyra's capabilities with custom plugins
- [ ] **Multi-User Conversations** - Enable multiple users to connect and talk to a single session simultaneously
- [ ] Garbage Collection - Automatically manage, archive, and delete outdated messages to optimize performance

## Getting Started

To begin using cyra, you'll need:

- Node.js 18 or higher
- npm package manager
- A Google Gemini API key

Follow the [Installation Guide](Installation.md) to set up your environment and start your first session with cyra!

## Documentation Overview

- **[Installation Guide](Installation.md)** - Set up cyra for development or production
- **[Architecture](Architecture.md)** - Understand how cyra's components work together
- **[Payload Standard](Payload.md)** - Learn the message format for client-server communication

## Quick Navigation

Depending on your needs:
- **Getting started?** → [Installation Guide](Installation.md)
- **Want to understand the system?** → [Architecture](Architecture.md)
- **Building a client?** → [Payload Standard](Payload.md)
- **Extending cyra?** → [Architecture](Architecture.md) → [Payload Standard](Payload.md)
