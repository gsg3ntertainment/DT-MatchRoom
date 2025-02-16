// Backend (Node.js + Express + WebSockets)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files for any static assets (e.g., images, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the matchroom HTML page on the /matchroom route
app.get('/matchroom', (req, res) => {
    res.sendFile(path.join(__dirname, 'matchroom.html')); // Adjust path if needed
});

const PORT = process.env.PORT || 5000;

const matchRooms = {};
const maps = ["Dust2", "Anubis", "Train", "Overpass", "Ancient", "Inferno", "Mirage"];

// Handle socket connections
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ room, player }) => {
        if (!matchRooms[room]) {
            matchRooms[room] = { teams: { A: [], B: [], C: [], D: [] }, bans: [] };
        }
        matchRooms[room].teams[player.team].push(player.name);
        io.to(room).emit('roomUpdate', matchRooms[room]);
    });

    socket.on('banMap', ({ room, captain, map }) => {
        if (matchRooms[room].bans.length < 2 && maps.includes(map)) {
            matchRooms[room].bans.push(map);
            if (matchRooms[room].bans.length === 2) {
                const finalMap = maps.find(m => !matchRooms[room].bans.includes(m));
                io.to(room).emit('mapSelected', { finalMap, teams: matchRooms[room].teams });
                notifyResult(room, finalMap, matchRooms[room].teams);
            }
        }
    });
});

// Notify via Discord and Email
function notifyResult(room, map, teams) {
    const message = `Final Map: ${map}\nTeams:\nA: ${teams.A.join(', ')}\nB: ${teams.B.join(', ')}\nC: ${teams.C.join(', ')}\nD: ${teams.D.join(', ')}`;

    axios.post(process.env.DISCORD_WEBHOOK_URL, { content: message });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD }
    });

    transporter.sendMail({
        from: process.env.EMAIL,
        to: 'business.gsg3ntertainment@gmail.com',
        subject: 'Matchroom Result',
        text: message
    });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
