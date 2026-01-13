const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
    joinRoom: (ip) => console.log('Connecting to', ip), // Legacy/Unused maybe?
    sendVerificationEmail: (email) => ipcRenderer.invoke('send-verification-email', email),
    verifyEmailCode: (data) => ipcRenderer.invoke('verify-email-code', data)
});
