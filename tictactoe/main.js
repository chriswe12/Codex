const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const modeEl = document.getElementById('mode');
const resetEl = document.getElementById('reset');

const playerMarks = { X: [], O: [] }; // store positions for each player
let currentPlayer = 'X';
let gameOver = false;

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6] // diags
];

function initBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', () => handleMove(i));
    boardEl.appendChild(cell);
  }
  resetGame();
}

function resetGame() {
  playerMarks.X = [];
  playerMarks.O = [];
  currentPlayer = 'X';
  gameOver = false;
  Array.from(boardEl.children).forEach(c => c.textContent = '');
  statusEl.textContent = `Current Player: ${currentPlayer}`;
}

function placeMark(player, index) {
  const cell = boardEl.children[index];
  cell.textContent = player;
  playerMarks[player].push(index);
  if (playerMarks[player].length > 3) {
    const old = playerMarks[player].shift();
    boardEl.children[old].textContent = '';
  }
}

function checkWin(player) {
  if (playerMarks[player].length < 3) return false;
  return winningCombos.some(combo => combo.every(i => boardEl.children[i].textContent === player));
}

function handleMove(index) {
  if (gameOver || boardEl.children[index].textContent) return;
  placeMark(currentPlayer, index);
  if (checkWin(currentPlayer)) {
    statusEl.textContent = `${currentPlayer} wins!`;
    gameOver = true;
    return;
  }
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusEl.textContent = `Current Player: ${currentPlayer}`;

  if (!gameOver && modeEl.value === 'ai' && currentPlayer === 'O') {
    aiMove();
  }
}

// ---------- Improved AI using depth-limited minimax ----------

// helper to check win on an arbitrary board array
function boardWin(board, player) {
  return winningCombos.some(c => c.every(i => board[i] === player));
}

function emptyIndices(board) {
  const res = [];
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) res.push(i);
  }
  return res;
}

function cloneState(state) {
  return {
    board: state.board.slice(),
    marks: { X: state.marks.X.slice(), O: state.marks.O.slice() }
  };
}

function applyMove(state, player, index) {
  state.board[index] = player;
  state.marks[player].push(index);
  if (state.marks[player].length > 3) {
    const old = state.marks[player].shift();
    state.board[old] = '';
  }
}

function evaluate(state, depth) {
  if (boardWin(state.board, 'O')) return 10 - depth;
  if (boardWin(state.board, 'X')) return depth - 10;
  return 0;
}

function minimax(state, depth, maximizing, alpha, beta) {
  const score = evaluate(state, depth);
  if (score !== 0 || depth === 0) return score;

  const moves = emptyIndices(state.board);
  if (moves.length === 0) return 0;

  if (maximizing) { // AI's turn (O)
    let best = -Infinity;
    for (const idx of moves) {
      const newState = cloneState(state);
      applyMove(newState, 'O', idx);
      best = Math.max(best, minimax(newState, depth - 1, false, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else { // opponent's turn (X)
    let best = Infinity;
    for (const idx of moves) {
      const newState = cloneState(state);
      applyMove(newState, 'X', idx);
      best = Math.min(best, minimax(newState, depth - 1, true, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function aiMove() {
  const state = {
    board: Array.from(boardEl.children).map(c => c.textContent),
    marks: { X: playerMarks.X.slice(), O: playerMarks.O.slice() }
  };

  let bestScore = -Infinity;
  let bestMove = null;
  const depth = 5; // search depth

  for (const idx of emptyIndices(state.board)) {
    const newState = cloneState(state);
    applyMove(newState, 'O', idx);
    const score = minimax(newState, depth - 1, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  if (bestMove !== null) handleMove(bestMove);
}

modeEl.addEventListener('change', resetGame);
resetEl.addEventListener('click', resetGame);
document.addEventListener('DOMContentLoaded', initBoard);
