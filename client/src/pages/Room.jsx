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

    const [peerId, setPeerId] = useState(null);
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
            debug: 2
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

        return () => {
            if (peerRef.current) peerRef.current.destroy();
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
            console.log(`Connected to: ${conn.peer}`);
            connectionsRef.current[conn.peer] = conn;

            // If Host, broadcast to others that someone joined? optional.
            // If Host, call the user with stream if we have it?
            if (isHost && videoRef.current && videoRef.current.captureStream) {
                // Important: Wait a bit or ensure stream is ready?
                // Actually, if file is loaded, we can call.
                callPeer(conn.peer);
            }
        });

        conn.on('data', (data) => {
            handleIncomingData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log("Connection closed:", conn.peer);
            delete connectionsRef.current[conn.peer];
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
            // If Host received sync (unlikely usually host drives), broadcast? 
            // Normally only Host sends sync. If Viewer sends sync (e.g. valid request), Host broadcasts.
            // Ensure loop prevention if needed.
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
        if (!containerRef.current) return;
        if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen().catch(e => console.error(e));

        setShowStartButton(false);
        setCountdown(5);
        let count = 5;
        const interval = setInterval(() => {
            count--;
            if (count > 0) setCountdown(count);
            else {
                clearInterval(interval);
                setCountdown(null);
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play();
                    emitSync('play');
                }
            }
        }, 1000);
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
