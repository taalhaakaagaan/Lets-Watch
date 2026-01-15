import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FriendChat from './FriendChat';
import './SocialPanel.css';
import { GeminiService } from '../services/GeminiService';

const SocialPanel = ({ friends, pingStatus, onAddFriend, onRemoveFriend, onClearHistory, onCheckStatus, myId }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);

    const [newFriendId, setNewFriendId] = useState('');

    // AI Integration
    const [aiPartner, setAiPartner] = useState(null);

    useEffect(() => {
        const prefs = JSON.parse(localStorage.getItem('letswatch_preferences') || '{}');
        const persona = JSON.parse(localStorage.getItem('letswatch_ai_persona') || 'null');

        if (prefs.wantAiPartner && prefs.apiKey) {
            let aiName = 'AI Partner 🤖';
            let avatarUrl = null;

            if (persona) {
                aiName = `${persona.name} 🤖`;
                // Use randomuser.me for realistic avatar based on persona
                // Mapping gender: male/female
                const seed = persona.name.replace(/\s/g, '').toLowerCase();
                avatarUrl = `https://randomuser.me/api/portraits/${persona.gender === 'male' ? 'men' : 'women'}/${Math.floor(Math.random() * 90)}.jpg`;
                // Actually, random index might change on refresh if we don't save it.
                // Better to save the avatar URL in persona during onboarding, but we didn't.
                // Let's use a deterministic approach based on name char codes or just generated once?
                // Or stick to one. let's try a hash or just use ui-avatars as fallback if image fails.
                // Let's us specific ID for consistency.
                const id = (persona.name.length * 7) % 100;
                avatarUrl = `https://randomuser.me/api/portraits/${persona.gender === 'male' ? 'men' : 'women'}/${id}.jpg`;
            }

            const aiUser = {
                id: 'gemini_ai',
                name: aiName,
                isAi: true,
                apiKey: prefs.apiKey,
                mode: prefs.purpose || 'Date',
                persona: persona, // Pass full persona for context
                avatar: avatarUrl
            };
            setAiPartner(aiUser);

            // Check Greeting
            const service = new GeminiService(prefs.apiKey);
            service.shouldGreet().then(should => {
                if (should) {
                    service.generateGreeting(prefs.purpose).then(text => {
                        // Add to history
                        const histKey = `chat_history_${aiUser.id}`;
                        const existing = JSON.parse(localStorage.getItem(histKey) || '[]');
                        const msg = { sender: aiUser.id, text, timestamp: new Date().toISOString() };
                        localStorage.setItem(histKey, JSON.stringify([...existing, msg]));
                    });
                }
            });
        }
    }, []);

    // Merge friends with AI
    const displayFriends = aiPartner ? [aiPartner, ...friends] : friends;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleAdd = () => {
        // Simple parse: User@ID
        const parts = newFriendId.split('@');
        if (parts.length === 2) {
            const success = onAddFriend(parts[1], parts[0]);
            if (success) setNewFriendId('');
            else alert("Invalid or duplicate!");
        } else {
            alert("Format: Name@ID");
        }
    };

    return (
        <>
            <div className={`social-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="social-header" onClick={toggleExpand}>
                    <h3>💬 {isExpanded && t('social.title')}</h3>
                    <button className="toggle-btn">{isExpanded ? '→' : '←'}</button>
                </div>

                {isExpanded && (
                    <div className="social-content fade-in">
                        <div className="friends-list-mini">
                            {displayFriends.map(friend => (
                                <div key={friend.id} className="friend-row" onClick={() => setSelectedFriend(friend)}>
                                    <div className="friend-avatar-mini">
                                        {friend.avatar ? (
                                            <img src={friend.avatar} alt={friend.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            friend.name[0]
                                        )}
                                        <div className={`status-dot-mini ${pingStatus[friend.id] || 'online'}`}></div>{/* Assume AI online */}
                                    </div>
                                    <div className="friend-info-mini">
                                        <span className="friend-name">{friend.name}</span>
                                        <span className="friend-status">{pingStatus[friend.id] === 'online' ? t('social.online') : t('social.offline')}</span>
                                    </div>
                                    <button className="chat-btn-mini">➤</button>
                                </div>
                            ))}
                        </div>

                        <div className="add-friend-mini">
                            <input
                                placeholder={t('social.add_placeholder')}
                                value={newFriendId}
                                onChange={e => setNewFriendId(e.target.value)}
                            />
                            <button onClick={handleAdd}>+</button>
                        </div>

                        <div className="refresh-mini">
                            <button onClick={onCheckStatus}>🔄 {t('social.refresh')}</button>
                        </div>
                    </div>
                )}
            </div>

            {selectedFriend && (
                <FriendChat
                    friend={selectedFriend}
                    myId={myId}
                    onClose={() => setSelectedFriend(null)}
                    onRemove={(id) => {
                        onRemoveFriend(id);
                        setSelectedFriend(null);
                    }}
                    onClearHistory={onClearHistory}
                />
            )}
        </>
    );
};

export default SocialPanel;
