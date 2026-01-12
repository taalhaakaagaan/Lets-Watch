import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import './Dashboard.css';

const Dashboard = () => {
    // ...
    // Note: I will only replace the top import and the specific line usage to avoid large conflicts if possible.
    // Actually, I'll do two chunks.

    const [joinIp, setJoinIp] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        navigate('/create-room');
    };

    const saveToHistory = (id) => {
        const history = JSON.parse(localStorage.getItem('letswatch_history') || '[]');
        history.unshift({ roomId: id, roomName: `Room ${id.substr(0, 4)}`, timestamp: new Date().toISOString() });
        if (history.length > 10) history.pop();
        localStorage.setItem('letswatch_history', JSON.stringify(history));
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinIp) return;

        saveToHistory(joinIp);

        // Navigate with password
        const passwordParam = joinPassword ? `&password=${encodeURIComponent(joinPassword)}` : '';
        // Direct navigation to Room ID (Peer ID)
        navigate(`/room/${joinIp}?mode=viewer${passwordParam}`);

    };

    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [testStatus, setTestStatus] = useState(null); // 'testing', 'success', 'error'

    const handleSaveSettings = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setShowSettings(false);
    };

    const handleTestKey = async () => {
        if (!apiKey) return;
        setTestStatus('testing');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Say 'Hello'" }] }] })
            });

            if (response.ok) {
                setTestStatus('success');
                setTimeout(() => setTestStatus(null), 3000);
            } else {
                throw new Error('Invalid Key');
            }
        } catch (e) {
            setTestStatus('error');
            setTimeout(() => setTestStatus(null), 3000);
        }
    };

    // --- Global Peer & DM Logic ---
    const myStableId = localStorage.getItem('letswatch_peer_id');
    const [globalPeer, setGlobalPeer] = useState(null);

    useEffect(() => {
        if (!myStableId) return;

        // Ensure we don't create multiple peers if component remounts quickly or HMR
        // But for Dashboard it's fine usually.
        const peer = new Peer(myStableId, { debug: 1 });
        setGlobalPeer(peer);

        peer.on('connection', (conn) => {
            conn.on('data', (data) => {
                if (data.type === 'dm') {
                    // data.message = { sender, text, timestamp }
                    const senderId = data.message.sender;
                    // Find friend name or use ID
                    // Save to history
                    const historyKey = `chat_history_${senderId}`;
                    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
                    history.push(data.message);
                    localStorage.setItem(historyKey, JSON.stringify(history));

                    // Simple Notification
                    window.dispatchEvent(new Event('storage')); // trigger updates maybe?
                    alert(`Message from ${senderId}: ${data.message.text}`);
                }
            });
        });

        // Listen for outgoing DMs from FriendChat
        const handleSendDM = (e) => {
            const { targetId, message } = e.detail;
            const conn = peer.connect(targetId);
            conn.on('open', () => {
                conn.send({ type: 'dm', message });
                setTimeout(() => conn.close(), 1000);
            });
        };
        window.addEventListener('send-dm', handleSendDM);

        return () => {
            // peer.destroy(); // Destroying might be bad if we navigate away and back quickly? 
            // Actually if we navigate to Room, Dashboard unmounts. Peer is destroyed. 
            // Room uses a NEW peer. This is OK.
            if (peer) peer.destroy();
            window.removeEventListener('send-dm', handleSendDM);
        };
    }, [myStableId]);

    // Profile Pic Logic
    const avatarUrl = localStorage.getItem('letswatch_avatar');


    return (
        <div className="dashboard-container fade-in">
            {/* New Decorative User Bar */}
            <div className="user-bar">
                <div className="user-info-pill" onClick={() => navigate('/profile')}>
                    <div className="user-avatar-small" style={{
                        backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                        backgroundSize: 'cover'
                    }}>
                        {!avatarUrl && (localStorage.getItem('letswatch_username')?.[0] || 'G')}
                    </div>
                    <span className="user-name">{localStorage.getItem('letswatch_username') || 'Guest'}</span>
                </div>
                <div className="settings-btn-decorative" onClick={() => setShowSettings(true)}>
                    <span>⚙️</span>
                </div>
            </div>

            <div className="dashboard-header-modern">
                <h1>Let's Watch</h1>
                <p>Premium P2P Cinema Experience</p>
            </div>

            <div className="actions-grid">
                {/* Create Room Card */}
                <div className="action-card create-card" onClick={handleCreateRoom}>
                    <div className="icon">🎬</div>
                    <h2>Create Room</h2>
                    <p>Host a movie night. Configure your room.</p>
                </div>

                {/* Join Room Card */}
                <div className="action-card join-card">
                    <div className="icon">🎫</div>
                    <h2>Join Room</h2>
                    <p>Connect using a Room ID.</p>
                    <form onSubmit={handleJoinRoom} onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={joinIp}
                            onChange={(e) => setJoinIp(e.target.value)}
                            className="join-input"
                        />
                        <input
                            type="password"
                            placeholder="Password (if set)"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            className="join-input"
                            style={{ marginTop: '10px' }}
                        />
                        <button type="submit" className="join-button">Join</button>
                    </form>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Settings Modal */}
            {
                showSettings && (
                    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h2>Settings</h2>
                            <div className="form-group">
                                <label>Gemini API Key (Optional)</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Enter your API Key"
                                    className="settings-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button className={`test-button ${testStatus}`} onClick={handleTestKey} disabled={testStatus === 'testing'}>
                                    {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Verified ✓' : testStatus === 'error' ? 'Invalid ✗' : 'Test Key'}
                                </button>
                                <button className="save-button" onClick={handleSaveSettings}>Save & Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
