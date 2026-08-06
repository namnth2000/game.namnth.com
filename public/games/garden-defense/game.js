"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const gameOverlay = document.querySelector("#gameOverlay");
const modeSelect = document.querySelector("#modeSelect");
const resultPanel = document.querySelector("#resultPanel");
const resultIcon = document.querySelector("#resultIcon");
const resultEyebrow = document.querySelector("#resultEyebrow");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const resultActions = document.querySelector("#resultActions");
const sunValue = document.querySelector("#sunValue");
const modeLabel = document.querySelector("#modeLabel");
const levelValue = document.querySelector("#levelValue");
const waveLabel = document.querySelector("#waveLabel");
const enemyValue = document.querySelector("#enemyValue");
const waveProgress = document.querySelector("#waveProgress");
const healthPips = document.querySelector("#healthPips");
const healthValue = document.querySelector("#healthValue");
const selectionLabel = document.querySelector("#selectionLabel");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const gameNotice = document.querySelector("#gameNotice");
const levelPicker = document.querySelector("#levelPicker");
const campaignLabel = document.querySelector("#campaignLabel");
const helpDialog = document.querySelector("#helpDialog");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ROWS = 5;
const COLUMNS = 9;
const BOARD_X = 76;
const BOARD_Y = 105;
const CELL_WIDTH = 96;
const CELL_HEIGHT = 80;
const BOARD_RIGHT = BOARD_X + COLUMNS * CELL_WIDTH;
const BOARD_BOTTOM = BOARD_Y + ROWS * CELL_HEIGHT;
const SAVE_KEY = "garden-defense-progress";

const PLANT_TYPES = {
  sunflower: { label: "Hoa Mặt Trời", cost: 50, hp: 95, interval: 7.5 },
  pea: { label: "Hoa Bắn Đạn", cost: 100, hp: 125, interval: 1.25, damage: 24 },
  chili: { label: "Ớt Nổ", cost: 300, hp: 999, fuse: .72, damage: 580 },
  pumpkin: { label: "Bí Ngô", cost: 75, hp: 520 },
  whip: { label: "Cây Roi", cost: 150, hp: 170, interval: 1.55, damage: 48, range: CELL_WIDTH * 3 },
};

const MONSTER_TYPES = {
  normal: { label: "Quái Thường", hp: 135, speed: 12, damage: 18, interval: 1.05, color: "#68736f", unlock: 1 },
  tank: { label: "Quái Giáp", hp: 360, speed: 7.2, damage: 28, interval: 1.2, color: "#59676d", unlock: 2 },
  runner: { label: "Quái Chạy", hp: 90, speed: 24, damage: 13, interval: .72, color: "#806a65", unlock: 3 },
  jumper: { label: "Quái Nhảy", hp: 165, speed: 13, damage: 20, interval: 1, color: "#6b677e", unlock: 4 },
  gunner: { label: "Quái Súng", hp: 190, speed: 9, damage: 21, interval: 1.8, color: "#665d52", unlock: 5 },
};

let state = "menu";
let mode = "campaign";
let level = 1;
let selectedLevel = 1;
let unlockedLevel = loadProgress();
let selectedPlant = null;
let hoverCell = null;
let sunlight = 150;
let baseHealth = 5;
let plants = [];
let monsters = [];
let projectiles = [];
let suns = [];
let effects = [];
let elapsed = 0;
let spawnTimer = 0;
let skySunTimer = 0;
let totalEnemies = 0;
let spawnedEnemies = 0;
let currentWave = 0;
let spawnInterval = 3;
let lastFrame = performance.now();
let noticeTimer = null;
let primaryAction = null;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function loadProgress() {
  const value = Number.parseInt(localStorage.getItem(SAVE_KEY), 10);
  return Number.isFinite(value) ? clamp(value, 1, 10) : 1;
}

function saveProgress(value) {
  unlockedLevel = clamp(value, 1, 10);
  localStorage.setItem(SAVE_KEY, String(unlockedLevel));
}

function cellCenter(row, column) {
  return {
    x: BOARD_X + column * CELL_WIDTH + CELL_WIDTH / 2,
    y: BOARD_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2,
  };
}

function setupLevelPicker() {
  levelPicker.replaceChildren();
  for (let index = 1; index <= 10; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-picker__button";
    button.textContent = String(index).padStart(2, "0");
    button.disabled = index > unlockedLevel;
    button.setAttribute("aria-label", index > unlockedLevel ? `Ải ${index} chưa mở khóa` : `Chọn ải ${index}`);
    button.addEventListener("click", () => {
      selectedLevel = index;
      setupLevelPicker();
    });
    button.classList.toggle("is-selected", index === selectedLevel);
    levelPicker.append(button);
  }
  campaignLabel.textContent = `Chơi ải ${selectedLevel} · đã mở ${unlockedLevel}/10`;
}

