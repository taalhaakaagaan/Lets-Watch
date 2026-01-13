import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FriendChat from './FriendChat';
import './SocialPanel.css';

const SocialPanel = ({ friends, pingStatus, onAddFriend, onRemoveFriend, onClearHistory, onCheckStatus, myId }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [newFriendId, setNewFriendId] = useState('');

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
                            {friends.map(friend => (
                                <div key={friend.id} className="friend-row" onClick={() => setSelectedFriend(friend)}>
                                    <div className="friend-avatar-mini">
                                        {friend.name[0]}
                                        <div className={`status-dot-mini ${pingStatus[friend.id] || 'unknown'}`}></div>
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
