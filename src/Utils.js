/**
 * Utils.js - Utility functions and helpers
 */

const { Menu, dialog } = require('electron');

class Utils {
  static createMenuBarMenu(windowManager, shortcutHandler) {
    const template = [
      {
        label: 'Reading Helper',
        submenu: [
          {
            label: 'About Reading Helper',
            click: () => {
              Utils.showAbout(windowManager);
            }
          },
          {
            label: 'Show Instructions',
            click: () => {
              // Since we no longer create a main window, show instructions via dialog
              Utils.showAbout(windowManager);
            }
          },
          { type: 'separator' },
          {
            label: 'Test with Sample Text',
            click: () => {
              shortcutHandler.testWithSampleText();
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              const { app } = require('electron');
              app.quit();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  static showAbout(windowManager) {
    const mainWindow = windowManager.getMainWindow();
    const explanationWindow = windowManager.getExplanationWindow();
    
    dialog.showMessageBox(mainWindow || explanationWindow, {
      type: 'info',
      title: 'About Reading Helper',
      message: 'Reading Helper v3.1.0 - Modern Edition',
      detail: 'A smart text explanation tool that works with your clipboard.\n\nHow to use:\n1. SELECT/HIGHLIGHT text in any application\n2. Copy it (Cmd+C or Ctrl+C) - OR let the app auto-copy\n3. Press Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows/Linux) for quick explanations\n4. Press Cmd+Shift+E (Mac) or Ctrl+Shift+E (Windows/Linux) for thorough analysis\n5. Press Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux) for code explanations\n6. Get instant explanations with context!\n\nFeatures:\n• Lightning-fast clipboard-based text extraction\n• Automatic copy functionality for selected text\n• Three explanation modes: Quick, Thorough, and Code Analysis\n• AI-powered explanations with context\n• Specialized code understanding and breakdown\n• Works with all applications that support text selection\n\nSupported: Web browsers, documents, PDFs, code editors, and any app with selectable text.'
    });
  }

  static countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  static formatTextForDisplay(text, maxLength = 100) {
    if (!text) return '';
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength) + '...';
  }

  static sanitizeText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace and normalize line breaks
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  static isValidText(text) {
    return text && 
           typeof text === 'string' && 
           text.trim().length > 0 && 
           text.trim().length >= 3;
  }

  static getPlatformSpecificShortcut() {
    return process.platform === 'darwin' ? 'Cmd+Shift+D' : 'Ctrl+Shift+D';
  }

  static createTimeout(promise, timeoutMs, errorMessage = 'Operation timed out') {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static logWithTimestamp(message, ...args) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  static generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static validateEnvironment() {
    const issues = [];
    
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      issues.push('GEMINI_API_KEY not found in environment variables (AI features will be limited)');
    }
    
    // Check platform support
    const supportedPlatforms = ['darwin', 'win32', 'linux'];
    if (!supportedPlatforms.includes(process.platform)) {
      issues.push(`Platform ${process.platform} may have limited support`);
    }
    
    return issues;
  }
}

module.exports = Utils;
