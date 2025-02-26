/**
 * ShortcutHandler.js - Handles global shortcuts and text extraction
 */

const { globalShortcut, clipboard, Notification } = require('electron');
const { execSync } = require('child_process');
const ClipboardManager = require('./ClipboardManager');

class ShortcutHandler {
  constructor(windowCapture, contextGatherer, windowManager, aiService) {
    this.windowCapture = windowCapture;
    this.contextGatherer = contextGatherer;
    this.windowManager = windowManager;
    this.aiService = aiService;
    this.lastShortcutTrigger = 0;
    this.isProcessing = false;
    
    // Check permissions on macOS
    if (process.platform === 'darwin') {
      this.checkAccessibilityPermissions();
    }
  }

  registerGlobalShortcuts() {
    // Register Cmd+Shift+D (or Ctrl+Shift+D on Windows/Linux) - explanation with context
    const shortcut = process.platform === 'darwin' ? 'Command+Shift+D' : 'Ctrl+Shift+D';
    
    const ret = globalShortcut.register(shortcut, () => {
      // Add throttling and error handling
      const now = Date.now();
      if (now - this.lastShortcutTrigger < 1000) {
        console.log('Shortcut throttled - too soon after last trigger');
        return;
      }

      if (this.isProcessing) {
        console.log('Shortcut ignored - already processing');
        new Notification({
          title: 'Reading Helper',
          body: 'Already processing... please wait'
        }).show();
        return;
      }

      this.lastShortcutTrigger = now;
      this.isProcessing = true;
      
      // Handle async function - timeout handled by AIService
      this.handleExplainShortcut()
        .catch(error => {
          console.error('Shortcut handler failed:', error);
          new Notification({
            title: 'Reading Helper Error',
            body: 'Operation failed. Please try again.'
          }).show();
        })
        .finally(() => {
          this.isProcessing = false;
        });
    });

    // Register new thorough explanation shortcut: Cmd+Shift+E (or Ctrl+Shift+E)
    const thoroughShortcut = process.platform === 'darwin' ? 'Command+Shift+E' : 'Ctrl+Shift+E';
    
    const thoroughRet = globalShortcut.register(thoroughShortcut, () => {
      const now = Date.now();
      if (now - this.lastShortcutTrigger < 1000) {
        console.log('Thorough shortcut throttled - too soon after last trigger');
        return;
      }

      if (this.isProcessing) {
        console.log('Thorough shortcut ignored - already processing');
        new Notification({
          title: 'Reading Helper',
          body: 'Already processing... please wait'
        }).show();
        return;
      }

      this.lastShortcutTrigger = now;
      this.isProcessing = true;
      
      // Handle thorough explanation - timeout handled by AIService
      this.handleThoroughExplanationShortcut()
        .catch(error => {
          console.error('Thorough explanation handler failed:', error);
          new Notification({
            title: 'Reading Helper Error',
            body: 'Thorough explanation failed. Please try again.'
          }).show();
        })
        .finally(() => {
          this.isProcessing = false;
        });
    });

    // Register new code explanation shortcut: Cmd+Shift+C (or Ctrl+Shift+C)
    const codeShortcut = process.platform === 'darwin' ? 'Command+Shift+C' : 'Ctrl+Shift+C';
    
    const codeRet = globalShortcut.register(codeShortcut, () => {
      const now = Date.now();
      if (now - this.lastShortcutTrigger < 1000) {
        console.log('Code shortcut throttled - too soon after last trigger');
        return;
      }

      if (this.isProcessing) {
        console.log('Code shortcut ignored - already processing');
        new Notification({
          title: 'Reading Helper',
          body: 'Already processing... please wait'
        }).show();
        return;
      }

      this.lastShortcutTrigger = now;
      this.isProcessing = true;
      
      // Handle code explanation - timeout handled by AIService
      this.handleCodeExplanationShortcut()
        .catch(error => {
          console.error('Code explanation handler failed:', error);
          new Notification({
            title: 'Reading Helper Error',
            body: 'Code explanation failed. Please try again.'
          }).show();
        })
        .finally(() => {
          this.isProcessing = false;
        });
    });

    if (!ret) {
      console.log('Registration failed for main shortcut');
      new Notification({
        title: 'Reading Helper',
        body: `Failed to register shortcut ${shortcut}. Another app might be using it.`
      }).show();
    } else {
      console.log(`Shortcut ${shortcut} registered successfully`);
    }

    if (!thoroughRet) {
      console.log('Registration failed for thorough explanation shortcut');
      new Notification({
        title: 'Reading Helper',
        body: `Failed to register thorough explanation shortcut ${thoroughShortcut}. Another app might be using it.`
      }).show();
    } else {
      console.log(`Thorough explanation shortcut ${thoroughShortcut} registered successfully`);
    }

    if (!codeRet) {
      console.log('Registration failed for code explanation shortcut');
      new Notification({
        title: 'Reading Helper',
        body: `Failed to register code explanation shortcut ${codeShortcut}. Another app might be using it.`
      }).show();
    } else {
      console.log(`Code explanation shortcut ${codeShortcut} registered successfully`);
    }

    // Show welcome notification with all shortcuts
    if (ret || thoroughRet || codeRet) {
      const shortcuts = [];
      if (ret) shortcuts.push(shortcut + ' for quick explanations');
      if (thoroughRet) shortcuts.push(thoroughShortcut + ' for thorough analysis');
      if (codeRet) shortcuts.push(codeShortcut + ' for code explanations');
      
      new Notification({
        title: 'Reading Helper Active',
        body: `Ready! ${shortcuts.join(', ')}!`
      }).show();
    }
  }

