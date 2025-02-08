const { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Notification, Menu } = require('electron');
const path = require('path');
require('dotenv').config();

// Check if robotjs is available (it may fail on some systems)
let robot;
try {
  robot = require('robotjs');
  console.log('RobotJS loaded successfully');
} catch (error) {
  console.warn('RobotJS not available:', error.message);
  robot = null;
}

class ReadingHelper {
  constructor() {
    this.mainWindow = null;
    this.explanationWindow = null;
    this.isMenuBarApp = false;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 300,
      show: false,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    
    // Hide from dock on macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  }

  createExplanationWindow() {
    this.explanationWindow = new BrowserWindow({
      width: 600,
      height: 400,
      show: false,
      frame: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.explanationWindow.loadFile(path.join(__dirname, 'explanation-modular.html'));
  }

  createMenuBarMenu() {
    const template = [
      {
        label: 'Reading Helper',
        submenu: [
          {
            label: 'About Reading Helper',
            click: () => {
              this.showAbout();
            }
          },
          {
            label: 'Show Instructions',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.show();
                setTimeout(() => this.mainWindow.hide(), 3000);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Test with Sample Text',
            click: () => {
              this.testWithSampleText();
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  showAbout() {
    const { dialog } = require('electron');
    dialog.showMessageBox(this.mainWindow || this.explanationWindow, {
      type: 'info',
      title: 'About Reading Helper',
      message: 'Reading Helper v1.0.0',
      detail: 'A smart text explanation tool that captures context.\n\nShortcut: Cmd+Shift+E (Mac) / Ctrl+Shift+E (Windows/Linux)\n\nHighlight text anywhere and press the shortcut for explanations with context.'
    });
  }

  registerGlobalShortcuts() {
    // Register Cmd+Shift+E (or Ctrl+Shift+E on Windows/Linux)
    const shortcut = process.platform === 'darwin' ? 'Command+Shift+E' : 'Ctrl+Shift+E';
    
    const ret = globalShortcut.register(shortcut, () => {
      this.handleExplainShortcut();
    });

    if (!ret) {
      console.log('Registration failed');
      // Show notification about shortcut registration failure
      new Notification({
        title: 'Reading Helper',
        body: `Failed to register shortcut ${shortcut}. Another app might be using it.`
      }).show();
    } else {
      console.log(`Shortcut ${shortcut} registered successfully`);
      
      // Show welcome notification
      new Notification({
        title: 'Reading Helper Active',
        body: `Press ${shortcut} after highlighting text to get explanations!`
      }).show();
    }
  }

  async handleExplainShortcut() {
    try {
      // Show notification that we're processing
      new Notification({
        title: 'Reading Helper',
        body: 'Capturing text and gathering context...'
      }).show();

      let selectedText = '';
      let contextData = null;

      if (robot) {
        // Use robotjs method if available
        contextData = await this.gatherContextWithRobot();
        selectedText = contextData.selectedText;
      } else {
        // Fallback: just use current clipboard content
        selectedText = clipboard.readText();
        contextData = {
          selectedText,
          beforeContext: '',
          afterContext: '',
          fullContext: selectedText
        };
      }
      
      if (!selectedText || selectedText.trim().length === 0) {
        new Notification({
          title: 'Reading Helper',
          body: robot ? 
            'No text selected. Please highlight some text and try again.' :
            'No text in clipboard. Copy some text first, then try the shortcut.'
        }).show();
        return;
      }

      // Show explanation window
      await this.showExplanation(contextData);

    } catch (error) {
      console.error('Error handling explain shortcut:', error);
      new Notification({
        title: 'Reading Helper',
        body: 'Error processing text. Please try again.'
      }).show();
    }
  }

  async gatherContextWithRobot() {
    const originalClipboard = clipboard.readText();
    
    // Copy selected text to clipboard
    if (process.platform === 'darwin') {
      robot.keyTap('c', 'command');
    } else {
      robot.keyTap('c', 'control');
    }

    // Wait for clipboard to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const selectedText = clipboard.readText();
    
    if (!selectedText || selectedText === originalClipboard) {
      return {
        selectedText: originalClipboard || '',
        beforeContext: '',
        afterContext: '',
        fullContext: originalClipboard || ''
      };
    }

    try {
      // Select all text to get full context
      if (process.platform === 'darwin') {
        robot.keyTap('a', 'command');
      } else {
        robot.keyTap('a', 'control');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Copy all text
      if (process.platform === 'darwin') {
        robot.keyTap('c', 'command');
      } else {
        robot.keyTap('c', 'control');
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const fullText = clipboard.readText();
      
      // Restore original clipboard
      clipboard.writeText(originalClipboard);
      
      // Find the selected text in the full context
      const selectedIndex = fullText.indexOf(selectedText);
      
      if (selectedIndex === -1) {
        return {
          selectedText,
          beforeContext: '',
          afterContext: '',
          fullContext: selectedText
        };
      }

      // Get words before and after
      const beforeText = fullText.substring(0, selectedIndex);
      const afterText = fullText.substring(selectedIndex + selectedText.length);

      const beforeWords = beforeText.split(/\s+/).filter(word => word.length > 0);
      const afterWords = afterText.split(/\s+/).filter(word => word.length > 0);

      // Get last 500 words before and first 100 words after
      const beforeContext = beforeWords.slice(-500).join(' ');
      const afterContext = afterWords.slice(0, 100).join(' ');

      return {
        selectedText,
        beforeContext,
        afterContext,
        fullContext: beforeContext + ' ' + selectedText + ' ' + afterContext
      };

    } catch (error) {
      console.error('Error gathering context:', error);
      // Restore original clipboard on error
      clipboard.writeText(originalClipboard);
      
      return {
        selectedText,
        beforeContext: '',
        afterContext: '',
        fullContext: selectedText
      };
    }
  }

  async testWithSampleText() {
    const sampleContext = {
      selectedText: "artificial intelligence",
      beforeContext: "The rapid development of technology has led to significant advances in machine learning and data processing. Companies around the world are investing heavily in research and development to create more sophisticated algorithms. These technological breakthroughs are transforming industries from healthcare to transportation. The integration of smart systems into everyday life is becoming increasingly common, with applications ranging from voice assistants to autonomous vehicles.",
      afterContext: "is revolutionizing how we approach complex problems and automate routine tasks. The implications for society are profound and far-reaching.",
      fullContext: "The rapid development of technology has led to significant advances in machine learning and data processing. Companies around the world are investing heavily in research and development to create more sophisticated algorithms. These technological breakthroughs are transforming industries from healthcare to transportation. The integration of smart systems into everyday life is becoming increasingly common, with applications ranging from voice assistants to autonomous vehicles. Artificial intelligence is revolutionizing how we approach complex problems and automate routine tasks. The implications for society are profound and far-reaching."
    };

    await this.showExplanation(sampleContext);
  }

  async showExplanation(contextData) {
    if (!this.explanationWindow) {
      this.createExplanationWindow();
    }

    // Send data to explanation window
    this.explanationWindow.webContents.once('dom-ready', () => {
      this.explanationWindow.webContents.send('show-explanation', contextData);
    });

    this.explanationWindow.show();
    this.explanationWindow.focus();
  }

  setupIPC() {
    ipcMain.handle('get-explanation', async (event, contextData) => {
      return await this.getAIExplanation(contextData);
    });

    ipcMain.on('close-explanation', () => {
      if (this.explanationWindow) {
        this.explanationWindow.hide();
      }
    });
  }

  async getAIExplanation(contextData) {
    const { selectedText, beforeContext, afterContext, fullContext } = contextData;
    
    // Check if Gemini API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Please explain the following highlighted text in context:

HIGHLIGHTED TEXT: "${selectedText}"

CONTEXT BEFORE (up to 500 words): ${beforeContext}

CONTEXT AFTER (up to 100 words): ${afterContext}

Please provide:
1. A clear explanation of the highlighted text
2. How it relates to the surrounding context
3. Key concepts or terms that might need clarification
4. Any important background information

Format your response as a clear, educational explanation that helps the reader understand the text better.`;

        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: prompt,
          config: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1000
          }
        });
        
        const aiResponse = result.text;
        
        return {
          explanation: aiResponse,
          summary: `AI explanation for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
          wordCount: this.countWords(aiResponse)
        };

      } catch (error) {
        console.error('Google Gemini API error:', error);
        return this.getFallbackExplanation(contextData);
      }
    }
    
    // Fallback explanation when no API key is configured
    return this.getFallbackExplanation(contextData);
  }

  getFallbackExplanation(contextData) {
    const { selectedText, beforeContext, afterContext } = contextData;
    
    return {
      explanation: `The selected text "${selectedText}" appears in the context of a larger document. 

CONTEXT ANALYSIS:
• The text appears ${beforeContext.length > 0 ? 'within a larger discussion' : 'at the beginning of the content'}
• ${afterContext.length > 0 ? 'Additional content follows that may provide more context' : 'This appears to be near the end of the content'}
• The surrounding text contains ${this.countWords(beforeContext + afterContext)} additional words of context

SELECTED TEXT DETAILS:
• Length: ${selectedText.length} characters
• Word count: ${this.countWords(selectedText)} words
• Context available: ${robot ? 'Full context captured' : 'Limited to clipboard content'}

To get AI-powered explanations with deeper analysis, please add your Google Gemini API key to the .env file.

CONTEXT PREVIEW:
Before: ...${beforeContext.substring(Math.max(0, beforeContext.length - 100))}
After: ${afterContext.substring(0, 100)}...`,
      summary: `Analysis of "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      wordCount: this.countWords(selectedText)
    };
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// App event handlers
app.whenReady().then(() => {
  const readingHelper = new ReadingHelper();
  
  readingHelper.createMainWindow();
  readingHelper.createExplanationWindow();
  readingHelper.createMenuBarMenu();
  readingHelper.registerGlobalShortcuts();
  readingHelper.setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      readingHelper.createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running even when all windows are closed
  // This is typical for menu bar apps
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
