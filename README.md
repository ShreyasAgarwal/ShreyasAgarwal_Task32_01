# Chess Game – React Mini Project

A fully functional two-player offline chess game built with React.js (no external chess libraries used).

---

## What's in here

This project covers everything mentioned in the problem statement:

- 8×8 chess board with all pieces in starting positions
- Legal move validation for every piece (including edge cases like en passant and castling)
- Check and checkmate detection with visual highlights
- Turn-based gameplay with alternating turns
- Countdown timers for both players (10 minutes each)
- Move history displayed in standard algebraic notation (e.g., e4, Nf3, O-O)

---

## How to run it

Make sure you have Node.js installed, then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser and you're good to go.

---

## How to play

- Click a piece to select it — valid squares will be highlighted
- Click a highlighted square to move
- Turns alternate automatically between White and Black
- Timers only start counting once you make your first move
- The move list on the right tracks every move in chess notation
- If a king is in check, the square turns red
- Checkmate or stalemate ends the game with a message
- Click **New Game** at the top to reset everything

---

## Project structure

```
ShreyasVasnik_Task1/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx          # Main game component (UI + state)
    ├── App.css          # All styles
    └── chessLogic.js    # Board init, move generation, check/checkmate logic
```

---

## Implementation notes

All chess logic is written from scratch in `chessLogic.js`. This includes:

- **Move generation** for all 6 piece types
- **En passant**: tracked via a target square set after a pawn double-advance
- **Castling**: both kingside and queenside, with checks that the king doesn't pass through attacked squares
- **Pawn promotion**: auto-promotes to queen
- **Check detection**: simulates each candidate move on a cloned board and verifies the king is not left in check
- **Checkmate vs stalemate**: determined by whether the current player has zero legal moves, combined with whether they're in check

The UI uses Unicode chess symbols (♔ ♕ ♖ etc.) so no image assets are needed.

---

## Details

- **Name**: Shreyas Vasnik  
- **Reg. No**: 25BAI11356  
- **Task**: React.js Mini Project – Chess Game
