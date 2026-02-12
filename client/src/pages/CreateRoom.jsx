import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRoom.css';

const CreateRoom = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Configuration State
    const [roomName, setRoomName] = useState('');
    const [moviePath, setMoviePath] = useState('');
    const [movieName, setMovieName] = useState(''); // Extracted from path or manual
    const [sourceType, setSourceType] = useState('file'); // 'file' or 'screen'
    const [createdRoomId, setCreatedRoomId] = useState(null); // For extension instruction
    const [movieCategory, setMovieCategory] = useState('Action');
    const [movieDuration, setMovieDuration] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [enableBreaks, setEnableBreaks] = useState(false);
    const [breakDuration, setBreakDuration] = useState('5'); // minutes
    const [breakIntervals, setBreakIntervals] = useState('30'); // minutes
    const [responsibilityConfirmed, setResponsibilityConfirmed] = useState(false);
    const [maxUsers, setMaxUsers] = useState(5);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleSelectFile = async () => {
        if (window.electronAPI) {
            try {
                const path = await window.electronAPI.selectVideoFile();
                if (path) {
                    setMoviePath(path);
                    // Extract filename as default movie name
                    const filename = path.split('\\').pop().split('/').pop();
                    setMovieName(filename);
                }
            } catch (err) {
                console.error("File selection failed:", err);
                setError("Failed to select file.");
            }
        } else {
            // Fallback for browser testing (not ideal but functional)
            alert("Native file selection only works in Electron.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const config = {
            roomName,
            sourceType,
            moviePath: sourceType === 'file' ? moviePath : null,
            movieName,
            movieCategory,
            movieDuration,
            isPrivate,
            password: isPrivate ? password : null,
            breaks: enableBreaks ? {
                duration: parseInt(breakDuration),
                intervals: breakIntervals.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
            } : null
        };

        if (!roomName.trim()) {
            setError('Room Name is required.');
            setLoading(false);
            return;
        }

        if (isPrivate && !password.trim()) {
            setError('Password is required for private rooms.');
            setLoading(false);
            return;
        }

        if (sourceType === 'file' && !moviePath) {
            setError('Please select a movie file.');
            setLoading(false);
            return;
        }

        if (!movieName.trim() || !movieDuration) {
            setError('Movie Name and Duration are required.');
            setLoading(false);
            return;
        }

        if (!responsibilityConfirmed) {
            setError('You must confirm the responsibility check.');
            setLoading(false);
            return;
        }

        try {
            // Generate a random ID for the room (PeerJS ID)
            const randomSuffix = Math.random().toString(36).substr(2, 6);
            const sanitizedName = roomName.replace(/[^a-zA-Z0-9]/g, '-');
            const newRoomId = `${sanitizedName}-${randomSuffix}`;

            // Save to History
            const history = JSON.parse(localStorage.getItem('letswatch_history') || '[]');
            history.unshift({ roomId: newRoomId, roomName: roomName, timestamp: new Date().toISOString() });
            if (history.length > 10) history.pop();
            localStorage.setItem('letswatch_history', JSON.stringify(history));

            // Stats Update
            const stats = JSON.parse(localStorage.getItem('letswatch_stats') || '{"roomsJoined": 0, "hoursWatched": 0}');
            stats.roomsJoined += 1;
            localStorage.setItem('letswatch_stats', JSON.stringify(stats));

            // If File: Navigate directly. If Screen: Show instructions.
            if (sourceType === 'file') {
                navigate(`/room/${newRoomId}?mode=host`, {
                    state: {
                        filePath: moviePath,
                        roomName,
                        maxUsers,
                        sourceType
                    }
                });
            } else {
                setCreatedRoomId(newRoomId);
                setLoading(false); // Stop loading to show modal
            }

        } catch (err) {
            setError('System error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-room-container fade-in">
            {createdRoomId && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="modal-content" style={{
                        background: '#1a1a1a', padding: '30px', borderRadius: '20px',
                        textAlign: 'center', border: '1px solid #333', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ color: '#ff6b6b', marginBottom: '10px' }}>🚀 Room Ready!</h2>
                        <p style={{ color: '#ccc', marginBottom: '20px' }}>
                            Your room <strong>{roomName}</strong> is created. Follow these steps to stream:
                        </p>

                        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>1. Open Extension</h3>
                            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                                Go to the tab you want to share (e.g. Netflix, YouTube) and open the <strong>LetsWatch Side Panel</strong>.
                            </p>
                        </div>

                        <div style={{ background: '#111', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'left' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>2. Enter Code</h3>
                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>
                                Paste this Room ID into the extension:
                            </p>
                            <div style={{
                                display: 'flex', gap: '10px', alignItems: 'center',
                                background: '#000', padding: '10px', borderRadius: '8px', border: '1px dashed #444'
                            }}>
                                <code style={{ flex: 1, fontSize: '1.2rem', color: '#ff8e53', fontFamily: 'monospace' }}>{createdRoomId}</code>
                                <button onClick={() => {
                                    navigator.clipboard.writeText(createdRoomId);
                                    alert("Copied!");
                                }} style={{
                                    background: '#333', border: 'none', color: '#fff', padding: '8px 15px',
                                    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                }}>Copy</button>
                            </div>
                        </div>

                        <details style={{ textAlign: 'left', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                            <summary style={{ cursor: 'pointer', color: '#aaa', fontWeight: 'bold' }}>⚠️ Extension Not Installed?</summary>
                            <ol style={{ paddingLeft: '20px', marginTop: '10px', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <li>Go to <code>chrome://extensions</code> in your browser.</li>
                                <li>Enable <strong>Developer mode</strong> (top right).</li>
                                <li>Click <strong>Load unpacked</strong>.</li>
                                <li>Select folder: <code>c:\projects\letswatch\extension</code></li>
                            </ol>
                        </details>

                        <button onClick={() => navigate('/dashboard')} style={{
                            padding: '12px 30px', background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', border: 'none',
                            color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
                        }}>
                            Done & Go to Dashboard
                        </button>
                    </div>
                </div>
            )}

            <div className="back-button-container">
                <button onClick={handleBack} className="back-button">
                    ← Back
                </button>
            </div>

            <div className="create-room-card">
                <h1>Configure Room</h1>
                <p className="subtitle">Customize your viewing experience</p>

                <form onSubmit={handleCreate}>
                    {/* Room Name */}
                    <div className="form-group">
                        <label>Room Name <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Movie Night"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Source Type Selection */}
                    <div className="form-group">
                        <label>Content Source <span className="required">*</span></label>
                        <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="file"
                                    checked={sourceType === 'file'}
                                    onChange={() => setSourceType('file')}
                                    style={{ marginRight: '8px' }}
                                />
                                Local Video File
                            </label>
                            <label className="radio-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="screen"
                                    checked={sourceType === 'screen'}
                                    onChange={() => {
                                        setSourceType('screen');
                                        setMovieDuration('Live'); // Default for stream
                                    }}
                                    style={{ marginRight: '8px' }}
                                />
                                Browser Stream / Screen Share
                            </label>
                        </div>
                    </div>

                    {/* Movie Selection (Only for File) */}
                    {sourceType === 'file' && (
                        <div className="form-group fade-in">
                            <label>Movie File <span className="required">*</span></label>
                            <div className="file-select-area">
                                <button type="button" onClick={handleSelectFile} className="select-file-button">
                                    {moviePath ? 'Change Video' : 'Select Video File'}
                                </button>
                                {moviePath && <div className="selected-path">{moviePath}</div>}
                            </div>
                        </div>
                    )}

                    {/* Movie Details */}
                    <div className="form-group">
                        <label>{sourceType === 'file' ? 'Movie Name' : 'Stream Title'} <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Inception"
                            value={movieName}
                            onChange={(e) => setMovieName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>Category <span className="required">*</span></label>
                            <select
                                value={movieCategory}
                                onChange={(e) => setMovieCategory(e.target.value)}
                                className="select-input"
                            >
                                <option>Action</option>
                                <option>Comedy</option>
                                <option>Drama</option>
                                <option>Horror</option>
                                <option>Sci-Fi</option>
                                <option>Romance</option>
                                <option>Documentary</option>
                                <option>Anime</option>
                            </select>
                        </div>
                        <div className="form-group half">
                            <label>Duration (mins) <span className="required">*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. 120 or 'Live'"
                                value={movieDuration}
                                onChange={(e) => setMovieDuration(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Room Capacity */}
                    <div className="form-group">
                        <label>Max Users <span className="required">*</span></label>
                        <input
                            type="number"
                            placeholder="Max Users (Default: 5)"
                            value={maxUsers}
                            onChange={(e) => setMaxUsers(e.target.value)}
                            required
                            min="2"
                            max="50"
                        />
                    </div>

                    {/* Privacy Settings */}
                    <div className="form-group">
                        <label className="checkbox-group">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                            />
                            Private Room (Password Protected)
                        </label>
                    </div>

                    {isPrivate && (
                        <div className="form-group fade-in">
                            <label>Room Password <span className="required">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Break Settings */}
                    <div className="form-group">
                        <label className="checkbox-group">
                            <input
                                type="checkbox"
                                checked={enableBreaks}
                                onChange={(e) => setEnableBreaks(e.target.checked)}
                            />
                            Enable Scheduled Breaks
                        </label>
                    </div>

                    {enableBreaks && (
                        <div className="fade-in">
                            <div className="form-group">
                                <label>Break Duration (minutes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={breakDuration}
                                    onChange={(e) => setBreakDuration(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Break Intervals (minutes, comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 30, 60, 90"
                                    value={breakIntervals}
                                    onChange={(e) => setBreakIntervals(e.target.value)}
                                />
                                <small style={{ color: '#666' }}>Breaks will occur at these timestamps.</small>
                            </div>
                        </div>
                    )}

                    {/* Responsibility Check */}
                    <div className="responsibility-box">
                        <label className="checkbox-group warning-text">
                            <input
                                type="checkbox"
                                checked={responsibilityConfirmed}
                                onChange={(e) => setResponsibilityConfirmed(e.target.checked)}
                                required
                            />
                            I confirm that I have entered the {sourceType === 'file' ? 'movie' : 'stream'} name and category correctly and tagged it appropriately.
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={`create-button ${!responsibilityConfirmed ? 'disabled' : ''}`}
                        disabled={loading || !responsibilityConfirmed}
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </form>
            </div >
        </div >
    );
};

export default CreateRoom;
