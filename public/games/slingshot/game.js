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
const ammoValue = document.querySelector("#ammoValue");
const introOverlay = document.querySelector("#introOverlay");
const messageOverlay = document.querySelector("#messageOverlay");
const messageIcon = document.querySelector("#messageIcon");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const messageTertiary = document.querySelector("#messageTertiary");
const powerStatus = document.querySelector("#powerStatus");
const gameToast = document.querySelector("#gameToast");
const playTip = document.querySelector("#playTip");
const helpDialog = document.querySelector("#helpDialog");

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;
const GROUND_Y = 540;
const GRAVITY = 620;
const ANCHOR = { x: 145, y: 408 };
const MAX_PULL = 108;
const TAU = Math.PI * 2;

const MATERIALS = {
  glass: { hp: 52, color: "#76c7cf", edge: "#317f8a", restitution: 0.62, label: "Kính" },
  wood: { hp: 95, color: "#c78a4b", edge: "#7a4824", restitution: 0.46, label: "Gỗ" },
  stone: { hp: 175, color: "#77827d", edge: "#3f4a45", restitution: 0.32, label: "Đá" }
};

const POWERS = {
  heavy: { color: "#334155", label: "Bi nặng", short: "N" },
  split: { color: "#2563eb", label: "Phân ba", short: "×3" },
  blast: { color: "#c2410c", label: "Nổ lan", short: "✦" },
  ghost: { color: "#7c3aed", label: "Xuyên thấu", short: "G" },
  boost: { color: "#0f766e", label: "Tăng tốc", short: "»" }
};

const LEVELS = [
  {
    ammo: 4,
    hint: "Làm quen với lực kéo và đường bay.",
    targets: [[730, 500], [842, 500]],
    blocks: [[786, 462, 24, 78, "wood"]],
    powers: []
  },
  {
    ammo: 4,
    hint: "Kính bật bi mạnh hơn gỗ - tận dụng góc nảy.",
    targets: [[700, 500], [830, 500]],
    blocks: [[748, 430, 22, 110, "glass"], [790, 514, 126, 26, "wood"]],
    powers: [[470, 345, "heavy"]]
  },
  {
    ammo: 5,
    hint: "Cọc nhọn sẽ kết thúc ngay viên bi đang bay.",
    targets: [[690, 500], [792, 500], [876, 500]],
    blocks: [[740, 452, 22, 88, "wood"], [832, 452, 22, 88, "wood"], [718, 422, 158, 24, "glass"]],
    spikes: [[505, 516, 92, 24]],
    powers: [[390, 300, "split"]]
  },
  {
    ammo: 5,
    hint: "Khối đá cần cú bắn nhanh hoặc bi nặng.",
    targets: [[710, 500], [820, 500], [820, 370]],
    blocks: [[760, 452, 28, 88, "stone"], [852, 452, 28, 88, "stone"], [744, 414, 152, 26, "wood"]],
    powers: [[460, 300, "heavy"], [630, 250, "blast"]]
  },
  {
    ammo: 5,
    hint: "Luồng gió màu xanh bẻ quỹ đạo sang trái.",
    targets: [[700, 500], [814, 500], [860, 392]],
    blocks: [[754, 462, 24, 78, "wood"], [836, 430, 24, 110, "glass"], [794, 402, 110, 24, "wood"]],
    wind: [[420, 170, 160, 330, -170]],
    powers: [[350, 320, "boost"], [650, 240, "ghost"]]
  },
  {
    ammo: 6,
    hint: "Cổng di động mở ra một nhịp bắn ngắn.",
    targets: [[670, 500], [800, 500], [882, 500]],
    blocks: [[718, 444, 24, 96, "stone"], [842, 444, 24, 96, "wood"]],
    gates: [[560, 286, 24, 150, 92, 1.5]],
    powers: [[420, 255, "blast"], [750, 315, "split"]]
  },
  {
    ammo: 6,
    hint: "Đừng dùng hết bi cho lớp chắn đầu tiên.",
    targets: [[692, 500], [790, 500], [874, 500], [790, 365]],
    blocks: [[736, 452, 26, 88, "stone"], [832, 452, 26, 88, "stone"], [710, 420, 174, 25, "wood"], [770, 386, 42, 20, "glass"]],
    spikes: [[470, 516, 80, 24]],
    powers: [[365, 270, "heavy"], [610, 210, "ghost"]]
  },
  {
    ammo: 6,
    hint: "Gió và cổng phối hợp - hãy ngắm thấp hơn thường lệ.",
    targets: [[660, 500], [760, 500], [858, 500], [858, 360]],
    blocks: [[706, 448, 22, 92, "glass"], [808, 448, 24, 92, "stone"], [830, 398, 72, 25, "wood"]],
    gates: [[525, 250, 22, 155, 110, 1.8]],
    wind: [[340, 175, 145, 315, 145]],
    powers: [[310, 320, "boost"], [620, 250, "split"], [760, 235, "blast"]]
  },
  {
    ammo: 7,
    hint: "Hai vùng gió tạo quỹ đạo chữ S khó đoán.",
    targets: [[650, 500], [740, 500], [830, 500], [900, 500], [790, 350]],
    blocks: [[690, 450, 24, 90, "stone"], [782, 450, 24, 90, "wood"], [866, 450, 24, 90, "stone"], [716, 408, 180, 24, "glass"], [770, 377, 42, 18, "wood"]],
    wind: [[330, 150, 120, 350, -155], [470, 160, 120, 340, 155]],
    spikes: [[580, 516, 58, 24]],
    powers: [[295, 275, "heavy"], [505, 230, "ghost"], [665, 260, "blast"]]
  },
  {
    ammo: 7,
    hint: "Màn cuối: kết hợp vật phẩm, góc nảy và đúng thời điểm.",
    targets: [[640, 500], [730, 500], [820, 500], [900, 500], [730, 350], [860, 335]],
    blocks: [[678, 445, 26, 95, "stone"], [774, 445, 26, 95, "stone"], [862, 445, 26, 95, "stone"], [654, 405, 230, 26, "wood"], [704, 375, 52, 20, "glass"], [832, 362, 56, 20, "glass"]],
    gates: [[520, 260, 24, 160, 105, 2]],
    wind: [[350, 155, 135, 340, -165]],
    spikes: [[560, 516, 66, 24]],
    powers: [[300, 280, "boost"], [445, 205, "split"], [610, 245, "blast"], [780, 210, "heavy"]]
  }
];

