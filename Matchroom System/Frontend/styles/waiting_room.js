import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://your-deployed-backend.on.render.com'); // Replace with your backend URL

export default function WaitingRoom() {
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [matchrooms, setMatchrooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        // Fetch waiting users
        const fetchUsers = async () => {
            const res = await fetch('/api/waiting-users');
            const data = await res.json();
            setWaitingUsers(data);
        };

        fetchUsers();
        const interval = setInterval(fetchUsers, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Listen for matchroom updates
        socket.on('updateMatchrooms', (rooms) => {
            setMatchrooms(rooms);
        });

        // Clean up on unmount
        return () => {
            socket.off('updateMatchrooms');
        };
    }, []);

    const joinMatchroom = (roomId) => {
        // Emit a join room event
        socket.emit('joinRoom', roomId);

        // Set the selected room state
        setSelectedRoom(roomId);
    };

    return (
        <div>
            <h1>Waiting Room</h1>
            {waitingUsers.length > 0 ? (
                <div>
                    <h2>Players Waiting:</h2>
                    <ul>
                        {waitingUsers.map(user => (
                            <li key={user.id}>
                                <img src={user.photos[0].value} alt={user.displayName} width={50} />
                                {user.displayName}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>No players waiting...</p>
            )}

            <h2>Available Matchrooms:</h2>
            <ul>
                {matchrooms.map((room) => (
                    <li key={room.id}>
                        <button onClick={() => joinMatchroom(room.id)}>
                            Join Room {room.id}
                        </button>
                    </li>
                ))}
            </ul>

            {selectedRoom && <p>Joined Room {selectedRoom}</p>}
        </div>
    );
}
