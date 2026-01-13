import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Peer from 'peerjs';
import SocialPanel from '../components/SocialPanel';
import { useFriends } from '../hooks/useFriends';
import './Dashboard.css';

const Dashboard = () => {
    // ...
    // Note: I will only replace the top import and the specific line usage to avoid large conflicts if possible.
    // Actually, I'll do two chunks.
    const { t } = useTranslation();

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

    // Social Logic
    const { friends, addFriend, removeFriend, clearChatHistory, pingStatus, checkStatuses } = useFriends();

    useEffect(() => {
        if (!myStableId) return;
        // ... Peer Setup (Existing) ...
        const peer = new Peer(myStableId, { debug: 1 });
        setGlobalPeer(peer);

        // ...
        // Listen for outgoing DMs from FriendChat (still need custom event? 
        // Or can we pass direct handler if FriendChat is inside SocialPanel which is inside Dashboard?)
        // FriendChat is child of SocialPanel. SocialPanel is child of Dashboard.
        // Dashboard holds 'peer' instance. 
        // We can pass `sendDM` function down!
        // But FriendChat is also used in Profile. 
        // Let's keep the CustomEvent for decoupling or use Context.
        // CustomEvent is fine for now as per previous implementation.

        // ... (Existing Peer Logic) ...
        peer.on('connection', (conn) => {
            // ...
            conn.on('data', (data) => {
                if (data.type === 'dm') {
                    // ... existing DM handling ...
                    // Also trigger hook update?
                    // Actually hook reads from localStorage on mount.
                    // If we update localStorage here, we might need to notify hook?
                    // The hook doesn't listen to storage events by default.
                    // Maybe we should just use the hook's state if we move DM logic there?
                    // For now, let's keep separate.
                }
            });
        });

        // Listen for outgoing DMs 
        const handleSendDM = (e) => {
            // ... existing logic ...
            const { targetId, message } = e.detail;
            const conn = peer.connect(targetId);
            conn.on('open', () => {
                conn.send({ type: 'dm', message });
                setTimeout(() => conn.close(), 1000);
            });
        };
        window.addEventListener('send-dm', handleSendDM);

        return () => {
            if (peer) peer.destroy();
            window.removeEventListener('send-dm', handleSendDM);
        };
    }, [myStableId]);

    // Profile Pic Logic
    const avatarUrl = localStorage.getItem('letswatch_avatar');


    return (
        <div className="dashboard-container fade-in">
            {/* Social Sidebar */}
            <SocialPanel
                friends={friends}
                pingStatus={pingStatus}
                onAddFriend={addFriend}
                onRemoveFriend={removeFriend}
                onClearHistory={clearChatHistory}
                onCheckStatus={checkStatuses}
                myId={myStableId}
            />

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
                    <h2>{t('dashboard.create_room')}</h2>
                    <p>{t('dashboard.create_room_desc')}</p>
                </div>

                {/* Join Room Card */}
                <div className="action-card join-card">
                    <div className="icon">🎫</div>
                    <h2>{t('dashboard.join_room')}</h2>
                    <p>{t('dashboard.join_room_desc')}</p>
                    <form onSubmit={handleJoinRoom} onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder={t('dashboard.join_room_placeholder_id')}
                            value={joinIp}
                            onChange={(e) => setJoinIp(e.target.value)}
                            className="join-input"
                        />
                        <input
                            type="password"
                            placeholder={t('dashboard.join_room_placeholder_pass')}
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            className="join-input"
                            style={{ marginTop: '10px' }}
                        />
                        <button type="submit" className="join-button">{t('dashboard.join_btn')}</button>
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
        </div>
    );
};

export default Dashboard;
