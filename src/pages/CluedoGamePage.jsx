import { useState, useEffect, useRef, useCallback } from "react";
import Peer from "peerjs";
import Board from "../components/Board";
import ClueNotebook from "../components/ClueNotebook";
import PlayerHand from "../components/PlayerHand";
import SuggestionModal from "../components/SuggestionModal";
import AccusationModal from "../components/AccusationModal";
import PreGameCipherModal from "../components/CipherModal";
import { GameAssets } from "../components/GameAssets";

const SUSPECTS = GameAssets.suspects;
const WEAPONS = GameAssets.weapons;
const ROOMS = GameAssets.rooms;

const BOARD_SIZE = 9;
const ROOM_LAYOUT = {
  monaco:      { cells: [[0,0],[0,1],[1,0],[1,1]]},
  garage:      { cells: [[0,3],[0,4],[0,5],[1,3],[1,4],[1,5]]},
  chapel:      { cells: [[0,7],[0,8],[1,7],[1,8]]},
  lasvegas:    { cells: [[3,0],[3,1],[4,0],[4,1]]},
  bahrain:     { cells: [[3,3],[3,4],[3,5],[4,3],[4,4],[4,5]]},
  monza:       { cells: [[3,7],[3,8],[4,7],[4,8]]},
  cliffs:      { cells: [[6,0],[6,1],[7,0],[7,1],[8,0],[8,1]]},
  stage:       { cells: [[6,3],[6,4],[6,5],[7,3],[7,4],[7,5],[8,3],[8,4],[8,5]]},
  kennel:      { cells: [[6,7],[6,8],[7,7],[7,8],[8,7],[8,8]]},
};

// Door network definition
const ROOM_DOORS = {
  "1,1": [1, 2], // door out of monaco
  "1,3": [1, 2], // door out of garage
  "1,5": [2, 5], // door out of garage
  "1,7": [2, 7], // door out of chapel
  "4,1": [5, 1], // door out of las vegas
  "4,3": [4, 2], // door out of bahrain
  "3,5": [2, 5], // door out of bahrain
  "4,7": [5, 7], // door out of monza
  "6,1": [5, 1], // door out of cliffs
  "6,3": [5, 3], // door out of stage
  "6,5": [6, 6], // door out of stage
  "6,7": [6, 6], // door out of kennel
};

// Build two-way door connections graph
const DOOR_CONNECTIONS = {};
Object.entries(ROOM_DOORS).forEach(([fromKey, [toR, toC]]) => {
  const toKey = `${toR},${toC}`;
  if (!DOOR_CONNECTIONS[fromKey]) DOOR_CONNECTIONS[fromKey] = [];
  if (!DOOR_CONNECTIONS[toKey]) DOOR_CONNECTIONS[toKey] = [];

  DOOR_CONNECTIONS[fromKey].push([toR, toC]);
  DOOR_CONNECTIONS[toKey].push(fromKey.split(",").map(Number));
});

const CLUE_TILE_CELLS = [[2,2],[2,6],[4,2],[4,6],[6,2],[6,6]];
const PLAYER_START = [{ row: 8, col: 2 }, { row: 0, col: 6 }];

