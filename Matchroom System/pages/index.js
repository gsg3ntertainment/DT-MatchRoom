import { useState, useEffect } from "react";
import io from "socket.io-client";
import Matchroom from "../components/Matchroom";

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL); // WebSocket connection

export default function Home() {
  const [matchroom, setMatchroom] = useState(null);
  const [name, setName] = useState("");
  const [team, setTeam] = useState(null);

  const joinMatchroom = (room) => {
    if (!name) return alert("Enter your name first!");
    setMatchroom(room);
    socket.emit("join_room", { room, name });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">CS2 Matchroom System</h1>

      {!matchroom ? (
        <div className="mt-6">
          <input
            type="text"
            placeholder="Enter your name"
            className="p-2 text-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex space-x-4 mt-4">
            <button className="p-3 bg-blue-600 rounded" onClick={() => joinMatchroom("Room 1")}>Join Room 1</button>
            <button className="p-3 bg-green-600 rounded" onClick={() => joinMatchroom("Room 2")}>Join Room 2</button>
            <button className="p-3 bg-red-600 rounded" onClick={() => joinMatchroom("Room 3")}>Join Room 3</button>
          </div>
        </div>
      ) : (
        <Matchroom socket={socket} matchroom={matchroom} name={name} />
      )}
    </div>
  );
}
