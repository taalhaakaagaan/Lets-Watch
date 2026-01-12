import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
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

    // Parse query params safely
    const mode = searchParams.get('mode') || 'viewer';
    const port = searchParams.get('port') || 3001;
    const targetIp = searchParams.get('ip') || 'localhost';

    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [stream, setStream] = useState(null); // For viewer to receive
    const [countdown, setCountdown] = useState(null);
    const [showStartButton, setShowStartButton] = useState(mode === 'host');

    const videoRef = useRef(null);
    const containerRef = useRef(null); // New ref for container
    const username = localStorage.getItem('letswatch_username') || `Guest-${Math.floor(Math.random() * 1000)}`;
    const userId = useRef(Math.random().toString(36).substr(2, 9)).current;

    // Store peers: { [remoteUserId]: PeerInstance }
    const peersRef = useRef({});

    // Helper to add notification
    const addNotification = (text) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, text }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // WebRTC: Create Peer (Host calls Viewer or vice versa, but usually Host initiates stream)
    const createPeer = (remoteUserId, socketInstance, streamToSend) => {
        try {
            console.log(`Creating peer for ${remoteUserId}`);
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: streamToSend
            });

            peer.on('signal', (signal) => {
                socketInstance.emit('offer', {
                    target: remoteUserId,
                    callerId: userId,
                    signal
                });
            });

            peer.on('stream', (remoteStream) => {
                // Host ignored
            });

            peer.on('close', () => {
                if (peersRef.current[remoteUserId]) delete peersRef.current[remoteUserId];
            });

            peer.on('error', (err) => {
                console.error("Peer error:", err);
                addNotification(`Peer Error: ${err.message}`);
            });

            peersRef.current[remoteUserId] = peer;
        } catch (e) {
            console.error("Peer creation failed:", e);
        }
    };

    const answerPeer = (payload, socketInstance) => {
        try {
            console.log(`Answering peer from ${payload.callerId}`);
            const peer = new Peer({
                initiator: false,
                trickle: false
            });

            peer.on('signal', (signal) => {
                socketInstance.emit('answer', {
                    target: payload.callerId,
                    callerId: userId,
                    signal
                });
            });

            peer.on('stream', (incomingStream) => {
                console.log("Received stream from host");
                setStream(incomingStream);
            });

            peer.on('error', (err) => {
                console.error("Peer error:", err);
            });

            peer.signal(payload.signal);
            peersRef.current[payload.callerId] = peer;
        } catch (e) {
            console.error("Peer answer failed:", e);
        }
    };

    useEffect(() => {
        // Connect to Signaling Server
        const socketUrl = mode === 'host' ? `http://localhost:${port}` : `http://${targetIp}:3001`;
        console.log("Connecting to socket:", socketUrl);

        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Socket connected");
            newSocket.emit('join-room', {
                roomId,
                userId,
                username,
                password: searchParams.get('password')
            });
        });

        newSocket.on('error', (msg) => {
            addNotification(`Error: ${msg}`);
            if (msg === 'Invalid password') {
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        });

        newSocket.on('user-connected', ({ userId: remoteUserId, username: remoteUsername }) => {
            console.log("User connected:", remoteUsername);
            addNotification(`${remoteUsername} joined the room`);

            // If we are host and have a stream, call the new user
            if (mode === 'host' && videoRef.current) {
                try {
                    // Check if captureStream exists (it should in Electron/Chrome)
                    if (videoRef.current.captureStream) {
                        const s = videoRef.current.captureStream();
                        createPeer(remoteUserId, newSocket, s);
                    } else {
                        console.warn("captureStream not supported on video element");
                    }
                } catch (e) {
                    console.error("Failed to capture stream:", e);
                }
            }
        });

        newSocket.on('user-disconnected', (remoteUserId) => {
            addNotification("A user left the room");
            if (peersRef.current[remoteUserId]) {
                peersRef.current[remoteUserId].destroy();
                delete peersRef.current[remoteUserId];
            }
        });

        newSocket.on('offer', (payload) => {
            if (mode === 'viewer') {
                answerPeer(payload, newSocket);
            }
        });

        newSocket.on('answer', (payload) => {
            if (peersRef.current[payload.callerId]) {
                peersRef.current[payload.callerId].signal(payload.signal);
            }
        });

        newSocket.on('ice-candidate', (payload) => {
            if (peersRef.current[payload.callerId]) {
                peersRef.current[payload.callerId].signal(payload.candidate);
            }
        });

        // Sync Events
        newSocket.on('sync-event', ({ event, currentTime }) => {
            if (mode === 'viewer' && videoRef.current) {
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
            }
        });

        // Cleanup
        return () => {
            newSocket.disconnect();
            Object.values(peersRef.current).forEach(p => p.destroy());
        };
    }, [roomId, mode, port, targetIp, navigate, searchParams]);

    // Start Movie Logic
    const handleStartMovie = () => {
        if (!containerRef.current) return;

        // 1. Request Fullscreen on CONTAINER immediately
        if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen().catch(err => console.error("Fullscreen blocked:", err));
        } else if (containerRef.current.webkitRequestFullscreen) {
            containerRef.current.webkitRequestFullscreen();
        }

        setShowStartButton(false);
        setCountdown(5); // Start at 5

        // Start Countdown Timer
        let count = 5;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                setCountdown(null);
                startPlayback();
            }
        }, 1000);
    };

    const startPlayback = () => {
        if (videoRef.current) {
            // Mute to allow autoplay (browser policy)
            videoRef.current.muted = true;

            // Play
            videoRef.current.play()
                .then(() => {
                    // Optional: Unmute after success if desired, or let user unmute
                    // videoRef.current.muted = false; 
                })
                .catch(e => console.error("Play failed:", e));

            syncEvent('play');
        }
    };


    // Handlers
    const handleFileChange = (file) => {
        // Handled by VideoPlayer setting src
    };

    const syncEvent = (event) => {
        if (mode === 'host' && socket && videoRef.current) {
            socket.emit('sync-event', {
                roomId,
                event,
                currentTime: videoRef.current.currentTime
            });
        }
    };

    return (
        <div className="room-container">
            {notifications.map(n => (
                <div key={n.id} className="notification-toast fade-in">
                    {n.text}
                </div>
            ))}
            <div className="main-area">
                <div className="room-header">
                    <div className="room-info">
                        <h2>{location.state?.roomName || 'Cinema Room'}</h2>
                        <div className="room-id-badge" onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            addNotification("Room ID copied to clipboard!");
                        }}>
                            <span>ID: {roomId}</span>
                            <span className="copy-icon">📋</span>
                        </div>
                    </div>
                    {mode === 'host' && (
                        <div className="invite-box">
                            <span>Share this ID with your friends!</span>
                        </div>
                    )}
                </div>

                <div className="video-section" ref={containerRef}>
                    <VideoPlayer
                        mode={mode}
                        isHost={mode === 'host'}
                        stream={stream}
                        src={filePath}
                        videoRef={videoRef}
                        onFileChange={handleFileChange}
                        onPlay={() => syncEvent('play')}
                        onPause={() => syncEvent('pause')}
                        onSeek={() => syncEvent('seek')}
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

                    {mode === 'host' && showStartButton && (
                        <div className="start-movie-container" style={{
                            marginTop: '10px', display: 'flex', justifyContent: 'center'
                        }}>
                            <button onClick={handleStartMovie} style={{
                                padding: '12px 30px', background: '#ff6b6b', border: 'none',
                                borderRadius: '5px', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                            }}>
                                Start Movie
                            </button>
                        </div>
                    )}
                </div>
                <div className="ad-banner bottom-ad">
                    <span>Advertisement Area (Non-intrusive)</span>
                </div>
            </div>

            <div className="sidebar">
                <Chat socket={socket} username={username} roomId={roomId} />
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
