// src/ChatRoom.js

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Nhận keycloak như một prop
const ChatRoom = ({ keycloak }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socketRef = useRef(null);

    useEffect(() => {
        // Chỉ kết nối khi keycloak đã được xác thực
        if (keycloak && keycloak.authenticated) {
            // Kết nối với server, gửi token để xác thực
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            
            socketRef.current = io(backendUrl, {
                auth: {
                    token: keycloak.token
                }
            });

            socketRef.current.on('connect_error', (err) => {
                console.error("Connection Error:", err.message);
            });

            socketRef.current.on('receive_message', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });

            socketRef.current.on('user_joined', (data) => {
                 setMessages((prevMessages) => [...prevMessages, { system: true, text: `${data.username} has joined.` }]);
            });

            socketRef.current.on('user_left', (data) => {
                 setMessages((prevMessages) => [...prevMessages, { system: true, text: `${data.username} has left.` }]);
            });

            // Dọn dẹp khi component unmount
            return () => {
                socketRef.current.disconnect();
            };
        }
    }, [keycloak]); // useEffect sẽ chạy lại nếu đối tượng keycloak thay đổi

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim() && socketRef.current) {
            socketRef.current.emit('send_message', { text: input });
            setInput('');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg, index) => (
                     <div key={index} className={msg.system ? 'system-message' : 'user-message'}>
                        {msg.system ? (
                            <em>{msg.text}</em>
                        ) : (
                            <strong>{msg.username}:</strong>
                        )}
                        {!msg.system && ` ${msg.text}`}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatRoom;