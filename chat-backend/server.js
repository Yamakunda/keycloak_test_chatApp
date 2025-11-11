require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Cho phép client React kết nối
        methods: ["GET", "POST"]
    }
});

// Cấu hình Keycloak
const keycloakConfig = {
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
};

const client = jwksClient({
    jwksUri: `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function(err, key) {
        if (err) {
            console.error('Error getting signing key:', err);
            return callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

// Middleware xác thực của Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return next(new Error('Authentication error: Invalid token.'));
        }
        // Gắn thông tin người dùng đã giải mã vào đối tượng socket
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.preferred_username} (${socket.id})`);

    // Thông báo cho tất cả client rằng có người dùng mới tham gia
    socket.broadcast.emit('user_joined', {
        username: socket.user.preferred_username,
    });

    socket.on('send_message', (message) => {
        console.log(`Message from ${socket.user.preferred_username}: ${message.text}`);
        // Gửi tin nhắn đến tất cả các client đang kết nối, bao gồm cả người gửi
        io.emit('receive_message', {
            text: message.text,
            username: socket.user.preferred_username,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.preferred_username} (${socket.id})`);
        // Thông báo cho tất cả client rằng người dùng đã rời đi
        io.emit('user_left', {
            username: socket.user.preferred_username,
        });
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
