import React, { useState, useEffect, useRef } from 'react';
import './FriendChat.css';
import { GeminiService } from '../services/GeminiService';

const FriendChat = ({ friend, myId, onClose, onRemove, onClearHistory }) => {
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

    const [isTyping, setIsTyping] = useState(false);

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

        // Check for AI Interaction
        if (friend.isAi) {
            const service = new GeminiService(friend.apiKey);

            // Initial "Typing"
            // Delay before typing starts (e.g. 2s reading time)
            setTimeout(() => setIsTyping(true), 1500);

            service.randomDelay().then(async () => {
                // Pass persona data if available
                const responseText = await service.sendMessage(newHistory, inputText, friend.persona || {}, friend.mode);

                setIsTyping(false); // Stop typing

                const aiMsg = {
                    sender: friend.id,
                    text: responseText,
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => {
                    const updated = [...prev, aiMsg];
                    localStorage.setItem(`chat_history_${friend.id}`, JSON.stringify(updated));
                    return updated;
                });
                // Force scroll? It might happen naturally if user is looking
                // scrollToBottom(); // Can't easily call from closure without ref current check
                // Ideally use useEffect usage on [messages]
            });

            return; // Stop here, don't emit event
        }


        window.dispatchEvent(new CustomEvent('send-dm', {
            detail: { targetId: friend.id, message: msg }
        }));
    };

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [showOptions, setShowOptions] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);

    return (
        <div className="friend-chat-modal fade-in">
            <div className="chat-header">
                <div className="chat-avatar">
                    {friend.avatar ? <img src={friend.avatar} alt="av" /> : friend.name[0]}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{friend.name}</h3>
                    {/* IG Style Online Status: Only show 'Active now' if typing or recently messaged */}
                    {isTyping ?
                        <span style={{ fontSize: '0.7rem', color: '#888' }}>Active now</span> :
                        messages.length > 0 ? <span style={{ fontSize: '0.7rem', color: '#888' }}>Active 1h ago</span> : null
                    }
                </div>
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                    <button className="options-btn" onClick={() => setShowOptions(!showOptions)}>⋮</button>
                    {showOptions && <div className="chat-options-menu">
                        <button className={confirmDelete ? "confirm-danger" : ""} onClick={() => {
                            if (!confirmDelete) {
                                setConfirmDelete(true);
                                // Reset confirm after 3s
                                setTimeout(() => setConfirmDelete(false), 3000);
                                return;
                            }
                            onClearHistory && onClearHistory(friend.id);
                            setMessages([]);
                            setConfirmDelete(false);
                            setShowOptions(false);
                        }}>
                            {confirmDelete ? "Sure? Click again" : "Clear History"}
                        </button>

                        {!friend.isAi && <button className={confirmRemove ? "confirm-danger" : ""}
                            style={{ color: '#ff6b6b' }}
                            onClick={() => {
                                if (!confirmRemove) {
                                    setConfirmRemove(true);
                                    setTimeout(() => setConfirmRemove(false), 3000);
                                    return;
                                }
                                onRemove && onRemove(friend.id);
                                setConfirmRemove(false);
                                onClose();
                            }}>
                            {confirmRemove ? "Really Remove?" : "Remove Friend"}
                        </button>}
                    </div>
                    }
                </div>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="chat-body">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.sender === myId ? 'me' : 'them'}`}>
                        <p>{m.text}</p>
                        <span className="time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                {isTyping && (
                    <div className="chat-bubble them typing-indicator">
                        <span>...</span>
                    </div>
                )}
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
