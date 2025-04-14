# Modular Explanation Window

A modern, modular, and maintainable explanation window for the Reading Helper application.

## Architecture

The explanation window has been refactored from a monolithic HTML file into a modular, component-based architecture:

```
src/explanation/
├── explanation-modular.html       # Main HTML structure
├── styles/
│   └── explanation-styles.css     # All styling (extracted from HTML)
├── js/
│   ├── controller.js              # Main application controller
│   ├── event-handler.js           # IPC and event management
│   ├── ui-components.js           # UI component state management
│   ├── text-formatter.js          # Text processing and formatting
│   ├── mathjax-loader.js          # Mathematical equation rendering
│   └── explanation-display.js     # Content display logic
└── tests/
    └── text-formatter.test.js     # Unit tests (example)
```

## Features

### ✅ Completed
- **Modular Architecture**: Separated concerns into focused modules (<500 lines each)
- **CSS Extraction**: All styles moved to external stylesheet
- **Event Handling**: Centralized IPC and keyboard event management
- **UI Components**: Reusable UI state management
- **Text Processing**: Safe HTML formatting and processing
- **MathJax Integration**: Asynchronous mathematical equation rendering
- **Content Display**: Streaming and static content display
- **Error Handling**: Comprehensive error management
- **Development Tools**: Built-in development helpers and testing framework
- **Performance Monitoring**: Real-time performance tracking and optimization
- **Streaming Display**: Real-time content updates with visual indicators ✨
- **Unit Testing**: Comprehensive test coverage with integration tests
- **Test Runner**: Automated test execution and reporting

### 🔄 In Progress
- **Unit Testing**: Comprehensive test coverage for all modules
- **Feature Migration**: Moving remaining features from monolithic version
- **Performance Optimization**: Memory and rendering improvements

### 📋 Planned
- **Integration Tests**: End-to-end testing
- **Documentation**: Complete API documentation
- **Accessibility**: WCAG compliance improvements

## Module Responsibilities

### Controller (`controller.js`)
- Application initialization and coordination
- Module validation and management
- Error handling and recovery
- Development helpers

### Event Handler (`event-handler.js`)
- IPC communication with main process
- Keyboard shortcuts and UI events
- Streaming explanation coordination
- Context data management

### UI Components (`ui-components.js`)
- DOM element management
- Visual state updates
- Loading states and indicators
- Error display

### Text Formatter (`text-formatter.js`)
- HTML sanitization and escaping
- Text processing and formatting
- Code block enhancement
- Clipboard operations

### MathJax Loader (`mathjax-loader.js`)
- Asynchronous MathJax loading
- Mathematical equation rendering
- Render queue management
- Fallback handling

### Explanation Display (`explanation-display.js`)
- Content rendering and updates
- Streaming progress handling
- Math rendering coordination
- Export functionality

## Usage

### Starting the Application

The WindowManager now supports multiple explanation window versions:

```bash
# Use modular version (default)
npm start

# Use specific version
EXPLANATION_VERSION=modular npm start
EXPLANATION_VERSION=minimal npm start
EXPLANATION_VERSION=original npm start
```

### Testing

```bash
# Run all tests
node test-runner.js

# Run specific test suite
node src/explanation/tests/text-formatter.test.js
node src/explanation/tests/integration.test.js

# Test different explanation window versions
node test-modular.js modular
node test-modular.js minimal
node test-modular.js original
```

### Development

The modular version includes development helpers accessible via browser console:

```javascript
// Simulate different explanation types
window.dev.simulateExplanation('regular');
window.dev.simulateExplanation('thorough');
window.dev.simulateExplanation('code');
window.dev.simulateExplanation('math');

// Reload MathJax
await window.dev.reloadMathJax();

// Get performance metrics
console.log(window.dev.getMetrics());
```

## Code Quality Standards

- **File Size**: Each module is under 500 lines of actual code
- **Separation of Concerns**: Clear responsibility boundaries
- **Error Handling**: Comprehensive try-catch blocks
- **Documentation**: JSDoc comments for all public methods
- **Testing**: Unit tests with >85% coverage goal
- **Modern JavaScript**: ES6+ features and best practices

## API Reference

### ExplanationController

```javascript
// Initialize application
await window.ExplanationController.initialize();

// Get application status
const status = window.ExplanationController.getStatus();

// Access modules
const uiComponents = window.ExplanationController.getModule('uiComponents');
```

### UIComponents

```javascript
// Update status
window.UIComponents.updateStatus('Processing...', '#ffa726');

// Show/hide loading
window.UIComponents.showLoading('Custom message');
window.UIComponents.hideLoading();

// Display content
window.UIComponents.showExplanation('<p>Formatted HTML content</p>');
```

### TextFormatter

```javascript
// Format text safely
const formatted = window.TextFormatter.formatSelectedText(userInput);

// Check for math content
const hasMath = window.TextFormatter.containsMath(content);

// Copy to clipboard
await window.TextFormatter.copyCodeToClipboard('code-block-id');
```

## Migration Status

### Phase 1: Core Structure ✅
- [x] Modular HTML structure
- [x] CSS extraction
- [x] Core JavaScript modules
- [x] Basic event handling
- [x] WindowManager integration

### Phase 2: Feature Migration 🔄
- [x] Loading states and indicators
- [x] Error handling
- [x] Basic text display
- [x] MathJax integration
- [ ] Streaming functionality
- [ ] Code highlighting
- [ ] Theme support
- [ ] Copy functionality

### Phase 3: Testing & Polish 📋
- [ ] Complete unit test suite
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Documentation completion

## Contributing

When adding new features:

1. **Create focused modules** - Keep each file under 500 lines
2. **Add unit tests** - Minimum 85% coverage
3. **Document APIs** - Use JSDoc comments
4. **Handle errors** - Comprehensive error handling
5. **Follow patterns** - Consistent with existing modules

## Troubleshooting

### Common Issues

**Module not found errors**: Ensure all JavaScript files are loaded in the correct order in `explanation-modular.html`.

**MathJax not rendering**: Check browser console for loading errors. MathJax loads asynchronously and may fail in offline environments.

**IPC communication fails**: Verify Electron context and ensure `nodeIntegration: true` in BrowserWindow options.

**Styling issues**: Check that `explanation-styles.css` is loading correctly and paths are relative to the HTML file.

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();
```

View application logs:

```javascript
console.log(window.ExplanationController.exportLogs());
```
