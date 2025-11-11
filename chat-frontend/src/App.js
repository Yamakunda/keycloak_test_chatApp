import React, { useState, useEffect } from 'react';
import keycloak from './keycloak'; // Import file cấu hình keycloak
import ChatRoom from './ChatRoom';
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Khởi tạo Keycloak
        keycloak.init({ onLoad: 'check-sso' })
            .then(authenticated => {
                // Cập nhật trạng thái xác thực sau khi khởi tạo xong
                setIsAuthenticated(authenticated);
                setIsLoading(false); // Hoàn tất việc tải
            })
            .catch(error => {
                console.error("Keycloak initialization failed", error);
                setIsLoading(false);
            });
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần

    // Hiển thị thông báo trong khi Keycloak đang khởi tạo
    if (isLoading) {
        return <div>Initializing Keycloak...</div>;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>React Chat App with keycloak-js</h1>
                {!isAuthenticated && (
                    <button type="button" onClick={() => keycloak.login()}>
                        Login
                    </button>
                )}

                {isAuthenticated && (
                    <div>
                        <p>Welcome, {keycloak.tokenParsed.preferred_username}!</p>
                        <button type="button" onClick={() => keycloak.logout()}>
                            Logout
                        </button>
                        {/* Truyền đối tượng keycloak xuống cho component con */}
                        <ChatRoom keycloak={keycloak} />
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;