let mode = "campaign";
let levelIndex = 0;
let unlocked = { campaign: 0, surprise: 0 };
let state = "menu";
let score = 0;
let highScore = Number(localStorage.getItem("slingshot-high-score")) || 0;
let ammo = 0;
let totalTargets = 0;
let targets = [];
let blocks = [];
let spikes = [];
let windZones = [];
let gates = [];
let powers = [];
let balls = [];
let particles = [];
let explosions = [];
let loadedBall = null;
let dragging = false;
let lastTime = performance.now();
let elapsed = 0;
let shotTime = 0;
let toastTimer = 0;
let helpPausedGame = false;
let messageActions = {};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function loadProgress() {
  for (const gameMode of ["campaign", "surprise"]) {
    const saved = Number(localStorage.getItem(`slingshot-unlocked-${gameMode}`));
    unlocked[gameMode] = clamp(Number.isFinite(saved) ? saved : 0, 0, 9);
  }
}

function buildLevel() {
  const definition = LEVELS[levelIndex];
  targets = definition.targets.map(([x, y], index) => ({ x, y, radius: 20, hp: levelIndex >= 7 && index === definition.targets.length - 1 ? 2 : 1, flash: 0 }));
  blocks = (definition.blocks || []).map(([x, y, width, height, material]) => ({
    x, y, width, height, material, hp: MATERIALS[material].hp, maxHp: MATERIALS[material].hp, flash: 0
  }));
  spikes = (definition.spikes || []).map(([x, y, width, height]) => ({ x, y, width, height }));
  windZones = (definition.wind || []).map(([x, y, width, height, force]) => ({ x, y, width, height, force }));
  gates = (definition.gates || []).map(([x, y, width, height, range, speed]) => ({ x, y, width, height, baseY: y, range, speed }));
  powers = (definition.powers || []).map(([x, y, type]) => ({ x, y, type, radius: 18, phase: Math.random() * TAU }));

  if (mode === "surprise") {
    const bonusTypes = ["heavy", "split", "blast", "ghost", "boost"];
    const bonusSlots = [[285, 355], [385, 225], [520, 325], [645, 180]];
    const bonusCount = Math.min(4, 2 + Math.floor(levelIndex / 3));
    for (let index = 0; index < bonusCount; index += 1) {
      const [x, y] = bonusSlots[index];
      powers.push({ x, y, type: bonusTypes[(levelIndex + index) % bonusTypes.length], radius: 18, phase: index });
    }
  }

  totalTargets = targets.length;
  ammo = definition.ammo + (mode === "surprise" ? 1 : 0);
  balls = [];
  particles = [];
  explosions = [];
  shotTime = 0;
  loadedBall = createBall(ANCHOR.x, ANCHOR.y, 0, 0);
  updateHud();
}

function createBall(x, y, velocityX, velocityY) {
  return {
    x, y, previousX: x, previousY: y, velocityX, velocityY,
    radius: 14, damage: 1, age: 0, groundTime: 0, ghostUntil: 0,
    blast: false, split: false, active: true, trail: []
  };
}

function setMode(nextMode) {
  mode = nextMode;
  levelIndex = Math.min(levelIndex, unlocked[mode]);
  modeList.querySelectorAll(".slingshot-mode__option").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  showMenuPreview();
}

