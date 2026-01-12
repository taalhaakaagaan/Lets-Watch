const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startServer: (port, config) => ipcRenderer.invoke('start-server', port, config),
    resolveId: (id) => ipcRenderer.invoke('resolve-id', id),
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
    joinRoom: (ip) => console.log('Connecting to', ip)
});
