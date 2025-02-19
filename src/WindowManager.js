/**
 * WindowManager.js - Handles window creation and management
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.explanationWindows = new Set(); // Track multiple explanation windows
    this.windowCounter = 0; // For unique window IDs
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
      const { app } = require('electron');
      app.dock.hide();
    }

    return this.mainWindow;
  }

  /**
   * Gets the target display for window sizing based on cursor position or source window location
   * @param {Object} contextData - Context data that may contain windowBounds information
   * @returns {Electron.Display} The target display to use for sizing
   */
  getTargetDisplay(contextData = null) {
    const { screen } = require('electron');
    
    try {
      // Strategy 1: Use screen where source window is located (most accurate)
      if (contextData && contextData.windowInfo && contextData.windowInfo.windowBounds) {
        const windowBounds = contextData.windowInfo.windowBounds;
        const displays = screen.getAllDisplays();
        
        const sourceDisplay = displays.find(display => {
          const { x, y, width, height } = display.bounds;
          return windowBounds.x >= x && 
                 windowBounds.x < x + width &&
                 windowBounds.y >= y && 
                 windowBounds.y < y + height;
        });
        
        if (sourceDisplay) {
          console.log(`🖥️  Using display where source window is located: ${sourceDisplay.bounds.width}x${sourceDisplay.bounds.height}`);
          return sourceDisplay;
        }
      }
      
      // Strategy 2: Use screen where cursor is currently located
      try {
        const cursorPoint = screen.getCursorScreenPoint();
        const cursorDisplay = screen.getDisplayNearestPoint(cursorPoint);
        console.log(`🖱️  Using display where cursor is located: ${cursorDisplay.bounds.width}x${cursorDisplay.bounds.height}`);
        return cursorDisplay;
      } catch (cursorError) {
        console.warn('⚠️  Could not get cursor position:', cursorError.message);
      }
      
      // Strategy 3: Use the largest available display (best for productivity)
      const displays = screen.getAllDisplays();
      const largestDisplay = displays.reduce((largest, current) => {
        const largestArea = largest.bounds.width * largest.bounds.height;
        const currentArea = current.bounds.width * current.bounds.height;
        return currentArea > largestArea ? current : largest;
      });
      
      console.log(`📐 Using largest available display: ${largestDisplay.bounds.width}x${largestDisplay.bounds.height}`);
      return largestDisplay;
      
    } catch (error) {
      console.error('❌ Error in display detection, falling back to primary:', error.message);
      // Strategy 4: Final fallback to primary display
      return screen.getPrimaryDisplay();
    }
  }

  createExplanationWindow(width = 700, height = 500, contextData = null) {
    this.windowCounter++;
    const windowId = this.windowCounter;
    
    // Get the appropriate display for this window
    const targetDisplay = this.getTargetDisplay(contextData);
    const { width: screenWidth, height: screenHeight } = targetDisplay.workAreaSize;
    
    // Limit window size to 90% of screen width and 85% of screen height
    const maxWidth = Math.floor(screenWidth * 0.9);
    const maxHeight = Math.floor(screenHeight * 0.95);
    
    const finalWidth = Math.min(width, maxWidth);
    const finalHeight = Math.min(height, maxHeight);
    
    console.log(`📏 Creating explanation window: ${finalWidth}x${finalHeight} (requested: ${width}x${height}, target screen: ${screenWidth}x${screenHeight})`);
    
    const explanationWindow = new BrowserWindow({
      width: finalWidth,
      height: finalHeight,
      show: false,
      frame: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Force reload and clear cache to prevent stale content
    explanationWindow.webContents.session.clearCache();
    
    // Choose which explanation window to load based on environment variable or default
    const explanationVersion = process.env.EXPLANATION_VERSION || 'modular'; // 'original', 'minimal', 'modular'
    
    let htmlPath;
    switch (explanationVersion) {
      case 'original':
        htmlPath = path.join(__dirname, 'explanation.html');
        break;
      case 'minimal':
        htmlPath = path.join(__dirname, 'explanation-minimal.html');
        break;
      case 'modular':
      default:
        htmlPath = path.join(__dirname, 'explanation-modular.html');
        break;
    }
    
    console.log('📄 Loading explanation window version:', explanationVersion);
    console.log('📄 Loading explanation window from:', htmlPath);
    console.log('📄 __dirname is:', __dirname);
    console.log('📄 File exists check:', require('fs').existsSync(htmlPath));
    
    explanationWindow.loadFile(htmlPath).then(() => {
      console.log(`✅ ${explanationVersion} explanation window loaded successfully`);
    }).catch((error) => {
      console.error(`❌ Failed to load ${explanationVersion} explanation window:`, error);
    });
    
    // Enable developer tools for debugging (can be disabled later)
    // explanationWindow.webContents.openDevTools();
    
    // Debug events
    explanationWindow.webContents.on('did-start-loading', () => {
      console.log('📄 Started loading explanation window');
    });
    
    explanationWindow.webContents.on('did-finish-load', () => {
      console.log('📄 Finished loading explanation window');
    });
    
    explanationWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ Failed to load explanation window:', errorCode, errorDescription, validatedURL);
    });
    
    explanationWindow.webContents.on('dom-ready', () => {
      console.log('📄 DOM ready for explanation window');
    });
    
    // Handle window close event
    explanationWindow.on('closed', () => {
      this.explanationWindows.delete(explanationWindow);
    });

    // Add to our tracking set
    this.explanationWindows.add(explanationWindow);
    
    // Set a custom property to identify this window
    explanationWindow.windowId = windowId;

    return explanationWindow;
  }

  async showExplanation(contextData) {
    const windowShowStart = Date.now();
    console.log(`[${new Date().toISOString()}] Starting to show explanation window`);
    
    // Determine window size based on explanation type
    let windowWidth = 700;   // Default for regular explanations (Cmd+Shift+D)
    let windowHeight = 500;  // Default for regular explanations
    
    // Use larger "page size" for thorough explanations (Cmd+Shift+E) and code explanations (Cmd+Shift+C)
    if (contextData.isThorough || contextData.isCode) {
      windowWidth = 880;   // Page-like width for better reading
      windowHeight = 1900; // Taller page-like height for more content
      console.log(`🔧 Using page size dimensions for ${contextData.isThorough ? 'thorough' : 'code'} explanation: ${windowWidth}x${windowHeight}`);
    } else {
      console.log(`🔧 Using standard dimensions for regular explanation: ${windowWidth}x${windowHeight}`);
    }
    
    // Always create a new explanation window for each shortcut
    console.log('Creating new explanation window...');
    const explanationWindow = this.createExplanationWindow(windowWidth, windowHeight, contextData);

    // Position the window near the source window if we have window bounds
    if (contextData.windowInfo && contextData.windowInfo.windowBounds) {
      this.positionExplanationWindow(explanationWindow, contextData.windowInfo.windowBounds);
    } else {
      // Center the window on the appropriate screen if no source window bounds available
      const targetDisplay = this.getTargetDisplay(contextData);
      const { width: screenWidth, height: screenHeight } = targetDisplay.workAreaSize;
      const { x: screenX, y: screenY } = targetDisplay.workArea;
      const [winWidth, winHeight] = explanationWindow.getSize();
      
      const centerX = screenX + Math.floor((screenWidth - winWidth) / 2);
      const centerY = screenY + Math.floor((screenHeight - winHeight) / 2);
      
      explanationWindow.setPosition(centerX, centerY);
      console.log(`🎯 Centered explanation window at (${centerX}, ${centerY}) on target display`);
    }

    // Send data only once, using a more reliable approach with better timing
    const sendExplanationData = () => {
      console.log('🚀 Sending explanation data to window:', contextData);
      explanationWindow.webContents.send('reset-window');
      explanationWindow.webContents.send('show-explanation', contextData);
    };

    // Multiple approaches to ensure data gets sent (accounting for reload)
    console.log('Setting up IPC data sending...');
    
    let dataAlreadySent = false;
    const sendOnce = () => {
      if (!dataAlreadySent) {
        dataAlreadySent = true;
        setTimeout(sendExplanationData, 200);
      }
    };
    
    // Approach 1: Wait for DOM ready
    explanationWindow.webContents.once('dom-ready', () => {
      console.log('📄 DOM ready, sending explanation data...');
      sendOnce();
    });
    
    // Approach 2: Wait for did-finish-load (more reliable, handles reload)
    explanationWindow.webContents.once('did-finish-load', () => {
      console.log('📄 Page finished loading, sending explanation data...');
      sendOnce();
    });
    
    // Approach 3: Fallback timer (in case events don't fire)
    setTimeout(() => {
      console.log('📄 Fallback timer - sending explanation data...');
      sendOnce();
    }, 1000);

    explanationWindow.show();
    explanationWindow.focus();
    
    const windowShowDuration = Date.now() - windowShowStart;
    console.log(`[${new Date().toISOString()}] Explanation window shown and focused in ${windowShowDuration}ms`);
    
    return explanationWindow; // Return the new window instance
  }

  sendExplanationToWindow(contextData, targetWindow = null) {
    // If a specific window is provided, send to that window
    if (targetWindow && targetWindow.webContents) {
      targetWindow.webContents.send('show-explanation', contextData);
      return;
    }
    
    // Otherwise, send to the most recently created window
    const windows = Array.from(this.explanationWindows);
    if (windows.length > 0) {
      const mostRecentWindow = windows[windows.length - 1];
      if (mostRecentWindow && mostRecentWindow.webContents) {
        mostRecentWindow.webContents.send('show-explanation', contextData);
      }
    }
  }

  setupIPC(aiService) {
    ipcMain.handle('get-explanation', async (event, contextData) => {
      // Handle code explanation requests with streaming
      if (contextData.isCode) {
        // For code explanations, set up streaming
        const sender = event.sender;
        
        // Set up a progress callback for streaming updates
        const onProgress = (partialResult) => {
          if (sender && !sender.isDestroyed()) {
            sender.send('explanation-progress', partialResult);
          }
        };
        
        // Use the streaming version for code explanations
        return await aiService.getCodeExplanation(contextData, onProgress);
      }
      
      // Handle regular explanation requests
      if (!contextData.isThorough) {
        return await aiService.getExplanation(contextData);
      }
      
      // For thorough explanations, set up streaming
      const sender = event.sender;
      
      // Set up a progress callback for streaming updates
      const onProgress = (partialResult) => {
        if (sender && !sender.isDestroyed()) {
          sender.send('explanation-progress', partialResult);
        }
      };
      
      // Use the streaming version for thorough explanations
      return await aiService.getThoroughExplanation(contextData.selectedText, onProgress);
    });

    ipcMain.on('close-explanation', () => {
      // Close the most recently created window, or all windows if requested
      const windows = Array.from(this.explanationWindows);
      if (windows.length > 0) {
        const mostRecentWindow = windows[windows.length - 1];
        if (mostRecentWindow) {
          mostRecentWindow.hide();
        }
      }
    });
  }

  showMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      setTimeout(() => this.mainWindow.hide(), 3000);
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getExplanationWindow() {
    // Return the most recently created window, or null if none exist
    const windows = Array.from(this.explanationWindows);
    return windows.length > 0 ? windows[windows.length - 1] : null;
  }

  getAllExplanationWindows() {
    return Array.from(this.explanationWindows);
  }

  positionExplanationWindow(explanationWindow, sourceWindowBounds) {
    if (!explanationWindow) return;
    
    const { screen } = require('electron');
    const explanationWindowSize = explanationWindow.getSize();
    const explanationWidth = explanationWindowSize[0];
    const explanationHeight = explanationWindowSize[1];
    
    // Get the display that contains the source window
    const displays = screen.getAllDisplays();
    const sourceDisplay = displays.find(display => {
      const { x, y, width, height } = display.bounds;
      return sourceWindowBounds.x >= x && 
             sourceWindowBounds.x < x + width &&
             sourceWindowBounds.y >= y && 
             sourceWindowBounds.y < y + height;
    }) || screen.getPrimaryDisplay();
    
    const displayBounds = sourceDisplay.bounds;
    
    // Calculate preferred position (to the right of the source window)
    let targetX = sourceWindowBounds.x + sourceWindowBounds.width + 20; // 20px gap
    let targetY = sourceWindowBounds.y;
    
    // Add offset for multiple windows to prevent complete overlap
    const windowIndex = this.explanationWindows.size - 1;
    const offset = windowIndex * 30; // 30px offset per additional window
    targetX += offset;
    targetY += offset;
    
    // Check if the explanation window would go off-screen horizontally
    if (targetX + explanationWidth > displayBounds.x + displayBounds.width) {
      // Try positioning to the left of the source window
      targetX = sourceWindowBounds.x - explanationWidth - 20 - offset;
      
      // If that also goes off-screen, position overlapping but offset
      if (targetX < displayBounds.x) {
        targetX = displayBounds.x + displayBounds.width - explanationWidth - 20;
      }
    }
    
    // Check if the explanation window would go off-screen vertically
    if (targetY + explanationHeight > displayBounds.y + displayBounds.height) {
      // Position at bottom of screen with some margin
      targetY = displayBounds.y + displayBounds.height - explanationHeight - 20;
    }
    
    // Ensure minimum distance from screen edges
    targetX = Math.max(displayBounds.x + 10, targetX);
    targetY = Math.max(displayBounds.y + 10, targetY);
    
    console.log(`Positioning explanation window #${explanationWindow.windowId} at (${targetX}, ${targetY}) near source window at (${sourceWindowBounds.x}, ${sourceWindowBounds.y}, ${sourceWindowBounds.width}x${sourceWindowBounds.height})`);
    
    explanationWindow.setPosition(targetX, targetY);
  }
}

module.exports = WindowManager;
