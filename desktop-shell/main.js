const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Gets the actual Windows Hardware Serial Number.
 * This is the ultimate "Device ID" that never changes.
 */
function getHardwareId() {
  try {
    if (process.platform === 'win32') {
      // 1. Try to get BIOS Serial Number
      let output = execSync('wmic bios get serialnumber').toString();
      let serial = output.split('\n')[1]?.trim() || '';
      
      // 2. List of common "fake" or generic serial numbers to ignore
      const genericSerials = ['0', '00000000', 'NONE', 'DEFAULT STRING', 'TO BE FILLED BY O.E.M.', 'O.E.M'];
      const isGeneric = !serial || genericSerials.includes(serial.toUpperCase());

      // 3. Fallback to Motherboard UUID if Serial is generic or missing
      if (isGeneric) {
        output = execSync('wmic csproduct get uuid').toString();
        serial = output.split('\n')[1]?.trim() || 'UNKNOWN-UUID';
      }
      
      return `WIN-${serial}`.toUpperCase();
    } else {
      // For testing production from your laptop
      return `PROD-TEST-${require('os').hostname().toUpperCase()}`;
    }
  } catch (e) {
    return 'DEV-UNKNOWN-HARDWARE';
  }
}

const hardwareId = getHardwareId();

function createWindow() {
  const isWindows = process.platform === 'win32';
  
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    fullscreen: isWindows, // Auto-fullscreen on the Windows tablet
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Always point to production for this test
  const posUrl = 'https://luckybobastores.com'; 
  
  win.loadURL(posUrl);
}

// Make the Hardware ID available to the preload script
process.env.NATIVE_ID = hardwareId;

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