  async handleExplainShortcut() {
    const shortcutStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Shortcut Cmd+Shift+D pressed - starting timer`);
    
    try {
      // CRITICAL: Capture window info IMMEDIATELY before Reading Helper takes focus
      console.log('Capturing active window info before Reading Helper takes focus...');
      const originalWindowInfo = await this.windowCapture.getActiveWindowInfo();
      console.log('Original window info captured:', originalWindowInfo);
      
      console.log('Shortcut triggered - starting optimized text extraction and screenshot capture');
      
      // Show notification
      new Notification({
        title: 'Reading Helper',
        body: 'Capturing text and screenshot...'
      }).show();

      // Strategy: Copy text first (needs original window focus), then screenshot
      // This is actually faster than true concurrency due to focus conflicts
      console.log('Starting text copying...');
      const textResult = await this.performTextCopying();

      // Screenshot can happen after, using the original window info we captured
      console.log('Starting screenshot capture with original window info...');
      const screenshotResult = await this.performScreenshotCapture(originalWindowInfo);
      console.log(`Total operations completed`);

      // Check text copying result
      if (!textResult.success) {
        new Notification({
          title: 'Reading Helper',
          body: 'Failed to copy text. Please try again.'
        }).show();
        return;
      }

      const selectedText = textResult.text;
      if (!selectedText || selectedText.trim().length < 3) {
        console.log('DEBUG: No valid text found. Clipboard content:', `"${selectedText}"`);
        new Notification({
          title: 'Reading Helper',
          body: 'No text selected. Please select text first, then try the shortcut.'
        }).show();
        return;
      }

      console.log('Valid text extracted:', selectedText.substring(0, 50) + '...');

      // Use screenshot result or the original window info we captured
      let windowInfo = screenshotResult.windowInfo || originalWindowInfo;
      if (!screenshotResult.success) {
        console.log('Screenshot capture failed, using original window info');
        windowInfo = originalWindowInfo || {
          appName: 'Unknown App',
          windowTitle: 'Active Window', 
          platform: process.platform
        };
      }
      
      new Notification({
        title: 'Reading Helper',
        body: 'Analyzing with AI...'
      }).show();

      // Create initial context data without explanation to show loading screen immediately
      const initialContextData = {
        selectedText: selectedText,
        windowInfo: windowInfo,
        source: 'pending'
        // No explanation field - this will trigger loading screen
      };
      
      // Show explanation window immediately with loading screen
      console.log('Showing explanation window with loading screen...');
      const explanationWindow = await this.windowManager.showExplanation(initialContextData);

      // Now gather context and get AI explanation in the background
      console.log('Gathering context with pre-captured screenshot...');
      const contextData = await this.contextGatherer.gatherContextForSelectedText(
        selectedText, 
        windowInfo, 
        screenshotResult.success ? screenshotResult : null
      );
      
      // Send the complete explanation to the specific window we just created
      if (contextData && contextData.explanation) {
        console.log('Sending explanation to window...');
        this.windowManager.sendExplanationToWindow(contextData, explanationWindow);
      }
      
      // Success notification
      new Notification({
        title: 'Reading Helper',
        body: `Ready to explain: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`
      }).show();
      
      const totalDuration = Date.now() - shortcutStartTime;
      console.log(`[${new Date().toISOString()}] Shortcut handling completed successfully - Total time from Cmd+Shift+D to explanation showing: ${totalDuration}ms`);
      
    } catch (error) {
      const totalDuration = Date.now() - shortcutStartTime;
      console.error(`[${new Date().toISOString()}] Error handling explain shortcut after ${totalDuration}ms:`, error);
      new Notification({
        title: 'Reading Helper Error',
        body: 'Failed to process text. Please try again.'
      }).show();
      
      throw error;
    }
  }

  async performTextCopying() {
    try {
      console.log('Starting text copying operation...');
      
      // Simple approach: Save clipboard, copy, get text, restore
      console.log('Saving current clipboard...');
      const clipboardSaver = ClipboardManager.saveClipboard();
      const originalClipboard = clipboard.readText();
      console.log('DEBUG: Original clipboard length:', originalClipboard.length);
      
      // Clear clipboard before copying to ensure we get fresh content
      clipboard.writeText('');
      await new Promise(resolve => setTimeout(resolve, 20)); // Minimal wait - clipboard clears quickly
      
      console.log('Copying selected text...');
      const copySuccess = await ClipboardManager.copySelectedText();
      
      if (!copySuccess) {
        clipboardSaver.restore();
        return { success: false, error: 'Copy operation failed' };
      }
      
      // Small wait to ensure clipboard has updated - minimized for performance
      await new Promise(resolve => setTimeout(resolve, 30)); // Minimal wait for clipboard
      
      console.log('Getting clipboard text...');
      const selectedText = ClipboardManager.getClipboardText();
      console.log('DEBUG: Clipboard after copy length:', selectedText.length);
      
      // Validate that we actually got new content (not the cleared clipboard)
      if (!selectedText || selectedText.trim().length === 0) {
        console.log('DEBUG: No text found, attempting retry...');
        
        // Single retry with minimal wait
        await new Promise(resolve => setTimeout(resolve, 75));
        const retryText = ClipboardManager.getClipboardText();
        
        if (!retryText || retryText.trim().length === 0) {
          clipboardSaver.restore();
          return { success: false, error: 'No text was copied to clipboard' };
        }
        
        console.log('DEBUG: Retry successful, got text length:', retryText.length);
        clipboardSaver.restore();
        return { success: true, text: retryText };
      }
      
      // Restore original clipboard
      clipboardSaver.restore();
      
      console.log('Text copying operation completed successfully');
      return { success: true, text: selectedText };
      
    } catch (error) {
      console.error('Error in text copying operation:', error);
      return { success: false, error: error.message };
    }
  }

  async performScreenshotCapture(originalWindowInfo = null) {
    try {
      console.log('Starting screenshot capture operation...');
      
      // Use the original window info that was captured before Reading Helper took focus
      const windowInfo = originalWindowInfo || await this.windowCapture.getActiveWindowInfo();
      console.log('Using window info for screenshot:', windowInfo);
      
      let windowCapture = await this.windowCapture.captureActiveWindow(windowInfo);
      
      if (!windowCapture.success) {
        console.log('Screenshot capture failed:', windowCapture.error);
        return { 
          success: false, 
          error: windowCapture.error,
          windowInfo: windowCapture.windowInfo || windowInfo 
        };
      }

      console.log('Screenshot capture operation completed successfully');
      return { 
        success: true, 
        image: windowCapture.image,
        windowInfo: windowCapture.windowInfo || windowInfo 
      };
      
    } catch (error) {
      console.error('Error in screenshot capture operation:', error);
      return { 
        success: false, 
        error: error.message,
        windowInfo: {
          appName: 'Unknown App',
          windowTitle: 'Active Window', 
          platform: process.platform
        }
      };
    }
  }

  async handleThoroughExplanationShortcut() {
    const shortcutStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Shortcut Cmd+Shift+E pressed - starting timer`);
    
