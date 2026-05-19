import { useState, useEffect, useCallback, useRef } from "react";
import {
  initBoard,
  getLegalMoves,
  applyMove,
  isInCheck,
  hasAnyLegalMoves,
  moveToNotation,
  PIECE_SYMBOLS,
  COLORS,
  PIECES,
} from "./chessLogic";

const INITIAL_TIME = 10 * 60; // 10 minutes each

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function App() {
  const [board, setBoard] = useState(initBoard());
  const [selected, setSelected] = useState(null); // [row, col]
  const [legalMoves, setLegalMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(COLORS.WHITE);
  const [moveHistory, setMoveHistory] = useState([]);
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [gameStatus, setGameStatus] = useState("playing"); // playing | check | checkmate | stalemate
  const [timers, setTimers] = useState({ white: INITIAL_TIME, black: INITIAL_TIME });
  const [gameStarted, setGameStarted] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const moveListRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (!gameStarted || gameStatus !== "playing") return;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev, [currentTurn]: prev[currentTurn] - 1 };
        if (updated[currentTurn] <= 0) {
          setGameStatus("timeout");
          setStatusMsg(
            `Time's up! ${currentTurn === COLORS.WHITE ? "Black" : "White"} wins!`
          );
          clearInterval(interval);
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, gameStarted, gameStatus]);

  // Scroll move list to bottom
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const handleSquareClick = useCallback(
    (row, col) => {
      if (gameStatus !== "playing") return;

      const piece = board[row][col];

      // If we already have a selection, try to move
      if (selected) {
        const [selRow, selCol] = selected;

        // Clicking the same square deselects
        if (selRow === row && selCol === col) {
          setSelected(null);
          setLegalMoves([]);
          return;
        }

        // Check if clicked square is a valid move
        const isLegal = legalMoves.some(([r, c]) => r === row && c === col);

        if (isLegal) {
          const selectedPiece = board[selRow][selCol];
          const newBoard = applyMove(board, selRow, selCol, row, col, enPassantTarget);

          // Determine new en passant target
          let newEnPassant = null;
          if (
            selectedPiece.type === PIECES.PAWN &&
            Math.abs(row - selRow) === 2
          ) {
            newEnPassant = [(selRow + row) / 2, col];
          }

          const notation = moveToNotation(board, selRow, selCol, row, col, newBoard, currentTurn);

          const nextTurn = currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

          // Check game status
          const inCheck = isInCheck(newBoard, nextTurn);
          const hasLegal = hasAnyLegalMoves(newBoard, nextTurn, newEnPassant);

          let newStatus = "playing";
          let msg = "";

          if (!hasLegal) {
            if (inCheck) {
              newStatus = "checkmate";
              msg = `Checkmate! ${currentTurn === COLORS.WHITE ? "White" : "Black"} wins! 🎉`;
            } else {
              newStatus = "stalemate";
              msg = "Stalemate! It's a draw.";
            }
          } else if (inCheck) {
            newStatus = "check";
            msg = `${nextTurn === COLORS.WHITE ? "White" : "Black"} is in check!`;
          }

          setBoard(newBoard);
          setEnPassantTarget(newEnPassant);
          setCurrentTurn(nextTurn);
          setMoveHistory((prev) => [...prev, { notation, color: currentTurn }]);
          setGameStatus(newStatus === "check" ? "playing" : newStatus);
          setStatusMsg(msg);
          setSelected(null);
          setLegalMoves([]);

          if (!gameStarted) setGameStarted(true);
          return;
        }

        // Clicking another friendly piece switches selection
        if (piece && piece.color === currentTurn) {
          const moves = getLegalMoves(board, row, col, enPassantTarget);
          setSelected([row, col]);
          setLegalMoves(moves);
          return;
        }

        // Illegal move attempt
        setStatusMsg("Illegal move!");
        setTimeout(() => setStatusMsg((prev) => (prev === "Illegal move!" ? "" : prev)), 1500);
        setSelected(null);
        setLegalMoves([]);
        return;
      }

      // No selection yet — select a friendly piece
      if (piece && piece.color === currentTurn) {
        if (!gameStarted) setGameStarted(true);
        const moves = getLegalMoves(board, row, col, enPassantTarget);
        setSelected([row, col]);
        setLegalMoves(moves);
      }
    },
    [board, selected, legalMoves, currentTurn, enPassantTarget, gameStatus, gameStarted]
  );

  const resetGame = () => {
    setBoard(initBoard());
    setSelected(null);
    setLegalMoves([]);
    setCurrentTurn(COLORS.WHITE);
    setMoveHistory([]);
    setEnPassantTarget(null);
    setGameStatus("playing");
    setTimers({ white: INITIAL_TIME, black: INITIAL_TIME });
    setGameStarted(false);
    setStatusMsg("");
  };

  const isLightSquare = (r, c) => (r + c) % 2 === 0;
  const isSelected = (r, c) => selected && selected[0] === r && selected[1] === c;
  const isLegalTarget = (r, c) => legalMoves.some(([lr, lc]) => lr === r && lc === c);
  const isInCheckSquare = (r, c) => {
    const p = board[r][c];
    return p && p.type === PIECES.KING && isInCheck(board, p.color);
  };

  // Group moves into pairs
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moveHistory[i]?.notation || "",
      black: moveHistory[i + 1]?.notation || "",
    });
  }

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const whiteTimerLow = timers.white < 60;
  const blackTimerLow = timers.black < 60;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">♟ Chess</div>
        <button className="reset-btn" onClick={resetGame}>New Game</button>
      </header>

      <main className="main-content">
        {/* Black timer */}
        <div className={`timer-card timer-black ${currentTurn === COLORS.BLACK && gameStarted && gameStatus === "playing" ? "active" : ""}`}>
          <span className="timer-label">Black ♚</span>
          <span className={`timer-value ${blackTimerLow ? "low" : ""}`}>{formatTime(timers.black)}</span>
        </div>

        {/* Board area */}
        <div className="board-section">
          <div className="board-wrapper">
            {/* Rank labels */}
            <div className="rank-labels">
              {ranks.map((r) => <span key={r}>{r}</span>)}
            </div>

            <div>
              <div className="chess-board">
                {board.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const light = isLightSquare(rIdx, cIdx);
                    const sel = isSelected(rIdx, cIdx);
                    const legal = isLegalTarget(rIdx, cIdx);
                    const check = isInCheckSquare(rIdx, cIdx);

                    let squareClass = `square ${light ? "light" : "dark"}`;
                    if (sel) squareClass += " selected";
                    if (check) squareClass += " in-check";

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={squareClass}
                        onClick={() => handleSquareClick(rIdx, cIdx)}
                      >
                        {legal && (
                          <div className={`move-dot ${cell ? "capture-ring" : ""}`} />
                        )}
                        {cell && (
                          <span className={`piece ${cell.color}`}>
                            {PIECE_SYMBOLS[cell.color][cell.type]}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* File labels */}
              <div className="file-labels">
                {files.map((f) => <span key={f}>{f}</span>)}
              </div>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <div className={`status-msg ${gameStatus === "checkmate" || gameStatus === "stalemate" || gameStatus === "timeout" ? "game-over" : ""}`}>
              {statusMsg}
            </div>
          )}
        </div>

        {/* White timer */}
        <div className={`timer-card timer-white ${currentTurn === COLORS.WHITE && gameStarted && gameStatus === "playing" ? "active" : ""}`}>
          <span className="timer-label">White ♔</span>
          <span className={`timer-value ${whiteTimerLow ? "low" : ""}`}>{formatTime(timers.white)}</span>
        </div>
      </main>

      {/* Move history + turn indicator */}
      <aside className="sidebar">
        <div className="turn-indicator">
          <div className={`turn-dot ${currentTurn}`}></div>
          <span>{currentTurn === COLORS.WHITE ? "White" : "Black"}'s turn</span>
        </div>

        <div className="move-list-header">Move History</div>
        <div className="move-list" ref={moveListRef}>
          {movePairs.length === 0 ? (
            <div className="no-moves">No moves yet. Click a piece to start.</div>
          ) : (
            movePairs.map((pair) => (
              <div key={pair.num} className="move-row">
                <span className="move-num">{pair.num}.</span>
                <span className="move-white">{pair.white}</span>
                <span className="move-black">{pair.black}</span>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
