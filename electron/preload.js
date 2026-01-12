const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
    joinRoom: (ip) => console.log('Connecting to', ip)
});