    try {
      // CRITICAL: Capture window info IMMEDIATELY before Reading Helper takes focus
      console.log('Capturing active window info before Reading Helper takes focus...');
      const originalWindowInfo = await this.windowCapture.getActiveWindowInfo();
      console.log('Original window info captured:', originalWindowInfo);
      
      console.log('Thorough explanation shortcut triggered - starting text extraction and screenshot capture');
      
      // Show notification
      new Notification({
        title: 'Reading Helper - Thorough Analysis',
        body: 'Capturing text and screenshot for comprehensive explanation...'
      }).show();

      // Simple approach: Save clipboard, copy, get text, restore
      console.log('Saving current clipboard...');
      const clipboardSaver = ClipboardManager.saveClipboard();
      
      // Clear clipboard before copying to ensure we get fresh content
      clipboard.writeText('');
      await new Promise(resolve => setTimeout(resolve, 50)); // Increased for reliability
      
      console.log('Copying selected text for thorough analysis...');
      const copySuccess = await ClipboardManager.copySelectedText();
      
      // Extra delay to ensure clipboard has updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (!copySuccess) {
        new Notification({
          title: 'Reading Helper - Thorough Analysis',
          body: 'Failed to copy text. Please try again.'
        }).show();
        clipboardSaver.restore();
        return;
      }
      
