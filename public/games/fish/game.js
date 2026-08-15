"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");

const gameOverlay = document.querySelector("#gameOverlay");
const modeSelect = document.querySelector("#modeSelect");
const resultPanel = document.querySelector("#resultPanel");
const pausePanel = document.querySelector("#pausePanel");
const resultIcon = document.querySelector("#resultIcon");
const resultEyebrow = document.querySelector("#resultEyebrow");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const resultScore = document.querySelector("#resultScore");
const highScoreValue = document.querySelector("#highScoreValue");
const resultActions = document.querySelector("#resultActions");

const modeValue = document.querySelector("#modeValue");
const levelValue = document.querySelector("#levelValue");
const evolutionValue = document.querySelector("#evolutionValue");
const scoreValue = document.querySelector("#scoreValue");
const lifeValue = document.querySelector("#lifeValue");
const growthLabel = document.querySelector("#growthLabel");
const edibleLabel = document.querySelector("#edibleLabel");
const growthProgress = document.querySelector("#growthProgress");
const growthProgressTrack = document.querySelector(".fish-progress__track");

const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const resumeButton = document.querySelector("#resumeButton");
const gameNotice = document.querySelector("#gameNotice");
const levelPicker = document.querySelector("#levelPicker");
const campaignLabel = document.querySelector("#campaignLabel");
const campaignButton = document.querySelector("#campaignButton");
const surpriseButton = document.querySelector("#surpriseButton");