function createPlant(type, row, column) {
  const definition = PLANT_TYPES[type];
  const center = cellCenter(row, column);
  return {
    type,
    row,
    column,
    x: center.x,
    y: center.y,
    hp: definition.hp,
    maxHp: definition.hp,
    timer: type === "sunflower" ? 3.6 : definition.interval || definition.fuse || 0,
    alive: true,
    pulse: 0,
  };
}

function chooseMonsterType() {
  const difficulty = mode === "surprise" ? 10 : level;
  const available = Object.keys(MONSTER_TYPES).filter((key) => MONSTER_TYPES[key].unlock <= difficulty);
  const roll = Math.random();
  if (difficulty >= 7 && roll > .86) return "gunner";
  if (difficulty >= 5 && roll > .72) return "jumper";
  if (difficulty >= 3 && roll > .57) return "runner";
  if (difficulty >= 2 && roll > .35) return "tank";
  return available[Math.floor(Math.random() * Math.min(available.length, 2))] || "normal";
}

function spawnMonster() {
  const type = chooseMonsterType();
  const definition = MONSTER_TYPES[type];
  const difficulty = mode === "surprise" ? 7 : level;
  const healthScale = 1 + Math.max(0, difficulty - 1) * .055;
  const row = Math.floor(Math.random() * ROWS);
  const center = cellCenter(row, COLUMNS - 1);
  monsters.push({
    type,
    row,
    x: BOARD_RIGHT + 35 + Math.random() * 26,
    y: center.y,
    hp: definition.hp * healthScale,
    maxHp: definition.hp * healthScale,
    speed: definition.speed * (1 + difficulty * .018),
    attackTimer: .4,
    alive: true,
    jumped: false,
    jumpTimer: 0,
    flash: 0,
  });
  spawnedEnemies += 1;
  currentWave = Math.min(3, Math.ceil(spawnedEnemies / Math.ceil(totalEnemies / 3)));
  if (spawnedEnemies === 1 || spawnedEnemies === Math.ceil(totalEnemies / 3) + 1 || spawnedEnemies === Math.ceil(totalEnemies * 2 / 3) + 1) {
    showNotice(currentWave === 3 ? "Đợt cuối đang tràn tới!" : `Đợt ${currentWave} bắt đầu`, 1.5);
  }
}

function startMode(nextMode, nextLevel = selectedLevel) {
  mode = nextMode;
  level = nextMode === "surprise" ? 10 : nextLevel;
  state = "playing";
  selectedPlant = null;
  hoverCell = null;
  sunlight = nextMode === "surprise" ? Infinity : 175;
  baseHealth = 5;
  plants = [];
  monsters = [];
  projectiles = [];
  suns = [];
  effects = [];
  elapsed = 0;
  spawnTimer = 3.2;
  skySunTimer = 2.2;
  spawnedEnemies = 0;
  currentWave = 0;
  totalEnemies = nextMode === "surprise" ? 32 : 6 + level * 3;
  spawnInterval = Math.max(1.35, 3.05 - level * .14);
  gameOverlay.hidden = true;
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  pauseButton.disabled = false;
  restartButton.disabled = false;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  showNotice(nextMode === "surprise" ? "Nắng vô hạn - trồng đội hình bạn muốn!" : `Ải ${level} - chuẩn bị phòng tuyến`, 1.9);
  updateInterface();
}

function showMenu() {
  state = "menu";
  selectedPlant = null;
  selectedLevel = Math.min(unlockedLevel, selectedLevel);
  gameOverlay.hidden = false;
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  pauseButton.disabled = true;
  restartButton.disabled = true;
  setupLevelPicker();
  updateInterface();
}

function showNotice(message, duration = 1.2) {
  window.clearTimeout(noticeTimer);
  gameNotice.textContent = message;
  gameNotice.hidden = false;
  noticeTimer = window.setTimeout(() => {
    gameNotice.hidden = true;
  }, duration * 1000);
}

