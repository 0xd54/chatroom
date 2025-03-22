// Connect to Socket.IO server
const socket = io();

// DOM Elements
const messagesList = document.querySelector('.messages-container');
const messageInput = document.getElementById('chat-input');

// Get user data from localStorage
const username = localStorage.getItem('username');
const isAdmin = localStorage.getItem('isAdmin') === 'true' && username === '7cryx';

// Redirect to login if no username
if (!username) {
    window.location.href = 'login.html';
}

// Emit login event
socket.emit('user login', { username, isAdmin });

// Listen for chat messages
socket.on('chat message', (msg) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (msg.type === 'system' ? ' system-message' : '');

    const timestamp = new Date(msg.timestamp).toLocaleTimeString();
    const sender = msg.type === 'system' ? 'SYSTEM' : msg.sender;
    const adminClass = msg.isAdmin ? ' admin' : '';

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-time">[${timestamp}]</span>
            <span class="message-sender${adminClass}">${sender}</span>
        </div>
        <div class="message-content">${msg.content}</div>
    `;

    messagesList.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
});

// Handle message input
document.getElementById('send-button').addEventListener('click', sendMessage);

// Add Enter key event listener
document.getElementById('chat-input').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Message sending function
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message) {
        // Handle commands
        if (message.startsWith('/')) {
            switch(message.toLowerCase()) {
                case '/clear':
                    messagesList.innerHTML = '';
                    break;
                case '/date':
                    const now = new Date();
                    const systemMessage = {
                        type: 'system',
                        sender: 'SYSTEM',
                        content: `Current date and time: ${now.toLocaleString()}`,
                        timestamp: now
                    };
                    socket.emit('chat message', systemMessage);
                    break;
                case '/7cryx':
                    const cryxMessage = {
                        type: 'system',
                        sender: 'SYSTEM',
                        content: '7cryx is anonymous',
                        timestamp: new Date()
                    };
                    socket.emit('chat message', cryxMessage);
                    break;
                default:
                    socket.emit('chat message', message);
            }
        } else {
            socket.emit('chat message', message);
        }
        input.value = '';
    }
}

// Update uptime
function updateUptime() {
    let seconds = 0;
    setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        uptimeElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// Generate random IP address
function generateRandomIP() {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
}

// Initialize uptime counter
updateUptime();