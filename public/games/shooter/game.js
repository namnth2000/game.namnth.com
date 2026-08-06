"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const board = document.querySelector("#board");
const modeList = document.querySelector("#modeList");
const campaignLabel = document.querySelector("#campaignLabel");
const campaignTrack = document.querySelector("#campaignTrack");
const levelHint = document.querySelector("#levelHint");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const scoreValue = document.querySelector("#scoreValue");
const highScoreValue = document.querySelector("#highScoreValue");
const targetValue = document.querySelector("#targetValue");
const healthValue = document.querySelector("#healthValue");
const introOverlay = document.querySelector("#introOverlay");
const messageOverlay = document.querySelector("#messageOverlay");
const messageIcon = document.querySelector("#messageIcon");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const messageTertiary = document.querySelector("#messageTertiary");
const effectBar = document.querySelector("#effectBar");
const itemToast = document.querySelector("#itemToast");
const helpDialog = document.querySelector("#helpDialog");

const GAME_WIDTH = 720;
const GAME_HEIGHT = 900;
const BRAND_COLOR = "#10b981";
const TAU = Math.PI * 2;

const LEVELS = [
  { target: 12, spawn: 900, speed: 132, hint: "Làm quen với sao băng và nhịp bắn." },
  { target: 16, spawn: 840, speed: 148, hint: "Tiểu hành tinh cần nhiều phát bắn hơn." },
  { target: 19, spawn: 790, speed: 164, hint: "Mảnh vỡ vệ tinh có quỹ đạo khó đoán." },
  { target: 22, spawn: 745, speed: 178, hint: "Chiến cơ địch bắt đầu phản công." },
  { target: 25, spawn: 700, speed: 194, hint: "Mìn không gian sẽ phát nổ khi đến gần." },
  { target: 29, spawn: 650, speed: 208, hint: "Các hiểm họa xuất hiện thành cụm." },
  { target: 33, spawn: 605, speed: 224, hint: "Đạn địch nhanh hơn và dày hơn." },
  { target: 37, spawn: 560, speed: 240, hint: "Giữ vị trí, đừng đuổi theo vật phẩm." },
  { target: 42, spawn: 515, speed: 258, hint: "Tận dụng Lazer để mở đường thẳng." },
  { target: 50, spawn: 470, speed: 280, hint: "Toàn bộ hiểm họa đã đạt tốc độ tối đa." },
];

const ITEM_DEFINITIONS = {
  laser: { label: "Lazer", short: "L", color: "#14b8a6", duration: 5000 },
  triple: { label: "x3 tia", short: "×3", color: "#3b82f6", duration: 10000 },
  blast: { label: "Đạn nổ", short: "✦", color: "#f97316", duration: 10000 },
  shield: { label: "Khiên", short: "◇", color: "#8b5cf6", duration: 8000 },
  repair: { label: "Drone sửa chữa", short: "+", color: "#e11d48", duration: 0 },
  slow: { label: "Làm chậm", short: "T", color: "#0284c7", duration: 7000 },
};

const HAZARD_POINTS = { meteor: 80, asteroid: 140, enemy: 180, mine: 120, debris: 110 };
const keys = { left: false, right: false, up: false, down: false, fire: false };

let selectedMode = "campaign";
let state = "idle";
let level = 1;
let score = 0;
let scoreAtLevelStart = 0;
let defeated = 0;
let highScore = Number(localStorage.getItem("shooter-high-score")) || 0;
let frameId = 0;
let lastTime = 0;
let spawnElapsed = 0;
let surpriseItemElapsed = 0;
let lastShotAt = 0;
let lastEffectText = "";
let toastTimer = 0;
let dragging = false;
let helpPausedGame = false;
let messageActions = { primary: null, secondary: null, tertiary: null };

let player = createPlayer();
let stars = createStars();
let hazards = [];
let projectiles = [];
let enemyProjectiles = [];
let items = [];
let particles = [];
let effects = createEffects();

function createPlayer() {
  return { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 105, width: 52, height: 66, speed: 390, health: 3, maxHealth: 3, hitUntil: 0 };
}

function createEffects() {
  return { laser: 0, triple: 0, blast: 0, shield: 0, slow: 0 };
}

