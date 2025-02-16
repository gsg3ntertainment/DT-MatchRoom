const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
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
        transports: ['websocket', 'polling']
    }
});

const matchRooms = {};
const maps = ["Dust2", "Anubis", "Train", "Overpass", "Ancient", "Inferno", "Mirage"];
const waitingUsers = new Set(); // ✅ Store logged-in users

// ✅ Setup session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// ✅ Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// ✅ Configure Steam authentication strategy
passport.use(new SteamStrategy({
    returnURL: `${process.env.BASE_URL}/auth/steam/return`,
    realm: process.env.BASE_URL,
    apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
    profile.steamId = identifier.match(/\d+$/)[0]; // Extract Steam ID
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ✅ Steam Login Route
app.get('/auth/steam', passport.authenticate('steam'));

// ✅ Steam Callback Route
app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => {
        waitingUsers.add(req.user); // ✅ Add user to waiting room
        res.redirect('/waiting-room'); // Redirect to waiting room
    }
);

// ✅ API to fetch waiting users
app.get('/api/waiting-users', (req, res) => {
    res.json(Array.from(waitingUsers));
});

// ✅ Logout Route
app.get('/logout', (req, res) => {
    waitingUsers.delete(req.user);
    req.logout(() => res.redirect('/'));
});

// ✅ WebSockets for Matchroom
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

// ✅ Server Health Check
app.get('/health', (req, res) => {
    res.send('Server is running');
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
