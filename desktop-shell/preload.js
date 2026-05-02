const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('NATIVE_ID', process.env.NATIVE_ID);

contextBridge.exposeInMainWorld('electron', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printToPrinter: (options) => ipcRenderer.invoke('print-to-printer', options),
  previewPrint: () => ipcRenderer.invoke('preview-print')
});

console.log('Lucky Boba POS Hardware Bridge Active');
