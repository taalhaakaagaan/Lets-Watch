import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Peer from 'peerjs';
import FriendChat from '../components/FriendChat'; // Import Chat
import { useFriends } from '../hooks/useFriends';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('history');

    // Identity
    const [username, setUsername] = useState(localStorage.getItem('letswatch_username') || 'Guest');
    const myStableId = localStorage.getItem('letswatch_peer_id') || 'Generating...';
    // Display ID format: username@id (but peer id is just the id part)
    const displayIdentity = `${username}@${myStableId.split('-').pop()}`; // Just show random part for cleaner ID? Or full? Let's show Full for uniqueness.

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(username);
    const [prefs, setPrefs] = useState({});

    useEffect(() => {
        const p = JSON.parse(localStorage.getItem('letswatch_preferences') || '{}');
        setPrefs(p);
    }, []);

    const saveName = () => {
        if (editName.trim()) {
            setUsername(editName);
            localStorage.setItem('letswatch_username', editName);
        }
        setIsEditing(false);
    };

    // Avatar
    const [avatar, setAvatar] = useState(localStorage.getItem('letswatch_avatar') || null);

    // Stats State
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ roomsJoined: 0, hoursWatched: 0 });

    // Friends Logic from Hook
    const { friends, addFriend, removeFriend, clearChatHistory, pingStatus, checkStatuses } = useFriends();
    const [newFriendInput, setNewFriendInput] = useState('');

    // Chat State
    const [chatFriend, setChatFriend] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);

    useEffect(() => {
        // Load Data
        const savedHistory = JSON.parse(localStorage.getItem('letswatch_history') || '[]');
        setHistory(savedHistory);

        const savedStats = JSON.parse(localStorage.getItem('letswatch_stats') || '{"roomsJoined": 0, "hoursWatched": 0}');
        setStats(savedStats);
    }, []);


    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            // Resize to avoid localStorage quotas
            const img = new Image();
            img.src = ev.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 128;
                canvas.height = 128; // Square avatar
                ctx.drawImage(img, 0, 0, 128, 128);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                try {
                    localStorage.setItem('letswatch_avatar', dataUrl);
                    setAvatar(dataUrl);
                } catch (e) {
                    console.error("Storage Quota Exceeded for Avatar", e);
                    alert("Image too large for local storage!");
                }
            };
        };
        reader.readAsDataURL(file);
    };

    // Sync Avatar on focus/mount
    useEffect(() => {
        const checkAvatar = () => {
            const stored = localStorage.getItem('letswatch_avatar');
            if (stored && stored !== avatar) setAvatar(stored);
        };
        window.addEventListener('focus', checkAvatar);
        return () => window.removeEventListener('focus', checkAvatar);
    }, [avatar]);

    const handleRemoveAvatar = () => {
        setAvatar(null);
        localStorage.removeItem('letswatch_avatar');
    };

    // Handlers
    const onAddFriendSubmit = () => {
        if (!newFriendInput.trim()) return;
        // Parse: name@id or just id
        let idToAdd = newFriendInput.trim();
        let nameToAdd = 'Friend';
        if (idToAdd.includes('@')) {
            const parts = idToAdd.split('@');
            nameToAdd = parts[0];
            idToAdd = parts[1];
        }
        addFriend(idToAdd, nameToAdd);
        setNewFriendInput('');
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleDateString() + ' ' + new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="profile-container fade-in">
            <button className="back-button" onClick={() => navigate('/dashboard')}>{t('profile.back_dashboard')}</button>

            {/* TABS (Moved to Top) */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>{t('profile.tab_history')}</button>
                <button className={`tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>{t('profile.tab_friends')}</button>
                <button className={`tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>{t('profile.tab_contact')}</button>
                <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️</button>
            </div>

            <div className="tab-content">
                {activeTab === 'history' && (
                    <div className="history-list">
                        {history.length === 0 ? <p className="empty-msg">No watch history yet.</p> : (
                            history.map((item, idx) => (
                                <div key={idx} className="history-item">
                                    <div className="history-info">
                                        <h3>{item.roomName}</h3>
                                        <span>{formatTime(item.timestamp)}</span>
                                    </div>
                                    <button onClick={() => navigate(`/room/${item.roomId}?mode=viewer`)}>Rejoin</button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="friends-section">
                        <div className="add-friend-form">
                            <input
                                placeholder="Enter Username@ID (e.g. Talha@Talha-xyz)"
                                value={newFriendInput}
                                onChange={e => setNewFriendInput(e.target.value)}
                            />
                            <button onClick={onAddFriendSubmit}>{t('profile.add_friend_btn')}</button>
                        </div>

                        <div className="friends-controls">
                            <h3>{t('profile.saved_contacts')} ({friends.length})</h3>
                            <button className="refresh-btn" onClick={checkStatuses}>{t('profile.check_status')}</button>
                        </div>

                        <div className="friends-list">
                            {friends.length === 0 ? <p className="empty-msg">{t('profile.friends_empty')}</p> : (
                                friends.map(friend => (
                                    <div key={friend.id} className="friend-item">
                                        <div className="friend-info">
                                            <div className={`status-dot ${pingStatus[friend.id] || 'unknown'}`} title={pingStatus[friend.id]}></div>
                                            <div>
                                                <h4>{friend.name}</h4>
                                                <small>{friend.id}</small>
                                            </div>
                                        </div>
                                        <div className="friend-actions">
                                            <button className="msg-btn" onClick={() => {
                                                setChatFriend(friend);
                                                setChatVisible(true);
                                            }}>💬</button>
                                            <button className="join-friend-btn" onClick={() => navigate(`/room/${friend.id}?mode=viewer`)}>{t('profile.join')}</button>
                                            <button className="delete-btn" onClick={() => removeFriend(friend.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="contact-section">
                        <h2>Get in Touch</h2>
                        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Message sent! (Simulation)"); }}>
                            <input placeholder="Your Name" required />
                            <input type="email" placeholder="Your Email" required />
                            <textarea placeholder="Message" rows="5" required></textarea>
                            <button type="submit">Send Message</button>
                        </form>
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="contact-section">
                        <h2>{t('profile.settings_language')}</h2>
                        <div className="language-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
                            <button
                                className={`lang-btn ${i18n.language === 'en' ? 'active-lang' : ''}`}
                                onClick={() => i18n.changeLanguage('en')}
                            >
                                🇬🇧 English
                            </button>
                            <button
                                className={`lang-btn ${i18n.language === 'tr' ? 'active-lang' : ''}`}
                                onClick={() => i18n.changeLanguage('tr')}
                            >
                                🇹🇷 Türkçe
                            </button>
                            <button
                                className={`lang-btn ${i18n.language === 'de' ? 'active-lang' : ''}`}
                                onClick={() => i18n.changeLanguage('de')}
                            >
                                🇩🇪 Deutsch
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* HEADER MOVED TO BOTTOM */}
            <div className="profile-header">
                {/* Avatar Section */}
                <div className="avatar-wrapper">
                    <div className="avatar-circle-lg" style={{
                        backgroundImage: avatar ? `url(${avatar})` : 'none',
                        backgroundSize: 'cover'
                    }}>
                        {!avatar && username[0]}
                    </div>
                    <div className="avatar-controls">
                        <label className="upload-btn">
                            {t('profile.change_avatar')}
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                        </label>
                        {avatar && <button className="remove-btn" onClick={handleRemoveAvatar}>✕</button>}
                    </div>
                </div>

                <div className="profile-decoration-blob blob-1"></div>
                <div className="profile-decoration-blob blob-2"></div>

                {/* Username Edit */}
                <div className="username-container">
                    {isEditing ? (
                        <input
                            className="username-edit-input"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={saveName}
                            onKeyDown={e => e.key === 'Enter' && saveName()}
                            autoFocus
                        />
                    ) : (
                        <h1 onClick={() => { setEditName(username); setIsEditing(true); }} title="Click to Edit">{username} ✎</h1>
                    )}
                </div>

                {/* Identity Badge */}
                <div className="identity-badge" onClick={() => {
                    navigator.clipboard.writeText(displayIdentity);
                    alert("Copied Identity to clipboard!");
                }}>
                    <span className="id-label">ID:</span>
                    <span className="id-value">{displayIdentity}</span>
                    <span className="copy-icon">📋</span>
                </div>

                {/* Detailed Profile Info */}
                <div className="profile-details-grid">
                    <div className="detail-card">
                        <h3>Bio</h3>
                        <p>{prefs.bio || "No bio yet."}</p>
                    </div>
                    <div className="detail-card">
                        <h3>Genres</h3>
                        <div className="tags-row">
                            {(prefs.genres || []).map(g => <span key={g} className="tag">{g}</span>)}
                        </div>
                    </div>
                    {prefs.socialHandle && (
                        <div className="detail-card full-width" style={{ gridColumn: '1 / -1' }}>
                            <h3>Social</h3>
                            <p>@{prefs.socialHandle}</p>
                        </div>
                    )}
                </div>

                <div className="stats-row">
                    <div className="stat-pill">🎬 {stats.roomsJoined} {t('profile.rooms_joined')}</div>
                    <div className="stat-pill">⏱️ {Math.round(stats.hoursWatched)} {t('profile.hours_watched')}</div>
                </div>
            </div>

            {/* Friend Chat Modal - persistent but hidden when closed to keep AI alive */}
            {
                chatFriend && (
                    <div style={{ display: chatVisible ? 'block' : 'none' }}>
                        <FriendChat
                            friend={chatFriend}
                            myId={myStableId}
                            onClose={() => setChatVisible(false)} // Just hide, don't unmount
                            onRemove={(id) => {
                                removeFriend(id);
                                setChatFriend(null);
                                setChatVisible(false);
                            }}
                            onClearHistory={clearChatHistory}
                        />
                    </div>
                )
            }
            {/* Footer removed as requested */}
            {/* <Footer /> */}
        </div >
    );
};

export default Profile;
