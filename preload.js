const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('envVar', {
  // host: 'http://localhost:3000',
  host: 'https://52.192.169.95',
});
