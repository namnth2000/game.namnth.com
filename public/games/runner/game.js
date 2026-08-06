"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const board = document.querySelector("#board");
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
const scoreValue = document.querySelector("#scoreValue");
const highScoreValue = document.querySelector("#highScoreValue");
const coinValue = document.querySelector("#coinValue");
const lifeValue = document.querySelector("#lifeValue");
const journeyLabel = document.querySelector("#journeyLabel");
const journeyTrack = document.querySelector("#journeyTrack");
const levelHint = document.querySelector("#levelHint");
const effectBar = document.querySelector("#effectBar");
const gameToast = document.querySelector("#gameToast");
const helpDialog = document.querySelector("#helpDialog");
const modeButtons = [...document.querySelectorAll(".mode-switch__button")];

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 448;
const GRAVITY = 1780;
const MAX_FALL_SPEED = 980;
const LEVELS = [
  { length: 4700, speed: 245, gaps: 2, enemies: 4, obstacles: 5, hint: "Khởi động nhẹ nhàng. Hãy thử nhảy lên đầu yêu quái." },
  { length: 4950, speed: 252, gaps: 3, enemies: 5, obstacles: 6, hint: "Chông xuất hiện nhiều hơn - giữ nhịp nhảy ngắn." },
  { length: 5200, speed: 258, gaps: 3, enemies: 6, obstacles: 7, hint: "Cột lửa bật tắt theo nhịp. Quan sát trước khi lao qua." },
  { length: 5450, speed: 265, gaps: 4, enemies: 7, obstacles: 8, hint: "Đá lăn tuần tra. Nhảy cao hoặc đổi hướng kịp lúc." },
  { length: 5700, speed: 272, gaps: 4, enemies: 8, obstacles: 9, hint: "Búa dập đã xuất hiện - tận dụng khoảng dừng ngắn." },
  { length: 5950, speed: 279, gaps: 5, enemies: 9, obstacles: 10, hint: "Đường hẹp hơn. Cánh gió giúp vượt hố an toàn." },
  { length: 6200, speed: 286, gaps: 5, enemies: 10, obstacles: 11, hint: "Yêu quái nhanh hơn và thường đi thành cặp." },
  { length: 6450, speed: 294, gaps: 6, enemies: 11, obstacles: 12, hint: "Săn nam châm để gom xu ở những vị trí khó." },
  { length: 6700, speed: 302, gaps: 6, enemies: 12, obstacles: 13, hint: "Mọi thử thách cùng xuất hiện. Đừng vội ở đoạn cuối." },
  { length: 7100, speed: 312, gaps: 7, enemies: 14, obstacles: 15, hint: "Màn cuối - dùng đường tắt và vật phẩm thật khôn ngoan." },
];

const ITEM_TYPES = {
  shield: { label: "Khiên lá", short: "S", color: "#10b981" },
  wing: { label: "Cánh gió", short: "W", color: "#38bdf8" },
  magnet: { label: "Nam châm", short: "U", color: "#e879f9" },
  sprint: { label: "Giày tốc hành", short: "≫", color: "#fbbf24" },
  heart: { label: "Tim xanh", short: "♥", color: "#fb7185" },
};

let gameState = "idle";
let currentMode = "campaign";
let currentLevel = 1;
let surpriseZone = 1;
let surpriseSeed = Date.now() % 100000;
let score = 0;
let scoreAtLevelStart = 0;
let coinsCollected = 0;
let lives = 3;
let highScore = Number.parseInt(localStorage.getItem("runner-high-score") || "0", 10) || 0;
let world = null;
let cameraX = 0;
let lastFrame = performance.now();
let toastTimer = 0;
let portalRequested = false;
let messageActions = { primary: null, secondary: null };
const keys = { left: false, right: false, down: false };

const player = {
  x: 100,
  y: GROUND_Y - 54,
  width: 38,
  height: 54,
  vx: 0,
  vy: 0,
  onGround: true,
  jumpsUsed: 0,
  facing: 1,
  invulnerableUntil: 0,
  shield: false,
  checkpoint: 100,
};

const effects = {
  wingUntil: 0,
  magnetUntil: 0,
  sprintUntil: 0,
};

function isDarkTheme() {
  return document.documentElement.dataset.theme === "dark";
}

