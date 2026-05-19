export const PIECES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn',
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

export const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export function initBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRank = [
    PIECES.ROOK, PIECES.KNIGHT, PIECES.BISHOP, PIECES.QUEEN,
    PIECES.KING, PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK,
  ];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: COLORS.BLACK, moved: false };
    board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK, moved: false };
    board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE, moved: false };
    board[7][col] = { type: backRank[col], color: COLORS.WHITE, moved: false };
  }

  return board;
}

export function cloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getRawMoves(board, row, col, enPassantTarget) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];
  const { type, color, moved } = piece;
  const dir = color === COLORS.WHITE ? -1 : 1;
  const opponent = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

  if (type === PIECES.PAWN) {
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      moves.push([row + dir, col]);
      const startRank = color === COLORS.WHITE ? 6 : 1;
      if (row === startRank && !board[row + 2 * dir][col]) {
        moves.push([row + 2 * dir, col]);
      }
    }
    for (const dc of [-1, 1]) {
      const nr = row + dir;
      const nc = col + dc;
      if (inBounds(nr, nc)) {
        if (board[nr][nc] && board[nr][nc].color === opponent) {
          moves.push([nr, nc]);
        }
        if (enPassantTarget && enPassantTarget[0] === nr && enPassantTarget[1] === nc) {
          moves.push([nr, nc]);
        }
      }
    }
  }

  if (type === PIECES.KNIGHT) {
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc].color === opponent)) {
        moves.push([nr, nc]);
      }
    }
  }

  if (type === PIECES.BISHOP || type === PIECES.QUEEN) {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        if (board[nr][nc]) {
          if (board[nr][nc].color === opponent) moves.push([nr, nc]);
          break;
        }
        moves.push([nr, nc]);
        nr += dr;
        nc += dc;
      }
    }
  }

  if (type === PIECES.ROOK || type === PIECES.QUEEN) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        if (board[nr][nc]) {
          if (board[nr][nc].color === opponent) moves.push([nr, nc]);
          break;
        }
        moves.push([nr, nc]);
        nr += dr;
        nc += dc;
      }
    }
  }

  if (type === PIECES.KING) {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc].color === opponent)) {
        moves.push([nr, nc]);
      }
    }
    // Castling
    if (!moved) {
      // Kingside
      const rookKS = board[row][7];
      if (rookKS && rookKS.type === PIECES.ROOK && rookKS.color === color && !rookKS.moved) {
        if (!board[row][5] && !board[row][6]) {
          moves.push([row, 6]);
        }
      }
      // Queenside
      const rookQS = board[row][0];
      if (rookQS && rookQS.type === PIECES.ROOK && rookQS.color === color && !rookQS.moved) {
        if (!board[row][1] && !board[row][2] && !board[row][3]) {
          moves.push([row, 2]);
        }
      }
    }
  }

  return moves;
}

// Check if king in check
export function isInCheck(board, color) {
  let kingRow = -1, kingCol = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].type === PIECES.KING && board[r][c].color === color) {
        kingRow = r;
        kingCol = c;
      }
    }
  }
  if (kingRow === -1) return false;

  const opponent = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].color === opponent) {
        const rawMoves = getRawMoves(board, r, c, null);
        if (rawMoves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function applyMove(board, fromRow, fromCol, toRow, toCol, enPassantTarget) {
  const newBoard = cloneBoard(board);
  const piece = { ...newBoard[fromRow][fromCol], moved: true };

  if (piece.type === PIECES.PAWN && enPassantTarget &&
      toRow === enPassantTarget[0] && toCol === enPassantTarget[1]) {
    const capturedRow = fromRow;
    newBoard[capturedRow][toCol] = null;
  }

  if (piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    if (toCol === 6) {
      newBoard[fromRow][5] = { ...newBoard[fromRow][7], moved: true };
      newBoard[fromRow][7] = null;
    } else if (toCol === 2) {
      newBoard[fromRow][3] = { ...newBoard[fromRow][0], moved: true };
      newBoard[fromRow][0] = null;
    }
  }

  if (piece.type === PIECES.PAWN && (toRow === 0 || toRow === 7)) {
    piece.type = PIECES.QUEEN;
  }

  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = null;
  return newBoard;
}

export function getLegalMoves(board, row, col, enPassantTarget) {
  const piece = board[row][col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, row, col, enPassantTarget);
  const legal = [];

  for (const [toRow, toCol] of rawMoves) {
    const newBoard = applyMove(board, row, col, toRow, toCol, enPassantTarget);

    if (piece.type === PIECES.KING && Math.abs(toCol - col) === 2) {
      const passThroughCol = toCol === 6 ? 5 : 3;
      const passThroughBoard = applyMove(board, row, col, row, passThroughCol, null);
      if (isInCheck(passThroughBoard, piece.color)) continue;
      if (isInCheck(board, piece.color)) continue;
    }

    if (!isInCheck(newBoard, piece.color)) {
      legal.push([toRow, toCol]);
    }
  }

  return legal;
}

export function hasAnyLegalMoves(board, color, enPassantTarget) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].color === color) {
        if (getLegalMoves(board, r, c, enPassantTarget).length > 0) return true;
      }
    }
  }
  return false;
}

export function moveToNotation(board, fromRow, fromCol, toRow, toCol, newBoard, color) {
  const piece = board[fromRow][fromCol];
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];

  const toFile = files[toCol];
  const toRank = ranks[toRow];
  const fromFile = files[fromCol];

  let notation = '';

  if (piece.type === PIECES.PAWN) {
    if (board[toRow][toCol] || (toCol !== fromCol)) {
      notation = fromFile + 'x' + toFile + toRank;
    } else {
      notation = toFile + toRank;
    }
    if (toRow === 0 || toRow === 7) notation += '=Q';
  } else if (piece.type === PIECES.KING && Math.abs(toCol - fromCol) === 2) {
    notation = toCol === 6 ? 'O-O' : 'O-O-O';
  } else {
    const pieceLetters = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N' };
    const capture = board[toRow][toCol] ? 'x' : '';
    notation = pieceLetters[piece.type] + capture + toFile + toRank;
  }

  const opponent = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  if (isInCheck(newBoard, opponent)) {
    if (!hasAnyLegalMoves(newBoard, opponent, null)) {
      notation += '#';
    } else {
      notation += '+';
    }
  }

  return notation;
}
