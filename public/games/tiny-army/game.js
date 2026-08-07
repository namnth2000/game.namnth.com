"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const battlefield = document.querySelector("#battlefield");
const gameOverlay = document.querySelector("#gameOverlay");
const modeSelect = document.querySelector("#modeSelect");
const resultPanel = document.querySelector("#resultPanel");
const resultIcon = document.querySelector("#resultIcon");
const resultEyebrow = document.querySelector("#resultEyebrow");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const resultReward = document.querySelector("#resultReward");
const resultActions = document.querySelector("#resultActions");
const resultKeyHint = document.querySelector("#resultKeyHint");
const battleNotice = document.querySelector("#battleNotice");
const goldValue = document.querySelector("#goldValue");
const armyValue = document.querySelector("#armyValue");
const modeLabel = document.querySelector("#modeLabel");
const levelValue = document.querySelector("#levelValue");
const enemyBaseName = document.querySelector("#enemyBaseName");
const playerBaseHealth = document.querySelector("#playerBaseHealth");
const enemyBaseHealth = document.querySelector("#enemyBaseHealth");
const playerBaseValue = document.querySelector("#playerBaseValue");
const enemyBaseValue = document.querySelector("#enemyBaseValue");
const queueLabel = document.querySelector("#queueLabel");
const trainingProgress = document.querySelector("#trainingProgress");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const spellBar = document.querySelector("#spellBar");
const spellEmpty = document.querySelector("#spellEmpty");
const helpDialog = document.querySelector("#helpDialog");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 442;
const MAX_ARMY = 50;
const PLAYER_BASE_X = 94;
const ENEMY_BASE_X = 1186;
const PLAYER_MINE_X = WIDTH * .22;
const ENEMY_MINE_X = WIDTH * .78;
const SAVE_KEY = "tiny-army-progress";
const ENEMY_STARTING_GOLD = [50, 60, 70, 80, 90, 100, 105, 105, 110, 110];

const UNIT_TYPES = {
  miner: { label: "Thợ Mỏ", cost: 20, train: 1.4, hp: 40, speed: 65, damage: 0, range: 0, atkInterval: 1, scale: .9, slots: 1, gather: 5 },
  swordsman: { label: "Kiếm Sĩ", cost: 25, train: 2, hp: 100, speed: 55, damage: 12, range: 26, atkInterval: .8, scale: 1, slots: 1 },
  archer: { label: "Cung Thủ", cost: 35, train: 3, hp: 55, speed: 48, damage: 8, range: 200, atkInterval: 1, scale: 1, slots: 1 },
  spearton: { label: "Khiên Binh", cost: 45, train: 4, hp: 170, speed: 44, damage: 16, range: 36, atkInterval: 1, scale: 1.05, slots: 1 },
  giant: { label: "Khổng Lồ", cost: 90, train: 7, hp: 320, speed: 26, damage: 30, range: 38, atkInterval: 1.2, scale: 2, slots: 3, splash: 92 },
};

const SPELLS = [
  { id: "miner", label: "Bùa Thợ Mỏ", short: "Mỏ", description: "Khai thác x2 trong 15 giây" },
  { id: "archer", label: "Mưa Tên", short: "Tên", description: "Mưa tên phủ khắp chiến trường" },
  { id: "swordsman", label: "Kiếm Lửa", short: "Lửa", description: "Kiếm Sĩ gây x2 sát thương trong 15 giây" },
  { id: "shield", label: "Giáp Vàng", short: "Giáp", description: "Khiên Binh nhận nửa sát thương trong 15 giây" },
  { id: "giant", label: "Cự Nhân", short: "Lớn", description: "Khổng Lồ tăng 1,5 lần kích thước và máu" },
];

const BASES = [
  { name: "Thành đá", kind: "cave", color: "#6d6257" },
  { name: "Doanh trại", kind: "camp", color: "#8b5d38" },
  { name: "Tháp canh", kind: "tower", color: "#716b62" },
  { name: "Đồn cát", kind: "fort", color: "#a77b46" },
  { name: "Pháo đài", kind: "fortress", color: "#5f6465" },
  { name: "Cung điện đá", kind: "temple", color: "#625b70" },
  { name: "Thành băng", kind: "castle", color: "#7f949b" },
  { name: "Núi lửa", kind: "volcano", color: "#513c39" },
  { name: "Kinh thành", kind: "citadel", color: "#615c54" },
  { name: "Đỉnh Ma Vương", kind: "mountain", color: "#3f3748" },
];

const SPELL_ICONS = {
  miner: '<span class="spell-button__glyph" aria-hidden="true">⛏️</span>',
  archer: '<span class="spell-button__glyph" aria-hidden="true">🏹</span>',
  swordsman: '<span class="spell-button__glyph" aria-hidden="true">🗡️</span>',
  shield: '<span class="spell-button__glyph" aria-hidden="true">🛡️</span>',
  giant: '<span class="spell-button__glyph" aria-hidden="true">👊</span>',
};

let state = "menu";
let mode = "campaign";
let level = 1;
let gold = 50;
let enemyGold = 50;
let command = "hold";
let units = [];
let projectiles = [];
let particles = [];
let trainingQueue = [];
let trainingElapsed = 0;
let enemyTrainingQueue = [];
let enemyTrainingElapsed = 0;
let bossSpawned = false;
let enemySpawnTimer = 0;
let enemySpawnCount = 0;
let enemyCommand = "hold";
let enemyStrategyTimer = 0;
let passiveGoldTimer = 0;
let enemyPassiveGoldTimer = 0;
let playerBase = { hp: 1000, maxHp: 1000 };
let enemyBase = { hp: 1000, maxHp: 1000 };
let spellCharges = {};
let spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
let arrowRain = null;
let noticeTimer = 0;
let lastFrame = performance.now();
let unitId = 0;
let primaryAction = null;
let savedProgress = loadProgress();
let sceneryClouds = [];
let sceneryBushes = [];
let sceneryMountains = [];
const castleArcher = {
  id: -1,
  type: "archer",
  side: "player",
  x: PLAYER_BASE_X,
  y: GROUND_Y - 151,
  hp: UNIT_TYPES.archer.hp,
  maxHp: UNIT_TYPES.archer.hp,
  attackCooldown: 0,
  walkPhase: 0,
  hitFlash: 0,
  actionTimer: 0,
  actionDuration: .48,
  moving: false,
  garrisoned: true,
  scale: .9,
  damageMultiplier: 1,
  boss: false,
  alive: true,
};

function loadProgress() {
  try {
    return Math.max(1, Math.min(10, Number(localStorage.getItem(SAVE_KEY)) || 1));
  } catch {
    return 1;
  }
}

function saveProgress(nextLevel) {
  savedProgress = Math.max(savedProgress, Math.min(10, nextLevel));
  try { localStorage.setItem(SAVE_KEY, String(savedProgress)); } catch { /* Storage can be unavailable. */ }
  document.querySelector("#progressLabel").textContent = savedProgress > 1
    ? "10 chiến trường"
    : "10 chiến trường";
}

function isDarkTheme() {
  return document.documentElement.dataset.theme === "dark";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value) {
  return Math.floor(value).toLocaleString("vi-VN");
}

function unitSlots(type) {
  return UNIT_TYPES[type]?.slots ?? 1;
}

function armySlots(side) {
  return units
    .filter((unit) => unit.side === side && unit.alive)
    .reduce((total, unit) => total + unitSlots(unit.type), 0);
}

