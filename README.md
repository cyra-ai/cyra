# cyra

> Can You Really Assist?

A real-time voice assistant powered by Google's Gemini AI. cyra (pronounced "Sigh-ra") is a TypeScript-based voice interface that lets you have natural conversations and interact with your file system through dynamic tool execution.

## Features

- 🎤 **Real-time Voice Interaction**: Communicate with Gemini AI using voice input and output
- 🛠️ **Dynamic Tool Execution**: Automatically load and execute file system operations
- 🔄 **Hot Reloading**: Tools reload automatically when files change
- 🎵 **Audio Streaming**: Real-time audio input from microphone and output to speaker
- ⌨️ **Keyboard Controls**: Easy pause/resume and quit functionality
- 📝 **TypeScript**: Fully typed codebase for reliability

## Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key
- USB audio device (microphone and speaker, or configurable audio input)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cyra.git
cd cyra
```

2. Install dependencies:
```bash
npm install
```

3. Add your Google API key to `.env`:
```env
GOOGLE_API_KEY=your_api_key_here
```

4. Update the microphone device in `src/index.ts` if needed (currently set to `plughw:2,0`)

## Usage

### Development Mode
```bash
npm run dev
```

### Production Build & Run
```bash
npm run build
npm start
```

### Available Commands During Runtime
- **P** - Pause/resume listening
- **Q** - Quit the application
- **Ctrl+C** - Exit

## Project Structure

```
cyra/
├── src/
│   ├── index.ts                 # Main application entry point
│   └── functions/               # Tool definitions
│       ├── create_file.ts       # Create new files
│       ├── read_file.ts         # Read file contents
│       ├── read_repository.ts   # Map repository structure
│       └── update_file.ts       # Update existing files
├── types/
│   └── index.d.ts               # TypeScript type definitions
├── SystemPrompt.MD              # AI assistant system prompt
├── tsconfig.json                # TypeScript configuration
├── eslint.config.ts             # ESLint configuration
├── package.json                 # Project dependencies
└── LICENSE                      # MIT License
```

## Available Tools

cyra comes with built-in tools for file operations:

### `read_repository`
Get a map of all files in the repository structure. Useful for understanding project layout.

### `read_file`
Read the contents of a specific file.
- **Parameters**: `file_path` (relative path)

### `create_file`
Create a new file with specified content.
- **Parameters**: `file_path`, `content`

### `update_file`
Update an existing file's content.
- **Parameters**: `file_path`, `content`

## Configuration

### Audio Device
Edit the microphone device in `src/index.ts`:
```typescript
const micInstance = mic({
  device: 'plughw:2,0' // Change this to your device
});
```

To find your audio device:
```bash
arecord -l  # List recording devices
aplay -l    # List playback devices
```

### AI Model
The project uses `gemini-2.5-flash-native-audio-preview-12-2025`. Update in `src/index.ts` if needed.

### System Prompt
Customize AI behavior in `SystemPrompt.MD` - this file defines how cyra responds and operates.

## Development

### Scripts
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled code
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

### Adding New Tools
1. Create a new file in `src/functions/`
2. Implement the `CyraTool` interface
3. Export as default
4. The tool will automatically load on next restart (or immediately with hot reload)

## Environment Variables

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## Troubleshooting

**No audio input:**
- Check microphone device setting in `src/index.ts`
- Run `arecord -l` to list devices
- Verify USB device is connected and recognized

**No audio output:**
- Check speaker configuration
- Verify audio playback device is available with `aplay -l`

**API errors:**
- Verify `GOOGLE_API_KEY` is set correctly in `.env`
- Check API quotas and billing

## Credits

Built with:
- [Google Gemini AI](https://ai.google.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)