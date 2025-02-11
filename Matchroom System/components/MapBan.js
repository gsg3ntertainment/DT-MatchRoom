import { useState, useEffect } from "react";

const MAPS = ["Dust2", "Anubis", "Train", "Overpass", "Ancient", "Inferno", "Mirage"];

export default function MapBan({ socket, matchroom }) {
  const [availableMaps, setAvailableMaps] = useState([]);
  const [bannedMaps, setBannedMaps] = useState([]);
  const [finalMap, setFinalMap] = useState(null);

  useEffect(() => {
    const randomMaps = MAPS.sort(() => 0.5 - Math.random()).slice(0, 3);
    setAvailableMaps(randomMaps);

    socket.on("map_banned", (data) => {
      setBannedMaps((prev) => [...prev, data.map]);
      if (data.finalMap) setFinalMap(data.finalMap);
    });

    return () => socket.off("map_banned");
  }, []);

  const banMap = (map) => {
    socket.emit("ban_map", { matchroom, map });
  };

  return (
    <div className="mt-4">
      <h3>Map Ban Phase</h3>
      {finalMap ? (
        <p>Final Map: {finalMap}</p>
      ) : (
        <div>
          <h4>Available Maps:</h4>
          {availableMaps.map((map) => (
            <button key={map} className="m-2 p-2 bg-red-600 rounded" onClick={() => banMap(map)}>
              Ban {map}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
