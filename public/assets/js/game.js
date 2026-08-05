"use strict";

const GRID_SIZE = 24;
const CANVAS_SIZE = 720;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const BRAND_COLOR = "#10b981";
const LEVEL_TARGETS = [7, 9, 11, 13, 15];

const MODE_COPY = {
  endless: "Không có chướng ngại vật, nhưng cắn trúng thân vẫn kết thúc lượt.",
  levels: "Qua 5 level. Cẩn thận với những cụm chướng ngại vật lớn.",
  surprise: "Cắn thân chỉ bị ngắn lại. Vật phẩm x3 làm táo to 2×2 trong 8 giây.",
};

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const ITEM_DEFINITIONS = {
  phase: { label: "Xuyên vật cản", short: "↯", duration: 8000, color: "#7c3aed" },
  boost: { label: "Tăng tốc", short: ">>", duration: 6500, color: "#0284c7" },
  shield: { label: "Khiên bảo vệ", short: "S", duration: 0, color: "#d97706" },
  magnet: { label: "Nam châm mồi", short: "U", duration: 9000, color: "#db2777" },
  heart: { label: "Hồi máu", short: "+", duration: 0, color: "#dc2626" },
  triple: { label: "Táo lớn x3 điểm", short: "x3", duration: 8000, color: "#0f766e" },
};

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const board = document.querySelector("#board");
const modeList = document.querySelector("#modeList");
const modeTip = document.querySelector("#modeTip p");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const introOverlay = document.querySelector("#introOverlay");
const messageOverlay = document.querySelector("#messageOverlay");
const messageIcon = document.querySelector("#messageIcon");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const messageTertiary = document.querySelector("#messageTertiary");
const scoreValue = document.querySelector("#scoreValue");
const highScoreValue = document.querySelector("#highScoreValue");
const levelHud = document.querySelector("#levelHud");
const levelValue = document.querySelector("#levelValue");
const healthHud = document.querySelector("#healthHud");
const healthValue = document.querySelector("#healthValue");
const effectBar = document.querySelector("#effectBar");
const themeButton = document.querySelector("#themeButton");
const helpDialog = document.querySelector("#helpDialog");

let selectedMode = "endless";
let state = "idle";
let snake = [];
let direction = DIRECTIONS.right;
let queuedDirection = DIRECTIONS.right;
let food = null;
let specialItem = null;
let obstacles = [];
let score = 0;
let level = 1;
let levelProgress = 0;
let scoreAtLevelStart = 0;
let health = 3;
let tickCount = 0;
let growthPending = 0;
let loopTimer = null;
let touchStart = null;
let messageActions = { primary: null, secondary: null, tertiary: null };
let effects = { phase: 0, boost: 0, magnet: 0, triple: 0, shield: false };

