# Reading Helper

An Electron desktop app that explains highlighted text using Google Gemini AI. Select any text on screen, press a keyboard shortcut, and get an AI-powered explanation in a floating popup — with full context from a screenshot of the surrounding content.

## Features

- **Quick Explain** — Context-aware explanation using Vision AI to understand surrounding content
- **Thorough Analysis** — Comprehensive breakdown with analogies, math (LaTeX/MathJax), and code examples via streaming
- **Code Explain** — Specialized line-by-line code analysis with syntax highlighting
- **Screenshot Context** — Captures the active window screenshot and sends it to Gemini Vision for richer explanations
- **Multiple Windows** — Open several explanation popups side-by-side
- **Menu Bar App** — Runs in the background with no dock clutter

## Keyboard Shortcuts

| Shortcut | Mac | Windows/Linux | Description |
|:--|:--|:--|:--|
| Quick Explain | `Cmd+Shift+D` | `Ctrl+Shift+D` | Fast contextual explanation |
| Thorough Analysis | `Cmd+Shift+E` | `Ctrl+Shift+E` | Comprehensive streaming analysis |
| Code Explain | `Cmd+Shift+C` | `Ctrl+Shift+C` | Line-by-line code breakdown |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### macOS Only

- **Accessibility permissions** are required for text selection to work. The app will prompt you on first launch:
  - Go to **System Settings → Privacy & Security → Accessibility** and grant access to Reading Helper (or your terminal if running in dev mode).

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/keanthon/reading-helper.git
   cd reading-helper
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure your API key**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and replace the placeholder with your Gemini API key:

   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the app**

   ```bash
   npm start
   ```

   Or use the launch script (auto-installs deps if missing):

   ```bash
   chmod +x launch.sh
   ./launch.sh
   ```

## Usage

1. Highlight any text in any application
2. Press one of the keyboard shortcuts listed above
3. A floating popup appears with the AI explanation
4. Close the popup or open more — they stack independently

## Architecture

The app uses a modular architecture split across focused modules:

| Module | Purpose |
|:--|:--|
| `main-modular.js` | Entry point, app lifecycle |
| `AIService.js` | Gemini AI integration, explanation generation, HTML formatting |
| `ShortcutHandler.js` | Global keyboard shortcuts, text extraction, clipboard management |
| `WindowManager.js` | Explanation window creation, positioning, IPC |
| `WindowCapture.js` | Active window detection, screenshot capture |
| `ContextGatherer.js` | Vision API context analysis |
| `ClipboardManager.js` | Safe clipboard save/restore operations |
| `Utils.js` | Logging, environment validation, menu bar |

### AI Models Used

| Mode | Model | Purpose |
|:--|:--|:--|
| Quick Explain | `gemini-2.0-flash-lite` | Fast contextual explanations |
| Thorough Analysis | `gemini-2.5-flash-preview-05-20` | Streaming deep analysis with thinking |
| Code Explain | `gemini-2.0-flash-lite` | Streaming code-focused analysis |
| Vision Context | `gemini-1.5-flash-8b` | Screenshot understanding |

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration
```

## Tech Stack

- **[Electron](https://www.electronjs.org/)** v28 — Cross-platform desktop framework
- **[@google/genai](https://www.npmjs.com/package/@google/genai)** — Google Gemini AI SDK
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** — OCR text recognition
- **[MathJax](https://www.mathjax.org/)** — LaTeX math rendering in explanations

## License

MIT
