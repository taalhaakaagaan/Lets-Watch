import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ExtensionLanding = () => {
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const handleStartStream = (e) => {
        e.preventDefault();
        if (!roomId.trim()) return;
        // Navigate to Room as Host with Screen Source and Extension View
        navigate(`/room/${roomId.trim()}?mode=host&source=screen&view=extension`);
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                padding: '15px',
                borderRadius: '50%',
                marginBottom: '20px',
                boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'
            }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>

            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '700' }}>LetsWatch Stream</h2>
            <p style={{ margin: '0 0 30px 0', color: '#888', textAlign: 'center', fontSize: '0.9rem' }}>
                Enter the Room ID from the app to start streaming this tab.
            </p>

            <form onSubmit={handleStartStream} style={{ width: '100%', maxWidth: '300px' }}>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        background: '#1a1a1a',
                        color: '#fff',
                        fontSize: '1rem',
                        marginBottom: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        border: 'none',
                        background: roomId.trim() ? 'linear-gradient(135deg, #ff6b6b, #ff8e53)' : '#333',
                        color: roomId.trim() ? '#fff' : '#666',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: roomId.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s'
                    }}
                    disabled={!roomId.trim()}
                >
                    Start Streaming
                </button>
            </form>

            <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.8rem', color: '#444' }}>
                v1.4.0 • Chrome Extension
            </div>
        </div>
    );
};

export default ExtensionLanding;