function createStars() {
  return Array.from({ length: 72 }, (_, index) => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    radius: index % 9 === 0 ? 1.8 : index % 3 === 0 ? 1.2 : .7,
    speed: 18 + Math.random() * 54,
    alpha: .25 + Math.random() * .55,
  }));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function setMode(mode) {
  if (state !== "idle" || !["campaign", "surprise"].includes(mode)) return;
  selectedMode = mode;
  modeList.querySelectorAll(".shooter-mode__option").forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  startButton.querySelector("span").textContent = mode === "surprise" ? "Bắt đầu bất ngờ" : "Bắt đầu nhiệm vụ";
  updateCampaign();
}

function setModeControlsDisabled(disabled) {
  modeList.querySelectorAll("button").forEach((button) => { button.disabled = disabled; });
}

function updateCampaign() {
  campaignLabel.textContent = `Màn ${String(level).padStart(2, "0")} / 10`;
  levelHint.textContent = selectedMode === "surprise"
    ? `${LEVELS[level - 1].hint} Vật phẩm xuất hiện thường xuyên hơn.`
    : LEVELS[level - 1].hint;
  campaignTrack.querySelectorAll("li").forEach((item, index) => {
    item.classList.toggle("is-complete", index < level - 1);
    item.classList.toggle("is-current", index === level - 1);
  });
}

function updateHud() {
  const target = LEVELS[level - 1].target;
  scoreValue.textContent = score.toLocaleString("vi-VN");
  highScoreValue.textContent = highScore.toLocaleString("vi-VN");
  targetValue.textContent = `${Math.min(defeated, target)}/${target}`;
  healthValue.textContent = `${player.health}/${player.maxHealth}`;
  healthValue.classList.toggle("is-critical", player.health === 1);
  updateCampaign();
}

function saveHighScore() {
  if (score <= highScore) return;
  highScore = score;
  localStorage.setItem("shooter-high-score", String(highScore));
}

function resetLevel() {
  player = createPlayer();
  hazards = [];
  projectiles = [];
  enemyProjectiles = [];
  items = [];
  particles = [];
  effects = createEffects();
  defeated = 0;
  spawnElapsed = 0;
  surpriseItemElapsed = 0;
  lastShotAt = 0;
  lastEffectText = "";
  effectBar.replaceChildren();
}

function startGame() {
  window.cancelAnimationFrame(frameId);
  level = 1;
  score = 0;
  scoreAtLevelStart = 0;
  resetLevel();
  enterRunningState();
}

function restartLevel() {
  window.cancelAnimationFrame(frameId);
  score = scoreAtLevelStart;
  resetLevel();
  enterRunningState();
}

function enterRunningState() {
  state = "running";
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "Đang chiến đấu";
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  restartButton.disabled = false;
  setModeControlsDisabled(true);
  updateHud();
  lastTime = performance.now();
  frameId = window.requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (state !== "running") return;
  const delta = Math.min((timestamp - lastTime) / 1000, .034);
  lastTime = timestamp;
  update(delta, timestamp);
  draw(timestamp);
  if (state === "running") frameId = window.requestAnimationFrame(gameLoop);
}

function update(delta, timestamp) {
  updateStars(delta);
  updatePlayer(delta, timestamp);
  updateSpawning(delta);
  updateProjectiles(delta);
  updateHazards(delta, timestamp);
  updateEnemyProjectiles(delta);
  updateItems(delta);
  updateParticles(delta);
  applyLaser(delta, timestamp);
  checkProjectileHits();
  checkPlayerHits(timestamp);
  renderEffects(timestamp);
}

function updateStars(delta) {
  stars.forEach((star) => {
    star.y += star.speed * delta;
    if (star.y > GAME_HEIGHT + 3) {
      star.y = -3;
      star.x = Math.random() * GAME_WIDTH;
    }
  });
}

function updatePlayer(delta, timestamp) {
  let horizontal = Number(keys.right) - Number(keys.left);
  let vertical = Number(keys.down) - Number(keys.up);
  if (horizontal && vertical) {
    horizontal *= .707;
    vertical *= .707;
  }
  player.x = clamp(player.x + horizontal * player.speed * delta, 34, GAME_WIDTH - 34);
  player.y = clamp(player.y + vertical * player.speed * delta, 80, GAME_HEIGHT - 42);
  if (keys.fire) fire(timestamp);
}