const helpDialog = document.querySelector("#helpDialog");
const helpButton = document.querySelector("#helpButton");
const closeHelpButton = document.querySelector("#closeHelpButton");
const gotItButton = document.querySelector("#gotItButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const CAMPAIGN_LEVELS = 10;
const MAX_LIVES = 3;
const SAVE_KEY = "fish-campaign-progress";
const HIGH_SCORE_KEY = "fish-high-score";
const PLAYER_COLOR = "#10b981";
const PLAYER_DARK = "#047857";

const EVOLUTION_RULES = [
  { edibleMax: 0, radius: 24, threshold: 88, label: "Cấp 1" },
  { edibleMax: 2, radius: 34, threshold: 154, label: "Cấp 2" },
  { edibleMax: 4, radius: 44, threshold: 230, label: "Cấp 3" },
];

const FISH_RADII = [13, 18, 25, 34, 44];
const FISH_GROWTH = [10, 14, 19, 26, 34];
const FISH_SCORE = [10, 20, 35, 55, 80];

const POWERUPS = {
  speed: { label: "Tăng tốc", duration: 6.5 },
  shield: { label: "Khiên", duration: 0 },
  freeze: { label: "Đóng băng", duration: 4.5 },
  magnet: { label: "Nam châm", duration: 7 },
  double: { label: "Dinh dưỡng x2", duration: 7.5 },
};

const BIOMES = [
  {
    name: "Vịnh Ngọc",
    water: "#9bd8df",
    deep: "#6fb9c8",
    floor: "#d8c89a",
    detail: "#5d9f84",
    kind: "lagoon",
    fish: [
      ["Cá Cơm", "#e5f0e7", "#7ea78e"],
      ["Cá Bống", "#f5c86f", "#c28b3f"],
      ["Cá Mó", "#69c6bd", "#2d9188"],
      ["Cá Hồng", "#ed8b8e", "#b95057"],
      ["Cá Mú", "#536f6a", "#334944"],
    ],
  },
  {
    name: "Rạn San Hô",
    water: "#77c8d4",
    deep: "#4f9fac",
    floor: "#d7b685",
    detail: "#d46e62",
    kind: "reef",
    fish: [
      ["Cá Thia", "#f2dc75", "#bfa83d"],
      ["Cá Bướm", "#f5a75f", "#d0702f"],
      ["Cá Thiên Thần", "#77b8d8", "#3e7fa1"],
      ["Cá Kèn", "#9a79c4", "#644893"],
      ["Cá Nhồng", "#657d86", "#3d5057"],
    ],
  },
  {
    name: "Rừng Tảo",
    water: "#6fbeb2",
    deep: "#3d8f82",
    floor: "#a88f65",
    detail: "#357856",
    kind: "kelp",
    fish: [
      ["Cá Trích", "#dce4d9", "#7d9488"],
      ["Cá Thu Non", "#77a9bb", "#456f7e"],
      ["Cá Hề", "#f08a55", "#b64b27"],
      ["Cá Mặt Trăng", "#c2c7a7", "#83896d"],
      ["Cá Sói", "#596d72", "#36474c"],
    ],
  },
  {
    name: "Hẻm Biển Xanh",
    water: "#5da6c7",
    deep: "#336e92",
    floor: "#667d82",
    detail: "#2d536c",
    kind: "trench",
    fish: [
      ["Cá Mắt Bạc", "#d8e5ea", "#8ba9b4"],
      ["Cá Kiếm Non", "#7cb4c9", "#46778a"],
      ["Cá Bò", "#b7a779", "#7c6a3e"],
      ["Cá Đuối", "#65789a", "#40506d"],
      ["Cá Mập Rạn", "#4f626d", "#2f3d45"],
    ],
  },
  {
    name: "Vịnh Núi Lửa",
    water: "#4c8fa2",
    deep: "#2c6477",
    floor: "#675c55",
    detail: "#c56646",
    kind: "volcanic",
    fish: [
      ["Cá Nóc Non", "#dfc96e", "#9f8d35"],
      ["Cá Sơn", "#dd8d67", "#a65338"],
      ["Cá Hồng Đá", "#c66a62", "#8f3d39"],
      ["Cá Chình", "#6c736a", "#41473f"],
      ["Cá Mập Xám", "#4d5960", "#2f383d"],
    ],
  },
  {
    name: "Biển Băng",
    water: "#a9d7e5",
    deep: "#77aebf",
    floor: "#d5e4e6",
    detail: "#edf7f8",
    kind: "ice",
    fish: [
      ["Cá Cơm Băng", "#eef5f7", "#9fb6bd"],
      ["Cá Tuyết", "#d4d9cf", "#8f988d"],
      ["Cá Hồi", "#e78972", "#ad4e39"],
      ["Cá Sói Đại Dương", "#7b8790", "#4b565e"],
      ["Cá Mập Greenland", "#59666d", "#39454b"],
    ],
  },
  {
    name: "Rạn Phát Sáng",
    water: "#426e86",
    deep: "#29495f",
    floor: "#41545e",
    detail: "#7fd8c4",
    kind: "glow",
    fish: [
      ["Cá Đèn", "#9fe3d1", "#4ba98f"],
      ["Cá Neon", "#86c5e6", "#477fa0"],
      ["Cá Rồng Non", "#d1a5df", "#8e5ca2"],
      ["Cá Nanh", "#7c92a5", "#4d6170"],
      ["Cá Cần Câu", "#48525d", "#282f37"],
    ],
  },
  {
    name: "Xác Tàu Cổ",
    water: "#648d92",
    deep: "#405f64",
    floor: "#81735f",
    detail: "#554b3d",
    kind: "wreck",
    fish: [
      ["Cá Mòi", "#d7d9ce", "#92978a"],
      ["Cá Dìa", "#a6ad6f", "#6d7540"],
      ["Cá Hổ", "#d49a5b", "#945f2a"],
      ["Cá Cam", "#9a7c62", "#66503f"],
      ["Cá Mập Hổ", "#5c6260", "#383e3c"],
    ],
  },
  {
    name: "Vực Chạng Vạng",
    water: "#405b78",
    deep: "#26384f",
    floor: "#37404d",
    detail: "#746e9b",
    kind: "twilight",
    fish: [
      ["Cá Bạc", "#d7dde6", "#8f9bab"],
      ["Cá Tím", "#a58ac7", "#705790"],
      ["Cá Rìu", "#738da7", "#465f78"],
      ["Cá Mập Ma", "#667083", "#3e4655"],
      ["Cá Mập Sáu Mang", "#424b58", "#242c34"],
    ],
  },
  {
    name: "Thánh Địa Ngọc Lục",
    water: "#5cae9a",
    deep: "#327967",
    floor: "#b2a878",
    detail: "#2d7056",
    kind: "sanctuary",
    fish: [
      ["Cá Ngọc", "#bbdfca", "#6dac82"],
      ["Cá Vẹt", "#6ec6ae", "#338d77"],
      ["Cá Hoàng Đế", "#e0b85f", "#aa7d2d"],
      ["Cá Đuối Đại Bàng", "#6d7f85", "#44565c"],
      ["Cá Mập Trắng", "#59666b", "#343f43"],
    ],
  },
];

let state = "menu";
let mode = "campaign";
let level = 1;
let selectedLevel = 1;
let unlockedLevel = loadProgress();
let highScore = loadHighScore();

let player = createPlayer();
let fish = [];
let powerups = [];
let particles = [];
let score = 0;
let lives = MAX_LIVES;
let evolution = 1;
let growth = 0;
let elapsed = 0;
let spawnTimer = 0;
let powerupTimer = 0;
let lastFrame = performance.now();
let noticeTimer = null;

const effects = {
  speed: 0,
  freeze: 0,
  magnet: 0,
  double: 0,
  shield: false,
};

const keys = new Set();
const pointer = {
  active: false,
  x: WIDTH / 2,
  y: HEIGHT / 2,
  id: null,
};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function loadProgress() {
  const value = Number.parseInt(localStorage.getItem(SAVE_KEY), 10);
  return Number.isFinite(value) ? clamp(value, 1, CAMPAIGN_LEVELS) : 1;
}

function saveProgress(value) {
  unlockedLevel = clamp(value, 1, CAMPAIGN_LEVELS);
  localStorage.setItem(SAVE_KEY, String(unlockedLevel));
}

function loadHighScore() {
  const value = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function saveHighScore() {
  if (score <= highScore) return;
  highScore = score;
  localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
}

function createPlayer() {
  return {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: EVOLUTION_RULES[0].radius,
    direction: 1,
    invulnerable: 0,
    pulse: 0,
  };
}

function currentBiome() {
  return BIOMES[level - 1];
}

function currentEvolutionRule() {
  return EVOLUTION_RULES[evolution - 1];
}

function levelDifficulty() {
  return 1 + (level - 1) * 0.065;
}

function growthThreshold() {
  const surpriseFactor = mode === "surprise" ? 0.92 : 1;
  return currentEvolutionRule().threshold * (1 + (level - 1) * 0.035) * surpriseFactor;
}

function isEdible(type) {
  return type <= currentEvolutionRule().edibleMax;
}

function setupLevelPicker() {
  levelPicker.replaceChildren();

  for (let index = 1; index <= CAMPAIGN_LEVELS; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-picker__button";
    button.textContent = String(index).padStart(2, "0");
    button.disabled = index > unlockedLevel;
    button.classList.toggle("is-selected", index === selectedLevel);
    button.setAttribute(
      "aria-label",
      index > unlockedLevel ? `Vùng biển ${index} chưa mở khóa` : `Chọn vùng biển ${index}: ${BIOMES[index - 1].name}`,
    );
    button.addEventListener("click", () => {
      selectedLevel = index;
      setupLevelPicker();
    });
    levelPicker.append(button);
  }

  campaignLabel.textContent = `${BIOMES[selectedLevel - 1].name} · đã mở ${unlockedLevel}/10`;
}

function resetEffects() {
  effects.speed = 0;
  effects.freeze = 0;
  effects.magnet = 0;
  effects.double = 0;
  effects.shield = false;
}

function resetRun() {
  player = createPlayer();
  fish = [];
  powerups = [];
  particles = [];
  score = 0;
  lives = MAX_LIVES;
  evolution = 1;
  growth = 0;
  elapsed = 0;
  spawnTimer = 0;
  powerupTimer = mode === "surprise" ? 2.6 : 6;
  resetEffects();
  pointer.active = false;
  pointer.x = WIDTH / 2;
  pointer.y = HEIGHT / 2;
  updatePlayerSize();
}

function startGame(nextMode, requestedLevel = null) {
  mode = nextMode;
  level = requestedLevel || Math.floor(Math.random() * CAMPAIGN_LEVELS) + 1;
  resetRun();

  state = "playing";
  document.body.classList.remove("is-paused");
  gameOverlay.hidden = true;
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  pausePanel.hidden = true;
  pauseButton.disabled = false;
  restartButton.disabled = false;

  showNotice(`${currentBiome().name} · ăn cá nhỏ hơn để tiến hóa`, 2.3);
  updateUI();
  lastFrame = performance.now();
}

function openMenu() {
  state = "menu";
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  pausePanel.hidden = true;
  gameOverlay.hidden = false;
  pauseButton.disabled = true;
  restartButton.disabled = true;
  document.body.classList.remove("is-paused");
  setupLevelPicker();
  updateUI();
}

function pauseGame() {
  if (state !== "playing") return;
  state = "paused";
  pausePanel.hidden = false;
  modeSelect.hidden = true;
  resultPanel.hidden = true;
  gameOverlay.hidden = false;
  document.body.classList.add("is-paused");
  updateUI();
}

function resumeGame() {
  if (state !== "paused") return;
  state = "playing";
  gameOverlay.hidden = true;
  pausePanel.hidden = true;
  document.body.classList.remove("is-paused");
  lastFrame = performance.now();
  updateUI();
}

function restartGame() {
  if (state === "menu") return;
  startGame(mode, level);
}

function updatePlayerSize() {
  player.radius = currentEvolutionRule().radius;
}

function chooseFishType() {
  const roll = Math.random();

  if (evolution === 1) {
    if (roll < 0.43) return 0;
    if (roll < 0.64) return 1;
    if (roll < 0.79) return 2;
    if (roll < 0.91) return 3;
    return 4;
  }

  if (evolution === 2) {
    if (roll < 0.25) return 0;
    if (roll < 0.48) return 1;
    if (roll < 0.70) return 2;
    if (roll < 0.87) return 3;
    return 4;
  }

  if (roll < 0.18) return 0;
  if (roll < 0.37) return 1;
  if (roll < 0.59) return 2;
  if (roll < 0.81) return 3;
  return 4;
}

function spawnFish() {
  const type = chooseFishType();
  const fromLeft = Math.random() > 0.5;
  const radius = FISH_RADII[type] * (1 + (level - 1) * 0.008);
  const baseSpeed = randomBetween(65, 110) * levelDifficulty() * (1 + type * 0.055);
  const direction = fromLeft ? 1 : -1;

  fish.push({
    type,
    x: fromLeft ? -radius - 12 : WIDTH + radius + 12,
    y: randomBetween(58 + radius, HEIGHT - 54 - radius),
    radius,
    direction,
    speed: baseSpeed,
    wobble: randomBetween(0, Math.PI * 2),
    wobbleSpeed: randomBetween(1.1, 2.4),
    wobbleSize: randomBetween(5, 16),
    dead: false,
    flash: 0,
  });
}

function scheduleFishSpawns(dt) {
  spawnTimer -= dt;
  const targetCount = 20 + Math.min(level, 6);

  if (spawnTimer <= 0 && fish.length < targetCount) {
    spawnFish();
    if (Math.random() < 0.18 + level * 0.012 && fish.length < targetCount - 1) spawnFish();
    spawnTimer = randomBetween(0.28, 0.62) / Math.min(1.32, levelDifficulty());
  }
}

function randomPowerType() {
  const types = Object.keys(POWERUPS);
  return types[Math.floor(Math.random() * types.length)];
}

function spawnPowerup() {
  const type = randomPowerType();
  powerups.push({
    type,
    x: randomBetween(90, WIDTH - 90),
    y: randomBetween(80, HEIGHT - 80),
    radius: 19,
    life: 11,
    pulse: randomBetween(0, Math.PI * 2),
  });
}

function schedulePowerups(dt) {
  powerupTimer -= dt;
  if (powerupTimer > 0) return;

  const limit = mode === "surprise" ? 3 : 1;
  if (powerups.length < limit) spawnPowerup();

  powerupTimer = mode === "surprise"
    ? randomBetween(3.8, 6.2)
    : randomBetween(9.5, 13.5);
}

function updateInput(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;

  const keyboardActive = dx !== 0 || dy !== 0;
  const baseSpeed = 320;
  const speed = baseSpeed * (effects.speed > 0 ? 1.5 : 1);

  if (keyboardActive) {
    pointer.active = false;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    if (dx !== 0) player.direction = Math.sign(dx);
  } else if (pointer.active) {
    const deltaX = pointer.x - player.x;
    const deltaY = pointer.y - player.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 3) {
      const step = Math.min(distance, speed * dt);
      player.x += deltaX / distance * step;
      player.y += deltaY / distance * step;
      if (Math.abs(deltaX) > 2) player.direction = Math.sign(deltaX);
    }
  }

  player.x = clamp(player.x, player.radius + 7, WIDTH - player.radius - 7);
  player.y = clamp(player.y, player.radius + 7, HEIGHT - player.radius - 7);
}

function updateEffects(dt) {
  effects.speed = Math.max(0, effects.speed - dt);
  effects.freeze = Math.max(0, effects.freeze - dt);
  effects.magnet = Math.max(0, effects.magnet - dt);
  effects.double = Math.max(0, effects.double - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.pulse += dt * 5;
}

function updateFish(dt) {
  const frozen = effects.freeze > 0;

  for (const item of fish) {
    if (item.dead) continue;

    item.wobble += item.wobbleSpeed * dt;
    item.flash = Math.max(0, item.flash - dt);

    if (!frozen) {
      item.x += item.direction * item.speed * dt;
      item.y += Math.sin(item.wobble) * item.wobbleSize * dt;
    }

    if (effects.magnet > 0 && isEdible(item.type)) {
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 1 && distance < 250) {
        const pull = (1 - distance / 250) * 190 * dt;
        item.x += dx / distance * pull;
        item.y += dy / distance * pull;
      }
    }
  }

  fish = fish.filter((item) => (
    !item.dead
    && item.x > -110
    && item.x < WIDTH + 110
    && item.y > -90
    && item.y < HEIGHT + 90
  ));
}

function updatePowerups(dt) {
  for (const item of powerups) {
    item.life -= dt;
    item.pulse += dt * 3;
  }
  powerups = powerups.filter((item) => item.life > 0);
}

function addParticles(x, y, color, count = 8) {
  for (let index = 0; index < count; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(35, 110);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randomBetween(1.6, 4),
      life: randomBetween(0.28, 0.58),
      color,
    });
  }
}

