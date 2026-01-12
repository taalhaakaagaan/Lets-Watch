import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [joinIp, setJoinIp] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        navigate('/create-room');
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinIp) return;

        // Resolve ID to IP
        let targetIp = joinIp;
        if (window.electronAPI) {
            const resolved = await window.electronAPI.resolveId(joinIp);
            if (resolved) {
                targetIp = resolved;
            } else {
                setError("Invalid Room ID");
                return;
            }
        }

        // Navigate with password
        const passwordParam = joinPassword ? `&password=${encodeURIComponent(joinPassword)}` : '';
        navigate(`/room/${joinIp}?mode=viewer&ip=${targetIp}${passwordParam}`);
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Choose your cinema experience</p>
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
        </div>
    );
};

export default Dashboard;