function updateSpawning(delta) {
  const levelConfig = LEVELS[level - 1];
  spawnElapsed += delta * 1000;
  if (spawnElapsed >= levelConfig.spawn) {
    spawnElapsed = 0;
    spawnHazard();
    if (level >= 6 && Math.random() < .12 + level * .012) spawnHazard();
  }

  if (selectedMode === "surprise") {
    surpriseItemElapsed += delta * 1000;
    if (surpriseItemElapsed >= 5200) {
      surpriseItemElapsed = 0;
      if (items.length < 2) spawnItem(randomBetween(55, GAME_WIDTH - 55), -24);
    }
  }
}

function availableHazardTypes() {
  const types = ["meteor"];
  if (level >= 2) types.push("asteroid");
  if (level >= 3) types.push("debris");
  if (level >= 4) types.push("enemy");
  if (level >= 5) types.push("mine");
  return types;
}

function spawnHazard() {
  const types = availableHazardTypes();
  const type = types[Math.floor(Math.random() * types.length)];
  const baseSpeed = LEVELS[level - 1].speed;
  const x = randomBetween(55, GAME_WIDTH - 55);
  const common = { type, x, y: -55, rotation: Math.random() * TAU, dead: false };

  if (type === "meteor") hazards.push({ ...common, width: 36, height: 48, hp: 1, maxHp: 1, vx: randomBetween(-48, 48), vy: baseSpeed * 1.35 });
  if (type === "asteroid") hazards.push({ ...common, width: 56, height: 56, hp: 2 + Math.floor(level / 5), maxHp: 2 + Math.floor(level / 5), vx: randomBetween(-26, 26), vy: baseSpeed * .78 });
  if (type === "debris") hazards.push({ ...common, width: 76, height: 22, hp: 2, maxHp: 2, vx: randomBetween(-105, 105), vy: baseSpeed * .9 });
  if (type === "enemy") hazards.push({ ...common, width: 50, height: 54, hp: 2 + Math.floor(level / 4), maxHp: 2 + Math.floor(level / 4), vx: randomBetween(-90, 90), vy: baseSpeed * .42, fireElapsed: randomBetween(400, 1200) });
  if (type === "mine") hazards.push({ ...common, width: 43, height: 43, hp: 1, maxHp: 1, vx: randomBetween(-36, 36), vy: baseSpeed * .62, pulse: Math.random() * TAU });
}

function updateHazards(delta, timestamp) {
  const slowFactor = effects.slow > timestamp ? .48 : 1;
  hazards.forEach((hazard) => {
    hazard.x += hazard.vx * delta * slowFactor;
    hazard.y += hazard.vy * delta * slowFactor;
    if (hazard.type === "debris") hazard.rotation += delta * 2.4;
    if (hazard.type === "asteroid" || hazard.type === "mine") hazard.rotation += delta * .8;

    if (hazard.type === "enemy") {
      if (hazard.x < 40 || hazard.x > GAME_WIDTH - 40) hazard.vx *= -1;
      hazard.fireElapsed += delta * 1000 * slowFactor;
      const fireDelay = Math.max(680, 1550 - level * 75);
      if (hazard.y > 40 && hazard.fireElapsed >= fireDelay) {
        hazard.fireElapsed = 0;
        fireEnemyProjectile(hazard);
      }
    }

    if (hazard.type === "mine") {
      hazard.pulse += delta * 4;
      if (Math.hypot(player.x - hazard.x, player.y - hazard.y) < 72) {
        hazard.dead = true;
        damagePlayer(timestamp, 2);
        createParticles(hazard.x, hazard.y, "#fb7185", 20);
      }
    }
    if (hazard.x < -90 || hazard.x > GAME_WIDTH + 90 || hazard.y > GAME_HEIGHT + 90) hazard.dead = true;
  });
  hazards = hazards.filter((hazard) => !hazard.dead);
}

function fire(timestamp) {
  const delay = effects.triple > timestamp ? 135 : 185;
  if (timestamp - lastShotAt < delay) return;
  lastShotAt = timestamp;
  const explosive = effects.blast > timestamp;
  const createShot = (velocityX, offsetX = 0) => projectiles.push({
    x: player.x + offsetX,
    y: player.y - player.height * .45,
    vx: velocityX,
    vy: -720,
    radius: explosive ? 7 : 4,
    damage: explosive ? 3 : 1,
    explosive,
    dead: false,
  });
  createShot(0);
  if (effects.triple > timestamp) {
    createShot(-150, -9);
    createShot(150, 9);
  }
}

