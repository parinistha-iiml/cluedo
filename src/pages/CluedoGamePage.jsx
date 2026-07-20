import { useState, useEffect, useRef, useCallback} from "react";
import Peer from "peerjs";
import Board from "../components/Board";
import ClueNotebook from "../components/ClueNotebook";
import PlayerHand from "../components/PlayerHand";
import SuggestionModal from "../components/SuggestionModal";
import AccusationModal from "../components/AccusationModal";

const SUSPECTS = [
  { id: "scarlett", name: "Miss Scarlett", color: "#C0392B", initials: "MS" },
  { id: "mustard", name: "Col. Mustard", color: "#D4AC0D", initials: "CM" },
  { id: "white", name: "Mrs. White", color: "#BDC3C7", initials: "MW" },
  { id: "green", name: "Rev. Green", color: "#27AE60", initials: "RG" },
  { id: "peacock", name: "Mrs. Peacock", color: "#2980B9", initials: "MP" },
  { id: "plum", name: "Prof. Plum", color: "#8E44AD", initials: "PP" },
];

const WEAPONS = [
  { id: "candlestick", name: "Candlestick", icon: "🕯️" },
  { id: "knife", name: "Knife", icon: "🔪" },
  { id: "leadpipe", name: "Lead Pipe", icon: "🔩" },
  { id: "revolver", name: "Revolver", icon: "🔫" },
  { id: "rope", name: "Rope", icon: "🪢" },
  { id: "wrench", name: "Wrench", icon: "🔧" },
];

const ROOMS = [
  { id: "kitchen", name: "Kitchen", color: "#E8D5A3", row: 0, col: 0 },
  { id: "ballroom", name: "Ballroom", color: "#A3C4D5", row: 0, col: 1 },
  { id: "conservatory", name: "Conservatory", color: "#B5D5A3", row: 0, col: 2 },
  { id: "billiard", name: "Billiard Room", color: "#D5A3A3", row: 1, col: 0 },
  { id: "library", name: "Library", color: "#D5C4A3", row: 1, col: 2 },
  { id: "study", name: "Study", color: "#C4A3D5", row: 2, col: 0 },
  { id: "hall", name: "Hall", color: "#A3D5C4", row: 2, col: 1 },
  { id: "lounge", name: "Lounge", color: "#D5A3C4", row: 2, col: 2 },
  { id: "diningroom", name: "Dining Room", color: "#A3A3D5", row: 1, col: 1 },
];

const BOARD_SIZE = 9;
const ROOM_LAYOUT = {
  kitchen:      { cells: [[0,0],[0,1],[1,0],[1,1]], color: "#E8D5A3" },
  ballroom:     { cells: [[0,3],[0,4],[0,5],[1,3],[1,4],[1,5]], color: "#A3C4D5" },
  conservatory: { cells: [[0,7],[0,8],[1,7],[1,8]], color: "#B5D5A3" },
  billiard:     { cells: [[3,0],[3,1],[4,0],[4,1]], color: "#D5A3A3" },
  diningroom:   { cells: [[3,3],[3,4],[3,5],[4,3],[4,4],[4,5]], color: "#A3A3D5" },
  library:      { cells: [[3,7],[3,8],[4,7],[4,8]], color: "#D5C4A3" },
  study:        { cells: [[6,0],[6,1],[7,0],[7,1],[8,0],[8,1]], color: "#C4A3D5" },
  hall:         { cells: [[6,3],[6,4],[6,5],[7,3],[7,4],[7,5],[8,3],[8,4],[8,5]], color: "#A3D5C4" },
  lounge:       { cells: [[6,7],[6,8],[7,7],[7,8],[8,7],[8,8]], color: "#D5A3C4" },
};
const CLUE_TILE_CELLS = [[2,2],[2,6],[4,2],[4,6],[6,2],[6,6]];
const PLAYER_START = [{ row: 8, col: 4 }, { row: 0, col: 4 }];

