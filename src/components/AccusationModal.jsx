import React from "react";

export default function AccusationModal({ show, onClose, accusation, setAccusation, suspects, weapons, rooms, onSubmit }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, padding: "1.5rem", maxWidth: 320, width: "90%", border: "0.5px solid var(--color-border-secondary)" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500 }}>⚖️ Make an Accusation</h3>
        <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 16, marginTop: 0 }}>⚠️ If wrong, you are eliminated!</p>
        
        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Suspect:</label>
        <select value={accusation.suspect} onChange={e => setAccusation(a => ({...a, suspect: e.target.value}))} style={{ width: "100%", marginBottom: 10, padding: "6px", borderRadius: 6, background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>
          <option value="">-- select --</option>
          {suspects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Weapon:</label>
        <select value={accusation.weapon} onChange={e => setAccusation(a => ({...a, weapon: e.target.value}))} style={{ width: "100%", marginBottom: 10, padding: "6px", borderRadius: 6, background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>
          <option value="">-- select --</option>
          {weapons.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
        </select>

        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Room:</label>
        <select value={accusation.room} onChange={e => setAccusation(a => ({...a, room: e.target.value}))} style={{ width: "100%", marginBottom: 16, padding: "6px", borderRadius: 6, background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>
          <option value="">-- select --</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", border: "0.5px solid var(--color-border-secondary)" }}>Cancel</button>
          <button onClick={onSubmit} disabled={!accusation.suspect || !accusation.weapon || !accusation.room} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#C0392B", color: "white", border: "none", cursor: "pointer" }}>Accuse!</button>
        </div>
      </div>
    </div>
  );
}