function loadNumber(key) {
  const value = Number.parseInt(localStorage.getItem(key) || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function sameCell(first, second) {
  return first && second && first.x === second.x && first.y === second.y;
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function getHighScore() {
  return loadNumber(`snake-high-score-${selectedMode}`);
}

function updateHud() {
  scoreValue.textContent = score;
  highScoreValue.textContent = Math.max(score, getHighScore());
  levelValue.textContent = `${level}/5 · ${levelProgress}/${LEVEL_TARGETS[level - 1]}`;
  healthValue.textContent = `${"♥ ".repeat(Math.max(health, 0)).trim()}${" ♡".repeat(Math.max(3 - health, 0))}`;
  healthValue.setAttribute("aria-label", `${health} máu`);
}

function saveHighScore() {
  const key = `snake-high-score-${selectedMode}`;
  if (score > loadNumber(key)) localStorage.setItem(key, String(score));
  updateHud();
}

function setMode(mode) {
  if (state === "running") return;
  if (state === "paused") chooseModeScreen();
  selectedMode = mode;
  document.querySelectorAll(".mode-option").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  modeTip.textContent = MODE_COPY[mode];
  levelHud.hidden = mode === "endless";
  healthHud.hidden = mode === "endless";
  highScoreValue.textContent = getHighScore();
}

function resetSnake() {
  snake = [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
    { x: 5, y: 12 },
  ];
  direction = DIRECTIONS.right;
  queuedDirection = DIRECTIONS.right;
  growthPending = 0;
}

function foodContains(cell) {
  if (!food) return false;
  const width = food.width || 1;
  const height = food.height || 1;
  return cell.x >= food.x && cell.x < food.x + width && cell.y >= food.y && cell.y < food.y + height;
}

function cellIsFree(cell, includeFood = true) {
  const onSnake = snake.some((part) => sameCell(part, cell));
  const onObstacle = obstacles.some((obstacle) => sameCell(obstacle, cell));
  const onFood = includeFood && foodContains(cell);
  return !onSnake && !onObstacle && !onFood && !sameCell(specialItem, cell);
}

function getFreeCell(includeFood = true) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const cell = { x: randomInt(GRID_SIZE), y: randomInt(GRID_SIZE) };
    if (cellIsFree(cell, includeFood)) return cell;
  }
  return { x: 2, y: 2 };
}

function getFreeBlock(size) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const origin = { x: randomInt(GRID_SIZE - size + 1), y: randomInt(GRID_SIZE - size + 1) };
    const cells = [];
    for (let offsetY = 0; offsetY < size; offsetY += 1) {
      for (let offsetX = 0; offsetX < size; offsetX += 1) {
        cells.push({ x: origin.x + offsetX, y: origin.y + offsetY });
      }
    }
    if (cells.every((cell) => cellIsFree(cell))) return { origin, cells };
  }
  return null;
}

function spawnFood() {
  const isMega = selectedMode === "surprise" && effects.triple > Date.now();
  if (isMega) {
    const block = getFreeBlock(2);
    if (block) {
      food = { ...block.origin, width: 2, height: 2, growth: 4, multiplier: 3 };
      return;
    }
  }
  food = { ...getFreeCell(false), width: 1, height: 1, growth: 1, multiplier: 1 };
}

function syncFoodSize() {
  if (!food || selectedMode !== "surprise") return;
  const shouldBeMega = effects.triple > Date.now();
  const isMega = food.width === 2;
  if (shouldBeMega === isMega) return;
  food = null;
  spawnFood();
}

function obstaclePlan(currentLevel) {
  const plans = [
    { spike: 3 },
    { spike: 4, fire: 3 },
    { spike: 3, fire: 4, cat: 2 },
    { spike: 4, fire: 4, cat: 2, wall: 5, mud: 4 },
    { spike: 5, fire: 5, cat: 3, wall: 7, mud: 5, rock: 2 },
  ];
  return plans[currentLevel - 1];
}

function createObstacles() {
  obstacles = [];
  if (selectedMode === "endless") return;

  const plan = obstaclePlan(level);
  Object.entries(plan).forEach(([type, amount]) => {
    for (let index = 0; index < amount; index += 1) {
      const obstacle = getFreeCell(false);
      if (obstacle.x >= 4 && obstacle.x <= 11 && obstacle.y >= 10 && obstacle.y <= 14) {
        index -= 1;
        continue;
      }
      obstacles.push({
        ...obstacle,
        type,
        dx: type === "rock" ? (Math.random() > 0.5 ? 1 : -1) : 0,
      });
    }
  });

  const clusterCount = level >= 4 ? 2 : 1;
  for (let index = 0; index < clusterCount; index += 1) {
    if (Math.random() < 0.42 + level * 0.09) createLargeObstacleCluster(index);
  }
}

