/**
 * ClipboardManager.js - Handles cross-platform clipboard operations with improved reliability
 */

const { clipboard } = require('electron');
const { execSync } = require('child_process');

class ClipboardManager {
  /**
   * Copy selected text to clipboard - simple approach
   */
  static async copySelectedText() {
    try {
      console.log('Sending copy command...');
      
      if (process.platform === 'darwin') {
        // Get the frontmost application first, then send copy command to it
        try {
          // Use a simpler approach that doesn't require app name
          // This is more reliable across different apps
          execSync(`osascript -e '
            tell application "System Events"
              # Get the frontmost process first
              set frontProcess to first process whose frontmost is true
              # Then send command+c to that process
              tell frontProcess
                keystroke "c" using {command down}
              end tell
            end tell'`, { 
              timeout: 800, 
              stdio: ['pipe', 'pipe', 'ignore']  // Ignore stderr for better performance
            });
          
          console.log('Direct copy command sent successfully');
          
          // Minimal wait - clipboard updates almost immediately
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (appError) {
          console.log('App-specific copy failed, using generic approach');
          // Fallback to generic approach with reduced timeout
          execSync('osascript -e \'tell application "System Events" to keystroke "c" using command down\'', { timeout: 800 }); // Increased from 600ms
        }
      } else if (process.platform === 'win32') {
        execSync('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"', { timeout: 600 }); // Reduced
      } else {
        execSync('xdotool key ctrl+c', { timeout: 600 }); // Reduced
      }
      
      // Minimal wait for copy to complete - optimized for sequential operations
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced to 100ms - sufficient for clipboard updates
      
      console.log('Copy command sent');
      return true;
      
    } catch (error) {
      console.error('Copy failed:', error.message);
      return false;
    }
  }
  
  /**
   * Get text from clipboard - simple approach
   */
  static getClipboardText() {
    try {
      const text = clipboard.readText();
      if (text && text.trim().length > 0) {
        console.log('Got clipboard text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        return text.trim();
      }
      return '';
    } catch (error) {
      console.error('Failed to read clipboard:', error.message);
      return '';
    }
  }
  
  /**
   * Save current clipboard content and restore it later
   */
  static saveClipboard() {
    const savedContent = clipboard.readText();
    
    return {
      restore: () => {
        clipboard.writeText(savedContent);
        return savedContent;
      }
    };
  }
}

module.exports = ClipboardManager;