function selectLevel(nextLevel) {
  if (nextLevel > unlocked[mode]) return;
  levelIndex = nextLevel;
  showMenuPreview();
}

function showMenuPreview() {
  state = "menu";
  score = 0;
  buildLevel();
  dragging = false;
  introOverlay.hidden = false;
  messageOverlay.hidden = true;
  pauseButton.disabled = true;
  restartButton.disabled = true;
  powerStatus.hidden = true;
  startButton.querySelector("span").textContent = `Bắt đầu màn ${levelIndex + 1}`;
  levelHint.textContent = LEVELS[levelIndex].hint;
  playTip.textContent = mode === "surprise" ? "Bất ngờ: vật phẩm xuất hiện dày hơn và có thêm 1 viên bi." : "Mẹo: kéo càng xa, lực bắn càng mạnh.";
  updateCampaignTrack();
}

function startGame(options = {}) {
  const preserveScore = Boolean(options.preserveScore);
  if (!preserveScore) score = 0;
  buildLevel();
  state = "ready";
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  pauseButton.disabled = false;
  restartButton.disabled = false;
  startButton.querySelector("span").textContent = "Đang chơi";
  updateHud();
  showToast("Kéo viên bi để ngắm bắn");
}

function restartLevel() {
  score = Math.max(0, score - 250);
  startGame({ preserveScore: true });
}

function updateCampaignTrack() {
  campaignLabel.textContent = `Màn ${String(levelIndex + 1).padStart(2, "0")} / 10`;
  campaignTrack.querySelectorAll("li").forEach((item, index) => {
    const button = item.querySelector("button");
    item.classList.toggle("is-current", index === levelIndex);
    item.classList.toggle("is-complete", index < unlocked[mode] || (unlocked[mode] === 9 && index === 9));
    button.disabled = index > unlocked[mode];
    button.setAttribute("aria-current", index === levelIndex ? "step" : "false");
  });
}

function updateHud() {
  scoreValue.textContent = score.toLocaleString("vi-VN");
  highScoreValue.textContent = highScore.toLocaleString("vi-VN");
  targetValue.textContent = `${totalTargets - targets.length}/${totalTargets}`;
  ammoValue.textContent = String(ammo);
}

function updateHighScore() {
  if (score <= highScore) return;
  highScore = score;
  localStorage.setItem("slingshot-high-score", String(highScore));
}

function showToast(message) {
  gameToast.textContent = message;
  gameToast.hidden = false;
  toastTimer = 1.8;
}

function showPower(message) {
  powerStatus.textContent = message;
  powerStatus.hidden = false;
}

function clearPower() {
  powerStatus.hidden = true;
}

function releaseBall() {
  if (!dragging || !loadedBall || state !== "ready") return;
  dragging = false;
  const pull = distance(loadedBall.x, loadedBall.y, ANCHOR.x, ANCHOR.y);
  if (pull < 12) {
    loadedBall.x = ANCHOR.x;
    loadedBall.y = ANCHOR.y;
    return;
  }
  loadedBall.velocityX = (ANCHOR.x - loadedBall.x) * 5.5;
  loadedBall.velocityY = (ANCHOR.y - loadedBall.y) * 5.5;
  loadedBall.previousX = loadedBall.x;
  loadedBall.previousY = loadedBall.y;
  balls = [loadedBall];
  loadedBall = null;
  ammo -= 1;
  shotTime = 0;
  state = "flying";
  updateHud();
  clearPower();
}

function setDragPosition(event) {
  if (!loadedBall) return;
  const rectangle = canvas.getBoundingClientRect();
  let x = (event.clientX - rectangle.left) / rectangle.width * GAME_WIDTH;
  let y = (event.clientY - rectangle.top) / rectangle.height * GAME_HEIGHT;
  const deltaX = x - ANCHOR.x;
  const deltaY = y - ANCHOR.y;
  const pull = Math.hypot(deltaX, deltaY);
  if (pull > MAX_PULL) {
    x = ANCHOR.x + deltaX / pull * MAX_PULL;
    y = ANCHOR.y + deltaY / pull * MAX_PULL;
  }
  loadedBall.x = Math.min(x, ANCHOR.x + 22);
  loadedBall.y = clamp(y, ANCHOR.y - 80, ANCHOR.y + 102);
}

function circleIntersectsRect(ball, rectangle) {
  const nearestX = clamp(ball.x, rectangle.x, rectangle.x + rectangle.width);
  const nearestY = clamp(ball.y, rectangle.y, rectangle.y + rectangle.height);
  return distance(ball.x, ball.y, nearestX, nearestY) <= ball.radius;
}

