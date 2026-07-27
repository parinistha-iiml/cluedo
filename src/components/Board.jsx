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
  onCellClick,
  boardImageUrl = "/assets/board.png" // Pass your custom image URL here
}) {
  const cells = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      const roomId = roomCellMap?.[key];
      const isReachable = Array.isArray(reachable) 
        ? reachable.includes(key) 
        : Boolean(reachable?.[key]);
      const isClueTile = CLUE_TILE_CELLS.some(([tr, tc]) => tr === r && tc === c);
      const p0Here = positions?.[0]?.row === r && positions?.[0]?.col === c;
      const p1Here = positions?.[1]?.row === r && positions?.[1]?.col === c;

      // Transparent by default, highlighted gold when reachable
      let bg = "transparent";
      if (isReachable) {
        bg = "rgba(255, 215, 0, 0.55)"; 
      }

      cells.push(
        <div
          key={key}
          onClick={() => onCellClick && onCellClick(r, c)}
          style={{
            width: "100%",
            aspectRatio: "1",
            background: bg,
            border: isReachable 
              ? "2px solid #FFD700" 
              : "none",
            cursor: isReachable ? "pointer" : "default",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s, border 0.2s",
            boxSizing: "border-box",
            overflow: "hidden",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent"
          }}
        >
          {/* Clue Tile Indicator */}
          {isClueTile && !roomId && (
            <span style={{ 
              fontSize: "clamp(12px, 3.5vw, 20px)", 
              position: "absolute", 
              top: "5%", 
              left: "5%",
              filter: "drop-shadow(0px 1px 1px rgba(255,255,255,0.8))",
              lineHeight: 1,
              userSelect: "none"
            }}>
              ❓
            </span>
          )}

          {/* Player 1 Marker */}
          {p0Here && (
            <div style={{
              width: "clamp(14px, 4.5vw, 24px)", 
              height: "clamp(14px, 4.5vw, 24px)", 
              borderRadius: "50%", 
              background: "#C0392B", 
              border: "2px solid white",
              position: "absolute", 
              top: "6%", 
              left: "6%", 
              fontSize: "clamp(8px, 2vw, 12px)", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "bold", 
              zIndex: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
              userSelect: "none"
            }}>1</div>
          )}

          {/* Player 2 Marker */}
          {p1Here && (
            <div style={{
              width: "clamp(14px, 4.5vw, 24px)", 
              height: "clamp(14px, 4.5vw, 24px)", 
              borderRadius: "50%", 
              background: "#2980B9", 
              border: "2px solid white",
              position: "absolute", 
              bottom: "6%", 
              right: "6%", 
              fontSize: "clamp(8px, 2vw, 12px)", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "bold", 
              zIndex: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
              userSelect: "none"
            }}>2</div>
          )}
        </div>
      );
    }
  }

  return (
    <div style={{ 
      position: "relative",
      width: "100%",
      maxWidth: "1080px",
      margin: "0 auto",
      aspectRatio: "1",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      backgroundColor: "#2c3e50",
      containerType: "inline-size" // Enables container units for relative child sizing
    }}>
      {/* Layer 1: Custom Background Image */}
      {boardImageUrl && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${boardImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }} />
      )}

      {/* Layer 2: Transparent Interactive Click Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 1,
      }}>
        {cells}
      </div>
    </div>
  );
}