function createLargeObstacleCluster(clusterIndex) {
  const size = level >= 4 && Math.random() < 0.42 ? 3 : 2;
  const types = level >= 3 ? ["wall", "mud", "spike"] : ["wall", "mud"];
  const type = types[randomInt(types.length)];

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const origin = { x: randomInt(GRID_SIZE - size + 1), y: randomInt(GRID_SIZE - size + 1) };
    const cells = [];
    for (let offsetY = 0; offsetY < size; offsetY += 1) {
      for (let offsetX = 0; offsetX < size; offsetX += 1) {
        cells.push({ x: origin.x + offsetX, y: origin.y + offsetY });
      }
    }
    const nearStart = cells.some((cell) => cell.x >= 3 && cell.x <= 12 && cell.y >= 9 && cell.y <= 15);
    if (nearStart || !cells.every((cell) => cellIsFree(cell, false))) continue;
    cells.forEach((cell) => obstacles.push({
      ...cell,
      type,
      dx: 0,
      large: true,
      clusterId: `${level}-${clusterIndex}-${origin.x}-${origin.y}`,
    }));
    return;
  }
}

function startGame() {
  window.clearTimeout(loopTimer);
  messageActions = { primary: null, secondary: null, tertiary: null };
  state = "running";
  score = 0;
  scoreAtLevelStart = 0;
  level = 1;
  levelProgress = 0;
  health = 3;
  tickCount = 0;
  specialItem = null;
  food = null;
  effects = { phase: 0, boost: 0, magnet: 0, triple: 0, shield: false };
  resetSnake();
  obstacles = [];
  createObstacles();
  spawnFood();
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  startButton.querySelector("span").textContent = "Đang chơi";
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  restartButton.disabled = false;
  levelHud.hidden = selectedMode === "endless";
  healthHud.hidden = selectedMode === "endless";
  updateHud();
  draw();
  scheduleTick();
}

function restartCurrentLevel() {
  window.clearTimeout(loopTimer);
  messageActions = { primary: null, secondary: null, tertiary: null };
  state = "running";
  score = scoreAtLevelStart;
  levelProgress = 0;
  health = 3;
  tickCount = 0;
  specialItem = null;
  food = null;
  effects = { phase: 0, boost: 0, magnet: 0, triple: 0, shield: false };
  resetSnake();
  createObstacles();
  spawnFood();
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  startButton.querySelector("span").textContent = "Đang chơi";
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  restartButton.disabled = false;
  updateHud();
  draw();
  scheduleTick();
}

function scheduleTick() {
  window.clearTimeout(loopTimer);
  if (state !== "running") return;
  const now = Date.now();
  let delay = selectedMode === "endless" ? 126 : Math.max(82, 132 - level * 7);
  if (effects.boost > now) delay *= 0.67;
  const onMud = obstacles.some((item) => item.type === "mud" && sameCell(item, snake[0]));
  if (onMud) delay *= 1.65;
  loopTimer = window.setTimeout(gameTick, delay);
}

function gameTick() {
  if (state !== "running") return;
  tickCount += 1;
  direction = queuedDirection;
  syncFoodSize();

  if (selectedMode === "surprise" && !specialItem && tickCount % 42 === 0) spawnSpecialItem();
  if (tickCount % 5 === 0) moveRocks();

  const nextHead = {
    x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
    y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
  };

  if (!handleSelfCollision(nextHead) || !handleObstacleCollision(nextHead)) {
    scheduleTick();
    return;
  }

  snake.unshift(nextHead);
  if (foodContains(nextHead)) eatFood();
  if (sameCell(nextHead, specialItem)) collectSpecialItem();

  if (growthPending > 0) growthPending -= 1;
  else snake.pop();

  applyMagnet();
  renderEffects();
  draw();
  scheduleTick();
}

function handleSelfCollision(nextHead) {
  const collisionIndex = snake.findIndex((part, index) => index > 0 && sameCell(part, nextHead));
  if (collisionIndex < 0) return true;

  if (selectedMode === "surprise") {
    snake = snake.slice(0, Math.max(2, collisionIndex));
    score = Math.max(0, score - 1);
    updateHud();
    return true;
  }

  if (consumeProtection()) return true;
  endGame("Bạn đã tự cắn trúng mình.");
  return false;
}

