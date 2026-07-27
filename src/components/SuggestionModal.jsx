import React from "react";

export default function SuggestionModal({ 
  show, 
  onClose, 
  suggestion, 
  setSuggestion, 
  suspects = [], 
  weapons = [], 
  rooms = [], 
  onSubmit 
}) {
  if (!show) return null;

  const isFormComplete = suggestion.suspect && suggestion.weapon && suggestion.room;

  const selectStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #D4C494",
    background: "rgba(255, 255, 255, 0.7)",
    color: "#3B2D0C",
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#5C4A1E",
    display: "block",
    marginBottom: 4,
  };

  return (
    /* Backdrop overlay with blur */
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
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 100,
        padding: "1rem",
        cursor: "pointer"
      }}
    >
      {/* Parchment / Notebook Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#FAEECD", 
          borderRadius: 16, 
          padding: "1.5rem", 
          maxWidth: 360, 
          width: "100%", 
          border: "1px solid #E8D8A3", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          cursor: "default"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#3B2D0C" }}>
            💬 Make a Suggestion
          </h3>
          <p style={{ fontSize: 11, color: "#786538", margin: 0 }}>
            Propose a combination to test your theory
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {/* Suspect */}
          <div>
            <label style={labelStyle}>Suspect</label>
            <select 
              style={selectStyle}
              value={suggestion.suspect} 
              onChange={(e) => setSuggestion({ ...suggestion, suspect: e.target.value })}
            >
              <option value="">-- Choose Suspect --</option>
              {suspects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option> 
              ))}
            </select>
          </div>

          {/* Weapon */}
          <div>
            <label style={labelStyle}>Weapon</label>
            <select 
              style={selectStyle}
              value={suggestion.weapon} 
              onChange={(e) => setSuggestion({ ...suggestion, weapon: e.target.value })}
            >
              <option value="">-- Choose Weapon --</option>
              {weapons.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option> 
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label style={labelStyle}>Room</label>
            <select 
              style={selectStyle}
              value={suggestion.room} 
              onChange={(e) => setSuggestion({ ...suggestion, room: e.target.value })}
            >
              <option value="">-- Choose Room --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option> 
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              flex: 1, 
              padding: "10px", 
              borderRadius: 8, 
              cursor: "pointer", 
              border: "1px solid #D4C494",
              background: "rgba(255, 255, 255, 0.5)",
              color: "#5C4A1E",
              fontWeight: 600,
              fontSize: 13,
              transition: "background 0.15s ease"
            }}
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={onSubmit} 
            disabled={!isFormComplete} 
            style={{ 
              flex: 1, 
              padding: "10px", 
              borderRadius: 8, 
              background: isFormComplete ? "#8E44AD" : "#C4B2D8", 
              color: "white", 
              border: "none", 
              cursor: isFormComplete ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 13,
              boxShadow: isFormComplete ? "0 2px 4px rgba(142, 68, 173, 0.3)" : "none",
              transition: "all 0.15s ease"
            }}
          >
            Suggest
          </button>
        </div>
      </div>
    </div>
  );
}