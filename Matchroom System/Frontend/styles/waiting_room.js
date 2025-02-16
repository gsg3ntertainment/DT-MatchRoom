import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://dt-matchroom.onrender.com");  // Replace with your deployed backend URL

export default function WaitingRoom() {
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [room, setRoom] = useState("");
    const [player, setPlayer] = useState({ name: "", team: "" });

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