function resolveRectCollision(ball, rectangle, restitution) {
  const centerX = rectangle.x + rectangle.width / 2;
  const centerY = rectangle.y + rectangle.height / 2;
  const overlapX = rectangle.width / 2 + ball.radius - Math.abs(ball.x - centerX);
  const overlapY = rectangle.height / 2 + ball.radius - Math.abs(ball.y - centerY);
  if (overlapX <= 0 || overlapY <= 0) return 0;

  let normalX = 0;
  let normalY = 0;
  if (overlapX < overlapY) {
    normalX = ball.x < centerX ? -1 : 1;
    ball.x += normalX * overlapX;
  } else {
    normalY = ball.y < centerY ? -1 : 1;
    ball.y += normalY * overlapY;
  }

  const normalSpeed = ball.velocityX * normalX + ball.velocityY * normalY;
  if (normalSpeed < 0) {
    ball.velocityX -= (1 + restitution) * normalSpeed * normalX;
    ball.velocityY -= (1 + restitution) * normalSpeed * normalY;
  }
  return Math.abs(normalSpeed);
}

function collectPower(ball, power) {
  const definition = POWERS[power.type];
  showToast(definition.label);
  showPower(`Đang dùng: ${definition.label}`);
  score += 120;

  if (power.type === "heavy") {
    ball.radius = 20;
    ball.damage = Math.max(ball.damage, 2.4);
  }
  if (power.type === "boost") {
    ball.velocityX *= 1.45;
    ball.velocityY *= 1.45;
    ball.damage = Math.max(ball.damage, 1.45);
  }
  if (power.type === "blast") ball.blast = true;
  if (power.type === "ghost") ball.ghostUntil = elapsed + 2.8;
  if (power.type === "split" && !ball.split) {
    ball.split = true;
    const baseAngle = Math.atan2(ball.velocityY, ball.velocityX);
    const speed = Math.hypot(ball.velocityX, ball.velocityY);
    for (const angleOffset of [-0.18, 0.18]) {
      const clone = createBall(ball.x, ball.y, Math.cos(baseAngle + angleOffset) * speed, Math.sin(baseAngle + angleOffset) * speed);
      clone.radius = 11;
      clone.damage = 0.78;
      clone.age = ball.age;
      balls.push(clone);
    }
  }
  updateHud();
}

function triggerExplosion(x, y, ball) {
  if (!ball.blast) return;
  ball.blast = false;
  explosions.push({ x, y, radius: 8, life: 0.55 });
  for (const target of [...targets]) {
    if (distance(x, y, target.x, target.y) < 112) damageTarget(target, 2, true);
  }
  for (const block of [...blocks]) {
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    if (distance(x, y, centerX, centerY) < 125) damageBlock(block, 95, true);
  }
  spawnParticles(x, y, "#fb923c", 18);
}

function damageTarget(target, amount, splash = false) {
  if (!targets.includes(target)) return;
  target.hp -= amount;
  target.flash = 0.12;
  if (target.hp > 0) return;
  targets.splice(targets.indexOf(target), 1);
  score += splash ? 650 : 900;
  spawnParticles(target.x, target.y, "#10b981", 15);
  updateHighScore();
  updateHud();
}

function damageBlock(block, amount, splash = false) {
  if (!blocks.includes(block)) return;
  block.hp -= amount;
  block.flash = 0.1;
  if (block.hp > 0) return;
  blocks.splice(blocks.indexOf(block), 1);
  score += splash ? 120 : 180;
  spawnParticles(block.x + block.width / 2, block.y + block.height / 2, MATERIALS[block.material].color, 10);
  updateHighScore();
  updateHud();
}

function spawnParticles(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * TAU;
    const speed = 50 + Math.random() * 180;
    particles.push({ x, y, velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed, life: 0.45 + Math.random() * 0.45, color, size: 3 + Math.random() * 5 });
  }
}

