import React, { useEffect } from "react";

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
  // Handle 'Escape' key press on laptops/desktops
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

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
        return { label: "❌", bg: "#FCEBEB", border: "#F5C4B3", color: "#A32D2D", text: "Eliminated" };
      case "maybe":
        return { label: "❓", bg: "#FFF8E7", border: "#FAC775", color: "#854F0B", text: "Possible" };
      case "yes":
        return { label: "✓", bg: "#EAF3DE", border: "#9FE1CB", color: "#0F6E56", text: "Solution" };
      default:
        return { label: "-", bg: "rgba(255, 255, 255, 0.7)", border: "#D4C494", color: "#786538", text: "Unmarked" };
    }
  };

  return (
    /* Backdrop overlay */
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
        padding: "1rem",
        boxSizing: "border-box"
      }}
    >
      {/* Notebook Modal Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="notebook-title"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: "#FAEECD", 
          borderRadius: 16, 
          padding: "clamp(1rem, 3vw, 1.5rem)", 
          width: "min(520px, 100%)", 
          maxHeight: "85vh", 
          overflowY: "auto", 
          border: "1px solid #E8D8A3", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <h3 id="notebook-title" style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 600, color: "#3B2D0C" }}>
            📓 {playerName}'s Notebook
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#786538", margin: 0, lineHeight: 1.4 }}>
            Click items to toggle: Blank ➔ ❌ Eliminated ➔ ❓ Possible ➔ ✓ Solution
          </p>
        </div>

        {/* Categories Matrix */}
        {categories.map(({ label, items, type }) => (
          <div key={type} style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 8px", color: "#5C4A1E", borderBottom: "1px dashed #D4C494", paddingBottom: 4 }}>
              {label}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {items.map(item => {
                const val = notebook[playerIdx]?.[type]?.[item.id] || "";
                const btnConfig = getButtonConfig(val);

                return (
                  <div 
                    key={item.id} 
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle status for ${item.name}. Currently ${btnConfig.text}`}
                    onClick={() => onUpdateNotebook(playerIdx, type, item.id, cycleState(val))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onUpdateNotebook(playerIdx, type, item.id, cycleState(val));
                      }
                    }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      gap: 8, 
                      padding: "6px 10px",
                      minHeight: "40px", // Touch target standard
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.45)",
                      border: "1px solid rgba(212, 196, 148, 0.6)",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                      boxSizing: "border-box"
                    }}
                  >
                    <span style={{ flex: 1, fontSize: "0.825rem", fontWeight: 500, color: "#3B2D0C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </span>

                    {/* Visual Status Indicator */}
                    <div
                      style={{
                        width: 30,
                        height: 28,
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        border: `1px solid ${btnConfig.border}`,
                        background: btnConfig.bg,
                        color: btnConfig.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none", // Prevent click interception from wrapper div
                        flexShrink: 0
                      }}
                    >
                      {btnConfig.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Done / Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            minHeight: "44px",
            marginTop: "0.5rem",
            borderRadius: 8,
            border: "1px solid #D4C494",
            background: "rgba(255, 255, 255, 0.6)",
            color: "#5C4A1E",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "background 0.15s ease",
            boxSizing: "border-box"
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}