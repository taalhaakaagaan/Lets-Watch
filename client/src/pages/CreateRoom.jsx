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
    const [movieCategory, setMovieCategory] = useState('Action');
    const [movieDuration, setMovieDuration] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [enableBreaks, setEnableBreaks] = useState(false);
    const [breakDuration, setBreakDuration] = useState('5'); // minutes
    const [breakIntervals, setBreakIntervals] = useState('30'); // minutes
    const [responsibilityConfirmed, setResponsibilityConfirmed] = useState(false);

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
            moviePath, // Pass the full path
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

        if (!moviePath) {
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
            if (window.electronAPI) {
                // Pass config to startServer
                const result = await window.electronAPI.startServer(3001, config);
                if (result.success) {
                    // Pass filePath in state navigation so Room.jsx can pick it up
                    navigate(`/room/${result.roomId}?mode=host&port=${result.port}`, {
                        state: { filePath: moviePath }
                    });
                } else {
                    if (result.error === 'Server already running') {
                        // In a real app we'd update the config of the running server
                        navigate(`/room/ACTIVE_SESSION?mode=host&port=3001`, {
                            state: { filePath: moviePath }
                        });
                    } else {
                        setError('Failed to start room: ' + result.error);
                    }
                }
            } else {
                console.warn("Electron API not found");
                // Browser fallback
                navigate('/room/browser-mock?mode=host');
            }
        } catch (err) {
            setError('System error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-room-container fade-in">
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

                    {/* Movie Selection */}
                    <div className="form-group">
                        <label>Movie File <span className="required">*</span></label>
                        <div className="file-select-area">
                            <button type="button" onClick={handleSelectFile} className="select-file-button">
                                {moviePath ? 'Change Video' : 'Select Video File'}
                            </button>
                            {moviePath && <div className="selected-path">{moviePath}</div>}
                        </div>
                    </div>

                    {/* Movie Details */}
                    <div className="form-group">
                        <label>Movie Name <span className="required">*</span></label>
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
                                type="number"
                                placeholder="e.g. 120"
                                value={movieDuration}
                                onChange={(e) => setMovieDuration(e.target.value)}
                                required
                                min="1"
                            />
                        </div>
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
                            I confirm that I have entered the movie name and category correctly and tagged it appropriately.
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
            </div>
        </div>
    );
};

export default CreateRoom;
