import React, { useState, useEffect } from "react";
import { GameAssets } from "./GameAssets";

export default function PlayerHand({ show, onClose, playerName, hand = [], clueCards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine regular hand cards and clue cards into a single carousel dataset
  const combinedCards = [
    ...hand.map((c) => ({ ...c, isClue: false })),
    ...clueCards.map((c) => ({ ...c, isClue: true })),
  ];

  // Reset carousel index whenever modal opens or card props change
  useEffect(() => {
    setCurrentIndex(0);
  }, [show, hand, clueCards]);

  // Keyboard accessibility: Escape to close, Arrow keys to navigate
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? combinedCards.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === combinedCards.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose, combinedCards.length]);

  if (!show || combinedCards.length === 0) return null;

  const currentCard = combinedCards[currentIndex];

  // Helper to resolve card meta information (Image, Category, Name) from GameAssets
  const getAssetData = (card) => {
    if (!GameAssets) return {};
    const cardId = card.id || card;
    const cardName = card.name;

    const suspects = GameAssets.suspects || GameAssets.suspect || [];
    const weapons = GameAssets.weapons || GameAssets.weapon || [];
    const rooms = GameAssets.rooms || GameAssets.room || [];

    let match = null;
    let type = card.type;

    if (type === "suspect") {
      match = suspects.find((item) => item.id === cardId || item.name === cardName);
    } else if (type === "weapon") {
      match = weapons.find((item) => item.id === cardId || item.name === cardName);
    } else if (type === "room") {
      match = rooms.find((item) => item.id === cardId || item.name === cardName);
    } else {
      // Direct lookup if card.type is missing
      match = suspects.find((item) => item.id === cardId || item.name === cardName);
      if (match) type = "suspect";
      
      if (!match) {
        match = weapons.find((item) => item.id === cardId || item.name === cardName);
        if (match) type = "weapon";
      }

      if (!match) {
        match = rooms.find((item) => item.id === cardId || item.name === cardName);
        if (match) type = "room";
      }
    }

    return {
      match: match || {},
      resolvedType: type || "unknown",
      resolvedName: cardName || match?.name || cardId,
      resolvedImage: card.image || match?.image || null,
    };
  };

  const { resolvedType, resolvedName, resolvedImage } = getAssetData(currentCard);

  // Navigation handlers
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? combinedCards.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === combinedCards.length - 1 ? 0 : prev + 1));
  };

  // Theme mapping for styling card frames & badges
  const getTypeStyles = (type, isClue) => {
    if (isClue) {
      return { bg: "#FFF8E7", border: "#F0C059", text: "#7A5000", badge: "#E8D5A3", icon: "❓" };
    }
    switch (type) {
      case "suspect":
        return { bg: "#FAECE7", border: "#F5C4B3", text: "#993C1D", badge: "#F5C4B3", icon: "🕵️" };
      case "weapon":
        return { bg: "#FFF2D6", border: "#FAC775", text: "#854F0B", badge: "#FAC775", icon: "🔪" };
      case "room":
      default:
        return { bg: "#E1F5EE", border: "#9FE1CB", text: "#0F6E56", badge: "#9FE1CB", icon: "🏠" };
    }
  };

  const currentStyle = getTypeStyles(resolvedType, currentCard.isClue);

  return (
    /* Backdrop overlay: clicking triggers onClose */
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
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "pointer",
        padding: "1rem",
        boxSizing: "border-box"
      }}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-background-primary, #faeecd)",
          borderRadius: 16,
          padding: "1.25rem",
          maxWidth: 340,
          width: "100%",
          border: "0.5px solid var(--color-border-secondary, #ccc)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "default",
          boxSizing: "border-box"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8, width: "100%" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>
            🃏 {playerName}'s Hand ({currentIndex + 1}/{combinedCards.length})
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", margin: 0 }}>
            Keep this hidden from your opponents!
          </p>
        </div>

        {/* Carousel Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "8px 0 16px"
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
              width: 36,
              height: 36,
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
              userSelect: "none"
            }}
          >
            ❮
          </button>

          {/* Highlighted Card Container */}
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
              justifyContent: "space-between",
              position: "relative",
              boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.2)",
              transition: "all 0.2s ease-in-out",
              boxSizing: "border-box"
            }}
          >
            {/* Top Badges */}
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 2
              }}
            >


              {currentCard.isClue && (
                <span
                  style={{
                    background: "#F0C059",
                    color: "#5C3A07",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 10
                  }}
                >
                  CLUE
                </span>
              )}
            </div>

            {/* Card Main Asset Image */}
            {resolvedImage ? (
              <img
                src={resolvedImage}
                alt={resolvedName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              /* Fallback Graphic if Image is missing */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  color: currentStyle.text
                }}
              >
                {currentStyle.icon}
              </div>
            )}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            aria-label="Next Card"
            style={{
              position: "absolute",
              right: -4,
              zIndex: 3,
              width: 36,
              height: 36,
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
              userSelect: "none"
            }}
          >
            ❯
          </button>
        </div>

        {/* Modal Close Action Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            minHeight: "42px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "#8d2217",
            border: "none",
            color: "#faeecd",
            boxSizing: "border-box"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}