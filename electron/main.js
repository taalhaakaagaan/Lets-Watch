const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { startServer, createRoom } = require('./server');
const { getLocalIp, ipToId, idToIp } = require('./ipCodec');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // Allow loading local files
        },
        title: "Let's Watch",
        backgroundColor: '#0d0d0d'
    });

    mainWindow.setMenu(null);

    if (process.env.ELECTRON_START_URL) {
        mainWindow.loadURL(process.env.ELECTRON_START_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
    }
    // Open DevTools for debugging
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC: Start Server
ipcMain.handle('start-server', async (event, port, config) => {
    try {
        const actualPort = await startServer(port || 3001);
        const ip = getLocalIp();
        const roomId = ipToId(ip);

        // Register the room configuration
        createRoom(roomId, config);

        return { success: true, port: actualPort, roomId, ip };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// IPC: Resolve Room ID
ipcMain.handle('resolve-id', (event, id) => {
    return idToIp(id);
});

// IPC: Select Video File
ipcMain.handle('select-video-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Movies', extensions: ['mp4', 'mkv', 'avi', 'webapp', 'webm'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});
