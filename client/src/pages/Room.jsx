import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Peer from 'peerjs';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import './Room.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Room Component Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'white', background: '#330000', height: '100vh', overflow: 'auto' }}>
                    <h1>Something went wrong in the Room.</h1>
                    <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.href = '#/dashboard'}
                        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', background: '#444', color: 'white', border: 'none' }}
                    >
                        Return to Dashboard
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', marginLeft: '10px', padding: '10px 20px', cursor: 'pointer', background: '#0066cc', color: 'white', border: 'none' }}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const RoomContent = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const filePath = location.state?.filePath;

    const mode = searchParams.get('mode') || 'viewer';
    const isHost = mode === 'host';
    const maxUsers = isHost ? (location.state?.maxUsers || 5) : null;

    const [peerId, setPeerId] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stream, setStream] = useState(null); // Local (Host) or Remote (Viewer) Stream
    const [messages, setMessages] = useState([]);
    const [countdown, setCountdown] = useState(null);
    const [showStartButton, setShowStartButton] = useState(isHost);

    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const peerRef = useRef(null);
    // Connections ref: { [peerId]: DataConnection }
    const connectionsRef = useRef({});

    // Store my username
    const username = useRef(localStorage.getItem('letswatch_username') || `Guest-${Math.floor(Math.random() * 1000)}`).current;

    const addNotification = (text) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, text }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // --- PeerJS Initialization ---
    useEffect(() => {
        // Cleaning up previous instance if any (React StrictMode double-mount)
        if (peerRef.current) peerRef.current.destroy();

        const peer = new Peer(isHost ? roomId : undefined, {
            debug: 2,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My Peer ID is: ' + id);
            setPeerId(id);
            if (!isHost) {
                connectToHost(peer, roomId);
            }
        });

        peer.on('connection', (conn) => {
            // Received DataConnection
            handleDataConnection(conn);
        });

        peer.on('call', (call) => {
            // Received Media Call (Viewer logic)
            console.log("Receiving call...");
            call.answer(); // Answer without stream? Or viewer doesn't send stream.
            call.on('stream', (remoteStream) => {
                console.log("Received remote stream");
                setStream(remoteStream);
            });
        });

        peer.on('error', (err) => {
            console.error("Peer Error:", err);
            addNotification(`Peer Error: ${err.message}`);
            if (err.type === 'unavailable-id') {
                addNotification("Room ID is taken or invalid. Try another.");
            }
        });

        // Handle fullscreen exit
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                // Exited fullscreen
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            if (peerRef.current) peerRef.current.destroy();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        }
    }, [roomId, isHost]);

    const connectToHost = (peer, hostId) => {
        console.log(`Connecting to Host: ${hostId}`);
        const conn = peer.connect(hostId, {
            metadata: { username }
        });
        handleDataConnection(conn);
    };

    const handleDataConnection = (conn) => {
        conn.on('open', () => {
            // Capacity Check (Host Only)
            if (isHost && maxUsers && Object.keys(connectionsRef.current).length >= maxUsers) {
                conn.send({ type: 'error', payload: 'Room is Full' });
                setTimeout(() => conn.close(), 500);
                return;
            }

            console.log(`Connected to: ${conn.peer}`);
            connectionsRef.current[conn.peer] = conn;

            // Track User (Host)
            if (isHost) {
                const username = conn.metadata?.username || `User-${conn.peer.substr(0, 4)}`;
                setConnectedUsers(prev => [...prev, { peerId: conn.peer, username }]);
            }

            // If Host, call the user with stream if we have it
            if (isHost && videoRef.current && videoRef.current.captureStream) {
                callPeer(conn.peer);
            }
        });

        conn.on('data', (data) => {
            handleIncomingData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log("Connection closed:", conn.peer);
            delete connectionsRef.current[conn.peer];
            if (isHost) setConnectedUsers(prev => prev.filter(u => u.peerId !== conn.peer));
            addNotification("A user disconnected");
        });
    };

    const callPeer = (remotePeerId) => {
        if (!peerRef.current) return;
        try {
            // Capture stream from video element
            const streamToSend = videoRef.current.captureStream();
            const call = peerRef.current.call(remotePeerId, streamToSend);
            console.log("Calling peer with stream:", remotePeerId);
        } catch (e) {
            console.error("Failed to call peer:", e);
        }
    };

    const handleIncomingData = (data, senderId) => {
        if (data.type === 'error') {
            alert(data.payload);
            window.location.href = '#/dashboard';
            return;
        }
        if (data.type === 'kick') {
            alert("You have been kicked by the host.");
            window.location.href = '#/dashboard';
            return;
        }

        if (data.type === 'start-countdown') {
            // Viewer receives countdown start
            startCountdown(data.payload.seconds);
        }

        // data = { type: 'chat' | 'sync', payload: ... }
        if (data.type === 'chat') {
            setMessages(prev => [...prev, data.payload]);
            // If Host, broadcast to others (excluding sender if desired, but echoing is fine for simplicity)
            if (isHost) {
                broadcastData(data, senderId);
            }
        }
        else if (data.type === 'sync') {
            // Sync event
            handleSync(data.payload);
        }
    };

    // Send data to specific peer or all
    const broadcastData = (data, excludeId = null) => {
        Object.values(connectionsRef.current).forEach(conn => {
            if (conn.peer !== excludeId && conn.open) {
                conn.send(data);
            }
        });
    };

    const sendToHost = (data) => {
        // Viewer only has one connection usually?
        // Or find connection to roomId
        const hostConn = connectionsRef.current[roomId];
        if (hostConn && hostConn.open) {
            hostConn.send(data);
        }
    };

    // Chat Logic
    const handleSendMessage = (text) => {
        // Command Handling
        if (text.startsWith('/kick ') && isHost) {
            const targetName = text.split(' ')[1];
            const targetUser = connectedUsers.find(u => u.username === targetName);
            if (targetUser) {
                const conn = connectionsRef.current[targetUser.peerId];
                if (conn) {
                    conn.send({ type: 'kick' });
                    setTimeout(() => conn.close(), 500);
                    addNotification(`Kicked user: ${targetName}`);
                    // Local message
                    setMessages(prev => [...prev, { user: 'System', text: `Kicked ${targetName}`, time: 'Now' }]);
                }
            } else {
                addNotification(`User ${targetName} not found.`);
            }
            return;
        }

        const msgPayload = {
            user: username,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msgPayload]); // Optimistic local

        if (isHost) {
            broadcastData({ type: 'chat', payload: msgPayload });
        } else {
            sendToHost({ type: 'chat', payload: msgPayload });
        }
    };

    const startCountdown = (seconds) => {
        setCountdown(seconds);
        let count = seconds;
        const interval = setInterval(() => {
            count--;
            if (count > 0) setCountdown(count);
            else {
                clearInterval(interval);
                setCountdown(null);
            }
        }, 1000);
    }

    // Sync Logic
    const handleSync = ({ event, currentTime }) => {
        if (!videoRef.current) return;

        // Viewer logic: accept sync
        // Host logic: usually ignores unless we want 2-way sync
        if (isHost) return;

        const timeDiff = Math.abs(videoRef.current.currentTime - currentTime);

        if (event === 'play') {
            if (timeDiff > 0.5) videoRef.current.currentTime = currentTime;
            videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
        } else if (event === 'pause') {
            videoRef.current.pause();
            if (timeDiff > 0.5) videoRef.current.currentTime = currentTime;
        } else if (event === 'seek') {
            videoRef.current.currentTime = currentTime;
        }
    };

    const emitSync = (event) => {
        if (!isHost) return; // Viewers don't drive playback typically

        if (videoRef.current) {
            const payload = { event, currentTime: videoRef.current.currentTime };
            // Broadcast
            broadcastData({ type: 'sync', payload });
        }
    };

    // Start Movie Logic (Host only)
    const handleStartMovie = () => {
        const COUNTDOWN_SEC = 5;
        // Broadcast BEFORE local start
        broadcastData({ type: 'start-countdown', payload: { seconds: COUNTDOWN_SEC } });

        startCountdown(COUNTDOWN_SEC); // Local UI

        setTimeout(() => {
            if (!containerRef.current) return;
            // Go Fullscreen first?
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen().catch(e => console.error(e));
            }

            setShowStartButton(false);

            if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(e => console.error(e));
                emitSync('play');
            }
        }, COUNTDOWN_SEC * 1000);
    };

    // File change for local video (Host)
    const handleFileChange = () => {
        // VideoPlayer handles src update via existing logic passing 'src={filePath}'?
        // Actually filePath comes from location state.
        // If user changes file via VideoPlayer input?
        // We might need to refresh stream?
        // implementation details...
    };

    return (
        <div className="room-container">
            {notifications.map(n => (
                <div key={n.id} className="notification-toast fade-in">{n.text}</div>
            ))}
            <div className="main-area">
                <div className="room-header">
                    <div className="room-info">
                        <h2>{location.state?.roomName || `Room: ${roomId}`}</h2>
                        {isHost && <span style={{ fontSize: '0.8rem', color: '#999', marginLeft: '10px' }}>({connectedUsers.length + 1}/{maxUsers})</span>}
                        <div className="room-id-badge" onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            addNotification("Room ID copied!");
                        }}>
                            <span>ID: {roomId}</span>
                            <span className="copy-icon">📋</span>
                        </div>
                    </div>
                </div>

                <div className="video-section" ref={containerRef}>
                    <VideoPlayer
                        mode={mode}
                        isHost={isHost}
                        stream={stream}
                        src={filePath}
                        videoRef={videoRef}
                        onFileChange={handleFileChange}
                        onPlay={() => emitSync('play')}
                        onPause={() => emitSync('pause')}
                        onSeek={() => emitSync('seek')}
                    />
                    {countdown !== null && (
                        <div className="countdown-overlay" style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.8)', zIndex: 100, fontSize: '10rem', color: '#ff6b6b'
                        }}>
                            {countdown}
                        </div>
                    )}

                    {isHost && showStartButton && (
                        <div className="start-movie-container" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                            <button onClick={handleStartMovie} style={{
                                padding: '12px 30px', background: '#ff6b6b', border: 'none',
                                borderRadius: '5px', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                            }}> Start Movie </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar">
                <Chat
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    username={username}
                />
            </div>
        </div>
    );
};

const Room = () => (
    <ErrorBoundary>
        <RoomContent />
    </ErrorBoundary>
);

export default Room;
