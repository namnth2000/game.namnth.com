"use strict";

const BOARD_SIZE = 4;
const WINNING_VALUE = 2048;
const STORAGE_KEY = "merge-2048-best";

const board = document.querySelector("#board");
const tileGrid = document.querySelector("#tileGrid");
const scoreValue = document.querySelector("#scoreValue");
const bestValue = document.querySelector("#bestValue");
const scoreGain = document.querySelector("#scoreGain");
const goalProgress = document.querySelector("#goalProgress");
const goalLabel = document.querySelector("#goalLabel");
const gameAnnouncement = document.querySelector("#gameAnnouncement");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const newGameButton = document.querySelector("#newGameButton");
const messageOverlay = document.querySelector("#messageOverlay");
const messageMark = document.querySelector("#messageMark");
const messageEyebrow = document.querySelector("#messageEyebrow");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const helpDialog = document.querySelector("#helpDialog");
const restartDialog = document.querySelector("#restartDialog");

let grid = createEmptyGrid();
let score = 0;
let bestScore = readBestScore();
let gameState = "playing";
let winAcknowledged = false;
let newTileKey = "";
let mergedTileKeys = new Set();
let pointerStart = null;
let messageActions = { primary: null, secondary: null };

function createEmptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function readBestScore() {
  try {
    const value = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
}

function getEmptyCells() {
  const emptyCells = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) emptyCells.push({ row: rowIndex, column: columnIndex });
    });
  });
  return emptyCells;
}

function addRandomTile() {
  const emptyCells = getEmptyCells();
  if (!emptyCells.length) return false;
  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[cell.row][cell.column] = Math.random() < 0.9 ? 2 : 4;
  newTileKey = `${cell.row}-${cell.column}`;
  return true;
}

function getLinePositions(direction, index) {
  const sequence = Array.from({ length: BOARD_SIZE }, (_, itemIndex) => itemIndex);
  if (direction === "right" || direction === "down") sequence.reverse();

  if (direction === "left" || direction === "right") {
    return sequence.map((column) => ({ row: index, column }));
  }
  return sequence.map((row) => ({ row, column: index }));
}

function mergeLine(values) {
  const compactValues = values.filter(Boolean);
  const output = [];
  const mergedIndexes = [];
  let gainedScore = 0;

  compactValues.forEach((value) => {
    const lastIndex = output.length - 1;
    if (lastIndex >= 0 && output[lastIndex] === value && !mergedIndexes.includes(lastIndex)) {
      output[lastIndex] *= 2;
      gainedScore += output[lastIndex];
      mergedIndexes.push(lastIndex);
    } else {
      output.push(value);
    }
  });

  while (output.length < BOARD_SIZE) output.push(0);
  return { values: output, mergedIndexes, gainedScore };
}

function move(direction) {
  if (gameState !== "playing") return;

  const previousGrid = grid.map((row) => [...row]);
  let gainedScore = 0;
  mergedTileKeys = new Set();
  newTileKey = "";

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const positions = getLinePositions(direction, index);
    const values = positions.map(({ row, column }) => grid[row][column]);
    const mergedLine = mergeLine(values);
    gainedScore += mergedLine.gainedScore;

    positions.forEach(({ row, column }, positionIndex) => {
      grid[row][column] = mergedLine.values[positionIndex];
      if (mergedLine.mergedIndexes.includes(positionIndex)) {
        mergedTileKeys.add(`${row}-${column}`);
      }
    });
  }

  if (gridsAreEqual(previousGrid, grid)) {
    announce("Không thể trượt theo hướng đó.");
    return;
  }

  score += gainedScore;
  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }

  addRandomTile();
  render(gainedScore);

  const highestTile = getHighestTile();
  if (highestTile >= WINNING_VALUE && !winAcknowledged) {
    gameState = "won";
    pauseButton.disabled = true;
    showMessage({
      mark: "2048",
      eyebrow: "Chiến thắng",
      title: "Bạn đã tạo được ô 2048!",
      text: `Xuất sắc! Bạn đạt ${formatNumber(score)} điểm. Bạn có thể tiếp tục để chinh phục ô lớn hơn.`,
      primaryLabel: "Chơi tiếp",
      primaryAction: continueAfterWin,
      secondaryLabel: "Ván mới",
      secondaryAction: requestRestart,
    });
    announce(`Bạn đã chiến thắng với ${formatNumber(score)} điểm.`);
    return;
  }

  if (!hasAvailableMove()) {
    gameState = "game-over";
    pauseButton.disabled = true;
    showMessage({
      mark: "×",
      eyebrow: "Hết nước đi",
      title: "Bàn đã kín",
      text: `Bạn đạt ${formatNumber(score)} điểm. Bắt đầu một ván mới và thử giữ ô lớn nhất ở góc nhé.`,
      primaryLabel: "Chơi lại",
      primaryAction: startNewGame,
      secondaryLabel: "Xem bàn",
      secondaryAction: hideGameOverMessage,
    });
    announce(`Hết nước đi. Điểm của bạn là ${formatNumber(score)}.`);
  }
}

function gridsAreEqual(firstGrid, secondGrid) {
  return firstGrid.every((row, rowIndex) => (
    row.every((value, columnIndex) => value === secondGrid[rowIndex][columnIndex])
  ));
}

function hasAvailableMove() {
  if (getEmptyCells().length) return true;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const value = grid[row][column];
      if (column < BOARD_SIZE - 1 && value === grid[row][column + 1]) return true;
      if (row < BOARD_SIZE - 1 && value === grid[row + 1][column]) return true;
    }
  }
  return false;
}

