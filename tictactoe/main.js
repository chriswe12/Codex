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

function aiMove() {
  const emptyIndices = Array.from(boardEl.children)
    .map((c, i) => c.textContent ? null : i)
    .filter(i => i !== null);
  if (emptyIndices.length === 0) return;
  const choice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  handleMove(choice);
}

modeEl.addEventListener('change', resetGame);
resetEl.addEventListener('click', resetGame);
document.addEventListener('DOMContentLoaded', initBoard);