      console.log('Getting clipboard text for thorough analysis...');
      const selectedText = ClipboardManager.getClipboardText();
      
      // Restore original clipboard
      clipboardSaver.restore();
      
      if (!selectedText || selectedText.trim().length < 3) {
        new Notification({
          title: 'Reading Helper - Thorough Analysis',
          body: 'No text selected. Please select text first.'
        }).show();
        return;
      }
      
      console.log('Valid text extracted for thorough analysis:', selectedText.substring(0, 50) + '...');
      
      // Capture screenshot with window position info for thorough analysis
      console.log('Capturing screenshot for thorough analysis...');
      const screenshotResult = await this.performScreenshotCapture(originalWindowInfo);
      
      new Notification({
        title: 'Reading Helper - Thorough Analysis',
        body: 'Performing comprehensive AI analysis...'
      }).show();

      // Use screenshot result or the original window info we captured
      let windowInfo = screenshotResult.windowInfo || originalWindowInfo;
      if (!screenshotResult.success) {
        console.log('Screenshot capture failed for thorough analysis, using original window info');
        windowInfo = originalWindowInfo || {
          appName: 'Direct Analysis',
          windowTitle: 'Thorough Explanation',
          platform: process.platform
        };
      }

      // Create context data structure for the window display first (streaming mode)
      const contextData = {
        selectedText: selectedText,
        isThorough: true,
        // We don't include explanation here as it will be streamed
        // Minimal context data since we're skipping context gathering
        beforeContext: '',
        afterContext: '',
        fullContext: selectedText,
        source: 'thorough-analysis',
        windowInfo: windowInfo // Now includes actual window bounds for positioning
      };
      
      // Show explanation window immediately to start streaming
      console.log('Showing thorough explanation window for streaming...');
      const explanationWindow = await this.windowManager.showExplanation(contextData);
      
      const totalDuration = Date.now() - shortcutStartTime;
      console.log(`[${new Date().toISOString()}] Thorough explanation window shown - Total time from Cmd+Shift+E to window display: ${totalDuration}ms`);
      
      // The AI service will be called by the window via IPC, enabling streaming
      console.log('Thorough explanation streaming started...');

      // Success notification
      new Notification({
        title: 'Reading Helper - Streaming Analysis',
        body: `Analysis in progress: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`
      }).show();
      
      const duration = Date.now() - shortcutStartTime;
      console.log(`[${new Date().toISOString()}] Thorough explanation completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - shortcutStartTime;
      console.error(`[${new Date().toISOString()}] Error handling thorough explanation shortcut after ${duration}ms:`, error);
      new Notification({
        title: 'Reading Helper - Analysis Error',
        body: 'Failed to process thorough explanation. Please try again.'
      }).show();
      
      throw error;
    }
  }

  async handleCodeExplanationShortcut() {
    const shortcutStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Shortcut Cmd+Shift+C pressed - starting code explanation timer`);
    
