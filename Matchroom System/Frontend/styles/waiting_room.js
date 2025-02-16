import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://dt-matchroom.onrender.com");  // Replace with your deployed backend URL

export default function WaitingRoom() {
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [room, setRoom] = useState("");
    const [player, setPlayer] = useState({ name: "", team: "" });

    // Fetch waiting users every 5 seconds
    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch('https://dt-matchroom.onrender.com/api/waiting-users'); // Corrected URL
            const data = await res.json();
            setWaitingUsers(data);
        };

        fetchUsers();
        const interval = setInterval(fetchUsers, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    // Join room
    const joinRoom = () => {
        if (!room || !player.name || !player.team) {
            alert("Please enter all details to join the room!");
            return;
        }
        socket.emit('joinRoom', { room, player });
    };

    // Ban a map
    const banMap = (map) => {
        socket.emit('banMap', { room, captain: player.name, map });
    };

    // Socket listeners for room updates and map selection
    useEffect(() => {
        socket.on('roomUpdate', (matchRoomData) => {
            console.log('Updated matchroom data:', matchRoomData);
            setWaitingUsers(matchRoomData.teams.A.concat(matchRoomData.teams.B, matchRoomData.teams.C, matchRoomData.teams.D));
        });

        socket.on('mapSelected', (data) => {
            console.log('Final map:', data.finalMap);
            console.log('Teams:', data.teams);
        });

        return () => {
            socket.off('roomUpdate');
            socket.off('mapSelected');
        };
    }, []);

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
                <button onClick={() => banMap("Anubis")}>Ban Anubis</button>
                <button onClick={() => banMap("Inferno")}>Ban Inferno</button>
                <button onClick={() => banMap("Overpass")}>Ban Overpass</button>
                <button onClick={() => banMap("Train")}>Ban Train</button>
                <button onClick={() => banMap("Ancient")}>Ban Ancient</button>
            </div>
        </div>
    );
}