function queuedSlots(queue) {
  return queue.reduce((total, type) => total + unitSlots(type), 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomizeScenery() {
  sceneryClouds = Array.from({ length: 3 }, (_, index) => ({
    x: randomBetween(80 + index * 330, 280 + index * 330),
    y: randomBetween(60, 145),
    scale: randomBetween(.48, .8),
    drift: randomBetween(.000018, .000038),
  }));
  sceneryBushes = Array.from({ length: 4 }, (_, index) => ({
    x: randomBetween(320 + index * 185, 405 + index * 185),
    width: randomBetween(62, 92),
    height: randomBetween(18, 28),
  }));
  sceneryMountains = Array.from({ length: 5 }, (_, index) => ({
    x: WIDTH * (index + .5) / 5 + randomBetween(-34, 34),
    peakY: randomBetween(155, 248),
    width: randomBetween(235, 315),
  }));
}

function showNotice(message, duration = 2.2) {
  battleNotice.textContent = message;
  battleNotice.hidden = false;
  noticeTimer = duration;
}

function updateNotice(deltaTime) {
  if (noticeTimer <= 0) return;
  noticeTimer -= deltaTime;
  if (noticeTimer <= 0) battleNotice.hidden = true;
}

function createSpellCharges(currentLevel) {
  const charges = { miner: 0, archer: 0, swordsman: 0, shield: 0, giant: 0 };
  if (mode === "surprise") {
    Object.keys(charges).forEach((key) => { charges[key] = Infinity; });
    return charges;
  }
  for (let completed = 1; completed < currentLevel; completed += 1) {
    charges[SPELLS[(completed - 1) % SPELLS.length].id] += 1;
  }
  return charges;
}

function startMode(selectedMode) {
  mode = selectedMode;
  level = 1;
  spellCharges = createSpellCharges(level);
  spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
  startLevel();
}

function startLevel() {
  state = "playing";
  gold = 50;
  enemyGold = ENEMY_STARTING_GOLD[level - 1];
  command = "hold";
  units = [];
  projectiles = [];
  particles = [];
  trainingQueue = [];
  trainingElapsed = 0;
  enemyTrainingQueue = [];
  enemyTrainingElapsed = 0;
  bossSpawned = false;
  enemySpawnTimer = randomBetween(.2, 1.5);
  enemySpawnCount = 0;
  enemyCommand = "hold";
  enemyStrategyTimer = 0;
  passiveGoldTimer = 0;
  enemyPassiveGoldTimer = 0;
  castleArcher.attackCooldown = 0;
  castleArcher.actionTimer = 0;
  playerBase = { hp: 1000, maxHp: 1000 };
  enemyBase = { hp: 1000, maxHp: 1000 };
  if (mode === "surprise") {
    spellCharges = {
      miner: Infinity,
      archer: Infinity,
      swordsman: Infinity,
      shield: Infinity,
      giant: Infinity,
    };
  } else if (!spellCharges || Object.keys(spellCharges).length === 0) {
    spellCharges = createSpellCharges(level);
  }
  spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
  arrowRain = null;
  randomizeScenery();
  noticeTimer = 0;
  battleNotice.hidden = true;
  gameOverlay.hidden = true;
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  restartButton.disabled = false;
  document.querySelectorAll(".command-button").forEach((button) => button.classList.toggle("is-active", button.dataset.command === command));
  renderSpells();
  updateInterface();
  showNotice(level === 10 ? "Đỉnh Ma Vương đang ngủ - hãy cẩn trọng khi phá thành!" : `Ải ${String(level).padStart(2, "0")} · ${BASES[level - 1].name}`, 2.8);
  lastFrame = performance.now();
}

function restartLevel() {
  startLevel();
}

function restartJourney() {
  level = 1;
  spellCharges = createSpellCharges(level);
  spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
  startLevel();
}

function chooseMode() {
  state = "menu";
  units = [];
  projectiles = [];
  particles = [];
  pauseButton.disabled = true;
  restartButton.disabled = true;
  gameOverlay.hidden = false;
  modeSelect.hidden = false;
  resultPanel.hidden = true;
  primaryAction = null;
  updateInterface();
}

function nextLevel() {
  if (level >= 10) {
    level = 1;
  } else {
    level += 1;
  }
  startLevel();
}

function spawnUnit(type, side, options = {}) {
  const definition = UNIT_TYPES[type];
  const isBoss = Boolean(options.boss);
  const giantBlessed = side === "player" && type === "giant" && spellEffects.giant > 0;
  const hpMultiplier = isBoss ? 2 : giantBlessed ? 1.5 : 1;
  const damageMultiplier = isBoss ? 2 : 1;
  const scaleMultiplier = isBoss ? 2 : giantBlessed ? 1.5 : 1;
  const x = options.x ?? (side === "player" ? 142 : 1138);
  const maxHp = definition.hp * hpMultiplier;
  const unit = {
    id: unitId += 1,
    type,
    side,
    x,
    y: randomBetween(GROUND_Y - 2, GROUND_Y + 28),
    hp: maxHp,
    maxHp,
    attackCooldown: randomBetween(0, .35),
    mineTimer: 0,
    minerState: "to-mine",
    minerSwingTimer: 0,
    carriedGold: 0,
    defenseStage: type === "archer" ? "returning" : null,
    walkPhase: Math.random() * Math.PI * 2,
    hitFlash: 0,
    actionTimer: 0,
    actionDuration: 0,
    moving: false,
    garrisoned: false,
    scale: definition.scale * scaleMultiplier,
    damageMultiplier,
    boss: isBoss,
    giantBlessed,
    alive: true,
  };
  units.push(unit);
  return unit;
}

function queueUnit(type) {
  if (state !== "playing") return;
  const definition = UNIT_TYPES[type];
  const reservedSlots = armySlots("player") + queuedSlots(trainingQueue);
  if (reservedSlots + unitSlots(type) > MAX_ARMY) {
    showNotice("Đội quân đã đạt giới hạn 50");
    return;
  }
  if (gold < definition.cost) {
    showNotice(`Cần thêm ${formatNumber(definition.cost - gold)} vàng`);
    return;
  }
  gold -= definition.cost;
  trainingQueue.push(type);
  if (trainingQueue.length === 1) trainingElapsed = 0;
  updateInterface();
}

function updateTraining(deltaTime) {
  if (!trainingQueue.length) return;
  const type = trainingQueue[0];
  const definition = UNIT_TYPES[type];
  trainingElapsed += deltaTime;
  if (trainingElapsed >= definition.train) {
    trainingElapsed -= definition.train;
    trainingQueue.shift();
    spawnUnit(type, "player");
    burst(142, GROUND_Y - 32, "#6ee7b7", 8);
    showNotice(`${definition.label} đã xuất trận`, 1.25);
  }
}

function chooseEnemyType() {
  const pool = ["swordsman", "swordsman", "swordsman", "swordsman", "archer", "archer", "archer", "miner", "miner"];
  if (level >= 2) pool.push("spearton", "spearton");
  if (level >= 3) pool.push("giant");
  if (level == 5) pool.push("giant", "giant", "giant", "giant", "giant", "giant", "giant");
  if (level == 7) pool.push("giant", "giant", "giant", "giant", "giant", "giant", "giant");
  if (level == 8) pool.push("giant", "giant", "giant", "giant", "giant", "giant", "giant");
  if (level == 9) pool.push("giant", "giant", "giant", "giant", "giant", "giant", "giant");
  if (level == 10) pool.push("giant", "giant", "giant", "giant", "giant", "giant", "giant");
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateEnemySpawns(deltaTime) {
  if (enemyTrainingQueue.length) {
    const trainingType = enemyTrainingQueue[0];
    enemyTrainingElapsed += deltaTime;
    if (enemyTrainingElapsed >= UNIT_TYPES[trainingType].train) {
      enemyTrainingElapsed -= UNIT_TYPES[trainingType].train;
      enemyTrainingQueue.shift();
      spawnUnit(trainingType, "enemy");
      enemySpawnCount += 1;
      if (!enemyTrainingQueue.length) enemyTrainingElapsed = 0;
    }
  }

  enemySpawnTimer -= deltaTime;
  if (enemySpawnTimer > 0) return;
  enemySpawnTimer = randomBetween(.2, 1.5);
  const reservedEnemySlots = armySlots("enemy") + queuedSlots(enemyTrainingQueue);
  if (reservedEnemySlots >= MAX_ARMY) return;
  const type = chooseEnemyType();
  if (reservedEnemySlots + unitSlots(type) <= MAX_ARMY && enemyGold >= UNIT_TYPES[type].cost) {
    enemyGold -= UNIT_TYPES[type].cost;
    enemyTrainingQueue.push(type);
    if (enemyTrainingQueue.length === 1) enemyTrainingElapsed = 0;
  }
}

function hasUnit(side, type) {
  return units.some((unit) => unit.alive && unit.side === side && unit.type === type);
}

function hasPlayerUnit(type) {
  return hasUnit("player", type);
}

function updatePassiveIncome(deltaTime) {
  passiveGoldTimer += deltaTime;
  while (passiveGoldTimer >= 1) {
    passiveGoldTimer -= 1;
    gold += 2;
    particles.push({ x: PLAYER_BASE_X, y: GROUND_Y - 92, vx: 0, vy: -18, life: .9, maxLife: .9, color: "#f4bd2b", text: "+2" });
  }

  enemyPassiveGoldTimer += deltaTime;
  while (enemyPassiveGoldTimer >= 1) {
    enemyPassiveGoldTimer -= 1;
    enemyGold += 2;
    particles.push({ x: ENEMY_BASE_X, y: GROUND_Y - 92, vx: 0, vy: -18, life: .9, maxLife: .9, color: "#f4bd2b", text: "+2" });
  }
}

function updateCastleArcher(deltaTime) {
  if (command !== "defend") {
    castleArcher.actionTimer = 0;
    return;
  }
  castleArcher.actionTimer = Math.max(0, castleArcher.actionTimer - deltaTime);
  castleArcher.attackCooldown -= deltaTime;
  const target = units
    .filter((unit) => unit.alive && unit.side === "enemy" && unit.type !== "miner" && Math.abs(unit.x - PLAYER_BASE_X) <= 350)
    .sort((first, second) => Math.abs(first.x - PLAYER_BASE_X) - Math.abs(second.x - PLAYER_BASE_X))[0];
  if (!target || castleArcher.attackCooldown > 0) return;
  attackUnit(castleArcher, target);
  castleArcher.attackCooldown = UNIT_TYPES.archer.atkInterval;
}

function updateFinalBoss() {
  if (level !== 10 || bossSpawned || enemyBase.hp > enemyBase.maxHp * .5) return;
  bossSpawned = true;
  enemyGold += 300;
  enemyCommand = "attack";
  enemyStrategyTimer = 0;
  spawnUnit("giant", "enemy", { boss: true, x: ENEMY_BASE_X - 78 });
  burst(ENEMY_BASE_X - 78, GROUND_Y - 98, "#b15ad1", 24);
  showNotice("Ma Vương thức tỉnh từ Đỉnh Ma Vương!", 3.2);
}

function updateEnemyStrategy(deltaTime) {
  const combatUnits = units.filter((unit) => unit.alive && unit.side === "enemy" && unit.type !== "miner");
  const combatSlots = combatUnits.reduce((total, unit) => total + unitSlots(unit.type), 0);
  const launchThreshold = clamp(3 + Math.floor(level * .65), 3, 9);

  if (combatUnits.some((unit) => unit.boss)) {
    enemyCommand = "attack";
    enemyStrategyTimer = 0;
    return;
  }

  if (combatSlots === 0) {
    enemyCommand = "hold";
    enemyStrategyTimer = 0;
    return;
  }
  enemyStrategyTimer += deltaTime;

  if (enemyCommand === "hold") {
    const maximumWait = clamp(18 - level * .7, 10, 17.3);
    if (combatSlots >= launchThreshold || combatSlots > 0 && enemyStrategyTimer >= maximumWait) {
      enemyCommand = "attack";
      enemyStrategyTimer = 0;
      showNotice("Địch bắt đầu tổng tiến công!", 1.6);
    }
    return;
  }

  const retreatThreshold = Math.max(1, Math.floor(launchThreshold * .45));
  if (enemyStrategyTimer >= 8 && combatSlots <= retreatThreshold) {
    enemyCommand = "hold";
    enemyStrategyTimer = 0;
    showNotice("Địch đang rút về tập hợp lực lượng!", 1.6);
  }
}

function closestOpponent(unit) {
  let closest = null;
  let closestDistance = Infinity;
  units.forEach((candidate) => {
    if (!candidate.alive || candidate.garrisoned || candidate.side === unit.side || candidate.type === "miner" && Math.abs(candidate.x - unit.x) > 120) return;
    const distance = Math.abs(candidate.x - unit.x);
    if (distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  });
  return { target: closest, distance: closestDistance };
}

function unitRadius(unit) {
  return 13 * unit.scale;
}

function dealDamage(target, amount, attackerType, attackerSide) {
  if (!target?.alive) return;
  let finalDamage = amount;
  if (target.type === "spearton") finalDamage *= .78;
  if (target.side === "player" && target.type === "spearton" && spellEffects.shield > 0) finalDamage *= .5;
  target.hp -= finalDamage;
  target.hitFlash = .12;
  burst(target.x, target.y - 31 * target.scale, attackerSide === "player" ? "#34d399" : "#ef7777", attackerType === "giant" ? 7 : 3);
  if (target.hp <= 0) {
    target.alive = false;
    burst(target.x, target.y - 20, target.side === "player" ? "#10b981" : "#d94f4f", target.type === "giant" ? 18 : 9);
  }
}

function beginAttack(unit) {
  const durations = { miner: .52, swordsman: .42, spearton: .46, archer: .48, giant: .76 };
  unit.actionDuration = durations[unit.type];
  unit.actionTimer = unit.actionDuration;
}

function attackUnit(attacker, target) {
  const definition = UNIT_TYPES[attacker.type];
  beginAttack(attacker);
  let damage = definition.damage * attacker.damageMultiplier;
  if (attacker.side === "player" && attacker.type === "swordsman" && spellEffects.swordsman > 0) damage *= 2;
  if (attacker.type === "archer") {
    projectiles.push({
      kind: "arrow",
      side: attacker.side,
      x: attacker.x,
      y: attacker.y - 36 * attacker.scale,
      target,
      damage,
      speed: 440,
      life: 2,
    });
    return;
  }
  dealDamage(target, damage, attacker.type, attacker.side);
  if (attacker.type === "giant") {
    units.forEach((candidate) => {
      if (candidate !== target && candidate.alive && candidate.side !== attacker.side && Math.abs(candidate.x - target.x) <= definition.splash * attacker.scale) {
        dealDamage(candidate, damage * .55, "giant", attacker.side);
      }
    });
    burst(target.x, GROUND_Y + 27, "#8b6b43", 12);
    particles.push({ x: target.x, y: GROUND_Y + 22, vx: 0, vy: 0, life: .45, maxLife: .45, color: attacker.side === "player" ? "#10b981" : "#d94f4f", shockwave: true });
  }
}

function attackBase(attacker) {
  const definition = UNIT_TYPES[attacker.type];
  beginAttack(attacker);
  let damage = definition.damage * attacker.damageMultiplier;
  if (attacker.side === "player" && attacker.type === "swordsman" && spellEffects.swordsman > 0) damage *= 2;
  const targetBase = attacker.side === "player" ? enemyBase : playerBase;
  if (attacker.type === "archer") {
    projectiles.push({
      kind: "base-arrow",
      side: attacker.side,
      x: attacker.x,
      y: attacker.y - 36 * attacker.scale,
      targetX: attacker.side === "player" ? ENEMY_BASE_X : PLAYER_BASE_X,
      targetY: GROUND_Y - 70,
      damage,
      speed: 460,
      life: 2,
    });
    return;
  }
  targetBase.hp -= damage;
  burst(attacker.side === "player" ? ENEMY_BASE_X : PLAYER_BASE_X, GROUND_Y - 50, "#d39a56", attacker.type === "giant" ? 12 : 5);
}

function minerPosition(unit, mineX) {
  const miners = units
    .filter((candidate) => candidate.alive && candidate.side === unit.side && candidate.type === "miner")
    .sort((first, second) => first.id - second.id);
  const index = Math.max(0, miners.indexOf(unit));
  const direction = unit.side === "player" ? -1 : 1;
  return {
    x: mineX + direction * (12 + index % 4 * 12),
    y: GROUND_Y + 4 + index % 3 * 8,
  };
}

function depositMinerGold(unit) {
  if (!unit.carriedGold) return;
  const earned = unit.carriedGold;
  if (unit.side === "player") gold += earned;
  else enemyGold += earned;
  particles.push({
    x: unit.side === "player" ? PLAYER_BASE_X + 34 : ENEMY_BASE_X - 34,
    y: unit.y - 45,
    vx: 0,
    vy: -22,
    life: 1.1,
    maxLife: 1.1,
    color: "#f4bd2b",
    text: `+${formatNumber(earned)}`,
  });
  unit.carriedGold = 0;
}

function updateMiner(unit, deltaTime) {
  const mineX = unit.side === "player" ? PLAYER_MINE_X : ENEMY_MINE_X;
  const depositX = unit.side === "player" ? PLAYER_BASE_X + 48 : ENEMY_BASE_X - 48;
  const position = minerPosition(unit, mineX);

  if (unit.minerState === "to-mine") {
    if (moveUnitToward(unit, position.x, position.y, deltaTime)) {
      unit.minerState = "mining";
      unit.mineTimer = 0;
      unit.minerSwingTimer = 0;
    }
    return;
  }

  if (unit.minerState === "mining") {
    unit.x = position.x;
    unit.y += (position.y - unit.y) * Math.min(1, deltaTime * 7);
    unit.mineTimer += deltaTime;
    unit.minerSwingTimer -= deltaTime;
    if (unit.minerSwingTimer <= 0) {
      beginAttack(unit);
      unit.minerSwingTimer = .58;
    }
    if (unit.mineTimer >= 2) {
      const spellMultiplier = unit.side === "player" && spellEffects.miner > 0 ? 2 : 1;
      unit.carriedGold = UNIT_TYPES.miner.gather * spellMultiplier;
      unit.minerState = "to-base";
      unit.mineTimer = 0;
    }
    return;
  }

  if (moveUnitToward(unit, depositX, GROUND_Y + 8, deltaTime)) {
    depositMinerGold(unit);
    unit.minerState = "to-mine";
  }
}

function playerHoldPosition(unit) {
  const isArcher = unit.type === "archer";
  const formationUnits = units
    .filter((candidate) => candidate.alive && candidate.side === "player" && candidate.type !== "miner" && (candidate.type === "archer") === isArcher)
    .sort((first, second) => first.id - second.id);
  const index = Math.max(0, formationUnits.indexOf(unit));
  return {
    x: PLAYER_MINE_X + (isArcher ? 18 - Math.floor(index / 5) * 18 : 62 + Math.floor(index / 5) * 24),
    y: GROUND_Y + 2 + index % 5 * 9,
  };
}

function enemyHoldPosition(unit) {
  const combatUnits = units
    .filter((candidate) => candidate.alive && candidate.side === "enemy" && candidate.type !== "miner")
    .sort((first, second) => first.id - second.id);
  const index = Math.max(0, combatUnits.indexOf(unit));
  return {
    x: ENEMY_MINE_X - 54 + Math.floor(index / 5) * 24,
    y: GROUND_Y + 2 + index % 5 * 9,
  };
}

function closestInvader(unit) {
  let closest = null;
  let closestDistance = Infinity;
  units.forEach((candidate) => {
    if (!candidate.alive || candidate.garrisoned || candidate.side !== "enemy" || candidate.type === "miner" || candidate.x > WIDTH * .5) return;
    const distance = Math.abs(candidate.x - unit.x);
    if (distance < closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  });
  return { target: closest, distance: closestDistance };
}

function moveUnitToward(unit, targetX, targetY, deltaTime, speedMultiplier = 1) {
  const definition = UNIT_TYPES[unit.type];
  const difference = targetX - unit.x;
  const step = definition.speed * speedMultiplier * deltaTime;
  if (Math.abs(difference) > 2) {
    unit.x += Math.sign(difference) * Math.min(Math.abs(difference), step);
    unit.moving = true;
  } else {
    unit.x = targetX;
  }
  unit.y += (targetY - unit.y) * Math.min(1, deltaTime * 6);
  return Math.abs(unit.x - targetX) < 3 && Math.abs(unit.y - targetY) < 4;
}

function updateHoldingPlayerUnit(unit, deltaTime) {
  const definition = UNIT_TYPES[unit.type];
  const position = playerHoldPosition(unit);
  const { target, distance } = closestInvader(unit);

  if (!target) {
    moveUnitToward(unit, position.x, position.y, deltaTime, 1.2);
    return;
  }

  const reach = definition.range + unitRadius(target);
  if (distance <= reach) {
    if (unit.attackCooldown <= 0) {
      attackUnit(unit, target);
      unit.attackCooldown = definition.atkInterval;
    }
    return;
  }

  const boundary = WIDTH * .5 - unitRadius(unit);
  const targetX = Math.min(boundary, target.x - reach * .86);
  moveUnitToward(unit, targetX, position.y, deltaTime, 1.2);
  unit.x = Math.min(unit.x, boundary);
}

function updateDefensiveUnit(unit, deltaTime) {
  if (unit.type === "archer") {
    const archers = units.filter((candidate) => candidate.alive && candidate.side === "player" && candidate.type === "archer").sort((first, second) => first.id - second.id);
    const index = Math.max(0, archers.indexOf(unit));
    const targetX = PLAYER_BASE_X - 38 + (index % 5) * 19;
    const targetY = GROUND_Y - 151 - Math.floor(index / 5) * 7;
    if (!unit.garrisoned && unit.defenseStage !== "climbing") {
      const reachedGate = moveUnitToward(unit, PLAYER_BASE_X + 49, GROUND_Y + 7, deltaTime, 1.45);
      if (reachedGate) unit.defenseStage = "climbing";
      return;
    }
    if (!unit.garrisoned) {
      unit.garrisoned = moveUnitToward(unit, targetX, targetY, deltaTime, 1.45);
      if (!unit.garrisoned) return;
    }
    const { target, distance } = closestOpponent(unit);
    if (target && distance <= 340 && unit.attackCooldown <= 0) {
      attackUnit(unit, target);
      unit.attackCooldown = UNIT_TYPES.archer.atkInterval;
    }
    return;
  }
  unit.garrisoned = moveUnitToward(unit, PLAYER_BASE_X, GROUND_Y + 12, deltaTime, 1.55);
  if (unit.garrisoned && unit.type === "miner") {
    depositMinerGold(unit);
    unit.minerState = "to-mine";
  }
}

function updateUnit(unit, deltaTime) {
  if (!unit.alive) return;
  unit.hitFlash = Math.max(0, unit.hitFlash - deltaTime);
  unit.attackCooldown -= deltaTime;
  unit.actionTimer = Math.max(0, unit.actionTimer - deltaTime);
  unit.moving = false;
  unit.walkPhase += deltaTime * 4;

  if (unit.side === "player" && command === "defend") {
    updateDefensiveUnit(unit, deltaTime);
    return;
  }

  if (unit.garrisoned) {
    unit.garrisoned = false;
    unit.y = randomBetween(GROUND_Y - 2, GROUND_Y + 28);
    unit.x = Math.max(unit.x, PLAYER_BASE_X + 48);
    unit.defenseStage = null;
  }

  if (unit.type === "miner") {
    updateMiner(unit, deltaTime);
    return;
  }

  const definition = UNIT_TYPES[unit.type];
  if (unit.side === "player" && command === "hold") {
    updateHoldingPlayerUnit(unit, deltaTime);
    return;
  }

  const { target, distance } = closestOpponent(unit);
  const reach = definition.range + (target ? unitRadius(target) : 0);
  if (target && distance <= reach) {
    if (unit.attackCooldown <= 0) {
      attackUnit(unit, target);
      unit.attackCooldown = definition.atkInterval;
    }
    return;
  }

  if (unit.side === "enemy" && enemyCommand === "hold") {
    const position = enemyHoldPosition(unit);
    moveUnitToward(unit, position.x, position.y, deltaTime, 1.16);
    return;
  }

  const enemyBaseDistance = unit.side === "player" ? ENEMY_BASE_X - unit.x : unit.x - PLAYER_BASE_X;
  const baseReach = definition.range + 56;
  if (enemyBaseDistance <= baseReach) {
    if (unit.attackCooldown <= 0) {
      attackBase(unit);
      unit.attackCooldown = definition.atkInterval;
    }
    return;
  }

  const direction = unit.side === "player" ? 1 : -1;
  unit.x += direction * definition.speed * deltaTime;
  unit.moving = true;
  unit.x = clamp(unit.x, PLAYER_BASE_X + 45, ENEMY_BASE_X - 45);
}

function updateProjectiles(deltaTime) {
  projectiles.forEach((projectile) => {
    projectile.life -= deltaTime;
    const targetX = projectile.target?.alive ? projectile.target.x : projectile.targetX;
    const targetY = projectile.target?.alive ? projectile.target.y - 27 * projectile.target.scale : projectile.targetY;
    if (targetX == null) {
      projectile.life = 0;
      return;
    }
    const dx = targetX - projectile.x;
    const dy = targetY - projectile.y;
    const distance = Math.hypot(dx, dy);
    const step = projectile.speed * deltaTime;
    projectile.angle = Math.atan2(dy, dx);
    if (distance <= step + 5) {
      if (projectile.kind === "arrow" && projectile.target?.alive) {
        dealDamage(projectile.target, projectile.damage, "archer", projectile.side);
      } else if (projectile.kind === "base-arrow") {
        const base = projectile.side === "player" ? enemyBase : playerBase;
        base.hp -= projectile.damage;
        burst(targetX, targetY, "#d39a56", 4);
      }
      projectile.life = 0;
      return;
    }
    projectile.x += dx / distance * step;
    projectile.y += dy / distance * step;
  });
  projectiles = projectiles.filter((projectile) => projectile.life > 0);
}

function burst(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x,
      y,
      vx: randomBetween(-48, 48),
      vy: randomBetween(-78, -18),
      life: randomBetween(.35, .75),
      maxLife: .75,
      color,
      size: randomBetween(2, 5),
    });
  }
}

function updateParticles(deltaTime) {
  particles.forEach((particle) => {
    particle.life -= deltaTime;
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    if (!particle.text) particle.vy += 140 * deltaTime;
  });
  particles = particles.filter((particle) => particle.life > 0);
}

function useSpell(spellId) {
  if (state !== "playing" || !spellCharges[spellId]) return;
  if (Number.isFinite(spellCharges[spellId])) spellCharges[spellId] -= 1;

  if (spellId === "archer") {
    arrowRain = { elapsed: 0, duration: 2.4, shotTimer: 0 };
    showNotice("Mưa Tên phủ kín chiến trường!", 2.4);
  } else {
    spellEffects[spellId] = spellId === "giant" ? 18 : 15;
    const spell = SPELLS.find((item) => item.id === spellId);
    showNotice(`${spell.label} đã được kích hoạt`, 2.2);
    if (spellId === "giant") {
      units.filter((unit) => unit.alive && unit.side === "player" && unit.type === "giant" && !unit.giantBlessed).forEach((unit) => {
        unit.giantBlessed = true;
        unit.scale *= 1.5;
        unit.maxHp *= 1.5;
        unit.hp *= 1.5;
      });
    }
  }
  renderSpells();
}

function updateArrowRain(deltaTime) {
  if (!arrowRain) return;
  arrowRain.elapsed += deltaTime;
  arrowRain.shotTimer -= deltaTime;
  if (arrowRain.shotTimer <= 0) {
    arrowRain.shotTimer = .13;
    const targets = units.filter((unit) => unit.alive && unit.side === "enemy");
    const target = targets.length ? targets[Math.floor(Math.random() * targets.length)] : null;
    const targetX = target ? target.x + randomBetween(-28, 28) : randomBetween(560, 1140);
    particles.push({ x: targetX - 28, y: -10, vx: 100, vy: 470, life: 1.1, maxLife: 1.1, color: "#d8ebe5", arrow: true, target });
    if (target) dealDamage(target, 17 + level * 1.2, "archer", "player");
    else enemyBase.hp -= 9;
  }
  if (arrowRain.elapsed >= arrowRain.duration) arrowRain = null;
}

function updateSpellEffects(deltaTime) {
  Object.keys(spellEffects).forEach((key) => {
    spellEffects[key] = Math.max(0, spellEffects[key] - deltaTime);
  });
}

function renderSpells() {
  spellBar.querySelectorAll(".spell-button").forEach((button) => button.remove());
  const visibleSpells = SPELLS.filter((spell) => spellCharges[spell.id] > 0 || mode === "surprise");
  spellEmpty.hidden = visibleSpells.length > 0;
  visibleSpells.forEach((spell) => {
    const button = document.createElement("button");
    button.className = `spell-button${mode === "surprise" ? " is-unlimited" : ""}`;
    button.type = "button";
    button.dataset.spell = spell.id;
    button.title = `${spell.label}: ${spell.description}`;
    button.setAttribute("aria-label", `${spell.label}, ${spell.description}`);
    const charge = Number.isFinite(spellCharges[spell.id]) ? spellCharges[spell.id] : "∞";
    button.innerHTML = `${SPELL_ICONS[spell.id]}<small>${charge}</small>`;
    button.disabled = !spellCharges[spell.id] || state !== "playing";
    button.addEventListener("click", () => useSpell(spell.id));
    spellBar.appendChild(button);
  });
}

function updateInterface() {
  goldValue.textContent = formatNumber(gold);
  const playerSlotCount = armySlots("player");
  const reservedPlayerSlots = playerSlotCount + queuedSlots(trainingQueue);
  armyValue.textContent = `${playerSlotCount} / ${MAX_ARMY}`;
  modeLabel.textContent = mode === "campaign" ? "Vượt ải" : "Bất ngờ";
  levelValue.textContent = `Ải ${String(level).padStart(2, "0")} / 10`;
  enemyBaseName.textContent = BASES[level - 1].name;
  playerBaseHealth.style.width = `${clamp(playerBase.hp / playerBase.maxHp * 100, 0, 100)}%`;
  enemyBaseHealth.style.width = `${clamp(enemyBase.hp / enemyBase.maxHp * 100, 0, 100)}%`;
  playerBaseValue.textContent = formatNumber(playerBase.hp);
  enemyBaseValue.textContent = formatNumber(enemyBase.hp);

  const currentType = trainingQueue[0];
  if (currentType) {
    const definition = UNIT_TYPES[currentType];
    queueLabel.textContent = trainingQueue.length > 1 ? `${definition.label} +${trainingQueue.length - 1}` : definition.label;
    trainingProgress.style.width = `${clamp(trainingElapsed / definition.train * 100, 0, 100)}%`;
  } else {
    queueLabel.textContent = "Trống";
    trainingProgress.style.width = "0%";
  }

  document.querySelectorAll(".unit-button").forEach((button) => {
    const definition = UNIT_TYPES[button.dataset.unit];
    button.disabled = state !== "playing" || gold < definition.cost || reservedPlayerSlots + unitSlots(button.dataset.unit) > MAX_ARMY;
  });
}

function completeLevel(won) {
  if (state !== "playing") return;
  state = won ? "won" : "lost";
  pauseButton.disabled = true;
  restartButton.disabled = false;
  gameOverlay.hidden = false;
  modeSelect.hidden = true;
  resultPanel.hidden = false;
  resultIcon.classList.toggle("is-loss", !won);
  resultIcon.textContent = won ? "✓" : "×";
  resultEyebrow.textContent = won ? (level === 10 ? "Toàn thắng" : "Chiến thắng") : "Thành đã thất thủ";
  resultTitle.textContent = won
    ? (level === 10 ? "Bạn đã chinh phục cả 10 ải" : `${BASES[level - 1].name} đã thất thủ`)
    : `Thất bại tại ải ${String(level).padStart(2, "0")}`;
  resultText.textContent = won
    ? (level === 10 ? "Đạo Quân Tí Hon đã làm chủ toàn bộ vương quốc." : "Đội quân đã mở đường đến chiến trường tiếp theo.")
    : "Điều thêm Thợ Mỏ, giữ Cung Thủ ở tuyến sau và thử lại chiến thuật.";
  resultReward.hidden = true;
  resultActions.replaceChildren();

  if (won && mode === "campaign") {
    const rewardSpell = SPELLS[(level - 1) % SPELLS.length];
    spellCharges[rewardSpell.id] = (spellCharges[rewardSpell.id] ?? 0) + 1;
    resultReward.hidden = false;
    resultReward.textContent = `Nhận +1 ${rewardSpell.label}`;
    saveProgress(Math.min(10, level + 1));
  }

  const actions = won
    ? level < 10
      ? [
          { label: `Sang ải ${String(level + 1).padStart(2, "0")}`, action: nextLevel, primary: true },
          { label: "Chọn chế độ", action: chooseMode },
        ]
      : [
          { label: "Chơi lại từ đầu", action: restartJourney, primary: true },
          { label: "Chọn chế độ", action: chooseMode },
        ]
    : [
        { label: "Chơi lại màn", action: restartLevel, primary: true },
        { label: "Lại từ đầu", action: restartJourney },
        { label: "Chọn chế độ", action: chooseMode },
      ];

  actions.forEach((config) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button ${config.primary ? "button--primary" : "button--secondary"}`;
    button.textContent = config.label;
    button.addEventListener("click", config.action);
    resultActions.appendChild(button);
  });
  primaryAction = actions[0].action;
  resultKeyHint.textContent = won ? "        " : "        ";
  renderSpells();
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    gameOverlay.hidden = false;
    modeSelect.hidden = true;
    resultPanel.hidden = false;
    resultIcon.classList.remove("is-loss");
    resultIcon.textContent = "Ⅱ";
    resultEyebrow.textContent = "Tạm dừng";
    resultTitle.textContent = "                             ";
    resultText.textContent = "Tiếp tục khi bạn đã sẵn sàng trở lại chiến trường.";
    resultReward.hidden = true;
    resultActions.replaceChildren();
    const actions = [
      { label: "Tiếp tục", action: togglePause, primary: true },
      { label: "Chơi lại màn", action: restartLevel },
      { label: "Chọn chế độ", action: chooseMode },
    ];
    actions.forEach((config) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `button ${config.primary ? "button--primary" : "button--secondary"}`;
      button.textContent = config.label;
      button.addEventListener("click", config.action);
      resultActions.appendChild(button);
    });
    resultKeyHint.textContent = "Nhấn P để tiếp tục";
    primaryAction = togglePause;
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
  } else if (state === "paused") {
    state = "playing";
    gameOverlay.hidden = true;
    resultPanel.hidden = true;
    pauseButton.dataset.state = "pause";
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    primaryAction = null;
    lastFrame = performance.now();
  }
  renderSpells();
}

function update(deltaTime) {
  updateNotice(deltaTime);
  updateTraining(deltaTime);
  updatePassiveIncome(deltaTime);
  updateEnemySpawns(deltaTime);
  updateEnemyStrategy(deltaTime);
  updateSpellEffects(deltaTime);
  updateArrowRain(deltaTime);
  units.forEach((unit) => updateUnit(unit, deltaTime));
  updateCastleArcher(deltaTime);
  updateProjectiles(deltaTime);
  updateFinalBoss();
  updateParticles(deltaTime);
  units = units.filter((unit) => unit.alive);
  playerBase.hp = Math.max(0, playerBase.hp);
  enemyBase.hp = Math.max(0, enemyBase.hp);
  updateInterface();
  if (enemyBase.hp <= 0) completeLevel(true);
  else if (playerBase.hp <= 0) completeLevel(false);
}

function roundedPath(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawCloud(x, y, scale, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y + 11 * scale);
  context.bezierCurveTo(x - 3 * scale, y - 3 * scale, x + 11 * scale, y - 9 * scale, x + 22 * scale, y - 5 * scale);
  context.bezierCurveTo(x + 30 * scale, y - 25 * scale, x + 59 * scale, y - 20 * scale, x + 62 * scale, y);
  context.bezierCurveTo(x + 78 * scale, y - 2 * scale, x + 86 * scale, y + 8 * scale, x + 82 * scale, y + 16 * scale);
  context.lineTo(x + 8 * scale, y + 16 * scale);
  context.bezierCurveTo(x + 3 * scale, y + 16 * scale, x, y + 14 * scale, x, y + 11 * scale);
  context.fill();
}

function drawFixedWater(dark) {
  const waterColor = dark ? "#70b9c4" : "#82cad5";
  const waterHighlight = dark ? "rgba(230,255,255,.36)" : "rgba(255,255,255,.62)";

  // Large lake: its back edge extends beneath the mountains so only the near shoreline remains visible.
  context.fillStyle = waterColor;
  context.beginPath();
  context.moveTo(342, 331);
  context.bezierCurveTo(500, 329, 767, 329, 923, 331);
  context.lineTo(925, 334);
  context.bezierCurveTo(898, 346, 868, 348, 842, 354);
  context.bezierCurveTo(808, 362, 785, 376, 750, 377);
  context.bezierCurveTo(718, 378, 701, 391, 673, 389);
  context.bezierCurveTo(646, 387, 629, 375, 602, 380);
  context.bezierCurveTo(568, 386, 542, 374, 511, 378);
  context.bezierCurveTo(475, 381, 453, 365, 423, 369);
  context.bezierCurveTo(387, 373, 353, 360, 342, 347);
  context.closePath();
  context.fill();
}

function drawScenery(now) {
  const dark = isDarkTheme();
  const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, dark ? "#527985" : "#d9f1f6");
  sky.addColorStop(1, dark ? "#9ab39d" : "#f2f8e9");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, GROUND_Y + 1);

  context.fillStyle = dark ? "rgba(255,223,139,.24)" : "rgba(255,220,124,.22)";
  context.beginPath();
  context.arc(1008, 91, 61, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = dark ? "#ffd878" : "#f3c65e";
  context.beginPath();
  context.arc(1008, 91, 39, 0, Math.PI * 2);
  context.fill();

  sceneryClouds.forEach((cloud, index) => {
    drawCloud(cloud.x + Math.sin(now * cloud.drift + index) * 18, cloud.y, cloud.scale, dark ? "rgba(244,251,248,.48)" : "rgba(255,255,255,.82)");
  });

  context.fillStyle = dark ? "#6f9863" : "#8fba72";
  context.fillRect(0, 330, WIDTH, GROUND_Y - 330);
  drawFixedWater(dark);

  sceneryMountains.forEach((mountain, index) => {
    context.fillStyle = dark
      ? (index % 2 ? "#416660" : "#496f69")
      : (index % 2 ? "#91ada4" : "#9db7ae");
    context.beginPath();
    context.moveTo(mountain.x - mountain.width / 2, 330);
    context.quadraticCurveTo(mountain.x - mountain.width * .2, mountain.peakY + 35, mountain.x, mountain.peakY);
    context.quadraticCurveTo(mountain.x + mountain.width * .2, mountain.peakY + 31, mountain.x + mountain.width / 2, 330);
    context.closePath();
    context.fill();
  });

  context.fillStyle = dark ? "#416d48" : "#5f8b4f";
  sceneryBushes.forEach((bush) => {
    context.beginPath();
    context.moveTo(bush.x - bush.width / 2, GROUND_Y);
    context.bezierCurveTo(bush.x - bush.width / 2, GROUND_Y - bush.height, bush.x - 18, GROUND_Y - bush.height, bush.x - 8, GROUND_Y - bush.height * .65);
    context.bezierCurveTo(bush.x + 8, GROUND_Y - bush.height * 1.35, bush.x + 25, GROUND_Y - bush.height, bush.x + bush.width / 2, GROUND_Y);
    context.fill();
  });

  context.fillStyle = dark ? "#557642" : "#739752";
  context.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  context.fillStyle = dark ? "#6c6750" : "#a59267";
  context.fillRect(0, GROUND_Y + 38, WIDTH, 44);
  context.fillStyle = dark ? "rgba(255,250,220,.22)" : "rgba(255,251,220,.38)";
  roundedPath(0, GROUND_Y + 57, WIDTH, 4, 2);
  context.fill();
}

function drawBattlements(x, y, width, count, color) {
  const gap = width / count;
  context.fillStyle = color;
  for (let index = 0; index < count; index += 1) {
    roundedPath(x + index * gap, y, gap * .64, 17, 2);
    context.fill();
  }
}

function drawStoneBlocks(x, y, width, height, blockWidth = 24, blockHeight = 17) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.strokeStyle = "rgba(24,31,32,.3)";
  context.lineWidth = 1.5;
  for (let rowY = y + blockHeight; rowY < y + height; rowY += blockHeight) {
    context.beginPath();
    context.moveTo(x, rowY);
    context.lineTo(x + width, rowY);
    context.stroke();
  }
  let row = 0;
  for (let rowY = y; rowY < y + height; rowY += blockHeight) {
    const offset = row % 2 ? blockWidth * .5 : 0;
    for (let columnX = x + offset; columnX < x + width; columnX += blockWidth) {
      context.beginPath();
      context.moveTo(columnX, rowY);
      context.lineTo(columnX, Math.min(rowY + blockHeight, y + height));
      context.stroke();
    }
    row += 1;
  }
  context.strokeStyle = "rgba(255,255,255,.11)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y + 1);
  context.lineTo(x + width, y + 1);
  context.stroke();
  context.restore();
}

function drawPlayerCastle() {
  context.save();
  context.translate(PLAYER_BASE_X, GROUND_Y);
  context.fillStyle = "rgba(17,31,26,.2)";
  context.beginPath();
  context.ellipse(0, 7, 79, 13, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7c8587";
  roundedPath(-50, -138, 100, 138, 4);
  context.fill();
  drawStoneBlocks(-50, -138, 100, 138, 25, 18);
  context.fillStyle = "#90989a";
  roundedPath(-72, -111, 34, 111, 4);
  context.fill();
  drawStoneBlocks(-72, -111, 34, 111, 17, 18);
  roundedPath(38, -111, 34, 111, 4);
  context.fill();
  drawStoneBlocks(38, -111, 34, 111, 17, 18);
  drawBattlements(-72, -126, 34, 2, "#90989a");
  drawBattlements(38, -126, 34, 2, "#90989a");
  drawBattlements(-50, -154, 100, 5, "#7c8587");

  context.fillStyle = "rgba(255,255,255,.13)";
  context.fillRect(-39, -130, 7, 83);
  context.fillRect(46, -100, 5, 53);
  context.fillStyle = "#303638";
  roundedPath(-23, -51, 46, 51, 22);
  context.fill();
  context.fillStyle = "#c6d1d3";
  roundedPath(-9, -105, 18, 27, 8);
  context.fill();
  context.fillStyle = "#626c6f";
  context.fillRect(-1, -105, 2, 27);

  context.fillStyle = "#454c4e";
  context.fillRect(-4, -196, 5, 47);
  context.fillStyle = "#10b981";
  context.beginPath();
  context.moveTo(1, -193);
  context.quadraticCurveTo(23, -187, 43, -177);
  context.quadraticCurveTo(24, -167, 1, -165);
  context.closePath();
  context.fill();
  context.restore();
}

function drawEnemyFlag(y = -185) {
  context.fillStyle = "#43292d";
  context.fillRect(-1, y, 5, 48);
  context.fillStyle = "#d94f4f";
  context.beginPath();
  context.moveTo(-1, y + 3);
  context.quadraticCurveTo(-23, y + 8, -45, y + 17);
  context.quadraticCurveTo(-25, y + 27, -1, y + 31);
  context.closePath();
  context.fill();
}

function drawEnemyBase() {
  const base = BASES[level - 1];
  context.save();
  context.translate(ENEMY_BASE_X, GROUND_Y);
  context.fillStyle = "rgba(24,23,23,.23)";
  context.beginPath();
  context.ellipse(0, 7, 88, 14, 0, 0, Math.PI * 2);
  context.fill();

  if (["cave", "volcano", "mountain"].includes(base.kind)) {
    const height = base.kind === "mountain" ? 280 : base.kind === "volcano" ? 244 : 184;
    const halfWidth = base.kind === "mountain" ? 146 : base.kind === "volcano" ? 122 : 96;
    context.fillStyle = base.color;
    context.beginPath();
    context.moveTo(-halfWidth, 0);
    context.lineTo(-halfWidth * .82, -61);
    context.lineTo(-halfWidth * .58, -92);
    context.lineTo(-halfWidth * .38, -height * .57);
    context.lineTo(-halfWidth * .2, -height * .74);
    context.lineTo(0, -height);
    context.lineTo(halfWidth * .15, -height * .73);
    context.lineTo(halfWidth * .34, -height * .62);
    context.lineTo(halfWidth * .55, -height * .39);
    context.lineTo(halfWidth * .82, -67);
    context.lineTo(halfWidth, 0);
    context.closePath();
    context.fill();
    context.save();
    context.clip();
    context.restore();
    context.fillStyle = "rgba(255,255,255,.1)";
    context.beginPath();
    context.moveTo(-halfWidth * .62, -height * .39);
    context.lineTo(-halfWidth * .2, -height * .74);
    context.lineTo(-3, -height * .91);
    context.lineTo(-halfWidth * .12, -height * .48);
    context.closePath();
    context.fill();
    if (base.kind === "mountain") {
      context.fillStyle = "rgba(151,65,203,.22)";
      context.beginPath();
      context.ellipse(-8, -54, 55, 66, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = base.kind === "volcano" ? "#241b1b" : base.kind === "mountain" ? "#160d1f" : "#252124";
    roundedPath(-39, -57, 78, 57, 32);
    context.fill();
    if (base.kind === "volcano") {
      context.fillStyle = "#d84e32";
      context.beginPath();
      context.moveTo(-26, -height + 18);
      context.quadraticCurveTo(0, -height + 34, 26, -height + 18);
      context.lineTo(15, -height - 1);
      context.lineTo(-15, -height - 1);
      context.closePath();
      context.fill();
      context.strokeStyle = "#f58b43";
      context.lineWidth = 4;
      [[-8, -height + 24, -23, -height + 78], [11, -height + 25, 25, -height + 94], [3, -height + 54, -5, -height + 128]].forEach(([x1, y1, x2, y2]) => {
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      });
      context.fillStyle = "rgba(60,48,48,.55)";
      [[-28, -height - 20, 20], [3, -height - 34, 25], [32, -height - 14, 17]].forEach(([x, y, radius]) => {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
    } else if (base.kind === "mountain") {
      context.strokeStyle = "#a756cf";
      context.lineWidth = 3;
      context.beginPath();
      context.stroke();
      context.fillStyle = "#f05b67";
      context.beginPath();
      context.moveTo(-14, -39);
      context.lineTo(-5, -43);
      context.lineTo(-8, -34);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(14, -39);
      context.lineTo(5, -43);
      context.lineTo(8, -34);
      context.closePath();
      context.fill();
    }
    drawEnemyFlag(-height + 8);
  } else if (base.kind === "camp") {
    context.fillStyle = "#a56c43";
    context.beginPath();
    context.moveTo(-82, 0);
    context.quadraticCurveTo(-43, -91, 0, -126);
    context.quadraticCurveTo(45, -91, 82, 0);
    context.closePath();
    context.fill();
    context.save();
    context.clip();
    context.restore();
    context.strokeStyle = "#563c2e";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(0, -127);
    context.lineTo(0, 0);
    context.stroke();
    context.fillStyle = "#3d2c27";
    context.beginPath();
    context.moveTo(-23, 0);
    context.lineTo(0, -61);
    context.lineTo(23, 0);
    context.closePath();
    context.fill();
    drawEnemyFlag(-168);
  } else {
    const tall = ["tower", "temple"].includes(base.kind);
    const keepY = tall ? -172 : -136;
    context.fillStyle = base.color;
    roundedPath(-53, keepY, 106, -keepY, 4);
    context.fill();
    drawStoneBlocks(-53, keepY, 106, -keepY, 26, 18);
    context.fillStyle = "rgba(255,255,255,.1)";
    context.fillRect(-42, keepY + 12, 8, -keepY - 29);
    context.fillStyle = base.color;
    roundedPath(-77, -108, 35, 108, 4);
    context.fill();
    drawStoneBlocks(-77, -108, 35, 108, 18, 18);
    roundedPath(42, -108, 35, 108, 4);
    context.fill();
    drawStoneBlocks(42, -108, 35, 108, 18, 18);
    drawBattlements(-77, -123, 35, 2, base.color);
    drawBattlements(42, -123, 35, 2, base.color);
    drawBattlements(-53, keepY - 15, 106, 5, base.color);
    context.fillStyle = "#302d31";
    roundedPath(-25, -50, 50, 50, 23);
    context.fill();
    context.fillStyle = "#ef9a98";
    roundedPath(-8, keepY + 35, 16, 24, 7);
    context.fill();
    drawEnemyFlag(keepY - 58);
  }
  context.restore();
}

function drawGoldMine(mineX) {
  context.fillStyle = "rgba(27,30,23,.18)";
  context.beginPath();
  context.ellipse(mineX, GROUND_Y + 25, 48, 9, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#76644a";
  context.beginPath();
  context.moveTo(mineX - 42, GROUND_Y + 24);
  context.lineTo(mineX - 23, GROUND_Y - 5);
  context.lineTo(mineX + 6, GROUND_Y + 1);
  context.lineTo(mineX + 30, GROUND_Y + 24);
  context.closePath();
  context.fill();
  context.fillStyle = "#e4b22b";
  [[-24, 13, 7], [-6, 3, 8], [13, 15, 6]].forEach(([offset, y, radius]) => {
    context.beginPath();
    context.arc(mineX + offset, GROUND_Y + y, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = "#ffe18a";
  context.beginPath();
  context.arc(mineX - 9, GROUND_Y, 2.5, 0, Math.PI * 2);
  context.fill();
}

function drawHealthBar(unit) {
  if (unit.hp >= unit.maxHp) return;
  const width = 34 * clamp(unit.scale, 1, 1.8);
  const x = unit.x - width / 2;
  const y = unit.y - 79 * unit.scale;
  context.fillStyle = "rgba(15,28,23,.55)";
  context.fillRect(x, y, width, 4);
  context.fillStyle = unit.side === "player" ? "#34d399" : "#ef6a6a";
  context.fillRect(x, y, width * clamp(unit.hp / unit.maxHp, 0, 1), 4);
}

function drawUnit(unit) {
  if (!unit.alive || unit.garrisoned && unit.type !== "archer") return;
  const sideDirection = unit.side === "player" ? 1 : -1;
  const bodyColor = unit.hitFlash > 0 ? "#ffffff" : unit.side === "player" ? "#10b981" : "#d94f4f";
  const outlineColor = unit.side === "player" ? "#003c2e" : "#681f28";
  const accentColor = unit.side === "player" ? "#067455" : "#922f39";
  const scale = unit.scale;
  const gait = unit.moving ? Math.sin(unit.walkPhase) : 0;
  const bob = unit.moving ? Math.abs(Math.cos(unit.walkPhase)) * -1.7 : 0;
  const progress = unit.actionTimer > 0 ? 1 - unit.actionTimer / unit.actionDuration : 0;
  const strike = unit.actionTimer > 0 ? Math.sin(progress * Math.PI) : 0;
  const lean = strike * 3;
  const isSpearton = unit.type === "spearton";
  const frontFoot = 9 + gait * 7;
  const backFoot = -8 - gait * 7;

  context.save();
  context.translate(unit.x, unit.y + bob);
  context.scale(sideDirection * scale, scale);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.fillStyle = "rgba(20,27,23,.22)";
  context.beginPath();
  context.ellipse(0, 3, unit.type === "giant" ? 18 : 13, unit.type === "giant" ? 4 : 3, 0, 0, Math.PI * 2);
  context.fill();

  const bodyWidth = unit.type === "giant" ? 6 : 4.5;
  const drawSkeleton = (color, width) => {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    if (isSpearton) {
      const frontKnee = 8 + gait * 3.5;
      const rearKnee = -10 - gait * 3;
      context.moveTo(lean + 2, -39);
      context.quadraticCurveTo(lean + 1, -29, -2, -18);
      context.moveTo(-2, -18);
      context.lineTo(frontKnee, -10);
      context.lineTo(14 + gait * 5, 0);
      context.moveTo(-2, -18);
      context.lineTo(rearKnee, -10);
      context.lineTo(-14 - gait * 5, 0);
    } else {
      context.moveTo(lean, -40);
      context.quadraticCurveTo(lean + 1, -29, lean, -18);
      context.moveTo(lean, -18);
      context.lineTo(frontFoot, 0);
      context.moveTo(lean, -18);
      context.lineTo(backFoot, 0);
    }
    context.stroke();
  };
  drawSkeleton(outlineColor, bodyWidth + 3);
  drawSkeleton(bodyColor, bodyWidth);

  if (!isSpearton) {
    context.fillStyle = outlineColor;
    context.beginPath();
    context.arc(0, -49, unit.type === "giant" ? 11.5 : 9.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = bodyColor;
    context.beginPath();
    context.arc(0, -49, unit.type === "giant" ? 9 : 7, 0, Math.PI * 2);
    context.fill();
  }

  if (unit.type === "miner") {
    const angle = -.82 + strike * 1.45;
    context.strokeStyle = outlineColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(8, -29);
    context.moveTo(lean, -31);
    context.lineTo(2, -23);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(8, -29);
    context.moveTo(lean, -31);
    context.lineTo(2, -23);
    context.stroke();
    context.save();
    context.translate(5, -27);
    context.rotate(angle);
    context.strokeStyle = "#684329";
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(-8, 0);
    context.lineTo(34, 0);
    context.stroke();
    context.strokeStyle = "#f4f8f7";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(27, -10);
    context.quadraticCurveTo(38, -8, 43, -1);
    context.moveTo(27, 10);
    context.quadraticCurveTo(38, 8, 43, 1);
    context.stroke();
    context.restore();
    if (unit.carriedGold > 0) {
      context.fillStyle = "#8a5a2e";
      roundedPath(-18, -34, 13, 17, 5);
      context.fill();
      context.fillStyle = "#f4bd2b";
      context.beginPath();
      context.arc(-11.5, -27, 3.5, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#d7a82b";
    roundedPath(-8, -57, 16, 5, 2);
    context.fill();
  } else if (unit.type === "swordsman") {
    context.strokeStyle = outlineColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(11, -29);
    context.moveTo(lean, -31);
    context.lineTo(-9, -21);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(11, -29);
    context.moveTo(lean, -31);
    context.lineTo(-9, -21);
    context.stroke();
    const swordAngle = -.92 + strike * 1.65;
    context.save();
    context.translate(11, -29);
    context.rotate(swordAngle);
    context.fillStyle = "#6f4a2b";
    roundedPath(-4, -2.5, 11, 5, 2);
    context.fill();
    context.fillStyle = "#f6fbff";
    context.beginPath();
    context.moveTo(5, -3.2);
    context.lineTo(36, -2);
    context.lineTo(43, 0);
    context.lineTo(36, 2);
    context.lineTo(5, 3.2);
    context.closePath();
    context.fill();
    context.fillStyle = spellEffects.swordsman > 0 && unit.side === "player" ? "#ff7a22" : "#71817e";
    roundedPath(3, -7, 4, 14, 2);
    context.fill();
    context.restore();
  } else if (unit.type === "archer") {
    const pull = strike * 11;
    context.strokeStyle = outlineColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(12, -33);
    context.moveTo(lean, -31);
    context.lineTo(7 - pull, -31);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(12, -33);
    context.moveTo(lean, -31);
    context.lineTo(7 - pull, -31);
    context.stroke();
    context.strokeStyle = accentColor;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(19, -49);
    context.bezierCurveTo(35, -43, 35, -21, 19, -15);
    context.stroke();
    context.strokeStyle = "#f6fbff";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(19, -49);
    context.lineTo(7 - pull, -31);
    context.lineTo(19, -15);
    context.stroke();
    context.strokeStyle = "#6b4a32";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(4 - pull, -31);
    context.lineTo(38, -31);
    context.stroke();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(41, -31);
    context.lineTo(34, -35);
    context.lineTo(34, -27);
    context.closePath();
    context.fill();
  } else if (unit.type === "spearton") {
    const thrust = strike * 18;
    const spearElbowX = 7 + thrust * .24;
    const spearHandX = 13 + thrust * .62;
    const spearHandY = -32;
    context.strokeStyle = outlineColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean + 1, -36);
    context.lineTo(spearElbowX, -35);
    context.lineTo(spearHandX, spearHandY);
    context.moveTo(lean, -32);
    context.lineTo(7, -27);
    context.lineTo(13, -25);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(lean + 1, -36);
    context.lineTo(spearElbowX, -35);
    context.lineTo(spearHandX, spearHandY);
    context.moveTo(lean, -32);
    context.lineTo(7, -27);
    context.lineTo(13, -25);
    context.stroke();
    context.save();
    context.translate(spearHandX, spearHandY);
    context.rotate(-.045 - strike * .018);
    context.strokeStyle = "#785033";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-15, 0);
    context.lineTo(51, 0);
    context.stroke();
    context.fillStyle = "#f6faf9";
    context.strokeStyle = "#657275";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(61, 0);
    context.lineTo(49, -5.5);
    context.lineTo(52, 0);
    context.lineTo(49, 5.5);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

    const shieldBlessed = spellEffects.shield > 0 && unit.side === "player";
    const drawSpeartonShield = () => {
      context.fillStyle = shieldBlessed ? "#e8bd32" : "#95643a";
      context.beginPath();
      context.moveTo(5, -38);
      context.quadraticCurveTo(18, -45, 31, -38);
      context.lineTo(30, -24);
      context.quadraticCurveTo(28, -13, 18, -7);
      context.quadraticCurveTo(8, -13, 6, -24);
      context.closePath();
      context.fill();
      context.strokeStyle = shieldBlessed ? "#fff0a8" : "#e6d2ac";
      context.lineWidth = 2.2;
      context.beginPath();
      context.moveTo(5, -38);
      context.quadraticCurveTo(18, -45, 31, -38);
      context.lineTo(30, -24);
      context.quadraticCurveTo(28, -13, 18, -7);
      context.quadraticCurveTo(8, -13, 6, -24);
      context.closePath();
      context.stroke();
      context.strokeStyle = shieldBlessed ? "rgba(120,77,8,.46)" : "rgba(69,39,20,.5)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(18, -42);
      context.lineTo(18, -10);
      context.moveTo(8, -34);
      context.quadraticCurveTo(18, -30, 28, -34);
      context.stroke();
      context.fillStyle = shieldBlessed ? "#fff0a6" : "#e5b637";
      context.beginPath();
      context.arc(18, -25, 4.2, 0, Math.PI * 2);
      context.fill();
    };

    context.strokeStyle = outlineColor;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(lean + 1, -38);
    context.lineTo(0, -45);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 4;
    context.stroke();

    context.save();
    context.translate(0, 3);
    const plumeColor = unit.side === "player" ? "#ef3340" : "#ffd23f";
    context.fillStyle = plumeColor;
    context.beginPath();
    context.moveTo(-10, -65);
    context.bezierCurveTo(-8, -76, -1, -82, 9, -82);
    context.bezierCurveTo(17, -82, 22, -75, 22, -66);
    context.lineTo(7, -67);
    context.bezierCurveTo(1, -66, -4, -60, -8, -54);
    context.bezierCurveTo(-11, -57, -12, -61, -10, -65);
    context.closePath();
    context.fill();
    context.strokeStyle = "#20231e";
    context.lineWidth = 1.8;
    context.stroke();

    context.fillStyle = "#7f7644";
    context.beginPath();
    context.moveTo(-9, -62);
    context.quadraticCurveTo(0, -68, 11, -64);
    context.quadraticCurveTo(15, -60, 15, -53);
    context.lineTo(12, -50);
    context.lineTo(18, -39);
    context.lineTo(4, -47);
    context.lineTo(-5, -39);
    context.lineTo(-4, -51);
    context.quadraticCurveTo(-8, -55, -9, -62);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#171b19";
    context.beginPath();
    context.moveTo(1, -57);
    context.lineTo(12, -55);
    context.lineTo(10, -51);
    context.lineTo(3, -52);
    context.closePath();
    context.fill();
    context.fillStyle = "#f5f6e9";
    context.beginPath();
    context.ellipse(8.5, -54, 1.2, .7, -.12, 0, Math.PI * 2);
    context.fill();
    context.restore();
    drawSpeartonShield();
  } else if (unit.type === "giant") {
    const slam = unit.actionTimer > 0 ? Math.sin(Math.min(1, progress / .72) * Math.PI / 2) : 0;
    const weaponElbowX = -8 + slam * 4;
    const weaponElbowY = -24 - slam * 1.5;
    const weaponHandX = -15 + slam * 10;
    const weaponHandY = -29 - slam * 2;
    context.strokeStyle = outlineColor;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(lean, -35);
    context.lineTo(weaponElbowX, weaponElbowY);
    context.lineTo(weaponHandX, weaponHandY);
    context.moveTo(lean, -31);
    context.lineTo(8, -21);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -35);
    context.lineTo(weaponElbowX, weaponElbowY);
    context.lineTo(weaponHandX, weaponHandY);
    context.moveTo(lean, -31);
    context.lineTo(8, -21);
    context.stroke();
    const malletAngle = unit.actionTimer > 0 ? -1.02 + slam * 1.52 : 2.55;
    context.save();
    context.translate(weaponHandX, weaponHandY);
    context.rotate(malletAngle);
    context.strokeStyle = "#69462c";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(-8, 0);
    context.lineTo(43, 0);
    context.stroke();
    context.fillStyle = unit.boss ? "#33213b" : "#26312f";
    roundedPath(36, -11, 37, 22, 10);
    context.fill();
    context.fillStyle = "#f0f4f2";
    [[46, -10], [55, -12], [64, -8], [48, 10], [59, 12], [69, 7]].forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 3.2, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  if (unit.boss) {
    context.fillStyle = "#f3b33d";
    context.beginPath();
    context.moveTo(-10, -59);
    context.lineTo(-7, -72);
    context.lineTo(0, -63);
    context.lineTo(8, -72);
    context.lineTo(10, -58);
    context.closePath();
    context.fill();
  }
  context.restore();
  drawHealthBar(unit);
}

function drawProjectiles() {
  projectiles.forEach((projectile) => {
    context.save();
    context.translate(projectile.x, projectile.y);
    context.rotate(projectile.angle ?? (projectile.side === "player" ? .1 : Math.PI - .1));
    context.strokeStyle = projectile.side === "player" ? "#075d46" : "#7d2c2c";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-13, 0);
    context.lineTo(12, 0);
    context.stroke();
    context.fillStyle = context.strokeStyle;
    context.beginPath();
    context.moveTo(12, 0);
    context.lineTo(6, -3);
    context.lineTo(6, 3);
    context.closePath();
    context.fill();
    context.restore();
  });
}

function drawParticles() {
  particles.forEach((particle) => {
    context.save();
    context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    context.fillStyle = particle.color;
    if (particle.shockwave) {
      const progress = 1 - particle.life / particle.maxLife;
      context.strokeStyle = particle.color;
      context.lineWidth = 4 * (1 - progress);
      context.beginPath();
      context.ellipse(particle.x, particle.y, 12 + progress * 50, 4 + progress * 13, 0, 0, Math.PI * 2);
      context.stroke();
    } else if (particle.text) {
      context.font = "800 14px system-ui";
      context.textAlign = "center";
      context.fillText(particle.text, particle.x, particle.y);
    } else if (particle.arrow) {
      context.translate(particle.x, particle.y);
      context.rotate(.2);
      context.fillRect(-1, -10, 2, 24);
    } else {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  });
}

function draw(now = performance.now()) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  drawScenery(now);
  drawGoldMine(PLAYER_MINE_X);
  drawGoldMine(ENEMY_MINE_X);
  drawPlayerCastle();
  drawEnemyBase();
  if (state === "playing" && command === "defend") drawUnit(castleArcher);
  units.slice().sort((first, second) => first.y - second.y).forEach((unit) => drawUnit(unit, now));
  drawProjectiles();
  drawParticles();
}

function gameLoop(now) {
  const deltaTime = Math.min((now - lastFrame) / 1000, .035);
  lastFrame = now;
  if (state === "playing") update(deltaTime);
  draw(now);
  window.requestAnimationFrame(gameLoop);
}

document.querySelector("#campaignButton").addEventListener("click", () => startMode("campaign"));
document.querySelector("#surpriseButton").addEventListener("click", () => startMode("surprise"));
document.querySelectorAll(".unit-button").forEach((button) => button.addEventListener("click", () => queueUnit(button.dataset.unit)));
document.querySelectorAll(".command-button").forEach((button) => button.addEventListener("click", () => {
  if (state !== "playing") return;
  command = button.dataset.command;
  units.filter((unit) => unit.alive && unit.side === "player" && unit.type === "archer").forEach((unit) => {
    if (command === "defend" && !unit.garrisoned) unit.defenseStage = "returning";
    if (command !== "defend") unit.defenseStage = null;
  });
  document.querySelectorAll(".command-button").forEach((item) => item.classList.toggle("is-active", item === button));
  const messages = { defend: "Toàn quân lùi về phòng thủ!", hold: "Giữ vững vị trí!", attack: "Toàn quân tấn công!" };
  showNotice(messages[command], 1.4);
}));

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartLevel);

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  const key = event.key.toLowerCase();
  if ([" ", "enter", "1", "2", "3", "4", "5", "a", "s", "d", "p"].includes(key)) event.preventDefault();
  if (["1", "2", "3", "4", "5"].includes(key) && state === "playing") {
    queueUnit(Object.keys(UNIT_TYPES)[Number(key) - 1]);
  }
  if (["a", "s", "d"].includes(key) && state === "playing") {
    const commands = { a: "defend", s: "hold", d: "attack" };
    document.querySelector(`[data-command="${commands[key]}"]`).click();
  }
  if (key === "p" && ["playing", "paused"].includes(state)) togglePause();
  if ((key === " " || key === "enter") && ["won", "lost"].includes(state)) primaryAction?.();
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

saveProgress(savedProgress);
randomizeScenery();
updateInterface();
draw();
window.requestAnimationFrame(gameLoop);
