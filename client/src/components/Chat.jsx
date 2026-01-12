import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

const Chat = ({ messages, onSendMessage, username }) => {
    const [msg, setMsg] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = (e) => {
        e.preventDefault();
        if (!msg.trim()) return;

        onSendMessage(msg);
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