function addAction(label, primary, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button ${primary ? "button--primary" : "button--secondary"}`;
  button.textContent = label;
  button.addEventListener("click", action);
  resultActions.append(button);
  if (primary) primaryAction = action;
}

function showResult(won) {
  if (!["playing", "paused"].includes(state)) return;
  state = won ? "won" : "lost";
  selectedPlant = null;
  gameOverlay.hidden = false;
  modeSelect.hidden = true;
  resultPanel.hidden = false;
  resultActions.replaceChildren();
  resultIcon.classList.toggle("is-loss", !won);
  resultIcon.textContent = won ? "✓" : "×";
  resultEyebrow.textContent = won ? "Khu vườn an toàn" : "Hàng rào thất thủ";
  resultTitle.textContent = won ? (mode === "campaign" && level === 10 ? "Trọn 10 ải đã được chinh phục" : "Bạn đã đẩy lùi đợt tấn công") : "Quái vật đã tràn vào khu vườn";
  resultText.textContent = won ? (mode === "surprise" ? "Đội hình tự do của bạn đã vượt qua thử thách bất ngờ." : `Ải ${level} hoàn tất. Độ khó tiếp theo đã tăng lên.`) : "Đổi vị trí cây phòng thủ và thử lại. Bí Ngô sẽ giúp câu thêm thời gian.";
  if (won && mode === "campaign" && level < 10) {
    saveProgress(Math.max(unlockedLevel, level + 1));
    selectedLevel = level + 1;
    addAction("Chơi ải tiếp", true, () => startMode("campaign", level + 1));
  } else {
    addAction("Chơi lại", true, () => startMode(mode, level));
  }
  addAction("Chọn chế độ", false, showMenu);
  setupLevelPicker();
  updateInterface();
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    selectedPlant = null;
    gameOverlay.hidden = false;
    modeSelect.hidden = true;
    resultPanel.hidden = false;
    resultActions.replaceChildren();
    resultIcon.classList.remove("is-loss");
    resultIcon.textContent = "Ⅱ";
    resultEyebrow.textContent = "Đã tạm dừng";
    resultTitle.textContent = "Khu vườn đang nghỉ";
    resultText.textContent = "Mọi chuyển động đã dừng. Tiếp tục khi bạn sẵn sàng.";
    addAction("Tiếp tục", true, togglePause);
    addAction("Chơi lại ải", false, restartLevel);
    addAction("Chọn chế độ", false, showMenu);
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
  } else if (state === "paused") {
    state = "playing";
    gameOverlay.hidden = true;
    pauseButton.dataset.state = "pause";
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    primaryAction = null;
  }
  updateInterface();
}

function restartLevel() {
  startMode(mode, level);
}

function selectPlant(type) {
  if (state !== "playing") return;
  const definition = PLANT_TYPES[type];
  if (mode !== "surprise" && sunlight < definition.cost) {
    showNotice(`Cần ${definition.cost} nắng để trồng ${definition.label}`, 1.35);
    return;
  }
  selectedPlant = selectedPlant === type ? null : type;
  updateInterface();
}

function plantAt(row, column) {
  return plants.find((plant) => plant.alive && plant.row === row && plant.column === column);
}

function placePlant(row, column) {
  if (!selectedPlant || state !== "playing") return;
  if (plantAt(row, column)) {
    showNotice("Ô này đã có cây", 1);
    return;
  }
  const definition = PLANT_TYPES[selectedPlant];
  if (mode !== "surprise" && sunlight < definition.cost) {
    showNotice("Chưa đủ nắng", 1);
    return;
  }
  if (mode !== "surprise") sunlight -= definition.cost;
  plants.push(createPlant(selectedPlant, row, column));
  effects.push({ kind: "sprout", x: cellCenter(row, column).x, y: cellCenter(row, column).y + 24, life: .45, maxLife: .45 });
  if (selectedPlant === "chili") showNotice("Ớt Nổ đang nóng lên!", .7);
  selectedPlant = null;
  updateInterface();
}

function createSun(x, y, targetY, source = "sky") {
  suns.push({ x, y, targetY, source, value: 25, life: 8, radius: 24 });
}

function collectSun(sun) {
  if (mode !== "surprise") sunlight += sun.value;
  sun.collected = true;
  effects.push({ kind: "text", text: "+25", x: sun.x, y: sun.y, life: .7, maxLife: .7, color: "#7a5500" });
  updateInterface();
}

function monsterAhead(plant, range = WIDTH) {
  return monsters
    .filter((monster) => monster.alive && monster.row === plant.row && monster.x > plant.x - 8 && monster.x - plant.x <= range)
    .sort((first, second) => first.x - second.x)[0];
}

function damageMonster(monster, damage, effect = true) {
  if (!monster?.alive) return;
  monster.hp -= damage;
  monster.flash = .1;
  if (effect) effects.push({ kind: "hit", x: monster.x, y: monster.y - 12, life: .22, maxLife: .22 });
  if (monster.hp <= 0) {
    monster.alive = false;
    effects.push({ kind: "poof", x: monster.x, y: monster.y, life: .5, maxLife: .5 });
  }
}

function damagePlant(plant, damage) {
  if (!plant?.alive) return;
  plant.hp -= damage;
  plant.pulse = .1;
  if (plant.hp <= 0) {
    plant.alive = false;
    effects.push({ kind: "poof", x: plant.x, y: plant.y, life: .5, maxLife: .5 });
  }
}

function updatePlants(deltaTime) {
  plants.forEach((plant) => {
    if (!plant.alive) return;
    plant.timer -= deltaTime;
    plant.pulse = Math.max(0, plant.pulse - deltaTime);
    if (plant.type === "sunflower" && plant.timer <= 0) {
      if (mode !== "surprise") createSun(plant.x, plant.y - 20, plant.y - 20, "plant");
      plant.timer = PLANT_TYPES.sunflower.interval;
    }
    if (plant.type === "pea" && plant.timer <= 0 && monsterAhead(plant)) {
      projectiles.push({ kind: "pea", row: plant.row, x: plant.x + 22, y: plant.y - 7, speed: 240, damage: PLANT_TYPES.pea.damage, alive: true });
      plant.timer = PLANT_TYPES.pea.interval;
    }
    if (plant.type === "whip" && plant.timer <= 0) {
      const targets = monsters.filter((monster) => monster.alive && monster.row === plant.row && monster.x >= plant.x - 10 && monster.x <= plant.x + PLANT_TYPES.whip.range);
      if (targets.length) {
        targets.forEach((monster) => damageMonster(monster, PLANT_TYPES.whip.damage));
        effects.push({ kind: "whip", x: plant.x, y: plant.y, life: .28, maxLife: .28 });
        plant.timer = PLANT_TYPES.whip.interval;
      }
    }
    if (plant.type === "chili" && plant.timer <= 0) {
      monsters.filter((monster) => monster.alive && monster.row === plant.row).forEach((monster) => damageMonster(monster, PLANT_TYPES.chili.damage, false));
      effects.push({ kind: "fire", x: BOARD_X + (COLUMNS * CELL_WIDTH) / 2, y: plant.y, life: .75, maxLife: .75, row: plant.row });
      plant.alive = false;
    }
  });
}

function findCollisionPlant(monster) {
  return plants
    .filter((plant) => plant.alive && plant.row === monster.row && plant.x < monster.x + 14 && monster.x - plant.x < 48)
    .sort((first, second) => second.x - first.x)[0];
}

function findGunnerTarget(monster) {
  return plants
    .filter((plant) => plant.alive && plant.row === monster.row && plant.x < monster.x && monster.x - plant.x < 810)
    .sort((first, second) => second.x - first.x)[0];
}

function updateMonsters(deltaTime) {
  monsters.forEach((monster) => {
    if (!monster.alive) return;
    const definition = MONSTER_TYPES[monster.type];
    monster.attackTimer -= deltaTime;
    monster.flash = Math.max(0, monster.flash - deltaTime);
    if (monster.jumpTimer > 0) {
      monster.jumpTimer -= deltaTime;
      monster.x -= monster.speed * 8.3 * deltaTime;
      return;
    }
    const collision = findCollisionPlant(monster);
    if (monster.type === "jumper" && collision && !monster.jumped) {
      monster.jumped = true;
      monster.jumpTimer = .85;
      monster.x -= 12;
      effects.push({ kind: "dust", x: monster.x, y: monster.y + 25, life: .35, maxLife: .35 });
      return;
    }
    const gunnerTarget = monster.type === "gunner" ? findGunnerTarget(monster) : null;
    if (gunnerTarget && monster.attackTimer <= 0) {
      projectiles.push({ kind: "bullet", row: monster.row, x: monster.x - 28, y: monster.y - 12, speed: -225, damage: definition.damage, alive: true });
      monster.attackTimer = definition.interval;
      return;
    }
    if (collision) {
      if (monster.attackTimer <= 0) {
        damagePlant(collision, definition.damage);
        monster.attackTimer = definition.interval;
      }
    } else {
      monster.x -= monster.speed * deltaTime;
    }
    if (monster.x < 47) {
      monster.alive = false;
      baseHealth -= 1;
      effects.push({ kind: "impact", x: 54, y: monster.y, life: .45, maxLife: .45 });
      showNotice(baseHealth > 0 ? "Một quái vật đã lọt qua hàng rào!" : "Hàng rào đã thất thủ!", 1.1);
      if (baseHealth <= 0) showResult(false);
    }
  });
}

function updateProjectiles(deltaTime) {
  projectiles.forEach((projectile) => {
    if (!projectile.alive) return;
    projectile.x += projectile.speed * deltaTime;
    if (projectile.kind === "pea") {
      const target = monsters
        .filter((monster) => monster.alive && monster.row === projectile.row && Math.abs(monster.x - projectile.x) < 24)
        .sort((first, second) => first.x - second.x)[0];
      if (target) {
        damageMonster(target, projectile.damage);
        projectile.alive = false;
      }
    } else {
      const target = plants
        .filter((plant) => plant.alive && plant.row === projectile.row && Math.abs(plant.x - projectile.x) < 20)
        .sort((first, second) => second.x - first.x)[0];
      if (target) {
        damagePlant(target, projectile.damage);
        projectile.alive = false;
      }
    }
    if (projectile.x < BOARD_X - 20 || projectile.x > WIDTH + 20) projectile.alive = false;
  });
}

function updateSuns(deltaTime) {
  suns.forEach((sun) => {
    sun.life -= deltaTime;
    if (sun.y < sun.targetY) sun.y = Math.min(sun.targetY, sun.y + 58 * deltaTime);
  });
  suns = suns.filter((sun) => !sun.collected && sun.life > 0);
}

function updateEffects(deltaTime) {
  effects.forEach((effect) => {
    effect.life -= deltaTime;
    if (effect.kind === "text") effect.y -= 22 * deltaTime;
  });
  effects = effects.filter((effect) => effect.life > 0);
}

function updateSpawning(deltaTime) {
  if (spawnedEnemies >= totalEnemies) return;
  spawnTimer -= deltaTime;
  if (spawnTimer <= 0) {
    spawnMonster();
    const waveSize = Math.ceil(totalEnemies / 3);
    const waveBreak = spawnedEnemies % waveSize === 0 && spawnedEnemies < totalEnemies ? 3.3 : 0;
    spawnTimer = spawnInterval + Math.random() * .7 + waveBreak;
  }
}

function update(deltaTime) {
  elapsed += deltaTime;
  skySunTimer -= deltaTime;
  if (mode !== "surprise" && skySunTimer <= 0) {
    const column = Math.floor(Math.random() * COLUMNS);
    const row = 1 + Math.floor(Math.random() * 4);
    createSun(BOARD_X + column * CELL_WIDTH + CELL_WIDTH / 2, 72, BOARD_Y + row * CELL_HEIGHT - 18);
    skySunTimer = 6.6 + Math.random() * 1.8;
  }
  updateSpawning(deltaTime);
  updatePlants(deltaTime);
  updateMonsters(deltaTime);
  updateProjectiles(deltaTime);
  updateSuns(deltaTime);
  updateEffects(deltaTime);
  plants = plants.filter((plant) => plant.alive);
  monsters = monsters.filter((monster) => monster.alive);
  projectiles = projectiles.filter((projectile) => projectile.alive);
  if (spawnedEnemies >= totalEnemies && monsters.length === 0 && state === "playing") showResult(true);
  updateInterface();
}

function updateInterface() {
  sunValue.textContent = mode === "surprise" && state !== "menu" ? "∞" : String(Math.floor(sunlight));
  modeLabel.textContent = mode === "surprise" ? "Bất ngờ" : "Vượt ải";
  levelValue.textContent = mode === "surprise" ? "Nắng vô hạn" : `Ải ${String(level).padStart(2, "0")} / 10`;
  waveLabel.textContent = `Đợt ${currentWave} / 3`;
  enemyValue.textContent = `${monsters.length + Math.max(0, totalEnemies - spawnedEnemies)} quái`;
  waveProgress.style.width = `${totalEnemies ? (spawnedEnemies / totalEnemies) * 100 : 0}%`;
  healthValue.textContent = `${baseHealth} / 5`;
  if (healthPips.children.length !== 5) {
    for (let index = 0; index < 5; index += 1) healthPips.append(document.createElement("i"));
  }
  [...healthPips.children].forEach((pip, index) => pip.classList.toggle("is-empty", index >= baseHealth));
  document.querySelectorAll(".plant-button").forEach((button) => {
    const definition = PLANT_TYPES[button.dataset.plant];
    button.classList.toggle("is-selected", button.dataset.plant === selectedPlant);
    button.disabled = state !== "playing" || (mode !== "surprise" && sunlight < definition.cost);
  });
  selectionLabel.textContent = selectedPlant ? `${PLANT_TYPES[selectedPlant].label} - chạm vào một ô trống` : "Chọn một cây để bắt đầu";
}

function getPalette() {
  const dark = document.documentElement.dataset.theme === "dark";
  return dark ? {
    sky: "#172c2e", lawnA: "#315c43", lawnB: "#294f3a", grid: "rgba(235,255,241,.10)", soil: "#4b3e31", fence: "#a58b61", text: "#eaf8f0",
  } : {
    sky: "#bfe2e5", lawnA: "#8fcf70", lawnB: "#7fc164", grid: "rgba(26,82,43,.14)", soil: "#8d6c48", fence: "#efe0bc", text: "#143d2a",
  };
}

function drawBackground() {
  const palette = getPalette();
  context.fillStyle = palette.sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = palette.soil;
  context.fillRect(0, BOARD_BOTTOM, WIDTH, HEIGHT - BOARD_BOTTOM);
  context.fillStyle = palette.fence;
  context.fillRect(25, 77, 39, 444);
  context.fillStyle = "rgba(80,55,29,.28)";
  for (let row = 0; row < ROWS; row += 1) context.fillRect(34, BOARD_Y + row * CELL_HEIGHT + 22, 21, 8);
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      context.fillStyle = (row + column) % 2 ? palette.lawnA : palette.lawnB;
      context.fillRect(BOARD_X + column * CELL_WIDTH, BOARD_Y + row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
      context.strokeStyle = palette.grid;
      context.strokeRect(BOARD_X + column * CELL_WIDTH + .5, BOARD_Y + row * CELL_HEIGHT + .5, CELL_WIDTH - 1, CELL_HEIGHT - 1);
    }
  }
  if (hoverCell && selectedPlant && state === "playing") {
    const occupied = plantAt(hoverCell.row, hoverCell.column);
    context.fillStyle = occupied ? "rgba(220,60,60,.22)" : "rgba(255,255,255,.24)";
    context.fillRect(BOARD_X + hoverCell.column * CELL_WIDTH + 2, BOARD_Y + hoverCell.row * CELL_HEIGHT + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4);
  }
  context.fillStyle = palette.text;
  context.globalAlpha = .72;
  context.font = "800 12px system-ui";
  context.fillText(mode === "surprise" ? "NẮNG VÔ HẠN" : `ẢI ${String(level).padStart(2, "0")}`, BOARD_X, 72);
  context.textAlign = "right";
  context.fillText(`ĐỢT ${currentWave}/3`, BOARD_RIGHT, 72);
  context.textAlign = "left";
  context.globalAlpha = 1;
}

function drawHealthBar(entity, width = 42, yOffset = 34) {
  if (entity.hp >= entity.maxHp) return;
  const ratio = clamp(entity.hp / entity.maxHp, 0, 1);
  context.fillStyle = "rgba(20,28,24,.56)";
  context.fillRect(entity.x - width / 2, entity.y - yOffset, width, 4);
  context.fillStyle = ratio > .42 ? "#41c67a" : "#e4534e";
  context.fillRect(entity.x - width / 2, entity.y - yOffset, width * ratio, 4);
}

function drawPlant(plant, now) {
  const bob = Math.sin(now / 430 + plant.row) * 1.4;
  context.save();
  context.translate(plant.x, plant.y + bob);
  if (plant.pulse > 0) context.globalAlpha = .55;
  context.fillStyle = "rgba(32,70,43,.22)";
  context.beginPath();
  context.ellipse(0, 27, 27, 7, 0, 0, Math.PI * 2);
  context.fill();
  if (plant.type !== "pumpkin") {
    context.strokeStyle = "#307f48";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(0, 24);
    context.lineTo(0, -3);
    context.stroke();
    context.fillStyle = "#53a95f";
    context.beginPath();
    context.ellipse(-9, 14, 12, 6, -.45, 0, Math.PI * 2);
    context.fill();
  }
  if (plant.type === "sunflower") drawSunflower();
  if (plant.type === "pea") drawPeaPlant();
  if (plant.type === "chili") drawChili();
  if (plant.type === "pumpkin") drawPumpkin();
  if (plant.type === "whip") drawWhipPlant();
  context.restore();
  drawHealthBar(plant, 42, 37);
}

function drawFace(y = -14) {
  context.fillStyle = "#14251c";
  context.beginPath();
  context.arc(-5, y, 2, 0, Math.PI * 2);
  context.arc(5, y, 2, 0, Math.PI * 2);
  context.fill();
}

function drawSunflower() {
  context.fillStyle = "#f5bd2f";
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    context.beginPath();
    context.ellipse(Math.cos(angle) * 17, -14 + Math.sin(angle) * 17, 8, 5, angle, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#79491f";
  context.beginPath();
  context.arc(0, -14, 14, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff4c2";
  context.beginPath();
  context.arc(-5, -17, 2, 0, Math.PI * 2);
  context.arc(5, -17, 2, 0, Math.PI * 2);
  context.fill();
}

function drawPeaPlant() {
  context.fillStyle = "#58b962";
  context.beginPath();
  context.arc(-3, -14, 19, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#348a4b";
  context.beginPath();
  context.roundRect(9, -22, 24, 16, 7);
  context.fill();
  context.fillStyle = "#183d28";
  context.beginPath();
  context.arc(27, -14, 5, 0, Math.PI * 2);
  context.fill();
  drawFace(-18);
}

function drawChili() {
  context.fillStyle = "#e74d3f";
  context.beginPath();
  context.ellipse(0, -5, 16, 27, -.1, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#307f48";
  context.fillRect(-2, -37, 5, 10);
  context.strokeStyle = "#7a201f";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-8, -10);
  context.lineTo(-3, -13);
  context.moveTo(8, -10);
  context.lineTo(3, -13);
  context.stroke();
}

function drawPumpkin() {
  context.fillStyle = "rgba(32,70,43,.22)";
  context.beginPath();
  context.ellipse(0, 26, 30, 7, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e78b28";
  context.beginPath();
  context.ellipse(0, 0, 30, 27, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#c46f21";
  context.lineWidth = 3;
  [-13, 0, 13].forEach((x) => {
    context.beginPath();
    context.moveTo(x, -23);
    context.quadraticCurveTo(x * .55, 0, x, 23);
    context.stroke();
  });
  context.fillStyle = "#477840";
  context.fillRect(-3, -34, 7, 11);
  drawFace(-4);
}

function drawWhipPlant() {
  context.strokeStyle = "#4cac5c";
  context.lineWidth = 9;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-2, 20);
  context.quadraticCurveTo(-20, -5, 2, -27);
  context.stroke();
  context.fillStyle = "#72c779";
  context.beginPath();
  context.ellipse(6, -29, 16, 8, .22, 0, Math.PI * 2);
  context.fill();
  drawFace(-29);
}

function drawMonster(monster, now) {
  const definition = MONSTER_TYPES[monster.type];
  const step = Math.sin(now / 130 + monster.x * .04) * 2;
  const jump = monster.jumpTimer > 0 ? Math.sin((monster.jumpTimer / .85) * Math.PI) * 45 : 0;
  context.save();
  context.translate(monster.x, monster.y - jump);
  if (monster.flash > 0) context.globalAlpha = .48;
  context.fillStyle = "rgba(28,40,33,.25)";
  context.beginPath();
  context.ellipse(0, 29 + jump, 24, 6, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#27332f";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(-9, 12);
  context.lineTo(-13 + step, 29);
  context.moveTo(8, 12);
  context.lineTo(14 - step, 29);
  context.stroke();
  context.fillStyle = definition.color;
  context.fillRect(-18, -16, 34, 36);
  context.fillStyle = monster.flash > 0 ? "#ffffff" : "#9aaa8e";
  context.beginPath();
  context.arc(-2, -28, 20, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f5f1d5";
  context.beginPath();
  context.arc(-8, -31, 5, 0, Math.PI * 2);
  context.arc(5, -31, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#1e2d27";
  context.beginPath();
  context.arc(-7, -30, 2, 0, Math.PI * 2);
  context.arc(6, -30, 2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#4a342c";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-8, -17);
  context.lineTo(7, -17);
  context.stroke();
  if (monster.type === "tank") {
    context.fillStyle = "#46545a";
    context.beginPath();
    context.arc(-2, -36, 22, Math.PI, Math.PI * 2);
    context.fill();
    context.fillRect(-25, -37, 45, 7);
  }
  if (monster.type === "runner") {
    context.fillStyle = "#e1693d";
    context.fillRect(-22, -40, 39, 7);
    context.strokeStyle = "#f0b15b";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(17, -36);
    context.lineTo(29, -30);
    context.stroke();
  }
  if (monster.type === "jumper") {
    context.strokeStyle = "#6f492c";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(22, -46);
    context.lineTo(22, 33);
    context.stroke();
  }
  if (monster.type === "gunner") {
    context.fillStyle = "#3c4641";
    context.fillRect(-39, -12, 38, 9);
    context.fillRect(-8, -5, 8, 12);
  }
  context.restore();
  drawHealthBar(monster, 44, 55);
}

function drawSuns(now) {
  suns.forEach((sun) => {
    const pulse = 1 + Math.sin(now / 180 + sun.x) * .05;
    context.save();
    context.translate(sun.x, sun.y);
    context.scale(pulse, pulse);
    context.strokeStyle = "#d49310";
    context.lineWidth = 3;
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      context.beginPath();
      context.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
      context.lineTo(Math.cos(angle) * 24, Math.sin(angle) * 24);
      context.stroke();
    }
    context.fillStyle = "#f7c83f";
    context.beginPath();
    context.arc(0, 0, 16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#8c5d06";
    context.font = "900 11px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("25", 0, 1);
    context.restore();
  });
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

function drawProjectiles() {
  projectiles.forEach((projectile) => {
    if (projectile.kind === "pea") {
      context.fillStyle = "#2f9953";
      context.beginPath();
      context.arc(projectile.x, projectile.y, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#84d67f";
      context.beginPath();
      context.arc(projectile.x - 2, projectile.y - 2, 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillStyle = "#f3c44b";
      context.fillRect(projectile.x - 7, projectile.y - 2, 12, 4);
    }
  });
}

function drawEffects() {
  effects.forEach((effect) => {
    const progress = 1 - effect.life / effect.maxLife;
    context.save();
    context.globalAlpha = clamp(effect.life / effect.maxLife, 0, 1);
    if (effect.kind === "text") {
      context.fillStyle = effect.color;
      context.font = "900 15px system-ui";
      context.textAlign = "center";
      context.fillText(effect.text, effect.x, effect.y);
    } else if (effect.kind === "fire") {
      const y = BOARD_Y + effect.row * CELL_HEIGHT;
      context.fillStyle = `rgba(244, 84, 35, ${.75 * (1 - progress)})`;
      context.fillRect(BOARD_X, y + 8, COLUMNS * CELL_WIDTH, CELL_HEIGHT - 16);
      context.fillStyle = "#ffc342";
      for (let index = 0; index < 18; index += 1) {
        const x = BOARD_X + index * 50 + 12;
        context.beginPath();
        context.moveTo(x - 10, y + 64);
        context.lineTo(x, y + 18 + Math.sin(index) * 8);
        context.lineTo(x + 10, y + 64);
        context.fill();
      }
    } else if (effect.kind === "whip") {
      context.strokeStyle = "#b6f06f";
      context.lineWidth = 8 * (1 - progress);
      context.beginPath();
      context.moveTo(effect.x, effect.y - 15);
      context.quadraticCurveTo(effect.x + 120, effect.y - 65, effect.x + PLANT_TYPES.whip.range, effect.y + 5);
      context.stroke();
    } else {
      context.strokeStyle = effect.kind === "impact" ? "#ef5b4d" : "#e9f6dd";
      context.lineWidth = 4 * (1 - progress);
      context.beginPath();
      context.arc(effect.x, effect.y, 8 + progress * 30, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  });
  context.textAlign = "left";
}

function draw(now = performance.now()) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  plants.slice().sort((first, second) => first.row - second.row).forEach((plant) => drawPlant(plant, now));
  monsters.slice().sort((first, second) => first.row - second.row).forEach((monster) => drawMonster(monster, now));
  drawProjectiles();
  drawSuns(now);
  drawEffects();
}

function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (WIDTH / bounds.width),
    y: (event.clientY - bounds.top) * (HEIGHT / bounds.height),
  };
}

function cellFromPosition(position) {
  if (position.x < BOARD_X || position.x >= BOARD_RIGHT || position.y < BOARD_Y || position.y >= BOARD_BOTTOM) return null;
  return {
    row: Math.floor((position.y - BOARD_Y) / CELL_HEIGHT),
    column: Math.floor((position.x - BOARD_X) / CELL_WIDTH),
  };
}

canvas.addEventListener("pointermove", (event) => {
  hoverCell = cellFromPosition(pointerPosition(event));
});

canvas.addEventListener("pointerleave", () => {
  hoverCell = null;
});

canvas.addEventListener("pointerdown", (event) => {
  if (state !== "playing") return;
  const position = pointerPosition(event);
  const sun = suns.find((item) => Math.hypot(item.x - position.x, item.y - position.y) <= item.radius + 8);
  if (sun) {
    collectSun(sun);
    return;
  }
  const cell = cellFromPosition(position);
  if (cell) placePlant(cell.row, cell.column);
});

document.querySelector("#campaignButton").addEventListener("click", () => startMode("campaign", selectedLevel));
document.querySelector("#surpriseButton").addEventListener("click", () => startMode("surprise", 10));
document.querySelectorAll(".plant-button").forEach((button) => button.addEventListener("click", () => selectPlant(button.dataset.plant)));
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartLevel);

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  const key = event.key.toLowerCase();
  if (["1", "2", "3", "4", "5"].includes(key) && state === "playing") {
    event.preventDefault();
    selectPlant(Object.keys(PLANT_TYPES)[Number(key) - 1]);
  }
  if (key === "escape" && state === "playing") {
    selectedPlant = null;
    updateInterface();
  }
  if (key === "p" && ["playing", "paused"].includes(state)) togglePause();
  if ((key === " " || key === "enter") && ["won", "lost", "paused"].includes(state)) {
    event.preventDefault();
    primaryAction?.();
  }
});

document.querySelector("#helpButton").addEventListener("click", () => {
  if (state === "playing") togglePause();
  if (typeof helpDialog.showModal === "function") helpDialog.showModal();
});
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") togglePause();
});
new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

function gameLoop(now) {
  const deltaTime = Math.min((now - lastFrame) / 1000, .04);
  lastFrame = now;
  if (state === "playing") update(deltaTime);
  draw(now);
  window.requestAnimationFrame(gameLoop);
}

selectedLevel = unlockedLevel;
setupLevelPicker();
updateInterface();
draw();
window.requestAnimationFrame(gameLoop);