function updateParticles(dt) {
  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.97;
    particle.vy *= 0.97;
    particle.life -= dt;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function collides(a, b, factor = 0.72) {
  const distance = Math.hypot(a.x - b.x, a.y - b.y);
  return distance < (a.radius + b.radius) * factor;
}

function eatFish(item) {
  item.dead = true;
  const multiplier = effects.double > 0 ? 2 : 1;
  const gain = FISH_GROWTH[item.type] * multiplier;
  score += Math.round(FISH_SCORE[item.type] * multiplier * (1 + (level - 1) * 0.08));
  growth += gain;
  addParticles(item.x, item.y, currentBiome().fish[item.type][1], 7);
  checkEvolution();
}

function hitDangerousFish(item) {
  if (player.invulnerable > 0) return;

  if (effects.shield) {
    effects.shield = false;
    player.invulnerable = 0.9;
    item.direction *= -1;
    item.x += item.direction * 35;
    addParticles(player.x, player.y, "#d7fff2", 12);
    showNotice("Khiên đã chặn một va chạm", 1.2);
    updateUI();
    return;
  }

  lives -= 1;
  player.invulnerable = 1.8;
  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  pointer.active = false;
  addParticles(player.x, player.y, "#ffffff", 14);

  if (lives <= 0) {
    finishGame(false);
    return;
  }

  showNotice(`Mất một mạng · còn ${lives}/${MAX_LIVES}`, 1.4);
  updateUI();
}

function collectPowerup(item) {
  item.life = -1;

  if (item.type === "shield") {
    effects.shield = true;
  } else {
    effects[item.type] = POWERUPS[item.type].duration;
  }

  addParticles(item.x, item.y, "#d8fff4", 12);
  showNotice(`${POWERUPS[item.type].label} đã kích hoạt`, 1.2);
}

function checkCollisions() {
  for (const item of fish) {
    if (item.dead || !collides(player, item)) continue;

    if (isEdible(item.type)) {
      eatFish(item);
    } else {
      hitDangerousFish(item);
    }

    if (state !== "playing") return;
  }

  for (const item of powerups) {
    if (item.life > 0 && collides(player, item, 0.78)) collectPowerup(item);
  }
}

function checkEvolution() {
  const threshold = growthThreshold();
  if (growth < threshold) {
    updateUI();
    return;
  }

  if (evolution < 3) {
    evolution += 1;
    growth = 0;
    updatePlayerSize();
    player.invulnerable = Math.max(player.invulnerable, 1.2);
    addParticles(player.x, player.y, PLAYER_COLOR, 18);
    showNotice(
      evolution === 2
        ? "Tiến hóa cấp 2 · giờ ăn được 3 loại cá"
        : "Tiến hóa cấp 3 · giờ ăn được cả 5 loại cá",
      2,
    );
    updateUI();
    return;
  }

  finishGame(true);
}

function finishGame(won) {
  state = "result";
  pointer.active = false;
  saveHighScore();

  if (won && mode === "campaign" && level < CAMPAIGN_LEVELS) {
    saveProgress(Math.max(unlockedLevel, level + 1));
    selectedLevel = Math.min(level + 1, CAMPAIGN_LEVELS);
  }

  gameOverlay.hidden = false;
  modeSelect.hidden = true;
  pausePanel.hidden = true;
  resultPanel.hidden = false;
  pauseButton.disabled = true;
  restartButton.disabled = false;
  document.body.classList.remove("is-paused");

  resultIcon.textContent = won ? "✓" : "×";
  resultEyebrow.textContent = won ? "Vùng biển an toàn" : "Cuộc săn kết thúc";
  resultTitle.textContent = won
    ? (mode === "campaign" && level === CAMPAIGN_LEVELS ? "Bạn đã chinh phục cả 10 vùng biển" : "Bạn đã làm chủ vùng biển")
    : "Bạn đã gặp một con cá quá lớn";
  resultText.textContent = won
    ? `${currentBiome().name} đã hoàn thành với đủ 3 cấp tiến hóa.`
    : "Thử lại, ưu tiên cá nhỏ và giữ khoảng trống để né cá săn mồi.";
  resultScore.textContent = formatScore(score);
  highScoreValue.textContent = formatScore(highScore);

  buildResultActions(won);
  setupLevelPicker();
  updateUI();
}

function makeAction(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function buildResultActions(won) {
  resultActions.replaceChildren();

  if (won && mode === "campaign" && level < CAMPAIGN_LEVELS) {
    resultActions.append(
      makeAction("Màn tiếp theo", "button button--primary", () => startGame("campaign", level + 1)),
    );
  } else if (won && mode === "surprise") {
    resultActions.append(
      makeAction("Bất ngờ khác", "button button--primary", () => startGame("surprise")),
    );
  } else {
    resultActions.append(
      makeAction("Chơi lại", "button button--primary", () => startGame(mode, level)),
    );
  }

  resultActions.append(
    makeAction("Về menu", "button button--secondary", openMenu),
  );
}

function formatScore(value) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value)));
}