function handleObstacleCollision(nextHead) {
  const obstacle = obstacles.find((item) => sameCell(item, nextHead));
  if (!obstacle) return true;
  if (effects.phase > Date.now()) return true;

  if (obstacle.type === "fire") {
    health -= 1;
    updateHud();
    if (health <= 0) {
      endGame("Rắn đã hết máu khi đi qua lửa.");
      return false;
    }
    return true;
  }

  if (obstacle.type === "mud") return true;
  if (consumeProtection()) {
    obstacles = obstacles.filter((item) => item !== obstacle);
    return true;
  }

  const names = { spike: "gai", cat: "mèo", wall: "tường đá", rock: "đá lăn" };
  endGame(`Rắn đã va vào ${names[obstacle.type] || "chướng ngại vật"}.`);
  return false;
}

function consumeProtection() {
  if (!effects.shield) return false;
  effects.shield = false;
  renderEffects();
  return true;
}

function eatFood() {
  const multiplier = food.multiplier || 1;
  const growth = food.growth || 1;
  score += multiplier;
  growthPending += growth;
  levelProgress += 1;
  saveHighScore();

  if (selectedMode !== "endless" && levelProgress >= LEVEL_TARGETS[level - 1]) {
    if (level === 5) {
      winGame();
      return;
    }
    completeLevel();
    return;
  }
  spawnFood();
}

function completeLevel() {
  state = "level-complete";
  window.clearTimeout(loopTimer);
  showMessage("✓", `Hoàn thành level ${level}`, `Điểm hiện tại: ${score}. Nhấn Space hoặc Enter để sang level tiếp.`, [
    { label: "Sang level tiếp", action: nextLevel, primary: true },
    { label: "Chọn chế độ", action: chooseModeScreen },
  ]);
}

function nextLevel() {
  level += 1;
  scoreAtLevelStart = score;
  levelProgress = 0;
  health = Math.min(3, health + 1);
  specialItem = null;
  food = null;
  resetSnake();
  createObstacles();
  spawnFood();
  state = "running";
  messageOverlay.hidden = true;
  updateHud();
  draw();
  scheduleTick();
}

function winGame() {
  state = "finished";
  saveHighScore();
  window.clearTimeout(loopTimer);
  showMessage("★", "Bạn đã chinh phục 5 level!", `Tổng điểm: ${score}. Nhấn Space hoặc Enter để chơi lại từ đầu.`, [
    { label: "Lại từ đầu", action: startGame, primary: true },
    { label: "Chọn chế độ", action: chooseModeScreen },
  ]);
  resetControlsAfterGame();
}

function endGame(reason) {
  state = "finished";
  saveHighScore();
  window.clearTimeout(loopTimer);
  const actions = selectedMode === "endless"
    ? [
        { label: "Chơi lại", action: startGame, primary: true },
        { label: "Chọn chế độ", action: chooseModeScreen },
      ]
    : [
        { label: "Chơi lại màn", action: restartCurrentLevel, primary: true },
        { label: "Lại từ đầu", action: startGame },
        { label: "Chọn chế độ", action: chooseModeScreen },
      ];
  showMessage("×", "Kết thúc lượt", `${reason} Bạn đạt ${score} điểm. Nhấn Space hoặc Enter để chơi lại màn.`, actions);
  resetControlsAfterGame();
}

function resetControlsAfterGame() {
  startButton.disabled = false;
  startButton.querySelector("span").textContent = "Bắt đầu chơi";
  pauseButton.disabled = true;
  pauseButton.dataset.state = "pause";
}