function levelConfig() {
  if (currentMode === "campaign") return LEVELS[currentLevel - 1];
  const index = Math.min(LEVELS.length - 1, surpriseZone - 1);
  const base = LEVELS[index];
  return {
    ...base,
    length: Math.min(7300, base.length + surpriseZone * 20),
    speed: Math.min(320, base.speed + 3),
    enemies: base.enemies + 2,
    obstacles: base.obstacles + 1,
  };
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = value * 16807 % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function rangeRandom(random, minimum, maximum) {
  return minimum + random() * (maximum - minimum);
}

function formatNumber(number) {
  return new Intl.NumberFormat("vi-VN").format(number);
}

function overlaps(first, second, inset = 0) {
  return first.x + inset < second.x + second.width
    && first.x + first.width - inset > second.x
    && first.y + inset < second.y + second.height
    && first.y + first.height - inset > second.y;
}

function pointInsidePit(x, pits = world.pits) {
  return pits.some((pit) => x > pit.x && x < pit.x + pit.width);
}

function isAreaClear(x, width, reserved) {
  return !reserved.some((area) => x < area.x + area.width && x + width > area.x);
}

function createWorld() {
  const config = levelConfig();
  const seed = currentMode === "campaign" ? currentLevel * 9137 : surpriseSeed + surpriseZone * 15331;
  const random = seededRandom(seed);
  const length = config.length;
  const pits = [];
  const reserved = [
    { x: 0, width: 550 },
    { x: length - 520, width: 520 },
    { x: 1480, width: 1120 },
  ];

  for (let index = 0; index < config.gaps; index += 1) {
    let x = 720 + index * ((length - 1500) / config.gaps) + rangeRandom(random, -90, 110);
    const width = Math.min(155, 90 + currentLevel * 4 + rangeRandom(random, 0, 24));
    let attempts = 0;
    while (!isAreaClear(x, width, reserved) && attempts < 8) {
      x += 170;
      attempts += 1;
    }
    pits.push({ x, width });
    reserved.push({ x: x - 70, width: width + 140 });
  }

  const platforms = [];
  pits.forEach((pit, index) => {
    if (index % 2 === 1 || currentLevel >= 6) {
      platforms.push({ x: pit.x - 18, y: 355 - (index % 2) * 48, width: pit.width + 36, height: 18 });
    }
  });
  for (let x = 920; x < length - 650; x += 850) {
    if (isAreaClear(x, 180, reserved)) platforms.push({ x, y: 330 - Math.floor(random() * 2) * 55, width: 160 + random() * 60, height: 18 });
  }

  const portals = [{ entryX: 1600, exitX: 2460 }];
  if (currentLevel >= 7 || (currentMode === "surprise" && surpriseZone >= 3)) {
    portals.push({ entryX: length - 1960, exitX: length - 930 });
  }
  portals.forEach((portal) => {
    reserved.push({ x: portal.entryX - 95, width: 190 });
    reserved.push({ x: portal.exitX - 95, width: 190 });
  });

  const obstacleTypes = ["spike"];
  if (currentLevel >= 3 || currentMode === "surprise") obstacleTypes.push("fire");
  if (currentLevel >= 4 || surpriseZone >= 2) obstacleTypes.push("rock");
  if (currentLevel >= 5 || surpriseZone >= 3) obstacleTypes.push("crusher");
  const obstacles = [];
  let obstacleX = 620;
  for (let index = 0; index < config.obstacles; index += 1) {
    obstacleX += rangeRandom(random, 270, 430);
    if (obstacleX > length - 450) break;
    const type = obstacleTypes[index % obstacleTypes.length];
    const width = type === "spike" ? 54 : type === "crusher" ? 64 : 42;
    let attempts = 0;
    while ((!isAreaClear(obstacleX, width, reserved) || pointInsidePit(obstacleX + width / 2, pits)) && attempts < 12) {
      obstacleX += 95;
      attempts += 1;
    }
    if (obstacleX < length - 380) {
      obstacles.push({
        type,
        x: obstacleX,
        baseX: obstacleX,
        y: GROUND_Y - 28,
        width,
        height: type === "crusher" ? 96 : type === "fire" ? 50 : type === "rock" ? 38 : 28,
        phase: random() * Math.PI * 2,
      });
      reserved.push({ x: obstacleX - 45, width: width + 90 });
    }
  }

  const enemies = [];
  for (let index = 0; index < config.enemies; index += 1) {
    let x = 720 + index * ((length - 1250) / config.enemies) + rangeRandom(random, -80, 80);
    let attempts = 0;
    while ((!isAreaClear(x, 42, reserved) || pointInsidePit(x + 20, pits)) && attempts < 10) {
      x += 90;
      attempts += 1;
    }
    if (x < length - 420) {
      enemies.push({ x, y: GROUND_Y - 32, width: 40, height: 32, startX: x - 75, endX: x + 75, speed: 58 + currentLevel * 4, direction: index % 2 ? -1 : 1, alive: true });
    }
  }

  const coinItems = [];
  const coinStep = currentMode === "surprise" ? 135 : 190;
  for (let x = 420; x < length - 300; x += coinStep) {
    const wave = Math.sin(x * .012) * 45;
    let y = GROUND_Y - 95 - Math.abs(wave);
    const platform = platforms.find((item) => x > item.x && x < item.x + item.width);
    if (platform) y = platform.y - 38;
    coinItems.push({ x, y, radius: 10, collected: false });
  }

  const upgrades = [];
  const itemStep = currentMode === "surprise" ? 520 : 920;
  const types = Object.keys(ITEM_TYPES);
  let itemIndex = 0;
  for (let x = 790; x < length - 380; x += itemStep) {
    const safeX = pointInsidePit(x, pits) ? x + 150 : x;
    upgrades.push({ x: safeX, y: GROUND_Y - 124 - (itemIndex % 2) * 42, width: 32, height: 32, type: types[itemIndex % types.length], collected: false, phase: itemIndex * .8 });
    itemIndex += 1;
  }

  return { length, pits, platforms, portals, obstacles, enemies, coins: coinItems, items: upgrades, finishX: length - 220 };
}

function resetEffects() {
  effects.wingUntil = 0;
  effects.magnetUntil = 0;
  effects.sprintUntil = 0;
  player.shield = false;
  renderEffects(performance.now());
}

function resetPlayer(fullReset = false) {
  player.x = fullReset ? 100 : findSafeSpawn(player.checkpoint);
  player.y = GROUND_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.jumpsUsed = 0;
  player.invulnerableUntil = performance.now() + 1200;
  if (fullReset) player.checkpoint = 100;
  cameraX = Math.max(0, player.x - 220);
}

function findSafeSpawn(target) {
  let x = Math.max(100, target);
  while (pointInsidePit(x + player.width / 2) && x > 100) x -= 40;
  return x;
}

function prepareLevel(fullReset = true) {
  world = createWorld();
  resetEffects();
  if (fullReset) player.checkpoint = 100;
  resetPlayer(fullReset);
  updateInterface();
  draw(performance.now());
}

function startGame() {
  currentLevel = 1;
  surpriseZone = 1;
  if (currentMode === "surprise") surpriseSeed = Date.now() % 100000;
  score = 0;
  scoreAtLevelStart = 0;
  coinsCollected = 0;
  lives = 3;
  gameState = "running";
  prepareLevel(true);
  beginPlayInterface();
}

function restartLevel() {
  score = scoreAtLevelStart;
  lives = 3;
  gameState = "running";
  messageActions = { primary: null, secondary: null };
  prepareLevel(true);
  beginPlayInterface();
}

function nextLevel() {
  if (currentMode === "campaign") currentLevel += 1;
  else surpriseZone += 1;
  scoreAtLevelStart = score;
  lives = Math.min(3, lives + 1);
  gameState = "running";
  messageActions = { primary: null, secondary: null };
  prepareLevel(true);
  beginPlayInterface();
}

function beginPlayInterface() {
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "Đang phiêu lưu";
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  restartButton.disabled = false;
  modeButtons.forEach((button) => { button.disabled = true; });
}

function returnToIdle() {
  gameState = "idle";
  currentLevel = 1;
  surpriseZone = 1;
  score = 0;
  coinsCollected = 0;
  lives = 3;
  prepareLevel(true);
  messageOverlay.hidden = true;
  introOverlay.hidden = false;
  startButton.disabled = false;
  startButton.querySelector("span").textContent = currentMode === "campaign" ? "Bắt đầu vượt ải" : "Bắt đầu bất ngờ";
  pauseButton.disabled = true;
  restartButton.disabled = true;
  modeButtons.forEach((button) => { button.disabled = false; });
}

function selectMode(mode) {
  if (gameState === "running" || gameState === "paused") return;
  currentMode = mode;
  modeButtons.forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  returnToIdle();
}

function updateHighScore() {
  if (score <= highScore) return;
  highScore = score;
  localStorage.setItem("runner-high-score", String(highScore));
}

function updateInterface() {
  scoreValue.textContent = formatNumber(score);
  highScoreValue.textContent = formatNumber(highScore);
  coinValue.textContent = formatNumber(coinsCollected);
  const hearts = `${"♥ ".repeat(Math.max(0, lives)).trim()}${lives < 3 ? ` ${"♡ ".repeat(3 - lives).trim()}` : ""}`;
  lifeValue.textContent = hearts;
  lifeValue.setAttribute("aria-label", `${lives} mạng`);

  if (currentMode === "campaign") {
    journeyLabel.textContent = `Màn ${String(currentLevel).padStart(2, "0")} / 10`;
    levelHint.textContent = LEVELS[currentLevel - 1].hint;
  } else {
    journeyLabel.textContent = `Khu ${String(surpriseZone).padStart(2, "0")} / 10`;
    levelHint.textContent = "Vật phẩm xuất hiện dày hơn, đường chạy được xáo trộn mỗi khu.";
  }

  [...journeyTrack.children].forEach((item, index) => {
    const position = currentMode === "campaign" ? currentLevel : surpriseZone;
    item.classList.toggle("is-done", index + 1 < position);
    item.classList.toggle("is-current", index + 1 === position);
  });
}

function showMessage({ icon, title, text, primaryLabel, secondaryLabel, primaryAction, secondaryAction }) {
  messageIcon.textContent = icon;
  messageTitle.textContent = title;
  messageText.textContent = text;
  messagePrimary.textContent = primaryLabel;
  messageSecondary.textContent = secondaryLabel;
  messageSecondary.hidden = !secondaryLabel;
  messageActions = { primary: primaryAction, secondary: secondaryAction };
  messageOverlay.hidden = false;
}

function runMessageAction(type) {
  const action = messageActions[type];
  if (typeof action === "function") action();
}

function togglePause() {
  if (gameState === "running") {
    gameState = "paused";
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
    showMessage({
      icon: "Ⅱ",
      title: "Tạm dừng",
      text: "Hành trình đang đợi bạn.",
      primaryLabel: "Tiếp tục",
      secondaryLabel: "Chơi lại màn",
      primaryAction: resumeGame,
      secondaryAction: restartLevel,
    });
  } else if (gameState === "paused") resumeGame();
}

function resumeGame() {
  gameState = "running";
  messageOverlay.hidden = true;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  lastFrame = performance.now();
}

function showToast(text) {
  gameToast.textContent = text;
  gameToast.hidden = false;
  toastTimer = 1.5;
}

function jump() {
  if (gameState !== "running") return;
  const now = performance.now();
  const maxJumps = now < effects.wingUntil ? 2 : 1;
  if (player.onGround || player.jumpsUsed < maxJumps) {
    player.vy = -650;
    player.onGround = false;
    player.jumpsUsed += 1;
  }
}

function usePortal() {
  if (gameState !== "running" || !player.onGround) return;
  const portal = world.portals.find((item) => Math.abs((player.x + player.width / 2) - item.entryX) < 62);
  if (!portal) {
    showToast("Hãy đứng trên ô dịch chuyển");
    return;
  }
  player.x = portal.exitX + 58;
  player.y = GROUND_Y - player.height;
  player.checkpoint = player.x;
  player.vx = 0;
  cameraX = Math.max(0, player.x - 250);
  score += 150;
  showToast("Đường tắt! +150");
  updateInterface();
}

function activateItem(item, now) {
  if (item.type === "shield") player.shield = true;
  if (item.type === "wing") effects.wingUntil = now + 14000;
  if (item.type === "magnet") effects.magnetUntil = now + 12000;
  if (item.type === "sprint") effects.sprintUntil = now + 10000;
  if (item.type === "heart") lives = Math.min(3, lives + 1);
  score += 200;
  showToast(`${ITEM_TYPES[item.type].label} +200`);
  updateInterface();
  renderEffects(now);
}

function renderEffects(now) {
  const active = [];
  if (player.shield) active.push("Khiên lá");
  if (effects.wingUntil > now) active.push(`Cánh gió ${Math.ceil((effects.wingUntil - now) / 1000)}s`);
  if (effects.magnetUntil > now) active.push(`Nam châm ${Math.ceil((effects.magnetUntil - now) / 1000)}s`);
  if (effects.sprintUntil > now) active.push(`Tăng tốc ${Math.ceil((effects.sprintUntil - now) / 1000)}s`);
  effectBar.innerHTML = active.map((label) => `<span class="runner-effect">${label}</span>`).join("");
}

function takeDamage(now, reason = "Va chạm") {
  if (now < player.invulnerableUntil) return;
  if (player.shield) {
    player.shield = false;
    player.invulnerableUntil = now + 1000;
    player.vy = -380;
    player.vx = -180 * player.facing;
    showToast("Khiên lá đã bảo vệ bạn");
    renderEffects(now);
    return;
  }

  lives -= 1;
  updateInterface();
  if (lives <= 0) {
    gameOver(reason);
    return;
  }
  showToast(`${reason} · còn ${lives} mạng`);
  resetPlayer(false);
}

function gameOver(reason) {
  gameState = "game-over";
  updateHighScore();
  updateInterface();
  pauseButton.disabled = true;
  modeButtons.forEach((button) => { button.disabled = false; });
  showMessage({
    icon: "×",
    title: "Hành trình kết thúc",
    text: `${reason}. Bạn đạt ${formatNumber(score)} điểm và thu ${coinsCollected} xu.`,
    primaryLabel: "Chơi lại",
    secondaryLabel: "Đổi chế độ",
    primaryAction: startGame,
    secondaryAction: returnToIdle,
  });
}

function completeLevel() {
  if (gameState !== "running") return;
  score += 1000 + (currentMode === "campaign" ? currentLevel : surpriseZone) * 120;
  updateHighScore();
  updateInterface();
  const completedJourney = (currentMode === "campaign" && currentLevel === 10)
    || (currentMode === "surprise" && surpriseZone === 10);
  if (completedJourney) {
    gameState = "won";
    showMessage({
      icon: "★",
      title: currentMode === "campaign" ? "Đã chinh phục 10 màn!" : "Đã giải mã 10 khu bất ngờ!",
      text: `Tuyệt vời! Bạn hoàn thành hành trình với ${formatNumber(score)} điểm.`,
      primaryLabel: "Chơi lại từ đầu",
      secondaryLabel: currentMode === "campaign" ? "Thử chế độ bất ngờ" : "Thử chế độ vượt ải",
      primaryAction: startGame,
      secondaryAction: () => selectMode(currentMode === "campaign" ? "surprise" : "campaign"),
    });
    return;
  }

  gameState = "level-complete";
  const nextName = currentMode === "campaign" ? `màn ${currentLevel + 1}` : `khu ${surpriseZone + 1}`;
  showMessage({
    icon: "✓",
    title: currentMode === "campaign" ? `Hoàn thành màn ${currentLevel}` : `Vượt qua khu ${surpriseZone}`,
    text: `Cổng đến ${nextName} đã mở. Bạn được hồi thêm một mạng.`,
    primaryLabel: `Đi tiếp ${nextName}`,
    secondaryLabel: "Chơi lại khu này",
    primaryAction: nextLevel,
    secondaryAction: restartLevel,
  });
}

function surfaceForPlayer(previousBottom, currentBottom) {
  const centerX = player.x + player.width / 2;
  const surfaces = [];
  if (!pointInsidePit(centerX)) surfaces.push(GROUND_Y);
  world.platforms.forEach((platform) => {
    const horizontal = player.x + player.width - 7 > platform.x && player.x + 7 < platform.x + platform.width;
    if (horizontal) surfaces.push(platform.y);
  });
  return surfaces
    .filter((surface) => previousBottom <= surface + 6 && currentBottom >= surface)
    .sort((first, second) => first - second)[0];
}

function updatePlayer(deltaTime, now) {
  const direction = Number(keys.right) - Number(keys.left);
  const targetSpeed = now < effects.sprintUntil ? 385 : levelConfig().speed;
  const acceleration = player.onGround ? 1900 : 1150;
  const desiredVelocity = direction * targetSpeed;
  const velocityDifference = desiredVelocity - player.vx;
  const velocityStep = Math.sign(velocityDifference) * Math.min(Math.abs(velocityDifference), acceleration * deltaTime);
  player.vx += velocityStep;
  if (direction) player.facing = direction;

  player.x += player.vx * deltaTime;
  player.x = Math.max(0, Math.min(world.length - player.width, player.x));
  const previousBottom = player.y + player.height;
  player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * deltaTime);
  player.y += player.vy * deltaTime;
  const currentBottom = player.y + player.height;

  if (player.vy >= 0) {
    const surface = surfaceForPlayer(previousBottom, currentBottom);
    if (surface !== undefined) {
      player.y = surface - player.height;
      player.vy = 0;
      player.onGround = true;
      player.jumpsUsed = 0;
    } else {
      player.onGround = false;
    }
  }

  if (player.y > HEIGHT + 70) takeDamage(now, "Rơi xuống hố");
  if (player.x > world.length * .52 && player.checkpoint < world.length * .5) player.checkpoint = world.length * .5;
  cameraX += ((player.x - 270) - cameraX) * Math.min(1, deltaTime * 5.5);
  cameraX = Math.max(0, Math.min(world.length - WIDTH, cameraX));
  if (player.x + player.width >= world.finishX) completeLevel();
}