function updateBall(ball, deltaTime) {
  ball.age += deltaTime;
  ball.previousX = ball.x;
  ball.previousY = ball.y;
  ball.velocityY += GRAVITY * deltaTime;

  for (const zone of windZones) {
    if (ball.x > zone.x && ball.x < zone.x + zone.width && ball.y > zone.y && ball.y < zone.y + zone.height) {
      ball.velocityX += zone.force * deltaTime;
    }
  }

  ball.x += ball.velocityX * deltaTime;
  ball.y += ball.velocityY * deltaTime;
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 13) ball.trail.shift();

  for (let index = powers.length - 1; index >= 0; index -= 1) {
    const power = powers[index];
    if (distance(ball.x, ball.y, power.x, power.y) <= ball.radius + power.radius) {
      powers.splice(index, 1);
      collectPower(ball, power);
    }
  }

  for (const spike of spikes) {
    if (circleIntersectsRect(ball, spike)) {
      ball.active = false;
      showToast("Cọc nhọn đã chặn viên bi");
      spawnParticles(ball.x, ball.y, "#e34c4c", 10);
      return;
    }
  }

  for (const target of [...targets]) {
    const hitDistance = distance(ball.x, ball.y, target.x, target.y);
    if (hitDistance > ball.radius + target.radius) continue;
    const speed = Math.hypot(ball.velocityX, ball.velocityY);
    const normalX = (ball.x - target.x) / Math.max(hitDistance, 0.01);
    const normalY = (ball.y - target.y) / Math.max(hitDistance, 0.01);
    ball.x = target.x + normalX * (ball.radius + target.radius + 1);
    ball.y = target.y + normalY * (ball.radius + target.radius + 1);
    const normalSpeed = ball.velocityX * normalX + ball.velocityY * normalY;
    if (normalSpeed < 0) {
      ball.velocityX -= 1.55 * normalSpeed * normalX;
      ball.velocityY -= 1.55 * normalSpeed * normalY;
    }
    if (speed > 70) damageTarget(target, speed * ball.damage > 520 ? 2 : 1);
    triggerExplosion(ball.x, ball.y, ball);
  }

  if (elapsed >= ball.ghostUntil) {
    for (const block of [...blocks]) {
      if (!circleIntersectsRect(ball, block)) continue;
      const material = MATERIALS[block.material];
      const impact = resolveRectCollision(ball, block, material.restitution);
      if (impact > 55) damageBlock(block, impact * ball.damage * 0.42);
      if (impact > 115) triggerExplosion(ball.x, ball.y, ball);
      ball.velocityX *= block.material === "stone" ? 0.78 : 0.91;
      ball.velocityY *= block.material === "stone" ? 0.78 : 0.91;
    }

    for (const gate of gates) {
      if (!circleIntersectsRect(ball, gate)) continue;
      const impact = resolveRectCollision(ball, gate, 0.38);
      if (impact > 110) triggerExplosion(ball.x, ball.y, ball);
      ball.velocityX *= 0.82;
      ball.velocityY *= 0.82;
    }
  }

  if (ball.y + ball.radius >= GROUND_Y) {
    ball.y = GROUND_Y - ball.radius;
    if (ball.velocityY > 52) ball.velocityY *= -0.36;
    else ball.velocityY = 0;
    ball.velocityX *= Math.pow(0.38, deltaTime);
    if (Math.hypot(ball.velocityX, ball.velocityY) < 42) ball.groundTime += deltaTime;
    else ball.groundTime = 0;
  }

  if (ball.x < -80 || ball.x > GAME_WIDTH + 80 || ball.y > GAME_HEIGHT + 80 || ball.age > 12 || ball.groundTime > 0.8) {
    ball.active = false;
  }
}

function update(deltaTime) {
  elapsed += deltaTime;
  if (toastTimer > 0) {
    toastTimer -= deltaTime;
    if (toastTimer <= 0) gameToast.hidden = true;
  }
  powers.forEach((power) => { power.phase += deltaTime * 2.2; });
  blocks.forEach((block) => { block.flash = Math.max(0, block.flash - deltaTime); });
  targets.forEach((target) => { target.flash = Math.max(0, target.flash - deltaTime); });
  gates.forEach((gate) => { gate.y = gate.baseY + Math.sin(elapsed * gate.speed) * gate.range; });

  particles.forEach((particle) => {
    particle.life -= deltaTime;
    particle.velocityY += 300 * deltaTime;
    particle.x += particle.velocityX * deltaTime;
    particle.y += particle.velocityY * deltaTime;
  });
  particles = particles.filter((particle) => particle.life > 0);
  explosions.forEach((explosion) => { explosion.life -= deltaTime; explosion.radius += 260 * deltaTime; });
  explosions = explosions.filter((explosion) => explosion.life > 0);

  if (state !== "flying") return;
  shotTime += deltaTime;
  for (const ball of [...balls]) updateBall(ball, deltaTime);
  balls = balls.filter((ball) => ball.active);

  if (targets.length === 0) {
    completeLevel();
    return;
  }
  if (balls.length === 0) endTurn();
}

function endTurn() {
  clearPower();
  if (ammo <= 0) {
    state = "game-over";
    showMessage({
      icon: "×",
      title: "Hết lượt bắn",
      text: `Còn ${targets.length} mục tiêu. Thử đổi góc hoặc giữ vật phẩm cho lớp chắn đá.`,
      primary: "Thử lại màn",
      secondary: "Chọn màn",
      primaryAction: restartLevel,
      secondaryAction: showMenuPreview
    });
    return;
  }
  loadedBall = createBall(ANCHOR.x, ANCHOR.y, 0, 0);
  state = "ready";
  showToast("Lượt mới - kéo để bắn");
}

