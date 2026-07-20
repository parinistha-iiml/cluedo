import React from "react";

export default function PlayerHand({ show, onClose, playerName, hand, clueCards }) {
  if (!show) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 12, padding: "1.5rem", maxWidth: 340, width: "90%", border: "0.5px solid var(--color-border-secondary)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500 }}>🃏 {playerName}'s Hand</h3>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 0, marginBottom: 12 }}>Keep this hidden from your opponent!</p>
        
        {/* Custom Core Card Display Design Area */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {hand.map(card => (
            <div key={card.id} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: card.type === "suspect" ? "#FAECE7" : card.type === "weapon" ? "#E8D5A3" : "#E1F5EE",
              color: card.type === "suspect" ? "#993C1D" : card.type === "weapon" ? "#854F0B" : "#0F6E56",
              border: `0.5px solid ${card.type === "suspect" ? "#F5C4B3" : card.type === "weapon" ? "#FAC775" : "#9FE1CB"}`,
            }}>
              {card.type === "suspect" ? "🕵️" : card.type === "weapon" ? "🔪" : "🏠"} {card.name}
            </div>
          ))}
        </div>

        {/* Custom Clue Card Design Area */}
        {clueCards.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Clue tile hints found:</p>
            {clueCards.map((card, i) => (
              <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "#E8D5A3", borderRadius: 4, marginBottom: 4 }}>
                ❓ Hint: {card.name}
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid var(--color-border-secondary)" }}>Close</button>
      </div>
    </div>
  );
}