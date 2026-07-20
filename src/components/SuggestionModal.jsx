import React from "react";

export default function SuggestionModal({ show, onClose, suggestion, setSuggestion, suspects, weapons, rooms, onSubmit }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, padding: "1.5rem", maxWidth: 320, width: "90%", border: "0.5px solid var(--color-border-secondary)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500 }}>💬 Make a Suggestion</h3>
        
        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Suspect:</label>
<select 
  value={suggestion.suspect} 
  onChange={(e) => setSuggestion({ ...suggestion, suspect: e.target.value })}
>
  <option value="">-- Choose Suspect --</option>
  {suspects.map(s => (
    <option key={s.id} value={s.id}>{s.name}</option> 
  ))}
</select>

        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Weapon:</label>
        <select 
  value={suggestion.weapon} 
  onChange={(f) => setSuggestion({ ...suggestion, weapon: f.target.value })}
>
  <option value="">-- Choose Weapon --</option>
  {weapons.map(w => (
    <option key={w.id} value={w.id}>{w.name}</option> 
  ))}
</select>

        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Room:</label>
        <select 
  value={suggestion.room} 
  onChange={(e) => setSuggestion({ ...suggestion, room: e.target.value })}
>
  <option value="">-- Choose Suspect --</option>
  {rooms.map(r => (
    <option key={r.id} value={r.id}>{r.name}</option> 
  ))}
</select>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", border: "0.5px solid var(--color-border-secondary)" }}>Cancel</button>
          <button onClick={onSubmit} disabled={!suggestion.suspect || !suggestion.weapon || !suggestion.room} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#8E44AD", color: "white", border: "none", cursor: "pointer" }}>Suggest</button>
        </div>
      </div>
    </div>
  );
}