function showMessage(icon, title, text, actions) {
  messageIcon.textContent = icon;
  messageTitle.textContent = title;
  messageText.textContent = text;
  const buttons = [messagePrimary, messageSecondary, messageTertiary];
  const actionKeys = ["primary", "secondary", "tertiary"];
  messageActions = { primary: null, secondary: null, tertiary: null };
  buttons.forEach((button, index) => {
    const config = actions[index];
    button.hidden = !config;
    button.classList.toggle("button--primary", Boolean(config?.primary));
    button.classList.toggle("button--secondary", !config?.primary);
    if (!config) return;
    button.textContent = config.label;
    messageActions[actionKeys[index]] = config.action;
  });
  messageOverlay.hidden = false;
}

function runMessageAction(key) {
  const action = messageActions[key];
  messageActions = { primary: null, secondary: null, tertiary: null };
  action?.();
}

function togglePause() {
  if (state === "running") {
    state = "paused";
    window.clearTimeout(loopTimer);
    showMessage("Ⅱ", "Tạm dừng", "Tiếp tục ván chơi hoặc chọn một chế độ khác.", [
      { label: "Tiếp tục", action: togglePause, primary: true },
      { label: "Chọn chế độ", action: chooseModeScreen },
    ]);
    pauseButton.setAttribute("aria-label", "Tiếp tục");
    pauseButton.dataset.state = "play";
  } else if (state === "paused") {
    state = "running";
    messageActions = { primary: null, secondary: null, tertiary: null };
    messageOverlay.hidden = true;
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    pauseButton.dataset.state = "pause";
    scheduleTick();
  }
}

function spawnSpecialItem() {
  const types = Object.keys(ITEM_DEFINITIONS);
  const type = types[randomInt(types.length)];
  specialItem = { ...getFreeCell(), type, expiresAt: Date.now() + 9000 };
}

function collectSpecialItem() {
  const type = specialItem.type;
  const definition = ITEM_DEFINITIONS[type];
  if (type === "shield") effects.shield = true;
  else if (type === "heart") health = Math.min(3, health + 1);
  else effects[type] = Date.now() + definition.duration;
  specialItem = null;
  if (type === "triple") {
    food = null;
    spawnFood();
  }
  updateHud();
  renderEffects();
}

function applyMagnet() {
  if (effects.magnet <= Date.now() || !food || food.width > 1) return;
  const head = snake[0];
  const distance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
  if (distance > 7 || distance < 2) return;
  const nextFood = { ...food };
  if (head.x !== food.x) nextFood.x += head.x > food.x ? 1 : -1;
  else if (head.y !== food.y) nextFood.y += head.y > food.y ? 1 : -1;
  if (cellIsFree(nextFood, false)) food = nextFood;
}

function moveRocks() {
  obstacles.forEach((rock) => {
    if (rock.type !== "rock") return;
    const nextX = (rock.x + rock.dx + GRID_SIZE) % GRID_SIZE;
    const blocked = obstacles.some((item) => item !== rock && item.x === nextX && item.y === rock.y);
    if (blocked) rock.dx *= -1;
    else rock.x = nextX;
  });
}

function renderEffects() {
  const now = Date.now();
  const active = [];
  if (effects.shield) active.push("Khiên 1 lần");
  ["phase", "boost", "magnet", "triple"].forEach((type) => {
    if (effects[type] > now) {
      const seconds = Math.ceil((effects[type] - now) / 1000);
      active.push(`${ITEM_DEFINITIONS[type].label} ${seconds}s`);
    }
  });
  effectBar.replaceChildren(...active.map((label) => {
    const element = document.createElement("span");
    element.className = "effect-pill";
    element.textContent = label;
    return element;
  }));
}

function setDirection(name) {
  const next = DIRECTIONS[name];
  if (!next || isOpposite(next, direction)) return;
  queuedDirection = next;
}

function draw() {
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  obstacles.forEach(drawObstacle);
  if (food) drawFood(food);
  if (specialItem) {
    if (specialItem.expiresAt < Date.now()) specialItem = null;
    else drawSpecialItem(specialItem);
  }
  drawSnake();
}