function fireEnemyProjectile(hazard) {
  const angle = Math.atan2(player.y - hazard.y, player.x - hazard.x);
  const speed = 220 + level * 13;
  enemyProjectiles.push({ x: hazard.x, y: hazard.y + 24, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 6, dead: false });
}

function updateProjectiles(delta) {
  projectiles.forEach((projectile) => {
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;
    if (projectile.y < -24 || projectile.x < -24 || projectile.x > GAME_WIDTH + 24) projectile.dead = true;
  });
  projectiles = projectiles.filter((projectile) => !projectile.dead);
}

function updateEnemyProjectiles(delta) {
  enemyProjectiles.forEach((projectile) => {
    projectile.x += projectile.vx * delta;
    projectile.y += projectile.vy * delta;
    if (projectile.y > GAME_HEIGHT + 20 || projectile.x < -20 || projectile.x > GAME_WIDTH + 20) projectile.dead = true;
  });
  enemyProjectiles = enemyProjectiles.filter((projectile) => !projectile.dead);
}

function updateItems(delta) {
  items.forEach((item) => {
    item.y += item.vy * delta;
    item.rotation += delta * 1.8;
    if (item.y > GAME_HEIGHT + 30) item.dead = true;
  });
  items = items.filter((item) => !item.dead);
}

function updateParticles(delta) {
  particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  });
  particles = particles.filter((particle) => particle.life > 0);
}

function applyLaser(delta, timestamp) {
  if (effects.laser <= timestamp) return;
  hazards.forEach((hazard) => {
    const halfWidth = hazard.width / 2;
    if (hazard.y < player.y && player.x > hazard.x - halfWidth - 15 && player.x < hazard.x + halfWidth + 15) {
      hazard.hp -= 7 * delta;
      if (hazard.hp <= 0) destroyHazard(hazard, false);
    }
  });
}

function checkProjectileHits() {
  projectiles.forEach((projectile) => {
    if (projectile.dead) return;
    const hazard = hazards.find((candidate) => !candidate.dead && pointHitsRect(projectile.x, projectile.y, projectile.radius, candidate));
    if (!hazard) return;
    projectile.dead = true;
    hazard.hp -= projectile.damage;
    if (projectile.explosive) createBlast(projectile.x, projectile.y, hazard);
    if (hazard.hp <= 0) destroyHazard(hazard, true);
  });
  projectiles = projectiles.filter((projectile) => !projectile.dead);
  hazards = hazards.filter((hazard) => !hazard.dead);
}

function createBlast(x, y, directHazard) {
  createParticles(x, y, "#fb923c", 14);
  hazards.forEach((hazard) => {
    if (hazard === directHazard || hazard.dead) return;
    if (Math.hypot(hazard.x - x, hazard.y - y) <= 105) {
      hazard.hp -= 2;
      if (hazard.hp <= 0) destroyHazard(hazard, false);
    }
  });
}

function destroyHazard(hazard, allowItemDrop) {
  if (hazard.dead || state !== "running") return;
  hazard.dead = true;
  score += HAZARD_POINTS[hazard.type] * level;
  defeated += 1;
  createParticles(hazard.x, hazard.y, hazard.type === "enemy" ? "#ef4444" : "#f59e0b", 10);
  const dropChance = selectedMode === "surprise" ? .38 : .13;
  if (allowItemDrop && Math.random() < dropChance) spawnItem(hazard.x, hazard.y);
  saveHighScore();
  updateHud();
  if (defeated >= LEVELS[level - 1].target) completeLevel();
}

function spawnItem(x, y) {
  const types = Object.keys(ITEM_DEFINITIONS);
  let type = types[Math.floor(Math.random() * types.length)];
  if (type === "repair" && player.health === player.maxHealth) type = Math.random() < .5 ? "shield" : "triple";
  items.push({ type, x: clamp(x, 28, GAME_WIDTH - 28), y, vy: 118, radius: 17, rotation: 0, dead: false });
}

function collectItem(item) {
  const definition = ITEM_DEFINITIONS[item.type];
  item.dead = true;
  if (item.type === "repair") player.health = Math.min(player.maxHealth, player.health + 1);
  else effects[item.type] = performance.now() + definition.duration;
  score += 60;
  saveHighScore();
  showItemToast(`${definition.label} đã kích hoạt`);
  updateHud();
  renderEffects(performance.now(), true);
}

