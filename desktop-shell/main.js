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
      let serial = '';
      
      // Method 1: Registry (INSTANT - Best for performance)
      try {
        const regOutput = execSync('reg query "HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS" /v SystemSerialNumber').toString();
        const match = regOutput.match(/SystemSerialNumber\s+REG_SZ\s+(.+)/);
        if (match && match[1]) {
          serial = match[1].trim();
        }
      } catch (e) { /* skip */ }

      // Method 2: Legacy WMIC (Fast fallback)
      if (!serial || ['0', 'NONE', 'DEFAULT', 'TO BE FILLED'].some(s => serial.toUpperCase().includes(s))) {
        try {
          const output = execSync('wmic bios get serialnumber').toString();
          serial = output.split('\n')[1]?.trim();
        } catch (e) { /* skip */ }
      }

      // Method 3: UUID fallback
      if (!serial || ['0', 'NONE', 'DEFAULT', 'TO BE FILLED'].some(s => serial.toUpperCase().includes(s))) {
        try {
          const output = execSync('wmic csproduct get uuid').toString();
          serial = output.split('\n')[1]?.trim();
        } catch (e) { /* skip */ }
      }
      
      const genericSerials = ['0', '00000000', 'NONE', 'DEFAULT STRING', 'TO BE FILLED BY O.E.M.', 'O.E.M'];
      const isGeneric = !serial || genericSerials.includes(serial.toUpperCase());

      // Ultimate Fallback: Hostname
      if (isGeneric || !serial) {
        return `WIN-HOST-${require('os').hostname().toUpperCase()}`;
      }
      
      return `WIN-${serial}`.toUpperCase();
    } else {
      return `PROD-TEST-${require('os').hostname().toUpperCase()}`;
    }
  } catch (e) {
    try {
      return `WIN-FAILBACK-${require('os').hostname().toUpperCase()}`;
    } catch (inner) {
      return 'WIN-UNKNOWN-HARDWARE';
    }
  }
}

// Performance Flags for low-end hardware
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion'); // Prevents lag on Windows
app.commandLine.appendSwitch('no-proxy-server'); // Speeds up initial connection
app.commandLine.appendSwitch('disable-dev-shm-usage'); // Prevents crashes in low memory
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512'); // Caps memory usage for JS

// Note: Hardware acceleration is NOT disabled here by default anymore to improve rendering speed.
// It will only be disabled if a GPU crash is detected below.

const hardwareId = getHardwareId();

// FIX: If GPU fails on some laptops, disable it to prevent "Goodbye" crash
app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('GPU process gone, disabling hardware acceleration...');
    app.disableHardwareAcceleration();
  }
});

function createWindow() {
  const isWindows = process.platform === 'win32';
  
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    fullscreen: isWindows,
    icon: path.join(__dirname, 'lucky.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const posUrl = 'https://luckybobastores.com'; 
  win.loadURL(posUrl);
}

// Make the Hardware ID available to the preload script
process.env.NATIVE_ID = hardwareId;

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