function roundedCell(x, y, inset, radius, color) {
  const positionX = x * CELL_SIZE + inset;
  const positionY = y * CELL_SIZE + inset;
  const size = CELL_SIZE - inset * 2;
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(positionX, positionY, size, size, radius);
  context.fill();
}

function drawSnake() {
  snake.slice().reverse().forEach((part, reverseIndex) => {
    const originalIndex = snake.length - reverseIndex - 1;
    const alpha = Math.max(0.46, 1 - originalIndex * 0.018);
    context.globalAlpha = alpha;
    roundedCell(part.x, part.y, 2.5, originalIndex === 0 ? 9 : 7, BRAND_COLOR);
  });
  context.globalAlpha = 1;
  const head = snake[0];
  if (!head) return;
  context.fillStyle = "#063c2c";
  const eyeOffset = direction.x !== 0
    ? [{ x: direction.x > 0 ? 21 : 7, y: 9 }, { x: direction.x > 0 ? 21 : 7, y: 20 }]
    : [{ x: 9, y: direction.y > 0 ? 21 : 7 }, { x: 20, y: direction.y > 0 ? 21 : 7 }];
  eyeOffset.forEach((eye) => {
    context.beginPath();
    context.arc(head.x * CELL_SIZE + eye.x, head.y * CELL_SIZE + eye.y, 2.2, 0, Math.PI * 2);
    context.fill();
  });
}