    try {
      // CRITICAL: Capture window info IMMEDIATELY before Reading Helper takes focus
      console.log('Capturing active window info before Reading Helper takes focus...');
      const originalWindowInfo = await this.windowCapture.getActiveWindowInfo();
      console.log('Original window info captured:', originalWindowInfo);
      
      console.log('Code explanation shortcut triggered - starting text extraction and screenshot capture');
      
      // Show notification
      new Notification({
        title: 'Reading Helper - Code Analysis',
        body: 'Capturing code and screenshot for analysis...'
      }).show();

      // Strategy: Copy text first (needs original window focus), then screenshot
      console.log('Starting text copying for code analysis...');
      const textResult = await this.performTextCopying();

      // Screenshot can happen after, using the original window info we captured
      console.log('Starting screenshot capture with original window info...');
      const screenshotResult = await this.performScreenshotCapture(originalWindowInfo);
      console.log(`Total operations completed for code analysis`);

      // Check text copying result
      if (!textResult.success) {
        new Notification({
          title: 'Reading Helper - Code Analysis',
          body: 'Failed to copy code. Please try again.'
        }).show();
        return;
      }

      const selectedText = textResult.text;
      if (!selectedText || selectedText.trim().length < 3) {
        console.log('DEBUG: No valid code found. Clipboard content:', `"${selectedText}"`);
        new Notification({
          title: 'Reading Helper - Code Analysis',
          body: 'No code selected. Please select code first, then try the shortcut.'
        }).show();
        return;
      }

      console.log('Valid code extracted:', selectedText.substring(0, 50) + '...');

      // Use screenshot result or the original window info we captured
      let windowInfo = screenshotResult.windowInfo || originalWindowInfo;
      if (!screenshotResult.success) {
        console.log('Screenshot capture failed, using original window info');
        windowInfo = originalWindowInfo || {
          appName: 'Code Editor',
          windowTitle: 'Code Analysis', 
          platform: process.platform
        };
      }
      
      new Notification({
        title: 'Reading Helper - Code Analysis',
        body: 'Analyzing code with AI...'
      }).show();

      // Create initial context data for code analysis
      const initialContextData = {
        selectedText: selectedText,
        windowInfo: windowInfo,
        source: 'code-analysis',
        isCode: true
        // No explanation field - this will trigger loading screen
      };
      
      // Show explanation window immediately with loading screen to start streaming
      console.log('Showing code explanation window for streaming...');
      const explanationWindow = await this.windowManager.showExplanation(initialContextData);

      // Success notification
      new Notification({
        title: 'Reading Helper - Code Analysis',
        body: `Code analysis in progress: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`
      }).show();
      
      const totalDuration = Date.now() - shortcutStartTime;
      console.log(`[${new Date().toISOString()}] Code explanation window shown - Total time from Cmd+Shift+C to window display: ${totalDuration}ms`);
      
      // The AI service will be called by the window via IPC, enabling streaming
      console.log('Code explanation streaming started...');
      
      const duration = Date.now() - shortcutStartTime;
      console.log(`[${new Date().toISOString()}] Code explanation completed successfully in ${duration}ms`);
      
    } catch (error) {
      const totalDuration = Date.now() - shortcutStartTime;
      console.error(`[${new Date().toISOString()}] Error handling code explanation shortcut after ${totalDuration}ms:`, error);
      new Notification({
        title: 'Reading Helper - Code Analysis Error',
        body: 'Failed to analyze code. Please try again.'
      }).show();
      
      throw error;
    }
  }

  async testWithSampleText() {
    console.log('Testing with sample text...');
    
    const sampleText = `Reading Helper is a desktop application that responds to keyboard shortcuts and explains highlighted text by automatically gathering surrounding context. The app captures text directly from the active window without requiring manual copying, making it perfect for understanding complex documents, research papers, or any text content.`;
    
    const sampleContext = {
      selectedText: "explains highlighted text by automatically gathering surrounding context",
      beforeContext: "Reading Helper is a desktop application that responds to keyboard shortcuts and",
      afterContext: "The app captures text directly from the active window without requiring manual copying, making it perfect for understanding complex documents, research papers, or any text content.",
      fullContext: sampleText,
      windowInfo: {
        appName: 'Reading Helper',
        windowTitle: 'Sample Test',
        platform: process.platform
      }
    };
    
    new Notification({
      title: 'Reading Helper',
      body: 'Testing with sample text...'
    }).show();
    
    await this.windowManager.showExplanation(sampleContext);
  }
  
  async testShortcutWithoutOCR() {
    console.log('Testing shortcut functionality without OCR...');
    
    const sampleText = "explains highlighted text by automatically gathering surrounding context";
    
    // Simulate clipboard content
    const { clipboard } = require('electron');
    clipboard.writeText(sampleText);
    
    // Create mock window info
    const mockWindowInfo = {
      appName: 'TextEdit',
      windowTitle: 'Test Document',
      platform: process.platform
    };
    
    console.log('Getting context without OCR...');
    
    // Temporarily disable OCR for this test
    const originalOCREnabled = this.contextGatherer.ocrConfig.enabled;
    this.contextGatherer.ocrConfig.enabled = false;
    
    try {
      const contextData = await this.contextGatherer.gatherContextForSelectedText(sampleText, mockWindowInfo);
      
      console.log('Context data received:', {
        selectedText: contextData.selectedText,
        source: contextData.source,
        hasBeforeContext: !!contextData.beforeContext,
        hasAfterContext: !!contextData.afterContext
      });
      
      // Show explanation window
      await this.windowManager.showExplanation(contextData);
      
    } finally {
      // Restore OCR setting
      this.contextGatherer.ocrConfig.enabled = originalOCREnabled;
    }
  }

  async testCodeExplanation() {
    console.log('Testing code explanation functionality...');
    
    const sampleCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;
    
    // Simulate clipboard content with code
    const { clipboard } = require('electron');
    clipboard.writeText(sampleCode);
    
    // Create mock window info for code editor
    const mockWindowInfo = {
      appName: 'VS Code',
      windowTitle: 'fibonacci.js',
      platform: process.platform
    };
    
    console.log('Testing code explanation with streaming...');
    
    // Create code context data for streaming
    const codeContextData = {
      selectedText: sampleCode,
      windowInfo: mockWindowInfo,
      source: 'code-test',
      isCode: true
      // No explanation field - this will trigger streaming mode
    };
    
    console.log('Code context data prepared:', {
      hasSelectedText: !!codeContextData.selectedText,
      source: codeContextData.source,
      isCode: codeContextData.isCode
    });
    
    // Show code explanation window for streaming (similar to thorough explanations)
    await this.windowManager.showExplanation(codeContextData);
    
    console.log('✓ Code explanation test completed - streaming window shown');
  }

  /**
   * Test MathJax rendering functionality
   */
  async testMathJax() {
    console.log('Testing MathJax rendering...');
    
    // Sample text with mathematical equations
    const mathText = `
    **Mathematical Examples:**
    
    • The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
    
    • Einstein's mass-energy equation: $E = mc^2$
    
    • Integral example: $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
    
    • Summation notation: $$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$
    
    • Matrix notation: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$
    `;
    
    const mockWindowInfo = {
      appName: 'MathJax Test',
      windowTitle: 'Mathematical Equations Test',
      platform: process.platform
    };
    
    // Create math context data with pre-formatted explanation
    const mathContextData = {
      selectedText: 'Mathematical equations test',
      explanation: mathText,
      windowInfo: mockWindowInfo,
      source: 'mathjax-test',
      wordCount: 25
    };
    
    console.log('Math context data prepared:', {
      hasSelectedText: !!mathContextData.selectedText,
      hasExplanation: !!mathContextData.explanation,
      source: mathContextData.source
    });
    
    // Show explanation window with math equations
    await this.windowManager.showExplanation(mathContextData);
    
    console.log('✓ MathJax test completed - window shown with math equations');
  }

  /**
   * Check if the app has accessibility permissions (macOS only)
   * Will prompt the user with a helpful notification if permissions are needed
   */
  checkAccessibilityPermissions() {
    try {
      console.log('Checking macOS accessibility permissions...');
      const result = execSync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"', { 
        timeout: 1000, // Reduced from 2000ms
        stdio: ['pipe', 'pipe', 'pipe'] // Capture stderr
      });
      
      console.log('Accessibility permissions OK');
      return true;
      
    } catch (error) {
      console.warn('Accessibility permissions check failed:', error.message);
      
      // Show helpful notification about permissions
      new Notification({
        title: 'Reading Helper - Permissions Needed',
        body: 'Please grant Accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility for text selection to work.'
      }).show();
      
      return false;
    }
  }
}

module.exports = ShortcutHandler;
