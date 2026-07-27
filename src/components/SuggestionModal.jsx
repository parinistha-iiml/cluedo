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
    padding: "10px 12px",
    minHeight: "44px", // Safe touch-target height for mobile
    borderRadius: 8,
    border: "1px solid #D4C494",
    background: "rgba(255, 255, 255, 0.7)",
    color: "#3B2D0C",
    fontSize: "0.9rem",
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#5C4A1E",
    display: "block",
    marginBottom: 6,
  };

  return (
    /* Backdrop overlay with dynamic padding */
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
        zIndex: 100,
        padding: "1rem", // Generous edge padding on phones
        cursor: "pointer",
        boxSizing: "border-box"
      }}
    >
      {/* Parchment / Notebook Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#FAEECD", 
          borderRadius: 16, 
          padding: "clamp(1.25rem, 4vw, 2rem)", // Fluid scaling for mobile/desktop padding
          width: "min(400px, 100%)", // Expands up to 400px on desktop; sits flush on small phones
          maxHeight: "90vh", // Prevents overflow on short/landscape mobile viewports
          overflowY: "auto", // Enables internal scroll if screen height is constrained
          border: "1px solid #E8D8A3", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          cursor: "default",
          boxSizing: "border-box"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 600, color: "#3B2D0C" }}>
            💬 Make a Suggestion
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#786538", margin: 0, lineHeight: 1.4 }}>
            Propose a combination to test your theory
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
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
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              flex: 1, 
              padding: "12px", 
              minHeight: "44px",
              borderRadius: 8, 
              cursor: "pointer", 
              border: "1px solid #D4C494",
              background: "rgba(255, 255, 255, 0.5)",
              color: "#5C4A1E",
              fontWeight: 600,
              fontSize: "0.9rem",
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
              padding: "12px", 
              minHeight: "44px",
              borderRadius: 8, 
              background: isFormComplete ? "#8E44AD" : "#C4B2D8", 
              color: "white", 
              border: "none", 
              cursor: isFormComplete ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "0.9rem",
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