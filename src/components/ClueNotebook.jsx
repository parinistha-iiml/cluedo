import React from "react";

export default function ClueNotebook({ 
  show, 
  onClose, 
  playerName, 
  playerIdx, 
  notebook, 
  suspects = [], 
  weapons = [], 
  rooms = [], 
  onUpdateNotebook 
}) {
  if (!show) return null;

  const categories = [
    { label: "Suspects", items: suspects, type: "suspects" },
    { label: "Weapons", items: weapons, type: "weapons" },
    { label: "Rooms", items: rooms, type: "rooms" },
  ];

  // Cycling sequence: Blank ("") -> ❌ ("no") -> ❓ ("maybe") -> ✓ ("yes") -> Blank ("")
  const cycleState = (currentVal) => {
    switch (currentVal) {
      case "no":
        return "maybe";
      case "maybe":
        return "yes";
      case "yes":
        return "";
      default:
        return "no";
    }
  };

  // Helper for styling the toggle buttons based on current state
  const getButtonConfig = (val) => {
    switch (val) {
      case "no":
        return { label: "❌", bg: "#FCEBEB", border: "#F5C4B3", color: "#A32D2D" };
      case "maybe":
        return { label: "❓", bg: "#FFF8E7", border: "#FAC775", color: "#854F0B" };
      case "yes":
        return { label: "✓", bg: "#EAF3DE", border: "#9FE1CB", color: "#0F6E56" };
      default:
        return { label: "-", bg: "rgba(255, 255, 255, 0.6)", border: "#D4C494", color: "#786538" };
    }
  };

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
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 100, 
        overflowY: "auto",
        cursor: "pointer"
      }}
    >
      {/* Opaque Notebook Container with #FAEECD background */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#FAEECD", 
          borderRadius: 16, 
          padding: "1.25rem", 
          maxWidth: 440, 
          width: "90%", 
          border: "1px solid #E8D8A3", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          margin: "1rem",
          cursor: "default"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#3B2D0C" }}>
            📓 {playerName}'s Notebook
          </h3>
          <p style={{ fontSize: 11, color: "#786538", margin: 0 }}>
            Click items to toggle: Blank ➔ ❌ Eliminated ➔ ❓ Possible ➔ ✓ Solution
          </p>
        </div>

        {/* Categories Matrix */}
        {categories.map(({ label, items, type }) => (
          <div key={type} style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px", color: "#5C4A1E", borderBottom: "1px dashed #D4C494", paddingBottom: 2 }}>
              {label}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              {items.map(item => {
                const val = notebook[playerIdx]?.[type]?.[item.id] || "";
                const btnConfig = getButtonConfig(val);

                return (
                  <div 
                    key={item.id} 
                    onClick={() => onUpdateNotebook(playerIdx, type, item.id, cycleState(val))}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      gap: 6, 
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.3)",
                      border: "1px solid rgba(212, 196, 148, 0.4)",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#3B2D0C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </span>

                    {/* Cycle Toggle Button */}
                    <button
                      type="button"
                      aria-label={`Toggle status for ${item.name}`}
                      style={{
                        width: 28,
                        height: 24,
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: "bold",
                        border: `1px solid ${btnConfig.border}`,
                        background: btnConfig.bg,
                        color: btnConfig.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {btnConfig.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}