function getHighestTile() {
  return Math.max(...grid.flat());
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function render(gainedScore = 0) {
  const tiles = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (!value) return;
      const tile = document.createElement("div");
      const tileKey = `${rowIndex}-${columnIndex}`;
      tile.className = "merge-tile";
      if (tileKey === newTileKey) tile.classList.add("is-new");
      if (mergedTileKeys.has(tileKey)) tile.classList.add("is-merged");
      tile.dataset.value = String(value);
      tile.dataset.digits = String(String(value).length);
      tile.style.gridRow = String(rowIndex + 1);
      tile.style.gridColumn = String(columnIndex + 1);
      tile.setAttribute("role", "gridcell");
      tile.setAttribute("aria-rowindex", String(rowIndex + 1));
      tile.setAttribute("aria-colindex", String(columnIndex + 1));
      tile.setAttribute("aria-label", `Ô ${formatNumber(value)}`);
      tile.textContent = String(value);
      tiles.push(tile);
    });
  });
  tileGrid.replaceChildren(...tiles);

  scoreValue.textContent = formatNumber(score);
  bestValue.textContent = formatNumber(bestScore);
  const highestTile = getHighestTile();
  const progress = Math.min(100, (Math.log2(highestTile) / Math.log2(WINNING_VALUE)) * 100);
  goalProgress.style.width = `${progress}%`;
  goalLabel.textContent = `Ô cao nhất: ${formatNumber(highestTile)}`;

  if (gainedScore > 0) {
    scoreGain.textContent = `+${formatNumber(gainedScore)}`;
    scoreGain.classList.remove("is-visible");
    window.requestAnimationFrame(() => scoreGain.classList.add("is-visible"));
    announce(`Ghép được ${formatNumber(gainedScore)} điểm. Tổng điểm ${formatNumber(score)}.`);
  }
}

function announce(message) {
  gameAnnouncement.textContent = "";
  window.requestAnimationFrame(() => {
    gameAnnouncement.textContent = message;
  });
}

function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  gameState = "playing";
  winAcknowledged = false;
  mergedTileKeys = new Set();
  hideMessage();
  pauseButton.disabled = false;
  pauseButton.classList.remove("is-paused");
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  addRandomTile();
  addRandomTile();
  render();
  announce("Ván mới đã bắt đầu. Trên bàn có hai ô số.");
}

function requestRestart() {
  if (restartDialog.open) return;
  restartDialog.showModal();
}

function confirmRestart() {
  restartDialog.close();
  startNewGame();
}

function continueAfterWin() {
  winAcknowledged = true;
  gameState = "playing";
  pauseButton.disabled = false;
  hideMessage();
  announce("Tiếp tục ván chơi để tạo ô lớn hơn 2048.");
}

function hideGameOverMessage() {
  hideMessage();
  announce("Đang xem lại bàn đã kín. Hãy chọn Ván mới để chơi tiếp.");
}

function togglePause() {
  if (gameState === "playing") {
    gameState = "paused";
    pauseButton.classList.add("is-paused");
    pauseButton.setAttribute("aria-label", "Tiếp tục");
    showMessage({
      mark: "Ⅱ",
      eyebrow: "Tạm nghỉ",
      title: "Ván chơi đã tạm dừng",
      text: "Điểm và bàn chơi của bạn vẫn được giữ nguyên.",
      primaryLabel: "Tiếp tục",
      primaryAction: togglePause,
      secondaryLabel: "Ván mới",
      secondaryAction: requestRestart,
    });
  } else if (gameState === "paused") {
    gameState = "playing";
    pauseButton.classList.remove("is-paused");
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    hideMessage();
    announce("Tiếp tục ván chơi.");
  }
}

function showMessage(config) {
  messageMark.textContent = config.mark;
  messageEyebrow.textContent = config.eyebrow;
  messageTitle.textContent = config.title;
  messageText.textContent = config.text;
  messagePrimary.textContent = config.primaryLabel;
  messageSecondary.textContent = config.secondaryLabel;
  messageActions = {
    primary: config.primaryAction,
    secondary: config.secondaryAction,
  };
  messageOverlay.hidden = false;
}

function hideMessage() {
  messageOverlay.hidden = true;
  messageActions = { primary: null, secondary: null };
}

function runMessageAction(actionName) {
  const action = messageActions[actionName];
  if (typeof action === "function") action();
}

function dialogIsOpen() {
  return helpDialog.open || restartDialog.open;
}

function closeDialogFromBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

document.addEventListener("keydown", (event) => {
  if (dialogIsOpen()) return;
  const directions = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (directions[event.key]) {
    event.preventDefault();
    move(directions[event.key]);
    return;
  }

  if ((event.key === " " || event.key.toLowerCase() === "p") && ["playing", "paused"].includes(gameState)) {
    event.preventDefault();
    togglePause();
  }
});

board.addEventListener("pointerdown", (event) => {
  if (gameState !== "playing") return;
  pointerStart = { x: event.clientX, y: event.clientY };
  board.setPointerCapture?.(event.pointerId);
});

board.addEventListener("pointerup", (event) => {
  if (!pointerStart || gameState !== "playing") return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? "right" : "left");
  else move(deltaY > 0 ? "down" : "up");
});

board.addEventListener("pointercancel", () => {
  pointerStart = null;
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.direction));
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", requestRestart);
newGameButton.addEventListener("click", requestRestart);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));

document.querySelector("#helpButton").addEventListener("click", () => helpDialog.showModal());
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#closeRestartButton").addEventListener("click", () => restartDialog.close());
document.querySelector("#cancelRestartButton").addEventListener("click", () => restartDialog.close());
document.querySelector("#confirmRestartButton").addEventListener("click", confirmRestart);
helpDialog.addEventListener("click", closeDialogFromBackdrop);
restartDialog.addEventListener("click", closeDialogFromBackdrop);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState === "playing") togglePause();
});

bestValue.textContent = formatNumber(bestScore);
startNewGame();
