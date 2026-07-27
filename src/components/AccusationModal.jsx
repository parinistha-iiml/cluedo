import React from "react";

export default function AccusationModal({ show, onClose, accusation, setAccusation, suspects, weapons, rooms, onSubmit }) {
  if (!show) return null;

  return (
    /* Backdrop overlay: clicking here closes the modal */
    <div 
      onClick={onClose}
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: "rgba(0, 0, 0, 0.65)", 
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 1000,
        padding: "clamp(0.75rem, 3vw, 1.5rem)",
        boxSizing: "border-box",
        overscrollBehavior: "contain",
        cursor: "pointer"
      }}
    >
      {/* Opaque Modal Container with #FAEECD background */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#FAEECD", 
          borderRadius: 16, 
          padding: "clamp(1rem, 3vw, 1.5rem)", 
          maxWidth: 480, 
          width: "100%", 
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
          border: "1px solid #E8D8A3", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
          WebkitOverflowScrolling: "touch",
          cursor: "default"
        }}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)", fontWeight: 600, color: "#3B2D0C" }}>
          ⚖️ Make an Accusation
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#C0392B", marginBottom: "1.25rem", marginTop: 0, fontWeight: 500 }}>
          ⚠️ If wrong, you are eliminated!
        </p>
        
        <label style={{ fontSize: "0.85rem", display: "block", marginBottom: 6, fontWeight: 600, color: "#5C4A1E" }}>
          Suspect:
        </label>
        <select 
          value={accusation.suspect} 
          onChange={e => setAccusation(a => ({...a, suspect: e.target.value}))} 
          style={{ 
            width: "100%", 
            minHeight: "44px",
            marginBottom: "1rem", 
            padding: "10px 12px", 
            borderRadius: 8, 
            border: "1px solid #D4C494", 
            background: "#ffffff", 
            color: "#3B2D0C",
            fontSize: "16px", // 16px stops automatic zoom on mobile browser focus
            outline: "none",
            boxSizing: "border-box"
          }}
        >
          <option value="">-- select --</option>
          {suspects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label style={{ fontSize: "0.85rem", display: "block", marginBottom: 6, fontWeight: 600, color: "#5C4A1E" }}>
          Weapon:
        </label>
        <select 
          value={accusation.weapon} 
          onChange={e => setAccusation(a => ({...a, weapon: e.target.value}))} 
          style={{ 
            width: "100%", 
            minHeight: "44px",
            marginBottom: "1rem", 
            padding: "10px 12px", 
            borderRadius: 8, 
            border: "1px solid #D4C494", 
            background: "#ffffff", 
            color: "#3B2D0C",
            fontSize: "16px",
            outline: "none",
            boxSizing: "border-box"
          }}
        >
          <option value="">-- select --</option>
          {weapons.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
        </select>

        <label style={{ fontSize: "0.85rem", display: "block", marginBottom: 6, fontWeight: 600, color: "#5C4A1E" }}>
          Room:
        </label>
        <select 
          value={accusation.room} 
          onChange={e => setAccusation(a => ({...a, room: e.target.value}))} 
          style={{ 
            width: "100%", 
            minHeight: "44px",
            marginBottom: "1.25rem", 
            padding: "10px 12px", 
            borderRadius: 8, 
            border: "1px solid #D4C494", 
            background: "#ffffff", 
            color: "#3B2D0C",
            fontSize: "16px",
            outline: "none",
            boxSizing: "border-box"
          }}
        >
          <option value="">-- select --</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={onClose} 
            style={{ 
              flex: "1 1 120px", 
              padding: "12px", 
              minHeight: "44px",
              borderRadius: 8, 
              cursor: "pointer", 
              background: "transparent",
              border: "1px solid #D4C494",
              color: "#3B2D0C",
              fontSize: "0.9rem",
              fontWeight: 500,
              touchAction: "manipulation"
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit} 
            disabled={!accusation.suspect || !accusation.weapon || !accusation.room} 
            style={{ 
              flex: "1 1 120px", 
              padding: "12px", 
              minHeight: "44px",
              borderRadius: 8, 
              background: "#C0392B", 
              color: "white", 
              border: "none", 
              cursor: !accusation.suspect || !accusation.weapon || !accusation.room ? "not-allowed" : "pointer",
              opacity: !accusation.suspect || !accusation.weapon || !accusation.room ? 0.6 : 1,
              fontSize: "0.9rem",
              fontWeight: 600,
              touchAction: "manipulation"
            }}
          >
            Accuse!
          </button>
        </div>
      </div>
    </div>
  );
}