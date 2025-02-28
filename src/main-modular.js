/**
 * main.js - Main entry point for Reading Helper (Modular Architecture)
 * 
 * This file coordinates all the modules and handles the application lifecycle.
 * The original 1455-line file has been refactored into smaller, focused modules.
 */

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
require('dotenv').config();

// Import modular components
const AIService = require('./AIService');
const WindowManager = require('./WindowManager');
const WindowCapture = require('./WindowCapture');
const ContextGatherer = require('./ContextGatherer');
const ShortcutHandler = require('./ShortcutHandler');
const Utils = require('./Utils');

class ReadingHelper {
  constructor() {
    this.aiService = null;
    this.windowManager = null;
    this.windowCapture = null;
    this.contextGatherer = null;
    this.shortcutHandler = null;
    
    this.startupTime = Date.now();
    
    Utils.logWithTimestamp('Reading Helper starting up...');
    
    // Validate environment
    const envIssues = Utils.validateEnvironment();
    if (envIssues.length > 0) {
      console.warn('Environment validation issues:', envIssues);
    }
  }

  async initialize() {
    try {
      Utils.logWithTimestamp('Initializing modules...');
      
      // Initialize core services
      this.aiService = new AIService();
      this.windowManager = new WindowManager();
      this.windowCapture = new WindowCapture();
      
      // Initialize context gatherer (now simplified to only use vision API)
      this.contextGatherer = new ContextGatherer(this.windowCapture, this.aiService);
      
      this.shortcutHandler = new ShortcutHandler(
        this.windowCapture,
        this.contextGatherer,
        this.windowManager,
        this.aiService
      );
      
      // Wait for AI service to initialize
      await this.aiService.initialize();
      
      Utils.logWithTimestamp('All modules initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to initialize Reading Helper:', error);
      return false;
    }
  }

  setupApplication() {
    Utils.logWithTimestamp('Setting up application...');
    
    try {
      // Don't pre-create explanation windows - they will be created on-demand for each shortcut
      // this.windowManager.createMainWindow();  // Commented out - not needed
      // this.windowManager.createExplanationWindow(); // Now created on-demand
      
      // Create menu
      Utils.createMenuBarMenu(this.windowManager, this.shortcutHandler);
      
      // Register shortcuts
      this.shortcutHandler.registerGlobalShortcuts();
      
      // Setup IPC communication
      this.windowManager.setupIPC(this.aiService);
      
      Utils.logWithTimestamp('Application setup completed');
      
      // Log startup performance
      const startupDuration = Date.now() - this.startupTime;
      Utils.logWithTimestamp(`Reading Helper ready in ${startupDuration}ms`);
      
    } catch (error) {
      console.error('Failed to setup application:', error);
      throw error;
    }
  }

  handleAppEvents() {
    app.on('activate', () => {
      // On macOS, don't create any windows when clicking dock icon
      // This app works via global shortcuts and menu bar
      Utils.logWithTimestamp('App activated - Reading Helper works via keyboard shortcuts');
    });

    app.on('window-all-closed', () => {
      // Keep app running even when all windows are closed
      // This is typical for menu bar apps
      Utils.logWithTimestamp('All windows closed, but keeping app running');
    });

    app.on('will-quit', () => {
      Utils.logWithTimestamp('Application quitting, cleaning up...');
      globalShortcut.unregisterAll();
    });

    app.on('before-quit', () => {
      Utils.logWithTimestamp('Application preparing to quit');
    });
  }
}

// Application lifecycle management
let readingHelper = null;

app.whenReady().then(async () => {
  Utils.logWithTimestamp('Electron app ready, initializing Reading Helper...');
  
  try {
    readingHelper = new ReadingHelper();
    
    const initSuccess = await readingHelper.initialize();
    if (!initSuccess) {
      throw new Error('Failed to initialize Reading Helper modules');
    }
    
    readingHelper.setupApplication();
    readingHelper.handleAppEvents();
    
    // Make instance globally accessible for testing
    global.readingHelperInstance = readingHelper;
    
    Utils.logWithTimestamp('Reading Helper fully operational');
    
  } catch (error) {
    console.error('Failed to start Reading Helper:', error);
    
    // Show error dialog
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Reading Helper Startup Error',
      `Failed to start Reading Helper: ${error.message}\n\nPlease check the logs and try again.`
    );
    
    app.quit();
  }
});

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  Utils.logWithTimestamp('Uncaught exception occurred', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  Utils.logWithTimestamp('Unhandled promise rejection', reason);
});

// Global test function accessible via console
global.testReadingHelper = async function() {
  try {
    const { testReadingHelper } = require('./TestRunner');
    if (global.readingHelperInstance && global.readingHelperInstance.shortcutHandler) {
      await testReadingHelper(global.readingHelperInstance.shortcutHandler);
    } else {
      console.log('Reading Helper instance not available for testing');
    }
  } catch (error) {
    console.error('Test execution failed:', error);
  }
};

// Make instance globally accessible for testing
global.readingHelperInstance = null;

// Export for potential external use
module.exports = ReadingHelper;