function showItemToast(text) {
  window.clearTimeout(toastTimer);
  itemToast.textContent = text;
  itemToast.hidden = false;
  toastTimer = window.setTimeout(() => { itemToast.hidden = true; }, 1500);
}

function checkPlayerHits(timestamp) {
  items.forEach((item) => {
    if (!item.dead && circleHitsPlayer(item.x, item.y, item.radius)) collectItem(item);
  });
  items = items.filter((item) => !item.dead);

  hazards.forEach((hazard) => {
    if (!hazard.dead && rectsOverlap(playerRect(), hazardRect(hazard))) {
      hazard.dead = true;
      damagePlayer(timestamp, hazard.type === "mine" ? 2 : 1);
      createParticles(hazard.x, hazard.y, "#f97316", hazard.type === "mine" ? 20 : 12);
    }
  });
  enemyProjectiles.forEach((projectile) => {
    if (!projectile.dead && circleHitsPlayer(projectile.x, projectile.y, projectile.radius)) {
      projectile.dead = true;
      damagePlayer(timestamp, 1);
    }
  });
  hazards = hazards.filter((hazard) => !hazard.dead);
  enemyProjectiles = enemyProjectiles.filter((projectile) => !projectile.dead);
}

function damagePlayer(timestamp, amount) {
  if (effects.shield > timestamp || player.hitUntil > timestamp || state !== "running") return;
  player.health = Math.max(0, player.health - amount);
  player.hitUntil = timestamp + 1100;
  updateHud();
  if (player.health === 0) endGame();
}

function pointHitsRect(x, y, radius, rectangle) {
  return x + radius > rectangle.x - rectangle.width / 2
    && x - radius < rectangle.x + rectangle.width / 2
    && y + radius > rectangle.y - rectangle.height / 2
    && y - radius < rectangle.y + rectangle.height / 2;
}

function playerRect() {
  return { left: player.x - 19, right: player.x + 19, top: player.y - 28, bottom: player.y + 28 };
}

function hazardRect(hazard) {
  return { left: hazard.x - hazard.width * .42, right: hazard.x + hazard.width * .42, top: hazard.y - hazard.height * .42, bottom: hazard.y + hazard.height * .42 };
}

function rectsOverlap(first, second) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

function circleHitsPlayer(x, y, radius) {
  const rectangle = playerRect();
  const closestX = clamp(x, rectangle.left, rectangle.right);
  const closestY = clamp(y, rectangle.top, rectangle.bottom);
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function createParticles(x, y, color, amount) {
  for (let index = 0; index < amount; index += 1) {
    const angle = Math.random() * TAU;
    const speed = randomBetween(45, 190);
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: randomBetween(.2, .55), size: randomBetween(2, 5), color });
  }
}

function completeLevel() {
  if (state !== "running") return;
  state = "level-complete";
  window.cancelAnimationFrame(frameId);
  if (level === LEVELS.length) {
    finishCampaign();
    return;
  }
  showMessage("✓", `Hoàn thành màn ${level}`, `Quỹ đạo đã an toàn. Điểm hiện tại: ${score.toLocaleString("vi-VN")}.`, [
    { label: "Sang màn tiếp", action: nextLevel, primary: true },
    { label: "Chơi lại màn", action: restartLevel },
    { label: "Chọn chế độ", action: chooseModeScreen },
  ]);
}

function nextLevel() {
  const remainingHealth = player.health;
  level += 1;
  scoreAtLevelStart = score;
  resetLevel();
  player.health = Math.min(player.maxHealth, remainingHealth + 1);
  enterRunningState();
}

function finishCampaign() {
  state = "finished";
  saveHighScore();
  showMessage("★", "Hoàn tất hành trình", `Bạn đã vượt 10 màn với ${score.toLocaleString("vi-VN")} điểm.`, [
    { label: "Chơi lại từ đầu", action: startGame, primary: true },
    { label: "Chọn chế độ", action: chooseModeScreen },
  ]);
  resetControlsAfterGame();
}