function buildRoomCellMap() {
  const map = {};
  for (const [roomId, layout] of Object.entries(ROOM_LAYOUT)) {
    for (const [r, c] of layout.cells) {
      map[`${r},${c}`] = roomId;
    }
  }
  return map;
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
  const [, setTargetPeerId] = useState("");
  const [connected, setConnected] = useState(false);

  // Phases: "setup" -> "cipher" -> "play" -> "game_over"
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
  
  const [cipherData, setCipherData] = useState({
    phrase: "",
    answer: "",
    isSet: false,
    isSolved: false,
  });

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

  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = { myHand, playerNames, myIndex, log, currentPlayer, role, solution, eliminated, cipherData };
  }, [myHand, playerNames, myIndex, log, currentPlayer, role, solution, eliminated, cipherData]);

  const addLog = (msg) => setLog(prev => [msg, ...prev].slice(0, 20));

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
    if (state.cipherData) setCipherData(state.cipherData);
  }

  function sendNetMessage(type, payload) {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type, ...payload });
    }
  }

  const syncGameLayout = useCallback((updatedFields) => {
    applyStateFields(updatedFields);
    const activeConnection = connRef.current;
    
    if (activeConnection && activeConnection.open) {
      if (stateRef.current.role === "host") {
        activeConnection.send({ type: "SYNC_STATE", state: updatedFields });
      } else {
        activeConnection.send({ type: "REQUEST_SYNC", fields: updatedFields });
      }
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    const peer = new Peer({
      host: "0.peerjs.com",
      port: 443,
      secure: true,
      path: "/",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          {
            urls: "turn:relay.metered.ca:80",
            username: "metered",
            credential: "password"
          }
        ]
      }
    });
    peerRef.current = peer;

    function bindConnectionEvents(conn) {
      connRef.current = conn;

      conn.on("open", () => {
        setConnected(true);
      });

      conn.on("data", (data) => {
        const { myHand: currentHand, playerNames: currentNames, myIndex: currentIndex, log: currentLog, currentPlayer: currentActive, role: currentRole, solution: currentSol, eliminated: currentElim } = stateRef.current;

        switch (data.type) {
          case "SYNC_STATE":
            applyStateFields(data.state); 
            break;
            
          case "REQUEST_SYNC":
            if (currentRole === "host") {
              syncGameLayout(data.fields);
            }
            break;

          case "ASSIGN_HANDS":
            setMyHand(data.hand);
            setPlayerNames(data.playerNames);
            setPhase("cipher");
            break;

          case "SET_CIPHER":
            setCipherData({
              phrase: data.phrase,
              answer: data.answer,
              isSet: true,
              isSolved: false
            });
            break;

          case "CIPHER_SOLVED":
            setCipherData(prev => ({ ...prev, isSolved: true }));
            break;

          case "START_MAIN_GAME":
            setPhase("play");
            setTurnPhase("roll");
            break;

          case "REQUEST_DISPROOF": {
            const incomingSuggest = data.suggestion;
            const matching = currentHand.filter(
              c => c.id === incomingSuggest.suspect || 
                   c.id === incomingSuggest.weapon || 
                   c.id === incomingSuggest.room
            );
            
            if (matching.length === 0) {
              sendNetMessage("NO_DISPROOF", {});
              const noMatchLog = [`${currentNames[currentIndex]} has no cards to disprove the suggestion.`, ...currentLog].slice(0, 20);
              syncGameLayout({ log: noMatchLog, turnPhase: "accuse", currentPlayer: currentActive });
            } else {
              setPendingResponse({ cards: matching, from: 1 - currentIndex, to: currentIndex });
              setTurnPhase("responding");
            }
            break;
          }

          case "NO_DISPROOF":
            syncGameLayout({ turnPhase: "accuse", currentPlayer: currentActive });
            break;

          case "SEND_DISPROOF_CARD":
            setRevealedCard({ card: data.card, shownTo: currentIndex, shownBy: 1 - currentIndex });
            setTurnPhase("see_card");
            break;

          case "CHECK_ACCUSATION":
            if (currentRole === "host") {
              const correct = data.accusation.suspect === currentSol.suspect.id &&
                              data.accusation.weapon === currentSol.weapon.id &&
                              data.accusation.room === currentSol.room.id;
              
              let finalWinner = correct ? 1 : -1;
              let updatedElim = [...currentElim];
              if (!correct) updatedElim[1] = true;
              if (updatedElim[0] && updatedElim[1]) finalWinner = -1;

              const nextPhase = (correct || (updatedElim[0] && updatedElim[1])) ? "game_over" : "play";
              const alertMsg = correct 
                ? `🎉 ${currentNames[1]} made the correct accusation and WON!` 
                : `❌ ${currentNames[1]}'s accusation was WRONG! They are eliminated.`;
              
              syncGameLayout({
                eliminated: updatedElim,
                phase: nextPhase,
                accusationResult: { winner: finalWinner, correct },
                log: [alertMsg, ...currentLog].slice(0, 20),
                turnPhase: nextPhase === "game_over" ? "wait" : "roll",
                currentPlayer: 0
              });
            }
            break;

          default:
            console.warn(`Unhandled P2P message type: ${data.type}`);
            break;
        }
      });
    }

    peer.on("open", (id) => {
      setPeerId(id);
      if (roomParam) {
        setRole("guest");
        setTargetPeerId(roomParam);
        const conn = peer.connect(roomParam, { reliable: true });
        bindConnectionEvents(conn);
      } else {
        setRole("host");
      }
    });

    peer.on("connection", (conn) => {
      bindConnectionEvents(conn);
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [syncGameLayout]);

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
        log: [`Investigation started! Set or solve the cipher to enter the estate.`], 
        playerNames: names, 
        phase: "cipher", 
        turnPhase: "roll" 
      });
    } else {
      sendNetMessage("SYNC_STATE", { state: { playerNames: names } });
      addLog(`Waiting for Host to deal cards...`);
    }
  }

  const handleHostSetCipher = (phrase, answer) => {
    const updatedCipher = { phrase, answer, isSet: true, isSolved: false };
    setCipherData(updatedCipher);
    sendNetMessage("SET_CIPHER", { phrase, answer });
    addLog(`Host created confidential cipher.`);
  };

  const handleGuestSolve = (inputAnswer) => {
    if (inputAnswer === cipherData.answer.toLowerCase()) {
      setCipherData(prev => ({ ...prev, isSolved: true }));
      sendNetMessage("CIPHER_SOLVED", {});
      addLog(`Guest successfully deciphered the passkey!`);
      return true;
    }
    return false;
  };

  const handleStartGameFromCipher = () => {
    setPhase("play");
    setTurnPhase("roll");
    sendNetMessage("START_MAIN_GAME", {});
  };

  function rollDice() {
  if (currentPlayer !== myIndex) return;
  setAnimateDice(true);

  setTimeout(() => {
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const total = d1 + d2;
    const res = { d1, d2, total };
    
    const startPos = positions[myIndex];
    const otherPlayerIndex = 1 - myIndex;
    const otherPos = positions[otherPlayerIndex];
    const otherKey = `${otherPos.row},${otherPos.col}`;

    const reachSet = new Set();
    const startKey = `${startPos.row},${startPos.col}`;
    const initialPath = new Set([startKey]);

    // Queue format: [row, col, stepsRemaining, visitedPathSet]
    const queue = [[startPos.row, startPos.col, total, initialPath]];

    while (queue.length > 0) {
      const [r, c, stepsLeft, visitedPath] = queue.shift();
      const currentKey = `${r},${c}`;
      const isCurrentRoom = Boolean(roomCellMap[currentKey]);

      // --- RULE 1: HIGHLIGHTING ---
      if (currentKey !== startKey) {
        if (isCurrentRoom) {
          // ROOMS: Valid landing spot if reached at or before exact roll
          reachSet.add(currentKey);
        } else if (stepsLeft === 0) {
          // HALLWAYS: Valid landing spot ONLY on exact step count
          reachSet.add(currentKey);
        }
      }

      // --- RULE 2: TERMINATION ---
      // Stop path expansion if out of steps OR if entering a new room
      if (stepsLeft === 0 || (isCurrentRoom && currentKey !== startKey)) {
        continue;
      }

      const neighbors = [];

      // --- RULE 3: NEIGHBOR DISCOVERY ---
      if (isCurrentRoom) {
        // Exiting a room: Must use door exits
        if (DOOR_CONNECTIONS[currentKey]) {
          DOOR_CONNECTIONS[currentKey].forEach(dest => neighbors.push(dest));
        }
      } else {
        // Hallway movement: Cardinal adjacent non-room tiles
        const cardinalDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of cardinalDirs) {
          const nr = r + dr;
          const nc = c + dc;
          const nextKey = `${nr},${nc}`;

          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (!roomCellMap[nextKey]) {
              neighbors.push([nr, nc]);
            }
          }
        }

        // Check if hallway tile links into a room via door transition
        if (DOOR_CONNECTIONS[currentKey]) {
          DOOR_CONNECTIONS[currentKey].forEach(dest => neighbors.push(dest));
        }
      }

      // --- RULE 4: VALIDATE AND QUEUE NEXT STEPS ---
      for (const [nr, nc] of neighbors) {
        const nextKey = `${nr},${nc}`;

        // Prevent looping/backtracking along the active turn path
        if (visitedPath.has(nextKey)) continue;

        // Corridor block: Players cannot step over each other in corridors
        const isNextRoom = Boolean(roomCellMap[nextKey]);
        if (!isNextRoom && nextKey === otherKey) continue;

        const newPath = new Set(visitedPath);
        newPath.add(nextKey);

        queue.push([nr, nc, stepsLeft - 1, newPath]);
      }
    }
    
    setReachable(Array.from(reachSet));
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

    sendNetMessage("REQUEST_DISPROOF", { suggestion: synchronizedSuggestion });
    
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
    
    sendNetMessage("SEND_DISPROOF_CARD", { card });
    setTurnPhase("wait");
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
    
    setReachable([]);
    syncGameLayout({ 
      currentPlayer: nextPlayerIndex, 
      diceResult: null, 
      turnPhase: "roll", 
      log: nextLog 
    });
  }

  /* ================= RENDER MODES ================= */

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
    <div style={{ 
      fontFamily: "Georgia, serif", 
      padding: "12px", 
      backgroundColor: "#faeecd", 
      color: "#442a0e",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <PreGameCipherModal
        show={phase === "cipher"}
        isHost={role === "host"}
        cipherData={cipherData}
        onHostSetCipher={handleHostSetCipher}
        onGuestSolve={handleGuestSolve}
        onStartGame={handleStartGameFromCipher}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>🕵️ CLUEDO ({role === "host" ? "P1" : "P2"})</h2>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={() => setShowHandModal(true)}>Your Hand</button>
          <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={() => setShowNotebook(true)}>Notebook</button>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, alignItems: "start" }}>
        
        {/* Board */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Board 
            roomCellMap={roomCellMap}
            roomLayout={ROOM_LAYOUT}
            rooms={ROOMS}
            reachable={reachable}
            positions={positions}
            playerNames={playerNames}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Right Column: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "var(--color-background-secondary)", padding: 10, borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ margin: "2px 0", fontSize: 12 }}>Active: <b>{playerNames[currentPlayer]}</b> {currentPlayer === myIndex ? "(You)" : ""}</p>
            <p style={{ margin: "2px 0", fontSize: 12 }}>Phase: <b>{turnPhase}</b></p>
          </div>

          {turnPhase === "roll" && currentPlayer === myIndex && !eliminated[myIndex] && (
            <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={rollDice} disabled={animateDice}>{animateDice ? "🎲..." : "🎲 Roll Dice"}</button>
          )}

          {diceResult && <div style={{ textAlign: "center", fontSize: 13 }}>Rolled Total: {diceResult.total}</div>}

          {turnPhase === "suggest" && currentPlayer === myIndex && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {roomCellMap[`${positions[myIndex].row},${positions[myIndex].col}`] && (
                <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={() => setShowSuggestModal(true)}>💬 Suggest</button>
              )}
              <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={() => { syncGameLayout({ turnPhase: "accuse" }); }}>Skip Suggestion</button>
            </div>
          )}

          {turnPhase === "accuse" && currentPlayer === myIndex && !eliminated[myIndex] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => setShowAccuseModal(true)} style={{ background: "#a4eabc", color: "#442a0e" }}>⚖️ Accuse</button>
              <button style={{ backgroundColor:"#8d2217", color:"#faeecd"}} onClick={endTurn}>End Turn</button>
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