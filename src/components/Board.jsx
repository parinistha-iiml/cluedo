import React from "react";

const BOARD_SIZE = 9;
const CLUE_TILE_CELLS = [[2, 2], [2, 6], [4, 2], [4, 6], [6, 2], [6, 6]];

export default function Board({ 
  roomCellMap, 
  roomLayout, 
  rooms, 
  reachable, 
  positions, 
  playerNames, 
  onCellClick 
}) {
  const cells = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      const roomId = roomCellMap[key];
      const isReachable = reachable.includes(key);
      const isClueTile = CLUE_TILE_CELLS.some(([tr, tc]) => tr === r && tc === c);
      const p0Here = positions[0].row === r && positions[0].col === c;
      const p1Here = positions[1].row === r && positions[1].col === c;

      // Custom Board Design Focus: Customize individual tile appearance here
      let bg = roomId ? roomLayout[roomId]?.color || "#d4c5a9" : "#f5f0e8";
      if (isReachable) bg = "#ffd700";

      cells.push(
        <div
          key={key}
          onClick={() => onCellClick(r, c)}
          style={{
            width: "100%",
            aspectRatio: "1",
            background: bg,
            border: roomId ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0.12)",
            cursor: isReachable ? "pointer" : "default",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {isClueTile && !roomId && (
            <span style={{ fontSize: "9px", position: "absolute", top: 1, left: 1 }}>❓</span>
          )}
          {p0Here && (
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: "#C0392B", border: "2px solid white",
              position: "absolute", top: 2, left: 2, fontSize: 7, color: "white", 
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", zIndex: 2
            }}>1</div>
          )}
          {p1Here && (
            <div style={{
              width: 14, height: 14, borderRadius: "50%", background: "#2980B9", border: "2px solid white",
              position: "absolute", bottom: 2, right: 2, fontSize: 7, color: "white", 
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", zIndex: 2
            }}>2</div>
          )}
        </div>
      );
    }
  }

  const roomLabels = Object.entries(roomLayout).map(([roomId, layout]) => {
    const roomName = rooms.find(r => r.id === roomId)?.name || roomId;
    const rows = layout.cells.map(cell => cell[0]);
    const cols = layout.cells.map(cell => cell[1]);
    const midRow = (Math.min(...rows) + Math.max(...rows)) / 2;
    const midCol = (Math.min(...cols) + Math.max(...cols)) / 2;
    return { roomId, roomName, midRow, midCol };
  });

  return (
    <div style={{ position: "relative" }}>
      {/* Custom Board Design Focus: Outer board frame layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        border: "2px solid #2C2C2A",
        borderRadius: 6,
        overflow: "hidden",
        background: "#f5f0e8",
      }}>
        {cells}
      </div>
      
      {/* Overlay Room Text Labels */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {roomLabels.map(({ roomId, roomName, midRow, midCol }) => (
          <div key={roomId} style={{
            position: "absolute",
            top: `${(midRow / BOARD_SIZE) * 100}%`,
            left: `${(midCol / BOARD_SIZE) * 100}%`,
            transform: "translate(-50%, -50%)",
            fontSize: "8px",
            fontWeight: 500,
            color: "#2C2C2A",
            textAlign: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            textShadow: "0 0 4px rgba(255,255,255,0.9)",
            pointerEvents: "none",
          }}>
            {roomName}
          </div>
        ))}
      </div>
    </div>
  );
}