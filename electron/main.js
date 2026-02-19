const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

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

    // In production, load the built index.html
    // In dev, load localhost
    // Checking environment variable or standard pattern
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

    // Check if we are in development mode (by checking if the URL is accessible or just by a flag)
    // A simple heuristic: if ELECTRON_START_URL is set, we try to use it.
    // However, if the user just cloned and ran 'npm start' without .env, 
    // process.env.ELECTRON_START_URL might be undefined.

    // We can try to load the local file if the dev server isn't explicitly requested or if we are packaged.
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
        mainWindow.loadURL(startUrl).catch(err => {
            console.log("Failed to load start URL, falling back to build or explaining error:", err);
            // Optionally load a simple error page or the dist file if exists
            // mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }

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

// --- Email Verification System ---
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure you installed dotenv if not already present, or use process.env directly if managed elsewhere. 
// For this environment, we'll try to load it or expect vars to be present. 
// Since dotenv isn't in package.json, we'll assume the user might need to install it or we skip it if they set env vars globally.
// Let's add dotenv usage for safety if they create the .env file.
try { require('dotenv').config(); } catch (e) { }

// Temporary storage for verification codes
const verificationCodes = new Map(); // email -> { code, expires }

// Transporter (Configure this in .env)
// Transporter (Configure this in .env)
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    console.warn("SMTP credentials not found in env. Email verification will be disabled.");
}

ipcMain.handle('send-verification-email', async (event, email) => {
    if (!transporter) {
        return { success: false, error: 'Email service is not configured.' };
    }
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        verificationCodes.set(email, { code, expires });

        // Clean up code after expiration
        setTimeout(() => verificationCodes.delete(email), 5 * 60 * 1000);

        const mailOptions = {
            from: `"Let's Watch" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your Verification Code - Let\'s Watch',
            text: `Your verification code is: ${code}\n\nIt expires in 5 minutes.`,
            html: `<div style="font-family: sans-serif; padding: 20px; background: #f4f4f4;">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <h2 style="color: #333;">Welcome to Let's Watch! 🍿</h2>
                        <p style="font-size: 16px;">Here is your verification code to get started:</p>
                        <h1 style="color: #FF8E53; letter-spacing: 5px;">${code}</h1>
                        <p style="color: #666; font-size: 12px;">This code expires in 5 minutes.</p>
                    </div>
                   </div>`
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email Error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('verify-email-code', async (event, { email, code }) => {
    const record = verificationCodes.get(email);
    if (!record) return { success: false, error: 'Code expired or not found.' };

    if (Date.now() > record.expires) {
        verificationCodes.delete(email);
        return { success: false, error: 'Code expired.' };
    }

    if (record.code === code) {
        verificationCodes.delete(email); // One-time use
        return { success: true };
    } else {
        return { success: false, error: 'Invalid code.' };
    }
});
