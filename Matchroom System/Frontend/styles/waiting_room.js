import { useEffect, useState } from 'react';

export default function WaitingRoom() {
    const [waitingUsers, setWaitingUsers] = useState([]);

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

    return (
        <div>
            <h1>Waiting Room</h1>
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
    );
}