function endGame() {
  if (state !== "running") return;
  state = "finished";
  window.cancelAnimationFrame(frameId);
  saveHighScore();
  showMessage("×", "Chiến cơ bị hạ", `Bạn đạt ${score.toLocaleString("vi-VN")} điểm tại màn ${level}.`, [
    { label: "Chơi lại màn", action: restartLevel, primary: true },
    { label: "Lại từ đầu", action: startGame },
    { label: "Chọn chế độ", action: chooseModeScreen },
  ]);
  resetControlsAfterGame();
}

function resetControlsAfterGame() {
  startButton.disabled = false;
  startButton.querySelector("span").textContent = "Chơi lại từ đầu";
  pauseButton.disabled = true;
  pauseButton.dataset.state = "pause";
  restartButton.disabled = false;
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
    if (!config) return;
    button.textContent = config.label;
    button.classList.toggle("button--primary", Boolean(config.primary));
    button.classList.toggle("button--secondary", !config.primary);
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
    window.cancelAnimationFrame(frameId);
    showMessage("Ⅱ", "Tạm dừng", "Nhiệm vụ đang được giữ nguyên.", [
      { label: "Tiếp tục", action: togglePause, primary: true },
      { label: "Chơi lại màn", action: restartLevel },
      { label: "Chọn chế độ", action: chooseModeScreen },
    ]);
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
  } else if (state === "paused") {
    state = "running";
    messageOverlay.hidden = true;
    pauseButton.dataset.state = "pause";
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    lastTime = performance.now();
    frameId = window.requestAnimationFrame(gameLoop);
  }
}

function chooseModeScreen() {
  window.cancelAnimationFrame(frameId);
  state = "idle";
  level = 1;
  score = 0;
  scoreAtLevelStart = 0;
  resetLevel();
  introOverlay.hidden = false;
  messageOverlay.hidden = true;
  startButton.disabled = false;
  startButton.querySelector("span").textContent = selectedMode === "surprise" ? "Bắt đầu bất ngờ" : "Bắt đầu nhiệm vụ";
  pauseButton.disabled = true;
  restartButton.disabled = true;
  setModeControlsDisabled(false);
  updateHud();
  draw(performance.now());
}

function renderEffects(timestamp, force = false) {
  const active = [];
  Object.entries(effects).forEach(([type, endTime]) => {
    if (endTime > timestamp) active.push(`${ITEM_DEFINITIONS[type].label} ${Math.ceil((endTime - timestamp) / 1000)}s`);
  });
  const effectText = active.join("|");
  if (!force && effectText === lastEffectText) return;
  lastEffectText = effectText;
  effectBar.replaceChildren(...active.map((label) => {
    const pill = document.createElement("span");
    pill.textContent = label;
    return pill;
  }));
}

function draw(timestamp) {
  drawBackground();
  items.forEach(drawItem);
  hazards.forEach(drawHazard);
  projectiles.forEach(drawPlayerProjectile);
  enemyProjectiles.forEach(drawEnemyProjectile);
  particles.forEach(drawParticle);
  if (effects.laser > timestamp && state === "running") drawLaser();
  drawPlayer(timestamp);
}

