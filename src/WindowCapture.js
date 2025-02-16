/**
 * WindowCapture.js - Handles active window detection and capture
 */

const { desktopCapturer } = require('electron');
const { execSync } = require('child_process');

class WindowCapture {
  constructor() {
    this.startupTime = Date.now();
  }



  async captureActiveWindow(windowInfo = null) {
    const startTime = Date.now();
    const operations = [];
    
    try {
      if (process.platform === 'darwin') {
        operations.push({ name: 'AppleScript Execution', status: 'Starting', duration: 0 });
        const scriptStart = Date.now();
        
        // macOS: Use AppleScript to get frontmost window and capture it directly
        const captureScript = `
          tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set appName to name of frontApp
            set frontWindow to first window of frontApp
            set windowName to name of frontWindow
            set {x, y} to position of frontWindow
            set {w, h} to size of frontWindow
          end tell
          
          set tempFile to "/tmp/reading_helper_screenshot.jpg"
          do shell script "screencapture -x -R" & x & "," & y & "," & w & "," & h & " " & tempFile
          
          -- Resize the screenshot to max 800px width while maintaining aspect ratio
          do shell script "sips -Z 800 " & tempFile
          
          return appName & "|" & windowName & "|" & tempFile & "|" & x & "," & y & "," & w & "," & h
        `;
        
        const result = execSync(`osascript -e '${captureScript}'`, { 
          encoding: 'utf8', 
          timeout: 2000 
        }).trim();
        
        operations[0].status = 'Completed';
        operations[0].duration = Date.now() - scriptStart;
        
        console.log('Raw AppleScript result:', result);
        
        const parts = result.split('|');
        // Ensure we have at least 4 parts: app name, window name(s), file path, and window bounds
        if (parts.length < 4) {
          throw new Error(`Invalid AppleScript result format: ${result}`);
        }
        
        // Handle window titles that contain pipe characters
        const appName = parts[0];
        const windowBounds = parts[parts.length - 1]; // Last part is window bounds
        const tempFile = parts[parts.length - 2]; // Second to last part is file path
        const windowName = parts.slice(1, -2).join('|'); // Everything between first and last two parts
        
        // Parse window bounds (x,y,width,height)
        const [x, y, width, height] = windowBounds.split(',').map(Number);
        
        operations.push({ name: 'File Processing', status: 'Starting', duration: 0 });
        const fileStart = Date.now();
        
        // Validate temp file path
        if (!tempFile || tempFile.trim() !== '/tmp/reading_helper_screenshot.jpg') {
          console.log(`Warning: Unexpected temp file path: "${tempFile}"`);
          // Use hardcoded path if AppleScript returned something strange
          const fixedTempFile = '/tmp/reading_helper_screenshot.jpg';
          console.log(`Using fixed path: ${fixedTempFile}`);
          
          // Skip our own app - be more specific to avoid rejecting other Electron apps like VS Code
          if (appName.toLowerCase().includes('reading helper') || 
              (appName.toLowerCase().includes('electron') && windowName.toLowerCase().includes('reading'))) {
            throw new Error('Reading Helper is the frontmost app');
          }
          
          // Read the screenshot file and convert to base64
          const fs = require('fs');
          try {
            const imageBuffer = fs.readFileSync(fixedTempFile);
            const imageBase64 = `data:image/jpg;base64,${imageBuffer.toString('base64')}`;
            
            // Clean up temp file
            try { fs.unlinkSync(fixedTempFile); } catch (e) { console.log('Error cleaning up temp file:', e.message); }
            
            operations[1].status = 'Completed';
            operations[1].duration = Date.now() - fileStart;
            
            console.log(`✓ Captured frontmost window: "${windowName}" from app "${appName}"`);
            
            const totalDuration = Date.now() - startTime;
            console.log(`Total capture duration: ${totalDuration}ms`);
            console.log('Operations performed:', operations);
            
            return {
              success: true,
              name: windowName,
              appName: appName,
              image: imageBase64,
              method: 'applescript-direct-fixed-path',
              windowInfo: {
                appName: appName,
                windowTitle: windowName,
                platform: 'darwin',
                windowBounds: { x: x, y: y, width: width, height: height }
              }
            };
          } catch (readError) {
            throw new Error(`Failed to read screenshot file: ${readError.message}`);
          }
        }
        
        // Skip our own app - be more specific to avoid rejecting other Electron apps like VS Code
        if (appName.toLowerCase().includes('reading helper') || 
            (appName.toLowerCase().includes('electron') && windowName.toLowerCase().includes('reading'))) {
          throw new Error('Reading Helper is the frontmost app');
        }
        
        // Read the screenshot file and convert to base64
        const fs = require('fs');
        const imageBuffer = fs.readFileSync(tempFile);
        const imageBase64 = `data:image/jpg;base64,${imageBuffer.toString('base64')}`;
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch (e) { console.log('Error cleaning up temp file:', e.message); }
        
        operations[1].status = 'Completed';
        operations[1].duration = Date.now() - fileStart;
        
        console.log(`✓ Captured frontmost window: "${windowName}" from app "${appName}"`);
        
        const totalDuration = Date.now() - startTime;
        console.log(`Total capture duration: ${totalDuration}ms`);
        console.log('Operations performed:', operations);
        
        return {
          success: true,
          name: windowName,
          appName: appName,
          image: imageBase64,
          method: 'applescript-direct',
          windowInfo: {
            appName: appName,
            windowTitle: windowName,
            platform: 'darwin',
            windowBounds: { x: x, y: y, width: width, height: height }
          }
        };
        
      } else {
        // Non-macOS: Fall back to Electron desktopCapturer
        operations.push({ name: 'Desktop Capturer', status: 'Starting', duration: 0 });
        const capturerStart = Date.now();
        
        const sources = await desktopCapturer.getSources({
          types: ['window'],
          thumbnailSize: { width: 800, height: 600 }, // Reduced resolution for faster API processing
          fetchWindowIcons: false
        });
        
        const goodWindows = sources.filter(source => {
          const name = source.name.toLowerCase();
          const size = source.thumbnail.getSize();
          return !name.includes('reading helper') && 
                 size.width > 100 && 
                 size.height > 50;
        });
        
        if (goodWindows.length === 0) {
          throw new Error('No suitable windows found');
        }
        
        const selectedWindow = goodWindows[0];
        console.log(`Selected window: ${selectedWindow.name}`);
        
        operations[0].status = 'Completed';
        operations[0].duration = Date.now() - capturerStart;
        
        const totalDuration = Date.now() - startTime;
        console.log(`Total capture duration: ${totalDuration}ms`);
        console.log('Operations performed:', operations);
        
        return {
          success: true,
          name: selectedWindow.name,
          image: selectedWindow.thumbnail.toDataURL(),
          method: 'electron-fallback'
        };
      }
      
    } catch (error) {
      console.error('Error capturing active window:', error);
      
      const totalDuration = Date.now() - startTime;
      console.log(`Failed capture duration: ${totalDuration}ms`);
      console.log('Operations attempted:', operations);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getActiveWindowInfo() {
    try {
      if (process.platform === 'darwin') {
        // macOS: Get frontmost app info
        const frontmostApp = execSync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"', { encoding: 'utf8', timeout: 500 }).trim();
        
        return {
          appName: frontmostApp,
          windowTitle: frontmostApp,
          platform: 'darwin'
        };
      } else if (process.platform === 'linux') {
        // Linux: Ultra-fast execution with minimal timeouts
        try {
          const windowId = execSync('xdotool getactivewindow', { encoding: 'utf8', timeout: 800 }).trim();
          const windowTitle = execSync(`xdotool getwindowname ${windowId}`, { encoding: 'utf8', timeout: 800 }).trim();
          const windowClass = execSync(`xprop -id ${windowId} WM_CLASS | cut -d'"' -f2`, { encoding: 'utf8', timeout: 800 }).trim();
          
          return {
            appName: windowClass || 'unknown',
            windowTitle: windowTitle || '',
            platform: 'linux'
          };
        } catch (linuxError) {
          console.log('xdotool failed, trying wmctrl fallback:', linuxError.message);
          try {
            // Fallback to wmctrl if available
            const wmctrlOutput = execSync('wmctrl -a :ACTIVE:', { encoding: 'utf8', timeout: 2000 }).trim();
            const parts = wmctrlOutput.split(' ');
            return {
              appName: parts[parts.length - 1] || 'unknown',
              windowTitle: parts.slice(4).join(' ') || '',
              platform: 'linux'
            };
          } catch (wmctrlError) {
            console.log('wmctrl also failed:', wmctrlError.message);
            return { appName: 'unknown', windowTitle: '', platform: 'linux' };
          }
        }
      } else if (process.platform === 'win32') {
        // Windows: Use PowerShell with improved error handling
        try {
          const psScript = `
            Add-Type -TypeDefinition "
              using System;
              using System.Runtime.InteropServices;
              using System.Text;
              public class Win32 {
                [DllImport(\\"user32.dll\\")]
                public static extern IntPtr GetForegroundWindow();
                [DllImport(\\"user32.dll\\")]
                public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
                [DllImport(\\"user32.dll\\")]
                public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
              }
            "
            $hwnd = [Win32]::GetForegroundWindow()
            $sb = New-Object System.Text.StringBuilder 256
            [Win32]::GetWindowText($hwnd, $sb, $sb.Capacity)
            $windowTitle = $sb.ToString()
            
            $processId = 0
            [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            $processName = if($process) { $process.ProcessName } else { "unknown" }
            
            Write-Output "$processName|$windowTitle"
          `;
          
          const result = execSync(`powershell -command "${psScript}"`, { encoding: 'utf8', timeout: 1500 }).trim();
          const [appName, windowTitle] = result.split('|');
          
          return {
            appName: appName || 'unknown',
            windowTitle: windowTitle || '',
            platform: 'win32'
          };
        } catch (winError) {
          console.log('PowerShell method failed:', winError.message);
          return { appName: 'unknown', windowTitle: '', platform: 'win32' };
        }
      }
      
      return { appName: 'unknown', windowTitle: '', platform: process.platform };
      
    } catch (error) {
      console.error('Error getting active window info:', error);
      return { appName: 'unknown', windowTitle: '', platform: process.platform };
    }
  }
}

module.exports = WindowCapture;
