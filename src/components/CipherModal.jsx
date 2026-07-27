import React, { useState } from "react";

export default function PreGameCipherModal({
  show,
  isHost,
  cipherData, // { phrase: string, answer: string, isSolved: boolean }
  onHostSetCipher, // fn(phrase, answer)
  onGuestSolve, // fn(inputAnswer) -> returns boolean
  onStartGame, // fn() triggers main game start for both
  briefingImage = "/assets/leclerc.png",
}) {

  // Host state
  const [hostPhrase, setHostPhrase] = useState(cipherData?.phrase || "");
  const [hostAnswer, setHostAnswer] = useState(cipherData?.answer || "");

  // Guest state
  const [guestGuess, setGuestGuess] = useState("");
  const [guessError, setGuessError] = useState(false);

  const handleHostSubmit = (e) => {
    e.preventDefault();
    if (!hostPhrase.trim() || !hostAnswer.trim()) return;
    onHostSetCipher(hostPhrase.trim(), hostAnswer.trim().toLowerCase());
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const success = onGuestSolve(guestGuess.trim().toLowerCase());
    if (!success) {
      setGuessError(true);
    } else {
      setGuessError(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: "#FAEECD",
          borderRadius: 16,
          padding: "1.5rem",
          maxWidth: isHost ? 380 : 560,
          width: "92%",
          border: "1px solid #E8D8A3",
          boxShadow: "0 20px 30px -5px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* ================= HOST VIEW ================= */}
        {isHost ? (
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "#3B2D0C" }}>
              🔐 Set Case Briefing & Secret Cipher
            </h3>
            <p style={{ fontSize: 12, color: "#786538", marginTop: 0, marginBottom: 16 }}>
              Set the coded message and answer your guest must solve before the investigation begins!
            </p>

            <form onSubmit={handleHostSubmit}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5C4A1E", display: "block", marginBottom: 4 }}>
                Coded Phrase (Displayed to Guest):
              </label>
              <input
                type="text"
                placeholder="e.g. KHOOR ZRUOG or 18-05-14"
                value={hostPhrase}
                onChange={(e) => setHostPhrase(e.target.value)}
                disabled={cipherData?.isSet}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 6,
                  border: "1px solid #D4C494",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />

              <label style={{ fontSize: 12, fontWeight: 600, color: "#5C4A1E", display: "block", marginBottom: 4 }}>
                Correct Answer:
              </label>
              <input
                type="text"
                placeholder="e.g. HELLO WORLD"
                value={hostAnswer}
                onChange={(e) => setHostAnswer(e.target.value)}
                disabled={cipherData?.isSet}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 6,
                  border: "1px solid #D4C494",
                  marginBottom: 16,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />

              {!cipherData?.isSet ? (
                <button
                  type="submit"
                  disabled={!hostPhrase.trim() || !hostAnswer.trim()}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    background: "#3B2D0C",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    cursor: !hostPhrase.trim() || !hostAnswer.trim() ? "not-allowed" : "pointer",
                    opacity: !hostPhrase.trim() || !hostAnswer.trim() ? 0.6 : 1,
                  }}
                >
                  Confirm Cipher Settings
                </button>
              ) : (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 600, display: "block", marginBottom: 12 }}>
                    ✓ Cipher is active! Waiting for Guest to solve...
                  </span>

                  {cipherData?.isSolved && (
                    <button
                      type="button"
                      onClick={onStartGame}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        background: "#0F6E56",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(15, 110, 86, 0.3)",
                      }}
                    >
                      ▶ Start Game Board
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        ) : (
          /* ================= GUEST VIEW ================= */
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600, color: "#3B2D0C", textAlign: "center" }}>
              🕵️ Confidential Case Briefing
            </h3>

            {/* 2-Column Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr",
                gap: 12,
                alignItems: "start",
                marginBottom: 16,
              }}
            >
              {/* Left Column: Picture */}
              <div
                style={{
                  height: 320,
                  width: 200,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #D4C494",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={briefingImage}
                  alt="Case Evidence Briefing"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Right Column: Paragraph Top & Coded Phrase Bottom */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 400}}>
                {/* Right Top Paragraph */}
                <p style={{ fontSize: 12, color: "#5C4A1E", lineHeight: 1.4, margin: 0 }}>
                  Charles Marc Hervé Percéval Leclerc was limping off the grid after what could only be called "Matchstick Gate". He wasn't sore initially, those matchsticks could never extinguish a once-in-a-lifetime talent like him (as per Sebastian Vettel himself) but the unnecessary dildo addition did hurt. Well, he thought to himself, atleast not as much as losing the WDC trophy because of Ferrari's fuckups, year on year. </p>
                  <p style={{ fontSize: 12, color: "#5C4A1E", lineHeight: 1.4, margin: 0 }}>Suddenly, a flash and a bang.</p>
                  <p style={{ fontSize: 12, color: "#5C4A1E", lineHeight: 1.4, margin: 0 }}>And Leclerc, was no more. </p>
                  <p style={{ fontSize: 12, color: "#5C4A1E", lineHeight: 1.4, margin: 0 }}>You have are one of the chosen few to solve the murder of the greatest legend of Formula 1 to never win the cup, Charles Leclerc To prove your worthiness to solve this murder most foul, solve the passphrase below and commence with the mystery. (PS: Ask host for hints)
                </p>

                {/* Right Bottom Coded Phrase Box */}
                <div
                  style={{
                    background: "#FFF8E7",
                    border: "1px dashed #FAC775",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginTop: 8,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#854F0B", display: "block" }}>
                    Encrypted Passkey:
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#3B2D0C", letterSpacing: "1px", marginTop: 2 }}>
                    {cipherData?.phrase ? cipherData.phrase : "Waiting for Host to transmit cipher..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Answer & Reveal Area */}
            {!cipherData?.phrase ? (
              <p style={{ fontSize: 12, color: "#786538", textAlign: "center", fontStyle: "italic", margin: 0 }}>
                Waiting for the host to set up the case cipher...
              </p>
            ) : !cipherData?.isSolved ? (
              <form onSubmit={handleGuestSubmit} style={{ borderTop: "1px solid #E8D8A3", paddingTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5C4A1E", display: "block", marginBottom: 4 }}>
                  Enter Decoded Answer:
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Type your solution..."
                    value={guestGuess}
                    onChange={(e) => {
                      setGuestGuess(e.target.value);
                      setGuessError(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 6,
                      border: guessError ? "1px solid #C0392B" : "1px solid #D4C494",
                      fontSize: 12,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      background: "#3B2D0C",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Verify
                  </button>
                </div>
                {guessError && (
                  <span style={{ fontSize: 11, color: "#C0392B", marginTop: 4, display: "block" }}>
                    ❌ Incorrect cipher answer. Try again!
                  </span>
                )}
              </form>
            ) : (
              /* Play Button Revealed to Guest */
              <div style={{ borderTop: "1px solid #E8D8A3", paddingTop: 12, textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 700, display: "block", marginBottom: 8 }}>
                  ✓ Access Granted! The cipher was solved.
                </span>
                <button
                  type="button"
                  onClick={onStartGame}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    background: "#0F6E56",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 110, 86, 0.3)",
                  }}
                >
                  ▶ Enter Main Game Board
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}