function updateUI() {
  modeValue.textContent = mode === "campaign" ? "Vượt ải" : "Bất ngờ";
  levelValue.textContent = mode === "campaign"
    ? `${String(level).padStart(2, "0")} / 10`
    : currentBiome().name;
  evolutionValue.textContent = `Cấp ${evolution} / 3`;
  scoreValue.textContent = formatScore(score);
  lifeValue.textContent = `${lives} / ${MAX_LIVES}`;

  const threshold = growthThreshold();
  const percentage = clamp(growth / threshold * 100, 0, 100);
  growthLabel.textContent = `Tiến hóa cấp ${evolution}`;
  edibleLabel.textContent = `Ăn được: ${currentEvolutionRule().edibleMax + 1} / 5 loại cá`;
  growthProgress.style.width = `${percentage}%`;
  growthProgressTrack.setAttribute("aria-valuenow", String(Math.round(percentage)));
}

function showNotice(message, duration = 1.4) {
  if (noticeTimer) window.clearTimeout(noticeTimer);
  gameNotice.textContent = message;
  gameNotice.hidden = false;
  noticeTimer = window.setTimeout(() => {
    gameNotice.hidden = true;
  }, duration * 1000);
}

function update(dt) {
  elapsed += dt;
  updateEffects(dt);
  updateInput(dt);
  scheduleFishSpawns(dt);
  schedulePowerups(dt);
  updateFish(dt);
  updatePowerups(dt);
  updateParticles(dt);
  checkCollisions();
}

