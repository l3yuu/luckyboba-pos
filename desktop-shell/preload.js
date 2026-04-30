const { contextBridge } = require('electron');

/**
 * This bridge securely passes the Windows Hardware ID 
 * from the tablet to your POS website.
 */
contextBridge.exposeInMainWorld('NATIVE_ID', process.env.NATIVE_ID);

console.log('Windows Hardware Bridge Active');
