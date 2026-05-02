const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

// CRITICAL: Set User Data Path immediately to local AppData to prevent "Access Denied" on external drives (E:)
try {
  const localAppData = app.getPath('appData');
  const userDataPath = path.join(localAppData, 'LuckyBobaPOS-Shell');
  app.setPath('userData', userDataPath);
} catch (e) {
  // Fallback if appData is somehow unavailable
}

// Aggressive Performance & Stability Flags
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling'); 
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512 --v8-cache-options=code'); 
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-default-apps');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache'); // Prevents "Gpu Cache Creation failed" on E: drive

/**
 * Gets the actual Windows Hardware Serial Number.
 */
function getHardwareId() {
  try {
    if (process.platform === 'win32') {
      let serial = '';
      
      // Method 1: Registry (INSTANT - Best for performance)
      try {
        const regOutput = execSync('reg query "HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS" /v SystemSerialNumber 2>nul').toString();
        const match = regOutput.match(/SystemSerialNumber\s+REG_SZ\s+(.+)/);
        if (match && match[1] && match[1].trim() !== '') {
          serial = match[1].trim();
        }
      } catch (e) { /* skip */ }

      // Method 2: Legacy WMIC (Fast fallback)
      if (!serial || ['0', 'NONE', 'DEFAULT', 'TO BE FILLED'].some(s => serial.toUpperCase().includes(s))) {
        try {
          const output = execSync('wmic bios get serialnumber 2>nul').toString();
          serial = output.split('\n')[1]?.trim();
        } catch (e) { /* skip */ }
      }

      // Method 3: UUID fallback
      if (!serial || ['0', 'NONE', 'DEFAULT', 'TO BE FILLED'].some(s => serial.toUpperCase().includes(s))) {
        try {
          const output = execSync('wmic csproduct get uuid 2>nul').toString();
          serial = output.split('\n')[1]?.trim();
        } catch (e) { /* skip */ }
      }
      
      const genericIds = [
        '0', '00000000', 'NONE', 'DEFAULT STRING', 'TO BE FILLED BY O.E.M.', 'O.E.M', 
        '03000200-0400-0500-0006-000700080009', 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
        '00000000-0000-0000-0000-000000000000'
      ];
      const isGeneric = !serial || genericIds.some(g => serial.toUpperCase().includes(g.toUpperCase()));

      if (isGeneric || !serial) {
        return `WIN-HOST-${require('os').hostname().toUpperCase()}`;
      }
      
      return `WIN-${serial}`.toUpperCase();
    }
    return `PROD-TEST-${require('os').hostname().toUpperCase()}`;
  } catch (e) {
    return 'WIN-UNKNOWN-HARDWARE';
  }
}

const hardwareId = getHardwareId();

// FIX: If GPU fails on some laptops, disable it to prevent "Goodbye" crash
app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('GPU process gone, disabling hardware acceleration...');
    app.disableHardwareAcceleration();
  }
});

// Optimization: Enable print preview and browser features
app.commandLine.appendSwitch('enable-print-browser');
app.commandLine.appendSwitch('enable-print-preview');
app.commandLine.appendSwitch('no-sandbox'); // Improved hardware access for thermal printers
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion'); // Prevent lag when printing
app.commandLine.appendSwitch('ignore-certificate-errors');

function createWindow() {
  const isWindows = process.platform === 'win32';
  
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    fullscreen: isWindows,
    backgroundColor: '#ffffff', // Prevent flicker
    show: false, // Don't show until ready to prevent white flash
    icon: path.join(__dirname, 'lucky.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      offscreen: false,
      spellcheck: false,
      enableRemoteModule: false
    }
  });

  // Handle window.open (used for receipt previews and reports)
  win.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        title: 'Print Preview - Lucky Boba POS',
        backgroundColor: '#ffffff'
      }
    };
  });

  win.once('ready-to-show', () => {
    win.show();
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
