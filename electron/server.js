const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

let io;
let server;
const rooms = {};

function createRoom(roomId, config) {
    rooms[roomId] = {
        config,
        users: []
    };
    console.log(`Room ${roomId} created with config:`, config);
}

function startServer(port) {
    return new Promise((resolve, reject) => {
        if (server) {
            console.log('Server already running on existing port');
            resolve(port);
            return;
        }

        const app = express();
        app.use(cors());

        server = http.createServer(app);
        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('join-room', ({ roomId, userId, username, password }) => {
                // Check if room exists
                if (!rooms[roomId]) {
                    // Implicit creation for legacy/simple mode if not strictly enforced?
                    // For now, let's assume rooms must be created via the new flow, 
                    // BUT for the very first host connecting, they might not have "created" it in this object if we didn't call createRoom yet.
                    // The host calls 'startserver' which calls 'createRoom'. So it should be fine.
                    // However, let's be lenient for now or strict?
                    // Let's be lenient: if room doesn't exist, create default?
                    // No, host creates it.
                }

                const room = rooms[roomId];
                // Defensive check: ensure config exists
                if (room && room.config && room.config.isPrivate) {
                    if (room.config.password !== password) {
                        socket.emit('error', 'Invalid password');
                        return; // Don't join
                    }
                }

                socket.join(roomId);
                // Broadcast to others in room
                socket.to(roomId).emit('user-connected', { userId, username });
                console.log(`User ${username} (${userId}) joined room ${roomId}`);

                socket.on('disconnect', () => {
                    socket.to(roomId).emit('user-disconnected', userId);
                });
            });

            // Chat
            socket.on('send-chat', ({ roomId, message }) => {
                io.to(roomId).emit('chat-message', message);
            });

            // Playback Sync
            socket.on('sync-event', ({ roomId, event, currentTime }) => {
                socket.to(roomId).emit('sync-event', { event, currentTime });
            });

            // WebRTC Signaling
            socket.on('offer', (payload) => {
                io.to(payload.target).emit('offer', payload);
            });

            socket.on('answer', (payload) => {
                io.to(payload.target).emit('answer', payload);
            });

            socket.on('ice-candidate', (payload) => {
                io.to(payload.target).emit('ice-candidate', payload);
            });
        });

        server.listen(port, () => {
            console.log(`Signaling server running on port ${port}`);
            resolve(port);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(startServer(port + 1));
            } else {
                reject(err);
            }
        });
    });
}

module.exports = { startServer, createRoom };