function drawBackground() {
  const biome = currentBiome();

  context.fillStyle = biome.water;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = biome.deep;
  context.fillRect(0, HEIGHT * 0.64, WIDTH, HEIGHT * 0.36);

  drawWaterLines(biome);
  drawScenery(biome);

  context.fillStyle = "rgba(255, 255, 255, 0.45)";
  for (let index = 0; index < 18; index += 1) {
    const x = (index * 83 + elapsed * (8 + index % 4)) % (WIDTH + 40) - 20;
    const y = 42 + (index * 61) % 430;
    const radius = 1.5 + index % 3;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawWaterLines(biome) {
  context.save();
  context.globalAlpha = 0.18;
  context.strokeStyle = biome.detail;
  context.lineWidth = 2;

  for (let row = 0; row < 4; row += 1) {
    const y = 70 + row * 105;
    context.beginPath();
    for (let x = -30; x <= WIDTH + 30; x += 45) {
      const offset = Math.sin(x * 0.018 + elapsed * 0.45 + row) * 5;
      if (x === -30) context.moveTo(x, y + offset);
      else context.lineTo(x, y + offset);
    }
    context.stroke();
  }
  context.restore();
}

function drawScenery(biome) {
  context.save();

  if (biome.kind === "lagoon" || biome.kind === "sanctuary") {
    drawSeabed(biome.floor);
    drawPlants(biome.detail, 11, biome.kind === "sanctuary" ? 92 : 62);
  } else if (biome.kind === "reef") {
    drawSeabed(biome.floor);
    drawCoral(biome.detail);
  } else if (biome.kind === "kelp") {
    drawSeabed(biome.floor);
    drawPlants(biome.detail, 14, 128);
  } else if (biome.kind === "trench") {
    drawTrenchRocks(biome.floor);
  } else if (biome.kind === "volcanic") {
    drawSeabed(biome.floor);
    drawVolcanicRocks(biome.detail);
  } else if (biome.kind === "ice") {
    drawIce(biome.detail);
  } else if (biome.kind === "glow") {
    drawGlow(biome.detail);
  } else if (biome.kind === "wreck") {
    drawSeabed(biome.floor);
    drawWreck(biome.detail);
  } else if (biome.kind === "twilight") {
    drawTwilight(biome.detail);
  }

  context.restore();
}

function drawSeabed(color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, HEIGHT - 50);
  for (let x = 0; x <= WIDTH; x += 80) {
    context.lineTo(x, HEIGHT - 45 + Math.sin(x * 0.02) * 9);
  }
  context.lineTo(WIDTH, HEIGHT);
  context.lineTo(0, HEIGHT);
  context.closePath();
  context.fill();
}

function drawPlants(color, count, height) {
  context.strokeStyle = color;
  context.lineWidth = 8;
  context.lineCap = "round";
  for (let index = 0; index < count; index += 1) {
    const x = 28 + index * (WIDTH - 56) / Math.max(1, count - 1);
    const sway = Math.sin(elapsed * 0.8 + index) * 10;
    context.beginPath();
    context.moveTo(x, HEIGHT - 34);
    context.quadraticCurveTo(x - 20, HEIGHT - height * 0.52, x + sway, HEIGHT - height);
    context.stroke();
  }
}

function drawCoral(color) {
  context.strokeStyle = color;
  context.lineWidth = 10;
  context.lineCap = "round";
  const anchors = [120, 290, 520, 760, 1010, 1120];
  for (const [index, x] of anchors.entries()) {
    const baseY = HEIGHT - 36;
    const height = 45 + (index % 3) * 18;
    context.beginPath();
    context.moveTo(x, baseY);
    context.lineTo(x, baseY - height);
    context.moveTo(x, baseY - 25);
    context.lineTo(x - 20, baseY - 48);
    context.moveTo(x, baseY - 37);
    context.lineTo(x + 22, baseY - 62);
    context.stroke();
  }
}

function drawTrenchRocks(color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, HEIGHT);
  context.lineTo(0, HEIGHT - 125);
  context.lineTo(115, HEIGHT - 180);
  context.lineTo(210, HEIGHT - 82);
  context.lineTo(315, HEIGHT - 142);
  context.lineTo(430, HEIGHT);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(WIDTH, HEIGHT);
  context.lineTo(WIDTH, HEIGHT - 150);
  context.lineTo(1080, HEIGHT - 205);
  context.lineTo(980, HEIGHT - 95);
  context.lineTo(850, HEIGHT - 160);
  context.lineTo(760, HEIGHT);
  context.closePath();
  context.fill();
}

