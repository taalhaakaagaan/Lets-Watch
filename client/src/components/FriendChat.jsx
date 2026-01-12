import React, { useState, useEffect, useRef } from 'react';
import './FriendChat.css';

const FriendChat = ({ friend, myId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const chatEndRef = useRef(null);
    const peerRef = useRef(null);

    useEffect(() => {
        // Load History
        const savedHistory = JSON.parse(localStorage.getItem(`chat_history_${friend.id}`) || '[]');
        setMessages(savedHistory);
        scrollToBottom();

        // Init Peer for sending if not passed via props (Simple ephemeral or reused)
        // Ideally we reuse the main peer, but for now let's creating a sender connection
        // Note: In a real app, we should use the persistent Dashboard peer. 
        // For this component, we assume parent passes a way to send OR we manage connection.
        // Let's rely on Dashboard/Profile passing a send function? 
        // Or simpler: PeerJS allows connecting.
        // We will assume 'peer' props OR create a temp peer. 
        // Actually, creating a new peer for *every* chat is slow.
        // Let's try to grab the existing peer if possible, or just create one.

        // BETTER: The parent (Profile/Dashboard) should handle the Peer instance.
        // But for isolation, let's allow this component to just "display" and "ask parent to send".
        // Wait, the user wants "persistent DM".
    }, [friend.id]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const msg = {
            sender: myId,
            text: inputText,
            timestamp: new Date().toISOString()
        };

        // Save Local
        const newHistory = [...messages, msg];
        setMessages(newHistory);
        localStorage.setItem(`chat_history_${friend.id}`, JSON.stringify(newHistory));
        setInputText('');
        scrollToBottom();

        // Trigger Send Callback
        // The parent component should handle the actual PeerJS transmission
        // onSendMessage(friend.id, msg);
        // HACK: Dispatch a custom event so Dashboard can pick it up? 
        // Or just use a prop. Let's assume we pass a `sendFunction`.

        window.dispatchEvent(new CustomEvent('send-dm', {
            detail: { targetId: friend.id, message: msg }
        }));
    };

    return (
        <div className="friend-chat-modal fade-in">
            <div className="chat-header">
                <div className="chat-avatar">{friend.name[0]}</div>
                <h3>{friend.name}</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="chat-body">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.sender === myId ? 'me' : 'them'}`}>
                        <p>{m.text}</p>
                        <span className="time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>➤</button>
            </div>
        </div>
    );
};

export default FriendChat;
