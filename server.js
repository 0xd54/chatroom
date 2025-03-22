const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store connected users
let connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user login
    socket.on('user login', (userData) => {
        const { username, isAdmin } = userData;
        // Only allow 7cryx as admin
        const actualIsAdmin = isAdmin && username === '7cryx';
        connectedUsers.set(socket.id, { username, isAdmin: actualIsAdmin });
        
        // Broadcast updated user list
        io.emit('users update', Array.from(connectedUsers.values()));
        
        // System message for new user
        io.emit('chat message', {
            type: 'system',
            content: `${username} has joined the chat`,
            timestamp: new Date().toISOString()
        });
    });

    // Handle chat messages
    socket.on('chat message', (msg) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            // Handle commands
            if (msg.startsWith('/')) {
                const [command, ...args] = msg.slice(1).split(' ');
                
                switch (command.toLowerCase()) {
                    case 'help':
                        socket.emit('chat message', {
                            type: 'system',
                            content: 'Available commands:\n' +
                                    '/nick <name> - Change your display name\n' +
                                    '/clear - Clear terminal\n' +
                                    '/help - Show this help message' +
                                    (user.isAdmin ? '\n\nAdmin commands:\n' +
                                    '/remove <username> - Remove user from chat' : ''),
                            timestamp: new Date().toISOString()
                        });
                        return;
                    case 'remove':
                        if (user.isAdmin && user.username === '7cryx' && args.length > 0) {
                            const targetUsername = args[0];
                            const targetSocketId = Array.from(connectedUsers.entries())
                                .find(([_, u]) => u.username === targetUsername)?.[0];
                            
                            if (targetSocketId) {
                                io.to(targetSocketId).emit('chat message', {
                                    type: 'system',
                                    content: 'You have been removed from the chat by admin.',
                                    timestamp: new Date().toISOString()
                                });
                                io.sockets.sockets.get(targetSocketId).disconnect();
                                return;
                            }
                        }
                        break;
                }
            }
            
            io.emit('chat message', {
                sender: user.username,
                content: msg,
                isAdmin: user.isAdmin,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            io.emit('chat message', {
                type: 'system',
                content: `${user.username} has left the chat`,
                timestamp: new Date().toISOString()
            });
            connectedUsers.delete(socket.id);
            io.emit('users update', Array.from(connectedUsers.values()));
        }
    });
});

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const PORT = portIndex !== -1 ? parseInt(args[portIndex + 1]) : (process.env.PORT || 3001);

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});