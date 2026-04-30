const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Gets the actual Windows Hardware Serial Number.
 * This is the ultimate "Device ID" that never changes.
 */
function getWindowsHardwareId() {
  try {
    // Try to get BIOS Serial Number
    let serial = execSync('wmic bios get serialnumber').toString().split('\n')[1].trim();
    
    // If Serial is generic or missing, use the Motherboard UUID
    if (!serial || serial.includes('O.E.M') || serial === '0') {
      serial = execSync('wmic csproduct get uuid').toString().split('\n')[1].trim();
    }
    
    return `WIN-${serial}`.toUpperCase();
  } catch (e) {
    return 'WIN-UNKNOWN-HARDWARE';
  }
}

const hardwareId = getWindowsHardwareId();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    fullscreen: true, // Best for POS tablets
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // IMPORTANT: The actual POS production URL
  // Your CI/CD will update this website, and the App will load it instantly.
  const posUrl = 'https://luckybobastores.com'; 
  
  win.loadURL(posUrl);
}

// Make the Hardware ID available to the preload script
process.env.NATIVE_ID = hardwareId;

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
