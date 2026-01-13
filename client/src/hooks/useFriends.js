import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export const useFriends = () => {
    const [friends, setFriends] = useState([]);
    const [pingStatus, setPingStatus] = useState({});
    const peerRef = useRef(null);

    useEffect(() => {
        const savedFriends = JSON.parse(localStorage.getItem('letswatch_friends') || '[]');
        setFriends(savedFriends);
    }, []);

    const addFriend = (id, name) => {
        if (!id || !name) return false;
        if (friends.some(f => f.id === id)) return false;

        const newFriends = [...friends, { id, name }];
        setFriends(newFriends);
        localStorage.setItem('letswatch_friends', JSON.stringify(newFriends));
        return true;
    };

    const removeFriend = (id) => {
        const newFriends = friends.filter(f => f.id !== id);
        setFriends(newFriends);
        localStorage.setItem('letswatch_friends', JSON.stringify(newFriends));

        // Cleanup status
        const newStatus = { ...pingStatus };
        delete newStatus[id];
        setPingStatus(newStatus);
    };

    const clearChatHistory = (friendId) => {
        localStorage.removeItem(`chat_history_${friendId}`);
        // Dispatch event to update any open chat windows if necessary
        window.dispatchEvent(new Event('chat-history-cleared'));
    };

    const checkStatuses = async () => {
        if (!peerRef.current || peerRef.current.destroyed) {
            peerRef.current = new Peer(undefined, { debug: 0 }); // ephemeral peer just for pinging? 
            // Actually better to use existing peer if possible, but hook might be used in Profile or Dashboard.
            // Let's create a temporary one if needed, or allow passing one in. 
            // For now, let's keep it simple and create one if not exists, but this might spam PeerServer.
            // OPTIMIZATION: Check if we can reuse the global peer from Dashboard.

            // Wait for open
            await new Promise(resolve => {
                if (peerRef.current.open) resolve();
                else peerRef.current.on('open', resolve);
            });
        }

        const newStatus = {};
        friends.forEach(f => newStatus[f.id] = 'checking');
        setPingStatus(prev => ({ ...prev, ...newStatus }));

        friends.forEach(friend => {
            const conn = peerRef.current.connect(friend.id, { reliable: true });

            const timer = setTimeout(() => {
                setPingStatus(prev => ({ ...prev, [friend.id]: 'offline' }));
                conn.close();
            }, 5000);

            conn.on('open', () => {
                clearTimeout(timer);
                setPingStatus(prev => ({ ...prev, [friend.id]: 'online' }));
                conn.close();
            });

            conn.on('error', () => {
                clearTimeout(timer);
                setPingStatus(prev => ({ ...prev, [friend.id]: 'offline' }));
            });
        });
    };

    return {
        friends,
        addFriend,
        removeFriend,
        clearChatHistory,
        pingStatus,
        checkStatuses
    };
};
