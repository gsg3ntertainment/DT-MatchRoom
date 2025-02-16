require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 5000;

let matchrooms = [
    { id: 'room1', players: [], map: 'Dust2' },
    { id: 'room2', players: [], map: 'Mirage' },
    { id: 'room3', players: [], map: 'Inferno' },
];

let waitingUsers = [
    { id: 'user1', displayName: 'Player1', photos: [{ value: 'https://image.url/player1.jpg' }] },
    { id: 'user2', displayName: 'Player2', photos: [{ value: 'https://image.url/player2.jpg' }] },
];

// Middleware to parse JSON
app.use(express.json());

// Route to serve waiting users data
app.get('/api/waiting-users', (req, res) => {
    res.json(waitingUsers); // Return waiting users
});

// Socket.io connection for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send matchrooms to the client when they connect
    socket.emit('updateMatchrooms', matchrooms);

    // Listen for the joinRoom event when a user wants to join a room
    socket.on('joinRoom', (roomId) => {
        const room = matchrooms.find(r => r.id === roomId);
        if (room) {
            room.players.push(socket.id); // Add the socket ID to the room's players
            socket.join(roomId); // Join the room

            // Broadcast updated room data to other users in the room
            io.to(roomId).emit('teamSelectionUpdate', room);
            console.log(`${socket.id} joined room ${roomId}`);
        }
    });

    // Clean up when a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Optionally remove the user from any room when they disconnect
        matchrooms.forEach(room => {
            room.players = room.players.filter(player => player !== socket.id);
        });
    });
});

// Start the server once all configurations are in place
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
