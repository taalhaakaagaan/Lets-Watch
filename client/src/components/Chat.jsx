import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

const Chat = ({ socket, username, roomId }) => {
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;
        socket.on('chat-message', (message) => {
            setMessages(prev => [...prev, message]);
        });
        return () => socket.off('chat-message');
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = (e) => {
        e.preventDefault();
        if (!msg.trim() || !socket) return;

        // Optimistic UI
        const newMessage = { user: username, text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        // setMessages(prev => [...prev, newMessage]); // Socket will echo back usually, depends on server logic. Let's assume server broadcasts to ALL including sender.

        socket.emit('send-chat', { roomId, message: newMessage });
        setMsg("");
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Room Chat</h3>
            </div>
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.user === username ? 'my-message' : ''}`}>
                        <span className="msg-user">{m.user}: </span>
                        <span className="msg-text">{m.text}</span>
                        <span className="msg-time">{m.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={send}>
                <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;