function drawVolcanicRocks(accent) {
  context.fillStyle = "#4e4743";
  for (let index = 0; index < 8; index += 1) {
    const x = 40 + index * 165;
    const y = HEIGHT - 64;
    context.beginPath();
    context.moveTo(x - 48, HEIGHT);
    context.lineTo(x, y - (index % 2) * 25);
    context.lineTo(x + 58, HEIGHT);
    context.closePath();
    context.fill();
  }

  context.fillStyle = accent;
  context.fillRect(560, HEIGHT - 43, 92, 6);
}

function drawIce(color) {
  context.fillStyle = color;
  const floes = [
    [0, 0, 230, 46],
    [320, 0, 210, 32],
    [690, 0, 270, 42],
    [1050, 0, 150, 35],
  ];
  for (const floe of floes) {
    context.fillRect(...floe);
  }
  context.fillStyle = "rgba(255,255,255,.34)";
  context.fillRect(0, HEIGHT - 36, WIDTH, 36);
}

function drawGlow(color) {
  context.fillStyle = color;
  context.globalAlpha = 0.42;
  for (let index = 0; index < 28; index += 1) {
    const x = 18 + (index * 137) % WIDTH;
    const y = 80 + (index * 83) % (HEIGHT - 130);
    const radius = 2 + index % 4;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawWreck(color) {
  context.fillStyle = color;
  context.globalAlpha = 0.65;
  context.beginPath();
  context.moveTo(720, HEIGHT - 62);
  context.lineTo(1050, HEIGHT - 62);
  context.lineTo(980, HEIGHT - 12);
  context.lineTo(760, HEIGHT - 12);
  context.closePath();
  context.fill();
  context.fillRect(850, HEIGHT - 180, 12, 120);
  context.fillRect(860, HEIGHT - 176, 112, 7);
  context.globalAlpha = 1;
}

function drawTwilight(color) {
  context.fillStyle = color;
  context.globalAlpha = 0.35;
  for (let index = 0; index < 12; index += 1) {
    const x = 30 + index * 108;
    const height = 45 + (index % 4) * 28;
    context.beginPath();
    context.moveTo(x - 50, HEIGHT);
    context.lineTo(x, HEIGHT - height);
    context.lineTo(x + 55, HEIGHT);
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawFish(item, isPlayer = false) {
  const biome = currentBiome();
  const definition = isPlayer ? null : biome.fish[item.type];
  const bodyColor = isPlayer ? PLAYER_COLOR : definition[1];
  const accentColor = isPlayer ? PLAYER_DARK : definition[2];
  const direction = item.direction || 1;

  context.save();
  context.translate(item.x, item.y);
  context.scale(direction, 1);

  if (isPlayer && player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0) {
    context.globalAlpha = 0.42;
  }

  context.fillStyle = accentColor;
  context.beginPath();
  context.moveTo(-item.radius * 0.78, 0);
  context.lineTo(-item.radius * 1.42, -item.radius * 0.72);
  context.lineTo(-item.radius * 1.28, item.radius * 0.76);
  context.closePath();
  context.fill();

  context.fillStyle = bodyColor;
  context.beginPath();
  context.ellipse(0, 0, item.radius * 1.18, item.radius * 0.72, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = accentColor;
  context.beginPath();
  context.moveTo(-item.radius * 0.1, -item.radius * 0.55);
  context.lineTo(item.radius * 0.22, -item.radius * 1.02);
  context.lineTo(item.radius * 0.42, -item.radius * 0.47);
  context.closePath();
  context.fill();

  if (isPlayer && evolution >= 2) {
    context.strokeStyle = "rgba(255,255,255,.72)";
    context.lineWidth = Math.max(2, item.radius * 0.08);
    context.beginPath();
    context.moveTo(-item.radius * 0.28, -item.radius * 0.58);
    context.lineTo(-item.radius * 0.1, item.radius * 0.58);
    if (evolution === 3) {
      context.moveTo(item.radius * 0.12, -item.radius * 0.62);
      context.lineTo(item.radius * 0.29, item.radius * 0.54);
    }
    context.stroke();
  }

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(item.radius * 0.68, -item.radius * 0.15, Math.max(2.8, item.radius * 0.12), 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#10211b";
  context.beginPath();
  context.arc(item.radius * 0.72, -item.radius * 0.15, Math.max(1.4, item.radius * 0.055), 0, Math.PI * 2);
  context.fill();

  if (!isPlayer && item.flash > 0) {
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(0, 0, item.radius * 1.2, item.radius * 0.74, 0, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();

  if (isPlayer) {
    drawPlayerEffects();
  }
}

function drawPlayerEffects() {
  if (effects.shield) {
    context.save();
    context.strokeStyle = "rgba(225,255,248,.92)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(player.x, player.y, player.radius * 1.62, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  if (effects.magnet > 0) {
    context.save();
    context.strokeStyle = "rgba(214,255,243,.38)";
    context.lineWidth = 2;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.arc(player.x, player.y, 130 + Math.sin(player.pulse) * 6, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
}

function drawPowerup(item) {
  const alpha = item.life < 2.5 ? 0.45 + (Math.sin(item.pulse * 7) + 1) * 0.25 : 0.92;
  context.save();
  context.globalAlpha = alpha;
  context.translate(item.x, item.y);

  context.fillStyle = "rgba(246,255,252,.92)";
  context.strokeStyle = "rgba(16,101,87,.58)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, item.radius + Math.sin(item.pulse) * 1.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = PLAYER_DARK;
  context.fillStyle = PLAYER_DARK;
  context.lineWidth = 2.2;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (item.type === "speed") {
    context.beginPath();
    context.moveTo(2, -11);
    context.lineTo(-6, 2);
    context.lineTo(0, 2);
    context.lineTo(-3, 12);
    context.lineTo(8, -3);
    context.lineTo(2, -3);
    context.closePath();
    context.fill();
  } else if (item.type === "shield") {
    context.beginPath();
    context.moveTo(0, -11);
    context.lineTo(9, -7);
    context.lineTo(8, 2);
    context.quadraticCurveTo(6, 9, 0, 12);
    context.quadraticCurveTo(-6, 9, -8, 2);
    context.lineTo(-9, -7);
    context.closePath();
    context.stroke();
  } else if (item.type === "freeze") {
    for (let index = 0; index < 3; index += 1) {
      context.rotate(Math.PI / 3);
      context.beginPath();
      context.moveTo(-10, 0);
      context.lineTo(10, 0);
      context.stroke();
    }
  } else if (item.type === "magnet") {
    context.beginPath();
    context.moveTo(-8, -9);
    context.lineTo(-8, 3);
    context.quadraticCurveTo(-8, 11, 0, 11);
    context.quadraticCurveTo(8, 11, 8, 3);
    context.lineTo(8, -9);
    context.stroke();
  } else {
    context.font = "900 12px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("2×", 0, 1);
  }

  context.restore();
}

function drawParticles() {
  for (const particle of particles) {
    context.save();
    context.globalAlpha = clamp(particle.life * 2.4, 0, 1);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function drawEffectStatus() {
  const active = [];
  if (effects.speed > 0) active.push(["Tốc", effects.speed]);
  if (effects.shield) active.push(["Khiên", null]);
  if (effects.freeze > 0) active.push(["Băng", effects.freeze]);
  if (effects.magnet > 0) active.push(["Hút", effects.magnet]);
  if (effects.double > 0) active.push(["2×", effects.double]);

  if (active.length === 0) return;

  context.save();
  context.font = "700 14px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";

  let x = 16;
  for (const [label, timer] of active) {
    const text = timer === null ? label : `${label} ${Math.ceil(timer)}s`;
    const width = context.measureText(text).width + 22;
    context.fillStyle = "rgba(5, 25, 28, .72)";
    context.fillRect(x, 16, width, 30);
    context.fillStyle = "#ffffff";
    context.fillText(text, x + 11, 31);
    x += width + 6;
  }
  context.restore();
}

function drawBiomeLabel() {
  context.save();
  context.fillStyle = "rgba(5, 25, 28, .66)";
  context.fillRect(16, HEIGHT - 46, 210, 30);
  context.fillStyle = "#ffffff";
  context.font = "700 14px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";
  context.fillText(currentBiome().name, 28, HEIGHT - 31);
  context.restore();
}

function draw() {
  drawBackground();

  for (const item of powerups) drawPowerup(item);
  for (const item of fish) drawFish(item);
  drawParticles();
  drawFish(player, true);
  drawEffectStatus();
  drawBiomeLabel();
}

function frame(timestamp) {
  const dt = clamp((timestamp - lastFrame) / 1000, 0, 0.034);
  lastFrame = timestamp;

  if (state === "playing") update(dt);
  draw();
  window.requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width * WIDTH,
    y: (event.clientY - rect.top) / rect.height * HEIGHT,
  };
}

function setPointer(event) {
  const point = canvasPoint(event);
  pointer.x = clamp(point.x, 0, WIDTH);
  pointer.y = clamp(point.y, 0, HEIGHT);
  pointer.active = true;
}

canvas.addEventListener("pointerdown", (event) => {
  if (state !== "playing") return;
  pointer.id = event.pointerId;
  canvas.setPointerCapture?.(event.pointerId);
  setPointer(event);
  event.preventDefault();
});

canvas.addEventListener("pointermove", (event) => {
  if (state !== "playing") return;
  if (event.pointerType === "touch" && pointer.id !== event.pointerId) return;
  setPointer(event);
  if (event.pointerType === "touch") event.preventDefault();
});

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerType === "touch") {
    pointer.active = false;
    pointer.id = null;
  }
});

canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
  pointer.id = null;
});

canvas.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse") pointer.active = false;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"].includes(key)) {
    keys.add(key);
    if (state === "playing") event.preventDefault();
  }

  if (key === "p" && !event.repeat) {
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  }

  if (key === "escape" && state === "paused") resumeGame();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
  keys.clear();
  if (state === "playing") pauseGame();
});

campaignButton.addEventListener("click", () => startGame("campaign", selectedLevel));
surpriseButton.addEventListener("click", () => startGame("surprise"));

pauseButton.addEventListener("click", () => {
  if (state === "playing") pauseGame();
  else if (state === "paused") resumeGame();
});

resumeButton.addEventListener("click", resumeGame);
restartButton.addEventListener("click", restartGame);

helpButton.addEventListener("click", () => helpDialog.showModal());
closeHelpButton.addEventListener("click", () => helpDialog.close());
gotItButton.addEventListener("click", () => helpDialog.close());

helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

setupLevelPicker();
updateUI();
draw();
window.requestAnimationFrame(frame);