function completeLevel() {
  state = levelIndex === 9 ? "finished" : "level-complete";
  balls = [];
  loadedBall = null;
  clearPower();
  const bonus = ammo * 450;
  score += 1200 + bonus;
  updateHighScore();
  updateHud();

  if (levelIndex < 9) {
    unlocked[mode] = Math.max(unlocked[mode], levelIndex + 1);
    localStorage.setItem(`slingshot-unlocked-${mode}`, String(unlocked[mode]));
    updateCampaignTrack();
    showMessage({
      icon: "✓",
      title: `Hoàn thành màn ${levelIndex + 1}`,
      text: `Thưởng ${bonus.toLocaleString("vi-VN")} điểm từ ${ammo} viên bi còn lại.`,
      primary: "Màn tiếp theo",
      secondary: "Chơi lại",
      tertiary: "Chọn màn",
      primaryAction: () => { levelIndex += 1; startGame({ preserveScore: true }); updateCampaignTrack(); },
      secondaryAction: restartLevel,
      tertiaryAction: showMenuPreview
    });
  } else {
    unlocked[mode] = 9;
    localStorage.setItem(`slingshot-unlocked-${mode}`, "9");
    showMessage({
      icon: "★",
      title: "Trọn vẹn 10 màn",
      text: `${score.toLocaleString("vi-VN")} điểm - bạn đã làm chủ chiếc ná.`,
      primary: "Chơi lại từ đầu",
      secondary: "Chọn chế độ",
      primaryAction: () => { levelIndex = 0; startGame(); updateCampaignTrack(); },
      secondaryAction: showMenuPreview
    });
  }
}

function showMessage(configuration) {
  introOverlay.hidden = true;
  messageOverlay.hidden = false;
  messageIcon.textContent = configuration.icon;
  messageTitle.textContent = configuration.title;
  messageText.textContent = configuration.text;
  messagePrimary.textContent = configuration.primary;
  messageSecondary.textContent = configuration.secondary;
  messageTertiary.hidden = !configuration.tertiary;
  if (configuration.tertiary) messageTertiary.textContent = configuration.tertiary;
  messageActions = {
    primary: configuration.primaryAction,
    secondary: configuration.secondaryAction,
    tertiary: configuration.tertiaryAction
  };
  pauseButton.disabled = !["paused", "ready", "flying"].includes(state);
}

function togglePause() {
  if (state === "ready" || state === "flying") {
    const returnState = state;
    state = "paused";
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
    showMessage({
      icon: "Ⅱ",
      title: "Tạm dừng",
      text: "Quỹ đạo đang được giữ nguyên.",
      primary: "Tiếp tục",
      secondary: "Chơi lại màn",
      primaryAction: () => resumeGame(returnState),
      secondaryAction: restartLevel
    });
  } else if (state === "paused") {
    messageActions.primary?.();
  }
}

function resumeGame(returnState) {
  state = returnState;
  messageOverlay.hidden = true;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
}

function drawBackground() {
  context.fillStyle = "#c8ede4";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "#acd8c8";
  context.beginPath();
  context.moveTo(0, 355);
  context.quadraticCurveTo(110, 245, 245, 355);
  context.quadraticCurveTo(380, 235, 535, 355);
  context.quadraticCurveTo(710, 210, 960, 345);
  context.lineTo(960, GROUND_Y);
  context.lineTo(0, GROUND_Y);
  context.closePath();
  context.fill();
  context.fillStyle = "#92b986";
  context.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
  context.fillStyle = "#67885f";
  context.fillRect(0, GROUND_Y, GAME_WIDTH, 7);

  context.fillStyle = "rgba(255,255,255,.72)";
  for (const cloud of [[235, 95, 42], [625, 115, 34], [820, 70, 28]]) {
    context.beginPath();
    context.arc(cloud[0] - cloud[2] * .55, cloud[1] + 6, cloud[2] * .55, 0, TAU);
    context.arc(cloud[0], cloud[1], cloud[2] * .72, 0, TAU);
    context.arc(cloud[0] + cloud[2] * .7, cloud[1] + 8, cloud[2] * .5, 0, TAU);
    context.fill();
  }
}

function drawWind(zone) {
  context.save();
  context.fillStyle = "rgba(14, 116, 144, .08)";
  context.fillRect(zone.x, zone.y, zone.width, zone.height);
  context.strokeStyle = "rgba(14, 116, 144, .45)";
  context.lineWidth = 3;
  context.setLineDash([9, 9]);
  for (let y = zone.y + 45; y < zone.y + zone.height; y += 62) {
    const fromX = zone.force > 0 ? zone.x + 20 : zone.x + zone.width - 20;
    const toX = zone.force > 0 ? zone.x + zone.width - 24 : zone.x + 24;
    context.beginPath();
    context.moveTo(fromX, y);
    context.lineTo(toX, y);
    context.stroke();
  }
  context.restore();
}

