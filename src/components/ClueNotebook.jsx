import React from "react";

export default function ClueNotebook({ 
  show, 
  onClose, 
  playerName, 
  playerIdx, 
  notebook, 
  suspects, 
  weapons, 
  rooms, 
  onUpdateNotebook 
}) {
  if (!show) return null;

  const categories = [
    { label: "Suspects", items: suspects, type: "suspects" },
    { label: "Weapons", items: weapons, type: "weapons" },
    { label: "Rooms", items: rooms, type: "rooms" },
  ];

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, overflowY: "auto" }}>
      {/* Custom Notebook Matrix Layout Design Container */}
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, padding: "1.5rem", maxWidth: 480, width: "90%", border: "0.5px solid var(--color-border-secondary)", margin: "1rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500 }}>📓 {playerName}'s Notebook</h3>
        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 0 }}>Mark cards as eliminated (❌), possible (❓), or confirmed solution (✓)</p>
        
        {categories.map(({ label, items, type }) => (
          <div key={type} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 8px", color: "var(--color-text-primary)" }}>{label}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {items.map(item => {
                const val = notebook[playerIdx][type][item.id] || "";
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ flex: 1, color: "var(--color-text-secondary)" }}>{item.name}</span>
                    <select 
                      value={val} 
                      onChange={e => onUpdateNotebook(playerIdx, type, item.id, e.target.value)}
                      style={{ padding: "2px 4px", borderRadius: 4, fontSize: 11, border: "0.5px solid var(--color-border-secondary)", background: val === "no" ? "#FCEBEB" : val === "yes" ? "#EAF3DE" : "var(--color-background-primary)", color: "var(--color-text-primary)" }}
                    >
                      <option value="">-</option>
                      <option value="no">❌ Eliminated</option>
                      <option value="maybe">❓ Possible</option>
                      <option value="yes">✓ Solution</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid var(--color-border-secondary)" }}>Close</button>
      </div>
    </div>
  );
}