function buildRoomCellMap() {
  const map = {};
  for (const [roomId, layout] of Object.entries(ROOM_LAYOUT)) {
    for (const [r, c] of layout.cells) {
      map[`${r},${c}`] = roomId;
    }
  }
  return map;
}

function getAdjacentCells(row, col) {
  const adj = [];
  if (row > 0) adj.push([row - 1, col]);
  if (row < BOARD_SIZE - 1) adj.push([row + 1, col]);
  if (col > 0) adj.push([row, col - 1]);
  if (col < BOARD_SIZE - 1) adj.push([row, col + 1]);
  return adj;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CluedoGamePage() {
  const [role, setRole] = useState(null); 
  const [peerId, setPeerId] = useState("");
  const [targetPeerId, setTargetPeerId] = useState("");
  const [connected, setConnected] = useState(false);

  const [phase, setPhase] = useState("setup");
  const [playerNames, setPlayerNames] = useState(["Host", "Guest"]);
  const [nameInput, setNameInput] = useState("");
  const [solution, setSolution] = useState(null); 
  const [myHand, setMyHand] = useState([]); 
  const [positions, setPositions] = useState(PLAYER_START);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceResult, setDiceResult] = useState(null);
  const [turnPhase, setTurnPhase] = useState("roll");
  const [reachable, setReachable] = useState([]);
  const [notebook, setNotebook] = useState([
    { suspects: {}, weapons: {}, rooms: {} },
    { suspects: {}, weapons: {}, rooms: {} },
  ]);
  const [log, setLog] = useState([]);
  const [suggestion, setSuggestion] = useState({ suspect: "", weapon: "", room: "" });
  const [accusation, setAccusation] = useState({ suspect: "", weapon: "", room: "" });
  
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [showHandModal, setShowHandModal] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  
  const [pendingResponse, setPendingResponse] = useState(null);
  const [responseCard, setResponseCard] = useState("");
  const [revealedCard, setRevealedCard] = useState(null);
  const [clueCardsFound, setClueCardsFound] = useState([[], []]);
  const [accusationResult, setAccusationResult] = useState(null);
  const [eliminated, setEliminated] = useState([false, false]);
  const [animateDice, setAnimateDice] = useState(false);

  const peerRef = useRef(null);
  const connRef = useRef(null);
  const roomCellMap = buildRoomCellMap();
  const myIndex = role === "host" ? 0 : 1;

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 20));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      if (roomParam) {
        setRole("guest");
        setTargetPeerId(roomParam);
        const conn = peer.connect(roomParam, { reliable: true });
        handleConnection(conn);
      } else {
        setRole("host");
      }
    });

    peer.on("connection", (conn) => {
      handleConnection(conn);
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const handleConnection = useCallback((conn) => {
  connRef.current = conn;

  conn.on("open", () => {
    setConnected(true);
  });

  conn.on("data", (data) => {
    switch (data.type) {
      case "SYNC_STATE":
        applyStateFields(data.state);
        break;

      case "ASSIGN_HANDS":
        setMyHand(data.hand);
        setPlayerNames(data.playerNames);
        setPhase("play");
        setTurnPhase("roll");
        break;

      case "REQUEST_DISPROOF": {
        const incomingSuggest = data.suggestion || data;
        if (!incomingSuggest || !incomingSuggest.suspect) {
          console.error("Malformed suggestion data received:", data);
          break;
        }

        const matching = myHand.filter(
          c => c.id === incomingSuggest.suspect || 
               c.id === incomingSuggest.weapon || 
               c.id === incomingSuggest.room
        );
        
        if (matching.length === 0) {
          sendNetMessage("NO_DISPROOF", {});
          const noMatchLog = [`${playerNames[myIndex]} has no cards to disprove the suggestion.`, ...log].slice(0, 20);
          syncGameLayout({ log: noMatchLog, turnPhase: "accuse", currentPlayer: currentPlayer });
        } else {
          setPendingResponse({ cards: matching, from: 1 - myIndex, to: myIndex });
          setTurnPhase("responding");
        }
        break;
      }

      case "NO_DISPROOF":
        syncGameLayout({ turnPhase: "accuse", currentPlayer: currentPlayer });
        break;

      case "SEND_DISPROOF_CARD":
        setRevealedCard({ card: data.card, shownTo: myIndex, shownBy: 1 - myIndex });
        setTurnPhase("see_card");
        break;

      case "CHECK_ACCUSATION":
        if (role === "host") {
          const correct = data.accusation.suspect === solution.suspect.id &&
                          data.accusation.weapon === solution.weapon.id &&
                          data.accusation.room === solution.room.id;
          
          let finalWinner = correct ? 1 : -1;
          let updatedElim = [...eliminated];
          if (!correct) updatedElim[1] = true;
          if (updatedElim[0] && updatedElim[1]) finalWinner = -1;

          const nextPhase = (correct || (updatedElim[0] && updatedElim[1])) ? "game_over" : "play";

          const alertMsg = correct 
            ? `🎉 ${playerNames[1]} made the correct accusation and WON!` 
            : `❌ ${playerNames[1]}'s accusation was WRONG! They are eliminated.`;
          
          const updatedLog = [alertMsg, ...log].slice(0, 20);

          syncGameLayout({
            eliminated: updatedElim,
            phase: nextPhase,
            accusationResult: { winner: finalWinner, correct },
            log: updatedLog,
            turnPhase: nextPhase === "game_over" ? "wait" : "roll",
            currentPlayer: 0
          });
        }
        break;

      default:
        break;
    }
  });
}, [myHand, playerNames, myIndex, log, currentPlayer, role, solution, eliminated]); 
// Added all external states used inside the network message handler to the dependency array

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get("room");

  const peer = new Peer({
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:relay.metered.ca:80",
          username: "metered",
          credential: "password"
        }
      ]
    }
  });
  peerRef.current = peer;

  peer.on("open", (id) => {
    setPeerId(id);
    if (roomParam) {
      setRole("guest");
      setTargetPeerId(roomParam);
      const conn = peer.connect(roomParam, { reliable: true });
      handleConnection(conn);
    } else {
      setRole("host");
    }
  });

  peer.on("connection", (conn) => {
    handleConnection(conn);
  });

  return () => {
    if (peerRef.current) peerRef.current.destroy();
  };
}, [handleConnection]);

  function sendNetMessage(type, payload) {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type, ...payload });
    }
  }

  // Helper to safely apply updates cleanly across local state fields
  function applyStateFields(state) {
    if (state.positions) setPositions(state.positions);
    if (state.currentPlayer !== undefined) setCurrentPlayer(state.currentPlayer);
    if (state.turnPhase) setTurnPhase(state.turnPhase);
    if (state.diceResult !== undefined) setDiceResult(state.diceResult);
    if (state.log) setLog(state.log);
    if (state.phase) setPhase(state.phase);
    if (state.suggestion) setSuggestion(state.suggestion);
    if (state.clueCardsFound) setClueCardsFound(state.clueCardsFound);
    if (state.eliminated) setEliminated(state.eliminated);
    if (state.accusationResult) setAccusationResult(state.accusationResult);
    if (state.playerNames) setPlayerNames(state.playerNames);
  }

  // Updated layout synchronizer that mutates BOTH sides instantly
  function syncGameLayout(updatedFields) {
    sendNetMessage("SYNC_STATE", { state: updatedFields });
    applyStateFields(updatedFields);
  }

  function startInvestigation() {
    const finalName = nameInput.trim() || (role === "host" ? "Host" : "Guest");
    const names = [...playerNames];
    names[myIndex] = finalName;
    setPlayerNames(names);

    if (role === "host") {
      const suspectCards = shuffle(SUSPECTS.map(s => ({ type: "suspect", id: s.id, name: s.name })));
      const weaponCards = shuffle(WEAPONS.map(w => ({ type: "weapon", id: w.id, name: w.name })));
      const roomCards = shuffle(ROOMS.map(r => ({ type: "room", id: r.id, name: r.name })));

      const sol = { suspect: suspectCards.pop(), weapon: weaponCards.pop(), room: roomCards.pop() };
      const allRemaining = shuffle([...suspectCards, ...weaponCards, ...roomCards]);
      const half = Math.ceil(allRemaining.length / 2);

      const hostHand = allRemaining.slice(0, half);
      const guestHand = allRemaining.slice(half);

      setSolution(sol);
      setMyHand(hostHand);
      
      sendNetMessage("ASSIGN_HANDS", { hand: guestHand, playerNames: names });
      
      syncGameLayout({ 
        log: [`Investigation started! ${names[0]} goes first.`], 
        playerNames: names, 
        phase: "play", 
        turnPhase: "roll" 
      });
    } else {
      sendNetMessage("SYNC_STATE", { state: { playerNames: names } });
      addLog(`Waiting for Host to deal cards...`);
    }
  }

  function rollDice() {
    if (currentPlayer !== myIndex) return;
    setAnimateDice(true);
    setTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      const total = d1 + d2;
      const res = { d1, d2, total };
      
      const pos = positions[myIndex];
      const reach = [];
      const visited = new Set();
      const queue = [[pos.row, pos.col, 0]];
      visited.add(`${pos.row},${pos.col}`);

      while (queue.length) {
        const [r, c, dist] = queue.shift();
        if (dist === total) {
          reach.push(`${r},${c}`);
          continue;
        }
        if (dist > total) continue;
        for (const [nr, nc] of getAdjacentCells(r, c)) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc, dist + 1]);
          }
        }
      }
      
      setReachable(reach);
      setAnimateDice(false);

      const nextLog = [`${playerNames[myIndex]} rolled ${d1} + ${d2} = ${total}`, ...log].slice(0, 20);
      syncGameLayout({ diceResult: res, turnPhase: "move", log: nextLog });
    }, 600);
  }

  function handleCellClick(row, col) {
    if (turnPhase !== "move" || currentPlayer !== myIndex) return;
    const key = `${row},${col}`;
    if (!reachable.includes(key)) return;

    const newPos = [...positions];
    newPos[myIndex] = { row, col };
    setReachable([]);

    const room = roomCellMap[key];
    const isClueTile = CLUE_TILE_CELLS.some(([r, c]) => r === row && c === col);
    let updatedClues = [...clueCardsFound];

    if (isClueTile) {
      const pool = [...SUSPECTS, ...WEAPONS, ...ROOMS];
      const hint = pool[Math.floor(Math.random() * pool.length)];
      updatedClues[myIndex] = [...updatedClues[myIndex], hint];
    }

    let msg = `${playerNames[myIndex]} moved to (${row},${col})`;
    let nextPhase = "suggest";
    let initialSuggestion = { suspect: "", weapon: "", room: "" };

    if (room) {
      msg = `${playerNames[myIndex]} moved to ${ROOMS.find(r => r.id === room)?.name}`;
      initialSuggestion = { suspect: "", weapon: "", room: room };
    } else {
      nextPhase = "accuse";
    }

    const nextLog = [msg, ...log].slice(0, 20);

    syncGameLayout({
      positions: newPos,
      clueCardsFound: updatedClues,
      turnPhase: nextPhase,
      log: nextLog,
      suggestion: initialSuggestion
    });
  }

  function submitSuggestion() {
    setShowSuggestModal(false);
    
    const suspectName = SUSPECTS.find(s => s.id === suggestion.suspect)?.name || suggestion.suspect;
    const weaponName = WEAPONS.find(w => w.id === suggestion.weapon)?.name || suggestion.weapon;
    const roomName = ROOMS.find(r => r.id === suggestion.room)?.name || suggestion.room;

    const nextLog = [
      `${playerNames[myIndex]} suggests: ${suspectName} with the ${weaponName} in the ${roomName}`, 
      ...log
    ].slice(0, 20);

    const synchronizedSuggestion = {
      suspect: suggestion.suspect,
      weapon: suggestion.weapon,
      room: suggestion.room
    };

    // Notify the other peer to evaluate their hand cards
    sendNetMessage("REQUEST_DISPROOF", { suggestion: synchronizedSuggestion });
    
    // Maintain turn identity explicitly while changing phase to responding
    syncGameLayout({ 
      log: nextLog, 
      turnPhase: "responding", 
      suggestion: synchronizedSuggestion,
      currentPlayer: currentPlayer 
    });
  }

  function respondToSuggestion() {
    const card = pendingResponse.cards.find(c => c.id === responseCard);
    
    setPendingResponse(null);
    setResponseCard("");
    setTurnPhase("roll"); // Move responder into a neutral resting state locally
    
    // Only send the card data over the wire. Let the receiver trigger the UI phase!
    sendNetMessage("SEND_DISPROOF_CARD", { card });
  }

  function acknowledgeCard() {
    const card = revealedCard.card;
    if (card) {
      setNotebook(notebook.map((nb, i) => {
        if (i !== myIndex) return nb;
        const updated = { ...nb };
        if (card.type === "suspect") updated.suspects = { ...updated.suspects, [card.id]: "no" };
        if (card.type === "weapon") updated.weapons = { ...updated.weapons, [card.id]: "no" };
        if (card.type === "room") updated.rooms = { ...updated.rooms, [card.id]: "no" };
        return updated;
      }));
    }
    
    setRevealedCard(null);
    
    // Safely progress to the accusation phase now that the card has been observed
    syncGameLayout({ 
      turnPhase: "accuse",
      currentPlayer: currentPlayer 
    });
  }

  function submitAccusation() {
    setShowAccuseModal(false);
    if (role === "host") {
      const correct = accusation.suspect === solution.suspect.id &&
                      accusation.weapon === solution.weapon.id &&
                      accusation.room === solution.room.id;
      
      let finalWinner = correct ? 0 : -1;
      let updatedElim = [...eliminated];
      if (!correct) updatedElim[0] = true;
      if (updatedElim[0] && updatedElim[1]) finalWinner = -1;

      const nextPhase = (correct || (updatedElim[0] && updatedElim[1])) ? "game_over" : "play";
      
      const alertMsg = correct 
        ? `🎉 ${playerNames[0]} made the correct accusation and WON!` 
        : `❌ ${playerNames[0]}'s accusation was WRONG! They are eliminated.`;

      const nextLog = [alertMsg, ...log].slice(0, 20);

      if (nextPhase === "game_over") {
        syncGameLayout({
          eliminated: updatedElim,
          phase: nextPhase,
          accusationResult: { winner: finalWinner, correct },
          log: nextLog,
          turnPhase: "wait"
        });
      } else {
        const nextPlayerIndex = 1 - currentPlayer;
        const turnLog = [`--- ${playerNames[nextPlayerIndex]}'s turn ---`, alertMsg, ...log].slice(0, 20);
        
        syncGameLayout({
          eliminated: updatedElim,
          phase: nextPhase,
          log: turnLog,
          currentPlayer: nextPlayerIndex,
          diceResult: null,
          turnPhase: "roll"
        });
        setReachable([]);
      }
    } else {
      sendNetMessage("CHECK_ACCUSATION", { accusation });
    }
  }

  function endTurn() {
    const nextPlayerIndex = 1 - currentPlayer;
    const nextLog = [`--- ${playerNames[nextPlayerIndex]}'s turn ---`, ...log].slice(0, 20);
    
    setReachable([]); // Wipe previous path overlays
    syncGameLayout({ 
      currentPlayer: nextPlayerIndex, 
      diceResult: null, 
      turnPhase: "roll", 
      log: nextLog 
    });
  }

  if (phase === "setup") {
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${peerId}`;
    return (
      <div style={{ minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: 440, width: "100%", background: "var(--color-background-secondary)", padding: "24px", borderRadius: "12px", border: "0.5px solid var(--color-border-tertiary)" }}>
          <h1 style={{ textAlign: "center", margin: "0 0 16px" }}>🕵️ CLUEDO ONLINE</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Network Status: {connected ? "🟢 Connected" : "⏳ Awaiting Peer Link Connection"}</p>
          
          {role === "host" && !connected && (
            <div style={{ margin: "16px 0", padding: "12px", background: "#f5f0e8", border: "1px dashed #2C2C2A", borderRadius: "6px" }}>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4, fontWeight: "bold" }}>SHARE INVITATION LINK WITH PLAYER 2:</label>
              <input readOnly value={peerId ? inviteLink : "Generating link..."} style={{ width: "100%", fontSize: 11, padding: "4px" }} onClick={(e) => e.target.select()} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Enter Your Name:</label>
            <input type="text" value={nameInput} placeholder={role === "host" ? "Host" : "Guest"} onChange={e => setNameInput(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: 6 }} />
          </div>

          <button onClick={startInvestigation} disabled={role === "guest" && !connected} style={{ width: "100%", padding: "10px", background: "#2C2C2A", color: "white", borderRadius: 8, cursor: "pointer" }}>
            {role === "host" ? "Deal Deck & Start Game" : "Ready Up"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "game_over") {
    const winIdx = accusationResult?.winner;
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h2>{winIdx >= 0 ? `🎉 ${playerNames[winIdx]} Solved the Mystery!` : "💀 Everyone Eliminated. Case Closed!"}</h2>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: 8, background: "#2C2C2A", color: "white", cursor: "pointer" }}>Reload App</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", padding: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2>🕵️ CLUEDO ({role === "host" ? "P1" : "P2"})</h2>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setShowHandModal(true)}>Your Hand</button>
          <button onClick={() => setShowNotebook(true)}>Notebook</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10 }}>
        <Board 
          roomCellMap={roomCellMap}
          roomLayout={ROOM_LAYOUT}
          rooms={ROOMS}
          reachable={reachable}
          positions={positions}
          playerNames={playerNames}
          onCellClick={handleCellClick}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "var(--color-background-secondary)", padding: 10, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ margin: "2px 0", fontSize: 12 }}>Active: <b>{playerNames[currentPlayer]}</b> {currentPlayer === myIndex ? "(You)" : ""}</p>
            <p style={{ margin: "2px 0", fontSize: 12 }}>Phase: <b>{turnPhase}</b></p>
          </div>

          {turnPhase === "roll" && currentPlayer === myIndex && !eliminated[myIndex] && (
            <button onClick={rollDice} disabled={animateDice}>{animateDice ? "🎲..." : "🎲 Roll Dice"}</button>
          )}

          {diceResult && <div style={{ textAlign: "center", fontSize: 13 }}>Rolled Total: {diceResult.total}</div>}

          {turnPhase === "suggest" && currentPlayer === myIndex && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {roomCellMap[`${positions[myIndex].row},${positions[myIndex].col}`] && (
                <button onClick={() => setShowSuggestModal(true)}>💬 Suggest</button>
              )}
              <button onClick={() => { syncGameLayout({ turnPhase: "accuse" }); }}>Skip Suggestion</button>
            </div>
          )}

          {turnPhase === "accuse" && currentPlayer === myIndex && !eliminated[myIndex] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => setShowAccuseModal(true)} style={{ background: "#C0392B", color: "white" }}>⚖️ Accuse</button>
              <button onClick={endTurn}>End Turn</button>
            </div>
          )}

          <div style={{ background: "var(--color-background-secondary)", padding: 8, borderRadius: 8, height: 120, overflowY: "auto", border: "0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ fontSize: 11, margin: "0 0 4px", fontWeight: "bold" }}>Game Log</p>
            {log.map((entry, idx) => (
              <p key={idx} style={{ fontSize: 10, margin: "2px 0", color: idx === 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{entry}</p>
            ))}
          </div>
        </div>
      </div>

      {turnPhase === "responding" && pendingResponse && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#FFFFFF", color: "#2C2C2A", padding: 24, borderRadius: 12, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0px 8px 24px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 8px" }}>🤔 Disprove Suggestion</h3>
            <p style={{ fontSize: 14, margin: "8px 0 16px", lineHeight: "1.4" }}>
              {playerNames[1 - myIndex]} suggested:<br />
              <b>👤 {SUSPECTS.find(s => s.id === suggestion.suspect)?.name || suggestion.suspect}</b> with the 
              <b> 🗡️ {WEAPONS.find(w => w.id === suggestion.weapon)?.name || suggestion.weapon}</b> in the 
              <b> 🚪 {ROOMS.find(r => r.id === suggestion.room)?.name || suggestion.room}</b>.
            </p>
            <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12, borderTop: "0.5px solid #DDD", paddingTop: 12 }}>Select one card from your hand to show them:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", paddingLeft: "25%", marginBottom: 20 }}>
              {pendingResponse.cards.map(card => (
                <label key={card.id} style={{ fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <input type="radio" name="resCard" value={card.id} checked={responseCard === card.id} onChange={() => setResponseCard(card.id)} style={{ marginRight: 10, width: 16, height: 16 }} /> 
                  🃏 {card.name}
                </label>
              ))}
            </div>
            <button onClick={respondToSuggestion} disabled={!responseCard} style={{ width: "100%", padding: "12px", background: "#2C2C2A", color: "white", borderRadius: 8, fontWeight: "bold", border: "none", cursor: responseCard ? "pointer" : "not-allowed", opacity: responseCard ? 1 : 0.5 }}>Reveal to Opponent</button>
          </div>
        </div>
      )}

      {turnPhase === "see_card" && revealedCard && revealedCard.shownTo === myIndex && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#FFFFFF", color: "#2C2C2A", padding: 24, borderRadius: 12, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <h3>🃏 Secret Card Revealed</h3>
            <p style={{ fontSize: 14 }}>{playerNames[revealedCard.shownBy]} showed you this card to disprove your suggestion:</p>
            <div style={{ fontSize: 22, fontWeight: "bold", margin: "20px 0", padding: "16px", border: "2px solid #2C2C2A", borderRadius: 8, background: "#f9f9f9" }}>
              {revealedCard.card.name}
            </div>
            <button onClick={acknowledgeCard} style={{ width: "100%", padding: "10px", background: "#2C2C2A", color: "white", borderRadius: 8 }}>Acknowledge & Close</button>
          </div>
        </div>
      )}

      {showSuggestModal && (
        <SuggestionModal show={showSuggestModal} onClose={() => setShowSuggestModal(false)} suggestion={suggestion} setSuggestion={setSuggestion} suspects={SUSPECTS} weapons={WEAPONS} rooms={ROOMS} onSubmit={submitSuggestion} />
      )}

      <AccusationModal show={showAccuseModal} onClose={() => setShowAccuseModal(false)} accusation={accusation} setAccusation={setAccusation} suspects={SUSPECTS} weapons={WEAPONS} rooms={ROOMS} onSubmit={submitAccusation} />
      
      <ClueNotebook show={showNotebook} onClose={() => setShowNotebook(false)} playerName={playerNames[myIndex]} playerIdx={myIndex} notebook={notebook} suspects={SUSPECTS} weapons={WEAPONS} rooms={ROOMS} onUpdateNotebook={(idx, type, id, val) => {
        setNotebook(notebook.map((nb, i) => i === idx ? { ...nb, [type]: { ...nb[type], [id]: val } } : nb));
      }} />

      <PlayerHand show={showHandModal} onClose={() => setShowHandModal(false)} playerName={playerNames[myIndex]} hand={myHand} clueCards={clueCardsFound[myIndex] || []} />
    </div>
  );
}