function drawBlock(block) {
  const material = MATERIALS[block.material];
  context.save();
  context.fillStyle = block.flash > 0 ? "#f8fafc" : material.color;
  context.fillRect(block.x, block.y, block.width, block.height);
  context.strokeStyle = material.edge;
  context.lineWidth = 3;
  context.strokeRect(block.x + 1.5, block.y + 1.5, block.width - 3, block.height - 3);

  if (block.material === "wood") {
    context.strokeStyle = "rgba(91,51,24,.45)";
    context.lineWidth = 2;
    if (block.width > block.height) {
      context.beginPath(); context.moveTo(block.x + 8, block.y + block.height / 2); context.lineTo(block.x + block.width - 8, block.y + block.height / 2); context.stroke();
    } else {
      context.beginPath(); context.moveTo(block.x + block.width / 2, block.y + 8); context.lineTo(block.x + block.width / 2, block.y + block.height - 8); context.stroke();
    }
  }
  if (block.material === "glass") {
    context.strokeStyle = "rgba(236,254,255,.8)";
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(block.x + 5, block.y + block.height - 8); context.lineTo(block.x + block.width - 6, block.y + 7); context.stroke();
  }
  if (block.hp < block.maxHp) {
    context.fillStyle = "rgba(0,0,0,.22)";
    context.fillRect(block.x, block.y - 7, block.width, 4);
    context.fillStyle = "#10b981";
    context.fillRect(block.x, block.y - 7, block.width * Math.max(0, block.hp / block.maxHp), 4);
  }
  context.restore();
}

function drawTarget(target) {
  context.save();
  context.translate(target.x, target.y);
  context.fillStyle = target.flash > 0 ? "#ecfdf5" : "#0b8f67";
  context.beginPath(); context.arc(0, 0, target.radius, 0, TAU); context.fill();
  context.strokeStyle = "#065f46";
  context.lineWidth = 4;
  context.beginPath(); context.arc(0, 0, target.radius - 5, 0, TAU); context.stroke();
  context.fillStyle = "#d1fae5";
  context.beginPath(); context.arc(0, 0, 5, 0, TAU); context.fill();
  if (target.hp > 1) {
    context.fillStyle = "#f8fafc";
    context.font = "800 10px system-ui";
    context.textAlign = "center";
    context.fillText("2", 0, -27);
  }
  context.restore();
}

function drawPower(power) {
  const definition = POWERS[power.type];
  const hover = Math.sin(power.phase) * 4;
  context.save();
  context.translate(power.x, power.y + hover);
  context.fillStyle = definition.color;
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = -Math.PI / 2 + index * TAU / 6;
    const x = Math.cos(angle) * power.radius;
    const y = Math.sin(angle) * power.radius;
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
  context.fillStyle = "#fff";
  context.font = "900 11px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(definition.short, 0, 1);
  context.restore();
}

function drawSpikes(spike) {
  const count = Math.max(2, Math.floor(spike.width / 18));
  const segment = spike.width / count;
  context.fillStyle = "#d64545";
  for (let index = 0; index < count; index += 1) {
    context.beginPath();
    context.moveTo(spike.x + index * segment, spike.y + spike.height);
    context.lineTo(spike.x + index * segment + segment / 2, spike.y);
    context.lineTo(spike.x + (index + 1) * segment, spike.y + spike.height);
    context.closePath();
    context.fill();
  }
}

function drawGate(gate) {
  context.fillStyle = "#475569";
  context.fillRect(gate.x, gate.y, gate.width, gate.height);
  context.fillStyle = "#94a3b8";
  for (let y = gate.y + 8; y < gate.y + gate.height; y += 22) context.fillRect(gate.x + 4, y, gate.width - 8, 7);
}

function drawSling(backOnly = false) {
  if (!backOnly) {
    context.strokeStyle = "#60361f";
    context.lineWidth = 15;
    context.lineCap = "round";
    context.beginPath(); context.moveTo(ANCHOR.x - 22, GROUND_Y); context.lineTo(ANCHOR.x - 17, ANCHOR.y - 3); context.stroke();
    context.beginPath(); context.moveTo(ANCHOR.x + 22, GROUND_Y); context.lineTo(ANCHOR.x + 17, ANCHOR.y - 3); context.stroke();
    context.strokeStyle = "#b7793f";
    context.lineWidth = 7;
    context.beginPath(); context.moveTo(ANCHOR.x - 22, GROUND_Y); context.lineTo(ANCHOR.x - 17, ANCHOR.y - 3); context.stroke();
    context.beginPath(); context.moveTo(ANCHOR.x + 22, GROUND_Y); context.lineTo(ANCHOR.x + 17, ANCHOR.y - 3); context.stroke();
  }
  if (loadedBall) {
    context.strokeStyle = "#4b2c1b";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(ANCHOR.x - 17, ANCHOR.y);
    context.lineTo(loadedBall.x, loadedBall.y);
    context.lineTo(ANCHOR.x + 17, ANCHOR.y);
    context.stroke();
  }
}

function drawTrajectory() {
  if (!dragging || !loadedBall) return;
  const velocityX = (ANCHOR.x - loadedBall.x) * 5.5;
  const velocityY = (ANCHOR.y - loadedBall.y) * 5.5;
  context.fillStyle = "rgba(5,95,70,.55)";
  for (let index = 1; index <= 18; index += 1) {
    const time = index * 0.095;
    const x = loadedBall.x + velocityX * time;
    const y = loadedBall.y + velocityY * time + GRAVITY * time * time / 2;
    if (y > GROUND_Y || x > GAME_WIDTH) break;
    context.beginPath(); context.arc(x, y, Math.max(2, 5 - index * .15), 0, TAU); context.fill();
  }
}