function drawFood(item) {
  const isMega = item.width === 2;
  const centerX = item.x * CELL_SIZE + (item.width || 1) * CELL_SIZE / 2;
  const centerY = item.y * CELL_SIZE + (item.height || 1) * CELL_SIZE / 2;
  const radius = isMega ? 24 : 9;
  context.fillStyle = isMega ? "#7c3aed" : "#ef4444";
  context.beginPath();
  context.arc(centerX, centerY + 1, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#087f5b";
  context.beginPath();
  context.ellipse(centerX + 5, centerY - radius + 1, 5, 2.5, -0.5, 0, Math.PI * 2);
  context.fill();
  if (isMega) {
    context.fillStyle = "#fff";
    context.font = "800 16px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("x3", centerX, centerY + 1);
  }
}

function drawObstacle(item) {
  const x = item.x * CELL_SIZE;
  const y = item.y * CELL_SIZE;
  context.save();
  if (item.type === "spike") {
    context.fillStyle = "#e34c4c";
    context.beginPath();
    context.moveTo(x + 3, y + 26);
    context.lineTo(x + 9, y + 7);
    context.lineTo(x + 15, y + 26);
    context.lineTo(x + 21, y + 7);
    context.lineTo(x + 27, y + 26);
    context.closePath();
    context.fill();
  } else if (item.type === "fire") {
    context.fillStyle = "#f97316";
    context.beginPath();
    context.moveTo(x + 15, y + 3);
    context.bezierCurveTo(x + 27, y + 14, x + 23, y + 28, x + 15, y + 28);
    context.bezierCurveTo(x + 4, y + 28, x + 5, y + 15, x + 12, y + 10);
    context.bezierCurveTo(x + 12, y + 16, x + 18, y + 15, x + 15, y + 3);
    context.fill();
    context.fillStyle = "#fde047";
    context.beginPath();
    context.arc(x + 15, y + 21, 5, 0, Math.PI * 2);
    context.fill();
  } else if (item.type === "cat") {
    context.fillStyle = "#475569";
    context.beginPath();
    context.moveTo(x + 5, y + 9); context.lineTo(x + 5, y + 3); context.lineTo(x + 11, y + 7);
    context.lineTo(x + 19, y + 7); context.lineTo(x + 25, y + 3); context.lineTo(x + 25, y + 9);
    context.arc(x + 15, y + 16, 11, -0.5, Math.PI + 0.5); context.fill();
    context.fillStyle = "#fff";
    context.fillRect(x + 10, y + 14, 3, 3); context.fillRect(x + 19, y + 14, 3, 3);
  } else if (item.type === "wall") {
    roundedCell(item.x, item.y, item.large ? 0 : 2, item.large ? 0 : 3, "#64748b");
    context.strokeStyle = "rgba(255,255,255,.45)";
    context.lineWidth = 1;
    context.beginPath(); context.moveTo(x + 4, y + 15); context.lineTo(x + 26, y + 15); context.moveTo(x + 15, y + 4); context.lineTo(x + 15, y + 15); context.stroke();
  } else if (item.type === "mud") {
    context.fillStyle = "#8b6f47";
    context.beginPath(); context.ellipse(x + 15, y + 18, 13, 8, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#b49362";
    context.beginPath(); context.arc(x + 10, y + 16, 2, 0, Math.PI * 2); context.arc(x + 20, y + 20, 2.5, 0, Math.PI * 2); context.fill();
  } else if (item.type === "rock") {
    context.fillStyle = "#94a3b8";
    context.beginPath();
    context.moveTo(x + 6, y + 24); context.lineTo(x + 3, y + 13); context.lineTo(x + 10, y + 4); context.lineTo(x + 23, y + 7); context.lineTo(x + 27, y + 19); context.lineTo(x + 20, y + 27); context.closePath(); context.fill();
  }
  context.restore();
}

function drawSpecialItem(item) {
  const centerX = item.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = item.y * CELL_SIZE + CELL_SIZE / 2;
  context.save();
  context.translate(centerX, centerY);
  context.rotate(Math.PI / 4);
  context.fillStyle = ITEM_DEFINITIONS[item.type].color;
  context.fillRect(-10, -10, 20, 20);
  context.restore();
  context.fillStyle = "#fff";
  context.font = "800 10px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(ITEM_DEFINITIONS[item.type].short, centerX, centerY);
}

function chooseModeScreen() {
  if (state === "running" || state === "paused") window.clearTimeout(loopTimer);
  state = "idle";
  messageActions = { primary: null, secondary: null, tertiary: null };
  messageOverlay.hidden = true;
  introOverlay.hidden = false;
  pauseButton.disabled = true;
  pauseButton.dataset.state = "pause";
  restartButton.disabled = true;
  startButton.disabled = false;
  startButton.querySelector("span").textContent = "Bắt đầu chơi";
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  themeButton.setAttribute("aria-label", theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối");
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#080c0b" : "#f7faf9";
  localStorage.setItem("snake-theme", theme);
}

modeList.addEventListener("click", (event) => {
  const button = event.target.closest(".mode-option");
  if (button) setMode(button.dataset.mode);
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startGame);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));
messageTertiary.addEventListener("click", () => runMessageAction("tertiary"));

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  if ((event.key === " " || event.key === "Enter") && ["finished", "level-complete"].includes(state)) {
    event.preventDefault();
    runMessageAction("primary");
    return;
  }
  const keyMap = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
  };
  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
  }
  if ((event.key === " " || event.key.toLowerCase() === "p") && ["running", "paused"].includes(state)) {
    event.preventDefault();
    togglePause();
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("pointerdown", () => setDirection(button.dataset.direction));
});

board.addEventListener("pointerdown", (event) => {
  touchStart = { x: event.clientX, y: event.clientY };
});

board.addEventListener("pointerup", (event) => {
  if (!touchStart) return;
  const deltaX = event.clientX - touchStart.x;
  const deltaY = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) setDirection(deltaX > 0 ? "right" : "left");
  else setDirection(deltaY > 0 ? "down" : "up");
});

themeButton.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

document.querySelector("#helpButton").addEventListener("click", () => helpDialog.showModal());
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "running") togglePause();
});

const savedTheme = localStorage.getItem("snake-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme);
setMode("endless");
updateHud();
