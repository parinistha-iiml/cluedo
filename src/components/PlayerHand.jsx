import React, { useState, useEffect } from "react";
import { GameAssets } from "./GameAssets";

export default function PlayerHand({ show, onClose, playerName, hand = [], clueCards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine regular hand cards and clue cards into a single carousel dataset
  const combinedCards = [
    ...hand.map((c) => ({ ...c, isClue: false })),
    ...clueCards.map((c) => ({ ...c, isClue: true })),
  ];

  // Reset index whenever modal opens or hand updates
  useEffect(() => {
    setCurrentIndex(0);
  }, [show, hand, clueCards]);

  if (!show || combinedCards.length === 0) return null;

  const currentCard = combinedCards[currentIndex];

  // Helper to fetch the card object (and image) from GameAssets
  const getAssetData = (card) => {
    if (!GameAssets) return {};
    let category = [];
    if (card.type === "suspect") category = GameAssets.suspects || GameAssets.suspect || [];
    else if (card.type === "weapon") category = GameAssets.weapons || GameAssets.weapon || [];
    else if (card.type === "room") category = GameAssets.rooms || GameAssets.room || [];

    return category.find((item) => item.id === card.id || item.name === card.name) || {};
  };

  const activeAsset = getAssetData(currentCard);
  // Image priority: card's own image -> matched asset image -> null
  const cardImage = currentCard.image || activeAsset.image;

  // Navigation handlers
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? combinedCards.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === combinedCards.length - 1 ? 0 : prev + 1));
  };

  // Color theme mapping
  const getTypeStyles = (type, isClue) => {
    if (isClue) {
      return { bg: "#FFF8E7", border: "#F0C059", text: "#7A5000", badge: "#E8D5A3" };
    }
    switch (type) {
      case "suspect":
        return { bg: "#FAECE7", border: "#F5C4B3", text: "#993C1D", badge: "#F5C4B3" };
      case "weapon":
        return { bg: "#FFF2D6", border: "#FAC775", text: "#854F0B", badge: "#FAC775" };
      case "room":
      default:
        return { bg: "#E1F5EE", border: "#9FE1CB", text: "#0F6E56", badge: "#9FE1CB" };
    }
  };

  const currentStyle = getTypeStyles(currentCard.type, currentCard.isClue);

  return (
    /* Backdrop overlay: clicking here triggers onClose */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        cursor: "pointer",
      }}
    >
      {/* Modal Container: e.stopPropagation prevents clicking inside from closing */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-background-primary, #faeecd)",
          borderRadius: 16,
          padding: "1.25rem",
          maxWidth: 340,
          width: "90%",
          border: "0.5px solid var(--color-border-secondary, #ccc)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "default",
          opacity:"100%"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 12, width: "100%" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
            🃏 {playerName}'s Hand
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", opacity:"100%", margin: 0 }}>
            Keep this hidden from your opponents!
          </p>
        </div>

        {/* Carousel Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "8px 0 16px",
            opacity:"100%"
          }}
        >
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous Card"
            style={{
              position: "absolute",
              left: -4,
              zIndex: 3,
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid var(--color-border-secondary, #ddd)",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            ❮
          </button>

          {/* Highlighted Card */}
          <div
            style={{
              width: 210,
              height: 300,
              borderRadius: 12,
              background: currentStyle.bg,
              border: `2px solid ${currentStyle.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.2)",
              transform: "scale(1.02)",
              transition: "all 0.2s ease-in-out",
            }}
          >
  

            {/* Image / Fallback Section */}
              <img
                src={cardImage}
                alt={currentCard.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Next Card"
            style={{
              position: "absolute",
              right: -4,
              zIndex: 3,
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid var(--color-border-secondary, #ddd)",
              background: "#ffffff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            ❯
          </button>
        </div>

        {/* Carousel Indicators */}
        <div style={{ display: "flex", gap: 6 }}>
          {combinedCards.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              style={{
                width: idx === currentIndex ? 14 : 6,
                height: 6,
                borderRadius: 3,
                border: "none",
                background:
                  idx === currentIndex
                    ? "var(--color-text-primary, #333)"
                    : "var(--color-border-secondary, #ccc)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}