function drawBall(ball) {
  context.save();
  for (let index = 0; index < ball.trail.length; index += 1) {
    const point = ball.trail[index];
    context.globalAlpha = (index + 1) / ball.trail.length * .15;
    context.fillStyle = elapsed < ball.ghostUntil ? "#8b5cf6" : "#17251f";
    context.beginPath(); context.arc(point.x, point.y, ball.radius * .65, 0, TAU); context.fill();
  }
  context.globalAlpha = elapsed < ball.ghostUntil ? .58 : 1;
  context.fillStyle = ball.blast ? "#c2410c" : ball.radius > 14 ? "#334155" : "#17251f";
  context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, TAU); context.fill();
  context.fillStyle = "rgba(255,255,255,.55)";
  context.beginPath(); context.arc(ball.x - ball.radius * .28, ball.y - ball.radius * .3, ball.radius * .24, 0, TAU); context.fill();
  context.restore();
}

function drawAmmo() {
  if (!["ready", "flying"].includes(state)) return;
  context.fillStyle = "#17251f";
  const visible = Math.min(ammo, 5);
  for (let index = 0; index < visible; index += 1) {
    context.beginPath(); context.arc(52 + index * 23, 518, 8, 0, TAU); context.fill();
  }
}

function drawEffects() {
  particles.forEach((particle) => {
    context.globalAlpha = clamp(particle.life * 2, 0, 1);
    context.fillStyle = particle.color;
    context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  });
  context.globalAlpha = 1;
  explosions.forEach((explosion) => {
    context.strokeStyle = `rgba(249,115,22,${clamp(explosion.life * 1.8, 0, 1)})`;
    context.lineWidth = 8;
    context.beginPath(); context.arc(explosion.x, explosion.y, explosion.radius, 0, TAU); context.stroke();
  });
}

function draw() {
  context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground();
  windZones.forEach(drawWind);
  drawAmmo();
  drawSling(true);
  powers.forEach(drawPower);
  spikes.forEach(drawSpikes);
  blocks.forEach(drawBlock);
  gates.forEach(drawGate);
  targets.forEach(drawTarget);
  drawTrajectory();
  if (loadedBall) drawBall(loadedBall);
  balls.forEach(drawBall);
  drawSling(false);
  drawEffects();
}

function gameLoop(time) {
  const deltaTime = Math.min((time - lastTime) / 1000, 0.025);
  lastTime = time;
  if (state !== "paused") update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

modeList.addEventListener("click", (event) => {
  const button = event.target.closest(".slingshot-mode__option");
  if (button) setMode(button.dataset.mode);
});

campaignTrack.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-level]");
  if (button) selectLevel(Number(button.dataset.level));
});

startButton.addEventListener("click", () => startGame());
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartLevel);
messagePrimary.addEventListener("click", () => messageActions.primary?.());
messageSecondary.addEventListener("click", () => messageActions.secondary?.());
messageTertiary.addEventListener("click", () => messageActions.tertiary?.());

board.addEventListener("pointerdown", (event) => {
  if (state !== "ready" || !loadedBall) return;
  const rectangle = canvas.getBoundingClientRect();
  const x = (event.clientX - rectangle.left) / rectangle.width * GAME_WIDTH;
  const y = (event.clientY - rectangle.top) / rectangle.height * GAME_HEIGHT;
  if (distance(x, y, loadedBall.x, loadedBall.y) > 42) return;
  event.preventDefault();
  dragging = true;
  board.setPointerCapture?.(event.pointerId);
  setDragPosition(event);
});

board.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  event.preventDefault();
  setDragPosition(event);
});

board.addEventListener("pointerup", releaseBall);
board.addEventListener("pointercancel", releaseBall);

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  const key = event.key.toLowerCase();
  if ((key === "p" || key === "escape") && ["ready", "flying", "paused"].includes(state)) {
    event.preventDefault();
    togglePause();
  }
  if (event.key === "Enter" && !messageOverlay.hidden) messageActions.primary?.();
});

document.querySelector("#helpButton").addEventListener("click", () => {
  helpPausedGame = state === "ready" || state === "flying";
  if (helpPausedGame) togglePause();
  helpDialog.showModal();
});
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});
helpDialog.addEventListener("close", () => {
  if (helpPausedGame && state === "paused") messageActions.primary?.();
  helpPausedGame = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && ["ready", "flying"].includes(state)) togglePause();
});

loadProgress();
highScoreValue.textContent = highScore.toLocaleString("vi-VN");
setMode("campaign");
requestAnimationFrame(gameLoop);
