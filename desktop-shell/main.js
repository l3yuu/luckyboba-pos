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
      
      // Method 1: Modern PowerShell (Best for Win 10/11)
      try {
        serial = execSync('powershell -ExecutionPolicy Bypass -Command "(Get-CimInstance -ClassName Win32_BIOS).SerialNumber"').toString().trim();
      } catch (e) { /* skip */ }

      // Method 2: Legacy WMIC (Best for Win 7/8 or if PowerShell is blocked)
      if (!serial || serial === '') {
        try {
          const output = execSync('wmic bios get serialnumber').toString();
          serial = output.split('\n')[1]?.trim();
        } catch (e) { /* skip */ }
      }

      // Method 3: Product UUID fallback
      if (!serial || serial === '') {
        try {
          serial = execSync('powershell -ExecutionPolicy Bypass -Command "(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID"').toString().trim();
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

// Disable Hardware Acceleration proactively to prevent GPU crashes on low-end Windows hardware
app.disableHardwareAcceleration();

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
