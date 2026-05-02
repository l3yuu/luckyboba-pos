/**
 * Lucky Boba POS - Hardware ID Service
 * 
 * A tiny HTTP server that runs on localhost:9876 and serves
 * the machine's hardware serial number. This allows the POS
 * website running in regular Google Chrome to read the hardware ID,
 * which is normally blocked by browser security policies.
 * 
 * This replaces the need for the full Electron shell.
 */

const http = require('http');
const { execSync } = require('child_process');
const os = require('os');

const PORT = 9876;

// ── Get Hardware ID (same logic as the Electron shell) ─────────────────────
function getHardwareId() {
  try {
    if (process.platform === 'win32') {
      let serial = '';

      // Method 1: Registry (INSTANT)
      try {
        const regOutput = execSync('reg query "HKLM\\HARDWARE\\DESCRIPTION\\System\\BIOS" /v SystemSerialNumber 2>nul').toString();
        const match = regOutput.match(/SystemSerialNumber\s+REG_SZ\s+(.+)/);
        if (match && match[1] && match[1].trim() !== '') {
          serial = match[1].trim();
        }
      } catch (e) { /* skip */ }

      // Method 2: Legacy WMIC
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
        return `WIN-HOST-${os.hostname().toUpperCase()}`;
      }

      return `WIN-${serial}`.toUpperCase();
    }
    return `PROD-TEST-${os.hostname().toUpperCase()}`;
  } catch (e) {
    return 'WIN-UNKNOWN-HARDWARE';
  }
}

// Cache the hardware ID at startup (it never changes)
const HARDWARE_ID = getHardwareId();

// ── HTTP Server ────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS headers — allow the POS website to read this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Standard API (Works in Chrome, blocked in Firefox via HTTPS)
  if (req.url === '/hardware-id') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: HARDWARE_ID }));
    return;
  }

  // 2. Handshake Redirect (BEST FOR MOZILLA)
  // Bypasses Firefox "Mixed Content" blocks by using a top-level navigation.
  // Usage: http://localhost:9876/handshake?return=https://luckybobastores.com
  if (req.url.startsWith('/handshake')) {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const returnUrl = url.searchParams.get('return');
      if (returnUrl) {
        const separator = returnUrl.includes('?') ? '&' : '?';
        const finalUrl = `${returnUrl}${separator}hwid=${HARDWARE_ID}`;
        console.log(`[Handshake] Redirecting to: ${finalUrl}`);
        res.writeHead(302, { 'Location': finalUrl });
        res.end();
        return;
      }
    } catch (e) {
      console.error('[Handshake] Error:', e.message);
    }
  }

  // 3. Status Check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'LuckyBoba Hardware Bridge',
      hwid: HARDWARE_ID,
      mozilla_ready: true
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '::', () => {
  console.log('----------------------------------------------------');
  console.log(`[Lucky Boba] Hardware Bridge: RUNNING`);
  console.log(`[Lucky Boba] Port:            ${PORT}`);
  console.log(`[Lucky Boba] Hardware ID:      ${HARDWARE_ID}`);
  console.log('----------------------------------------------------');
  console.log(`[Mozilla Fix] If Firefox blocks the connection, use:`);
  console.log(`http://127.0.0.1:${PORT}/handshake?return=https://luckybobastores.com`);
  console.log('----------------------------------------------------');
});

// Graceful shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
