// monorepo-structure
// /matchroom-app
//    ├── frontend (Next.js)
//    ├── backend (Node.js with Express & WebSockets)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        transports: ['websocket', 'polling'] // ✅ Required for Render
    }
});

// Initialize Matchrooms
const matchRooms = {};
const maps = ["Dust2", "Anubis", "Train", "Overpass", "Ancient", "Inferno", "Mirage"];

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', ({ room, player }) => {
        if (!matchRooms[room]) {
            matchRooms[room] = { teams: { A: [], B: [], C: [], D: [] }, bans: [] };
        }
        matchRooms[room].teams[player.team].push(player.name);
        io.to(room).emit('roomUpdate', matchRooms[room]);
    });

    socket.on('banMap', ({ room, captain, map }) => {
        if (matchRooms[room].bans.length < maps.length - 1 && maps.includes(map)) {
            matchRooms[room].bans.push(map);
        }
        if (matchRooms[room].bans.length === maps.length - 1) {
            const finalMap = maps.find(m => !matchRooms[room].bans.includes(m));
            io.to(room).emit('mapSelected', { finalMap, teams: matchRooms[room].teams });
            notifyResult(room, finalMap, matchRooms[room].teams);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Send match results via Email & Discord
function notifyResult(room, map, teams) {
    const message = `Final Map: ${map}\nTeams:\nA: ${teams.A.join(', ')}\nB: ${teams.B.join(', ')}\nC: ${teams.C.join(', ')}\nD: ${teams.D.join(', ')}`;

    // ✅ Send message to Discord webhook
    axios.post(process.env.DISCORD_WEBHOOK_URL, { content: message }).catch(err => console.error("Discord webhook error:", err));

    // ✅ Send email with match results
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD }
    });

    transporter.sendMail({
        from: process.env.EMAIL,
        to: 'business.gsg3ntertainment@gmail.com',
        subject: 'Matchroom Result',
        text: message
    }).catch(err => console.error("Email sending error:", err));
}

// ✅ Keep-Alive Endpoint to Prevent Sleeping on Render
app.get('/health', (req, res) => {
    res.send('Server is running');
});

// ✅ Server starts on Render-compatible port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