function updateEnemies(deltaTime, now, previousBottom) {
  world.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    enemy.x += enemy.direction * enemy.speed * deltaTime;
    if (enemy.x < enemy.startX || enemy.x > enemy.endX || pointInsidePit(enemy.x + enemy.width / 2)) {
      enemy.direction *= -1;
      enemy.x = Math.max(enemy.startX, Math.min(enemy.endX, enemy.x));
    }
    if (!overlaps(player, enemy, 5)) return;
    if (player.vy > 120 && previousBottom <= enemy.y + 13) {
      enemy.alive = false;
      player.vy = -440;
      score += 300;
      showToast("Giẫm quái +300");
      updateInterface();
    } else {
      takeDamage(now, "Đụng yêu quái");
    }
  });
}

function obstacleHitbox(obstacle, now) {
  if (obstacle.type === "spike") return { x: obstacle.x + 5, y: GROUND_Y - 24, width: obstacle.width - 10, height: 24 };
  if (obstacle.type === "fire") {
    const active = Math.sin(now * .004 + obstacle.phase) > -.25;
    if (!active) return null;
    return { x: obstacle.x + 8, y: GROUND_Y - obstacle.height, width: obstacle.width - 16, height: obstacle.height };
  }
  if (obstacle.type === "rock") {
    obstacle.x = obstacle.baseX + Math.sin(now * .0022 + obstacle.phase) * 58;
    return { x: obstacle.x, y: GROUND_Y - 38, width: 38, height: 38 };
  }
  const travel = (Math.sin(now * .003 + obstacle.phase) + 1) / 2;
  obstacle.y = 90 + travel * 252;
  return { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
}

function updateObstacles(now) {
  world.obstacles.forEach((obstacle) => {
    const hitbox = obstacleHitbox(obstacle, now);
    if (hitbox && overlaps(player, hitbox, 6)) takeDamage(now, obstacle.type === "rock" ? "Đụng đá lăn" : "Trúng chướng ngại");
  });
}

function updateCollectibles(deltaTime, now) {
  world.coins.forEach((coin) => {
    if (coin.collected) return;
    if (now < effects.magnetUntil) {
      const distanceX = (player.x + player.width / 2) - coin.x;
      const distanceY = (player.y + player.height / 2) - coin.y;
      const distance = Math.hypot(distanceX, distanceY);
      if (distance < 210 && distance > 1) {
        coin.x += distanceX / distance * 420 * deltaTime;
        coin.y += distanceY / distance * 420 * deltaTime;
      }
    }
    const coinBox = { x: coin.x - coin.radius, y: coin.y - coin.radius, width: coin.radius * 2, height: coin.radius * 2 };
    if (overlaps(player, coinBox, 3)) {
      coin.collected = true;
      coinsCollected += 1;
      score += 50;
      updateInterface();
    }
  });

  world.items.forEach((item) => {
    if (item.collected) return;
    const floatingItem = { ...item, y: item.y + Math.sin(now * .004 + item.phase) * 7 };
    if (overlaps(player, floatingItem, 3)) {
      item.collected = true;
      activateItem(item, now);
    }
  });
}

function update(deltaTime, now) {
  const previousBottom = player.y + player.height;
  updatePlayer(deltaTime, now);
  updateEnemies(deltaTime, now, previousBottom);
  updateObstacles(now);
  updateCollectibles(deltaTime, now);
  if (portalRequested || keys.down) {
    usePortal();
    portalRequested = false;
    keys.down = false;
  }
  if (toastTimer > 0) {
    toastTimer -= deltaTime;
    if (toastTimer <= 0) gameToast.hidden = true;
  }
  renderEffects(now);
}

function roundedRectangle(x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawBackground() {
  const dark = isDarkTheme();
  context.fillStyle = dark ? "#0e211b" : "#dff4ed";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = dark ? "#16372c" : "#c1eadc";
  for (let index = -1; index < 7; index += 1) {
    const x = index * 230 - (cameraX * .12 % 230);
    context.beginPath();
    context.arc(x + 110, GROUND_Y + 20, 145, Math.PI, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.78)";
  for (let index = 0; index < 5; index += 1) {
    const x = index * 270 - (cameraX * .2 % 280);
    roundedRectangle(x + 30, 65 + (index % 2) * 55, 92, 18, 9);
    context.fill();
  }
}

function drawGround() {
  const dark = isDarkTheme();
  const sortedPits = [...world.pits].sort((first, second) => first.x - second.x);
  let start = 0;
  const segments = [];
  sortedPits.forEach((pit) => {
    segments.push({ x: start, width: pit.x - start });
    start = pit.x + pit.width;
  });
  segments.push({ x: start, width: world.length - start });
  segments.forEach((segment) => {
    context.fillStyle = dark ? "#193f32" : "#285647";
    context.fillRect(segment.x, GROUND_Y, segment.width, HEIGHT - GROUND_Y);
    context.fillStyle = "#10b981";
    context.fillRect(segment.x, GROUND_Y, segment.width, 8);
    context.fillStyle = dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.08)";
    for (let x = segment.x + 18; x < segment.x + segment.width; x += 42) context.fillRect(x, GROUND_Y + 28, 18, 5);
  });
  context.fillStyle = dark ? "#285447" : "#3d6b5c";
  world.platforms.forEach((platform) => {
    roundedRectangle(platform.x, platform.y, platform.width, platform.height, 3);
    context.fill();
    context.fillStyle = "#34d399";
    context.fillRect(platform.x + 3, platform.y, platform.width - 6, 5);
    context.fillStyle = dark ? "#285447" : "#3d6b5c";
  });
}

function drawPortal(portal, isExit = false) {
  const x = isExit ? portal.exitX : portal.entryX;
  context.fillStyle = isExit ? "#047857" : "#10b981";
  roundedRectangle(x - 39, GROUND_Y - 18, 78, 18, 4);
  context.fill();
  context.fillStyle = isExit ? "#065f46" : "#059669";
  context.fillRect(x - 29, GROUND_Y - 12, 58, 12);
  context.fillStyle = "rgba(255,255,255,.55)";
  context.fillRect(x - 24, GROUND_Y - 14, 31, 3);
  if (!isExit) {
    context.fillStyle = "#ffffff";
    context.font = "800 12px system-ui";
    context.textAlign = "center";
    context.fillText("↓", x, GROUND_Y - 5);
  }
}

function drawFinish() {
  context.fillStyle = "#d7e1dd";
  context.fillRect(world.finishX, GROUND_Y - 155, 8, 155);
  context.fillStyle = "#10b981";
  context.fillRect(world.finishX + 8, GROUND_Y - 150, 66, 42);
  context.fillStyle = "#052e22";
  context.font = "900 17px system-ui";
  context.textAlign = "center";
  context.fillText("n", world.finishX + 41, GROUND_Y - 123);
}

function drawCoin(coin) {
  context.fillStyle = "#f2b827";
  context.beginPath();
  context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#b77906";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.6)";
  context.fillRect(coin.x - 2, coin.y - 6, 3, 12);
}

function drawItem(item, now) {
  const definition = ITEM_TYPES[item.type];
  const y = item.y + Math.sin(now * .004 + item.phase) * 7;
  context.fillStyle = definition.color;
  roundedRectangle(item.x, y, item.width, item.height, 5);
  context.fill();
  context.fillStyle = item.type === "heart" ? "#4c0519" : "#052e22";
  context.font = "900 13px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(definition.short, item.x + item.width / 2, y + item.height / 2 + 1);
  context.textBaseline = "alphabetic";
}

function drawEnemy(enemy) {
  context.fillStyle = "#dc4a4a";
  roundedRectangle(enemy.x, enemy.y, enemy.width, enemy.height, 13);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(enemy.x + 12, enemy.y + 13, 4, 0, Math.PI * 2);
  context.arc(enemy.x + 28, enemy.y + 13, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#521717";
  context.beginPath();
  context.arc(enemy.x + 13, enemy.y + 14, 2, 0, Math.PI * 2);
  context.arc(enemy.x + 29, enemy.y + 14, 2, 0, Math.PI * 2);
  context.fill();
  context.fillRect(enemy.x + 4, enemy.y + enemy.height - 4, 12, 6);
  context.fillRect(enemy.x + 24, enemy.y + enemy.height - 4, 12, 6);
}

function drawObstacle(obstacle, now) {
  const hitbox = obstacleHitbox(obstacle, now);
  if (obstacle.type === "spike") {
    context.fillStyle = "#e34c4c";
    const count = 3;
    const width = obstacle.width / count;
    for (let index = 0; index < count; index += 1) {
      context.beginPath();
      context.moveTo(obstacle.x + index * width, GROUND_Y);
      context.lineTo(obstacle.x + index * width + width / 2, GROUND_Y - 28);
      context.lineTo(obstacle.x + (index + 1) * width, GROUND_Y);
      context.fill();
    }
    return;
  }
  if (obstacle.type === "fire") {
    context.fillStyle = hitbox ? "#f97316" : "#9a5f42";
    const height = hitbox ? obstacle.height : 14;
    context.beginPath();
    context.moveTo(obstacle.x + 5, GROUND_Y);
    context.quadraticCurveTo(obstacle.x + 2, GROUND_Y - height * .65, obstacle.x + obstacle.width / 2, GROUND_Y - height);
    context.quadraticCurveTo(obstacle.x + obstacle.width - 2, GROUND_Y - height * .6, obstacle.x + obstacle.width - 5, GROUND_Y);
    context.fill();
    return;
  }
  if (obstacle.type === "rock") {
    context.fillStyle = "#6b7280";
    context.beginPath();
    context.arc(obstacle.x + 19, GROUND_Y - 19, 19, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#4b5563";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(obstacle.x + 8, GROUND_Y - 22);
    context.lineTo(obstacle.x + 19, GROUND_Y - 10);
    context.lineTo(obstacle.x + 30, GROUND_Y - 27);
    context.stroke();
    return;
  }
  context.fillStyle = "#374151";
  context.fillRect(obstacle.x + obstacle.width / 2 - 5, 0, 10, obstacle.y);
  context.fillStyle = "#6b7280";
  roundedRectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 3);
  context.fill();
  context.fillStyle = "#9ca3af";
  context.fillRect(obstacle.x + 8, obstacle.y + obstacle.height - 15, obstacle.width - 16, 5);
}

function drawPlayer(now) {
  if (now < player.invulnerableUntil && Math.floor(now / 90) % 2 === 0) return;
  const x = player.x;
  const y = player.y;
  if (player.shield) {
    context.strokeStyle = "#6ee7b7";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x + player.width / 2, y + player.height / 2, 37, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = "#047857";
  roundedRectangle(x - 3, y, player.width + 6, 12, 4);
  context.fill();
  context.fillStyle = "#10b981";
  roundedRectangle(x, y + 7, player.width, 39, 5);
  context.fill();
  context.fillStyle = "#065f46";
  context.fillRect(x + 4, y + 29, player.width - 8, 17);
  context.fillStyle = "#052e22";
  const eyeX = player.facing > 0 ? x + 27 : x + 8;
  context.beginPath();
  context.arc(eyeX, y + 19, 3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#10211b";
  context.fillRect(x + 2, y + 45, 14, 9);
  context.fillRect(x + 23, y + 45, 14, 9);
  if (now < effects.wingUntil) {
    context.fillStyle = "#7dd3fc";
    context.beginPath();
    context.ellipse(x - 7, y + 30, 12, 6, -.6, 0, Math.PI * 2);
    context.ellipse(x + player.width + 7, y + 30, 12, 6, .6, 0, Math.PI * 2);
    context.fill();
  }
}

function draw(now = performance.now()) {
  drawBackground();
  if (!world) return;
  context.save();
  context.translate(-cameraX, 0);
  drawGround();
  world.portals.forEach((portal) => { drawPortal(portal); drawPortal(portal, true); });
  drawFinish();
  world.coins.filter((coin) => !coin.collected).forEach(drawCoin);
  world.items.filter((item) => !item.collected).forEach((item) => drawItem(item, now));
  world.obstacles.forEach((obstacle) => drawObstacle(obstacle, now));
  world.enemies.filter((enemy) => enemy.alive).forEach(drawEnemy);
  drawPlayer(now);
  context.restore();
}

function gameLoop(now) {
  const deltaTime = Math.min((now - lastFrame) / 1000, .025);
  lastFrame = now;
  if (gameState === "running") update(deltaTime, now);
  if (["running", "paused", "idle", "level-complete", "game-over", "won"].includes(gameState)) draw(now);
  window.requestAnimationFrame(gameLoop);
}

function setTouchDirection(direction, active) {
  keys[direction] = active;
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartLevel);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));
modeButtons.forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  if (["ArrowLeft", "ArrowRight", "ArrowDown", " ", "a", "A", "d", "D", "s", "S"].includes(event.key)) event.preventDefault();
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
  if ((event.key === "ArrowDown" || event.key.toLowerCase() === "s") && !event.repeat) keys.down = true;
  if ((event.key === " " || event.key === "ArrowUp" || event.key.toLowerCase() === "w") && !event.repeat) jump();
  if (event.key.toLowerCase() === "p" && ["running", "paused"].includes(gameState)) togglePause();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
});

[["moveLeftButton", "left"], ["moveRightButton", "right"]].forEach(([id, direction]) => {
  const button = document.querySelector(`#${id}`);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    setTouchDirection(direction, true);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    button.addEventListener(eventName, () => setTouchDirection(direction, false));
  });
});

document.querySelector("#jumpButton").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  jump();
});
document.querySelector("#portalButton").addEventListener("click", () => { portalRequested = true; });
document.querySelector("#helpButton").addEventListener("click", () => {
  if (gameState === "running") togglePause();
  helpDialog.showModal();
});
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState === "running") togglePause();
});

new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

highScoreValue.textContent = formatNumber(highScore);
prepareLevel(true);
window.requestAnimationFrame(gameLoop);
