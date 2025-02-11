import { useState, useEffect } from "react";
import MapBan from "./MapBan";

const TEAMS = ["A", "B", "C", "D"];

export default function Matchroom({ socket, matchroom, name }) {
  const [team, setTeam] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [players, setPlayers] = useState([]);
  const [mapBanning, setMapBanning] = useState(false);

  useEffect(() => {
    socket.on("update_players", (data) => {
      setPlayers(data.players);
    });

    return () => socket.off("update_players");
  }, []);

  const selectTeam = (team) => {
    setTeam(team);
    socket.emit("join_team", { matchroom, name, team });
  };

  const chooseCaptain = () => {
    setIsCaptain(true);
    socket.emit("set_captain", { matchroom, name, team });
  };

  return (
    <div className="mt-6 text-center">
      <h2 className="text-2xl">Matchroom: {matchroom}</h2>

      {!team ? (
        <div className="mt-4">
          <h3>Select a Team:</h3>
          {TEAMS.map((t) => (
            <button key={t} className="m-2 p-2 bg-gray-700 rounded" onClick={() => selectTeam(t)}>
              Team {t}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <h3>You are in Team {team}</h3>
          {!isCaptain ? (
            <button className="p-2 bg-yellow-500 rounded" onClick={chooseCaptain}>Become Captain</button>
          ) : (
            <MapBan socket={socket} matchroom={matchroom} />
          )}
        </div>
      )}

      <div className="mt-6">
        <h3>Players in Room:</h3>
        <ul>
          {players.map((p, i) => (
            <li key={i}>{p.name} - Team {p.team}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