function drawBackground() {
  context.fillStyle = "#06110e";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const glow = context.createRadialGradient(GAME_WIDTH * .5, GAME_HEIGHT * .58, 20, GAME_WIDTH * .5, GAME_HEIGHT * .58, 510);
  glow.addColorStop(0, "rgba(16,185,129,.065)");
  glow.addColorStop(1, "rgba(16,185,129,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  stars.forEach((star) => {
    context.globalAlpha = star.alpha;
    context.fillStyle = "#d9fff0";
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, TAU);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawPlayer(timestamp) {
  if (player.hitUntil > timestamp && Math.floor(timestamp / 90) % 2 === 0) return;
  context.save();
  context.translate(player.x, player.y);
  context.fillStyle = "#075e46";
  context.beginPath();
  context.moveTo(-14, -8); context.lineTo(-34, 25); context.lineTo(-14, 18); context.closePath(); context.fill();
  context.beginPath();
  context.moveTo(14, -8); context.lineTo(34, 25); context.lineTo(14, 18); context.closePath(); context.fill();
  context.fillStyle = BRAND_COLOR;
  context.beginPath();
  context.moveTo(0, -34); context.lineTo(21, 24); context.lineTo(9, 32); context.lineTo(0, 22); context.lineTo(-9, 32); context.lineTo(-21, 24); context.closePath(); context.fill();
  context.fillStyle = "#99f6e4";
  context.beginPath();
  context.moveTo(0, -18); context.lineTo(7, 4); context.lineTo(-7, 4); context.closePath(); context.fill();
  context.fillStyle = "#f59e0b";
  context.fillRect(-10, 31, 7, randomBetween(8, 15));
  context.fillRect(3, 31, 7, randomBetween(8, 15));
  if (effects.shield > timestamp) {
    context.strokeStyle = "rgba(167,139,250,.9)";
    context.lineWidth = 4;
    context.beginPath(); context.arc(0, 0, 46, 0, TAU); context.stroke();
  }
  context.restore();
}

function drawPlayerProjectile(projectile) {
  context.fillStyle = projectile.explosive ? "#fb923c" : "#6ee7b7";
  context.fillRect(projectile.x - projectile.radius, projectile.y - 12, projectile.radius * 2, 22);
}

function drawEnemyProjectile(projectile) {
  context.fillStyle = "#fb7185";
  context.beginPath(); context.arc(projectile.x, projectile.y, projectile.radius, 0, TAU); context.fill();
  context.strokeStyle = "rgba(251,113,133,.35)";
  context.lineWidth = 5;
  context.beginPath(); context.arc(projectile.x, projectile.y, projectile.radius + 3, 0, TAU); context.stroke();
}

function drawLaser() {
  const gradient = context.createLinearGradient(player.x - 15, 0, player.x + 15, 0);
  gradient.addColorStop(0, "rgba(45,212,191,0)");
  gradient.addColorStop(.5, "rgba(153,246,228,.96)");
  gradient.addColorStop(1, "rgba(45,212,191,0)");
  context.fillStyle = gradient;
  context.fillRect(player.x - 17, 0, 34, player.y - 28);
  context.fillStyle = "#ecfdf5";
  context.fillRect(player.x - 3, 0, 6, player.y - 28);
}

function drawHazard(hazard) {
  context.save();
  context.translate(hazard.x, hazard.y);
  context.rotate(hazard.rotation);
  if (hazard.type === "meteor") drawMeteor();
  if (hazard.type === "asteroid") drawAsteroid(hazard);
  if (hazard.type === "debris") drawDebris();
  if (hazard.type === "enemy") drawEnemy();
  if (hazard.type === "mine") drawMine(hazard);
  context.restore();
}

function drawMeteor() {
  context.save();
  context.rotate(-.22);
  context.fillStyle = "rgba(249,115,22,.22)";
  context.beginPath(); context.moveTo(-12, -9); context.lineTo(0, -56); context.lineTo(12, -9); context.closePath(); context.fill();
  context.fillStyle = "#f97316";
  context.beginPath(); context.arc(0, 0, 18, 0, TAU); context.fill();
  context.fillStyle = "#fbbf24";
  context.beginPath(); context.arc(-4, -4, 9, 0, TAU); context.fill();
  context.restore();
}

function drawAsteroid(hazard) {
  context.fillStyle = "#718078";
  context.beginPath();
  context.moveTo(-25, -10); context.lineTo(-10, -27); context.lineTo(13, -24); context.lineTo(27, -7); context.lineTo(21, 19); context.lineTo(-2, 28); context.lineTo(-24, 15); context.closePath(); context.fill();
  context.fillStyle = "#4a5952";
  context.beginPath(); context.arc(-9, -8, 6, 0, TAU); context.arc(11, 9, 8, 0, TAU); context.fill();
  drawHealthBar(hazard, 30);
}

function drawDebris() {
  context.fillStyle = "#94a3b8";
  context.fillRect(-38, -7, 76, 14);
  context.fillStyle = "#334155";
  context.fillRect(-9, -15, 18, 30);
  context.fillStyle = "#38bdf8";
  for (let x = -34; x <= 23; x += 19) context.fillRect(x, -4, 12, 8);
}

function drawEnemy() {
  context.fillStyle = "#be123c";
  context.beginPath(); context.moveTo(0, 29); context.lineTo(24, -19); context.lineTo(12, -27); context.lineTo(0, -15); context.lineTo(-12, -27); context.lineTo(-24, -19); context.closePath(); context.fill();
  context.fillStyle = "#fda4af";
  context.beginPath(); context.moveTo(0, 13); context.lineTo(7, -11); context.lineTo(-7, -11); context.closePath(); context.fill();
}

function drawMine(hazard) {
  const pulse = 1 + Math.sin(hazard.pulse) * .08;
  context.scale(pulse, pulse);
  context.strokeStyle = "#f43f5e";
  context.lineWidth = 5;
  for (let index = 0; index < 8; index += 1) {
    context.rotate(TAU / 8);
    context.beginPath(); context.moveTo(0, -15); context.lineTo(0, -27); context.stroke();
  }
  context.fillStyle = "#881337";
  context.beginPath(); context.arc(0, 0, 17, 0, TAU); context.fill();
  context.fillStyle = "#fb7185";
  context.beginPath(); context.arc(-4, -5, 5, 0, TAU); context.fill();
}

function drawHealthBar(hazard, offsetY) {
  if (hazard.hp >= hazard.maxHp) return;
  context.fillStyle = "rgba(255,255,255,.18)";
  context.fillRect(-20, offsetY, 40, 4);
  context.fillStyle = BRAND_COLOR;
  context.fillRect(-20, offsetY, 40 * Math.max(0, hazard.hp / hazard.maxHp), 4);
}

function drawItem(item) {
  const definition = ITEM_DEFINITIONS[item.type];
  context.save();
  context.translate(item.x, item.y);
  context.rotate(item.rotation);
  context.fillStyle = definition.color;
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = -Math.PI / 2 + index * TAU / 6;
    const x = Math.cos(angle) * 19;
    const y = Math.sin(angle) * 19;
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath(); context.fill();
  context.rotate(-item.rotation);
  context.fillStyle = "#fff";
  context.font = "900 13px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(definition.short, 0, 1);
  context.restore();
}

function drawParticle(particle) {
  context.globalAlpha = clamp(particle.life * 2, 0, 1);
  context.fillStyle = particle.color;
  context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  context.globalAlpha = 1;
}

function setPointerPosition(event) {
  const rectangle = canvas.getBoundingClientRect();
  player.x = clamp((event.clientX - rectangle.left) / rectangle.width * GAME_WIDTH, 34, GAME_WIDTH - 34);
  player.y = clamp((event.clientY - rectangle.top) / rectangle.height * GAME_HEIGHT, 80, GAME_HEIGHT - 42);
}

function bindHoldButton(button, key) {
  const release = () => { keys[key] = false; };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[key] = true;
    button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

modeList.addEventListener("click", (event) => {
  const button = event.target.closest(".shooter-mode__option");
  if (button) setMode(button.dataset.mode);
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartLevel);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));
messageTertiary.addEventListener("click", () => runMessageAction("tertiary"));

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  const key = event.key.toLowerCase();
  const keyMap = { arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", arrowdown: "down", s: "down" };
  if (keyMap[key]) {
    event.preventDefault();
    keys[keyMap[key]] = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (["level-complete", "finished"].includes(state)) runMessageAction("primary");
    else keys.fire = true;
  }
  if ((key === "p" || key === "escape") && ["running", "paused"].includes(state)) {
    event.preventDefault();
    togglePause();
  }
  if (event.key === "Enter" && ["level-complete", "finished"].includes(state)) runMessageAction("primary");
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const keyMap = { arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", arrowdown: "down", s: "down" };
  if (keyMap[key]) keys[keyMap[key]] = false;
  if (event.code === "Space") keys.fire = false;
});

board.addEventListener("pointerdown", (event) => {
  if (state !== "running") return;
  dragging = true;
  board.setPointerCapture?.(event.pointerId);
  setPointerPosition(event);
});
board.addEventListener("pointermove", (event) => {
  if (dragging && state === "running") setPointerPosition(event);
});
board.addEventListener("pointerup", () => { dragging = false; });
board.addEventListener("pointercancel", () => { dragging = false; });

bindHoldButton(document.querySelector("#moveLeftButton"), "left");
bindHoldButton(document.querySelector("#moveRightButton"), "right");
bindHoldButton(document.querySelector("#fireButton"), "fire");

document.querySelector("#helpButton").addEventListener("click", () => {
  helpPausedGame = state === "running";
  if (helpPausedGame) togglePause();
  helpDialog.showModal();
});
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});
helpDialog.addEventListener("close", () => {
  if (helpPausedGame && state === "paused") togglePause();
  helpPausedGame = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "running") togglePause();
});

highScoreValue.textContent = highScore.toLocaleString("vi-VN");
setMode("campaign");
updateHud();
draw(performance.now());
