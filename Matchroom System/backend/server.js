// Backend (Node.js + Express + WebSockets)
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
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

const matchRooms = {};
const maps = ["Dust2", "Anubis", "Train", "Overpass", "Ancient", "Inferno", "Mirage"];

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

function notifyResult(room, map, teams) {
    const message = Final Map: ${map}\nTeams:\nA: ${teams.A.join(', ')}\nB: ${teams.B.join(', ')}\nC: ${teams.C.join(', ')}\nD: ${teams.D.join(', ')};

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

server.listen(PORT, () => console.log(Server running on port ${PORT}));
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:5000");  // Replace with your deployed backend URL

export default function WaitingRoom() {
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [room, setRoom] = useState("");
    const [player, setPlayer] = useState({ name: "", team: "" });

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch('/api/waiting-users');
            const data = await res.json();
            setWaitingUsers(data);
        };

        fetchUsers();
        const interval = setInterval(fetchUsers, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const joinRoom = () => {
        socket.emit('joinRoom', { room, player });
    };

    const banMap = (map) => {
        socket.emit('banMap', { room, captain: player.name, map });
    };

    socket.on('roomUpdate', (matchRoomData) => {
        console.log('Updated matchroom data:', matchRoomData);
    });

    socket.on('mapSelected', (data) => {
        console.log('Final map:', data.finalMap);
        console.log('Teams:', data.teams);
    });

    return (
        <div>
            <h1>Waiting Room</h1>
            <div>
                {waitingUsers.length > 0 ? (
                    <ul>
                        {waitingUsers.map(user => (
                            <li key={user.id}>
                                <img src={user.photos[0].value} alt={user.displayName} width={50} />
                                {user.displayName}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No players waiting...</p>
                )}
            </div>
            <div>
                <input 
                    type="text" 
                    placeholder="Enter Room Name" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)} 
                />
                <input 
                    type="text" 
                    placeholder="Enter Your Name" 
                    value={player.name} 
                    onChange={(e) => setPlayer(prev => ({ ...prev, name: e.target.value }))} 
                />
                <select 
                    value={player.team} 
                    onChange={(e) => setPlayer(prev => ({ ...prev, team: e.target.value }))}>
                    <option value="">Select Team</option>
                    <option value="A">Team A</option>
                    <option value="B">Team B</option>
                    <option value="C">Team C</option>
                    <option value="D">Team D</option>
                </select>
                <button onClick={joinRoom}>Join Room</button>
            </div>
            <div>
                <h2>Ban a Map</h2>
                <button onClick={() => banMap("Dust2")}>Ban Dust2</button>
                <button onClick={() => banMap("Mirage")}>Ban Mirage</button>
                {/* Add buttons for other maps */}
            </div>
        </div>
    );
}
