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
const MAX_ARMY = 18;
const PLAYER_BASE_X = 94;
const ENEMY_BASE_X = 1186;
const SAVE_KEY = "tiny-army-progress";

const UNIT_TYPES = {
  miner: { label: "Thợ Mỏ", cost: 60, train: 2, hp: 110, speed: 38, damage: 0, range: 0, attackRate: 0, size: .92 },
  swordsman: { label: "Kiếm Sĩ", cost: 90, train: 3, hp: 110, speed: 58, damage: 24, range: 34, attackRate: .78, size: 1 },
  archer: { label: "Cung Thủ", cost: 135, train: 4, hp: 70, speed: 38, damage: 18, range: 210, attackRate: .78, size: .98 },
  shield: { label: "Khiên Binh", cost: 190, train: 6, hp: 225, speed: 25, damage: 34, range: 43, attackRate: 1.12, size: 1.08 },
  giant: { label: "Khổng Lồ", cost: 320, train: 9, hp: 430, speed: 16, damage: 76, range: 70, attackRate: 1.78, size: 1.55, splash: 94 },
};

const SPELLS = [
  { id: "miner", label: "Bùa Thợ Mỏ", short: "Mỏ", description: "Khai thác x2 trong 15 giây" },
  { id: "archer", label: "Mưa Tên", short: "Tên", description: "Mưa tên phủ khắp chiến trường" },
  { id: "swordsman", label: "Kiếm Lửa", short: "Lửa", description: "Kiếm Sĩ gây x2 sát thương trong 15 giây" },
  { id: "shield", label: "Giáp Vàng", short: "Giáp", description: "Khiên Binh nhận nửa sát thương trong 15 giây" },
  { id: "giant", label: "Cự Nhân", short: "Lớn", description: "Khổng Lồ tăng 1,5 lần kích thước và máu" },
];

const BASES = [
  { name: "Hang đá", kind: "cave", color: "#6d6257" },
  { name: "Doanh trại", kind: "camp", color: "#8b5d38" },
  { name: "Tháp canh", kind: "tower", color: "#716b62" },
  { name: "Đồn cát", kind: "fort", color: "#a77b46" },
  { name: "Pháo đài", kind: "fortress", color: "#5f6465" },
  { name: "Điện đá", kind: "temple", color: "#625b70" },
  { name: "Thành tuyết", kind: "castle", color: "#7f949b" },
  { name: "Núi lửa", kind: "volcano", color: "#513c39" },
  { name: "Kinh thành", kind: "citadel", color: "#615c54" },
  { name: "Đỉnh Ma Vương", kind: "mountain", color: "#3f3748" },
];

const SPELL_ICONS = {
  miner: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 16 5M7 3 4 9m16-1-2 6M12 8v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  archer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M7 3 4 5l3 2m1 4h12m-9-2-3 2 3 2m-7 6h16m-3-2 3 2-3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  swordsman: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 3 7 7-10 10-7 1 1-7Z" fill="currentColor"/><path d="M11 6c-1-3 2-4 2-6 3 3 4 5 1 8Z" fill="#f97316"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 6v6c0 5 3.3 8.5 8 10 4.7-1.5 8-5 8-10V6Z" fill="currentColor"/><path d="M12 6v11" stroke="#fff" stroke-width="2" opacity=".7"/></svg>',
  giant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h8v4h4v8h-4v8H8v-8H4V6h4Z" fill="currentColor"/></svg>',
};

let state = "menu";
let mode = "campaign";
let level = 1;
let gold = 220;
let command = "attack";
let units = [];
let projectiles = [];
let particles = [];
let trainingQueue = [];
let trainingElapsed = 0;
let enemySpawnTimer = 0;
let enemySpawnCount = 0;
let baseShotTimers = { player: 0, enemy: 0 };
let playerBase = { hp: 1200, maxHp: 1200 };
let enemyBase = { hp: 900, maxHp: 900 };
let spellCharges = {};
let spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
let arrowRain = null;
let noticeTimer = 0;
let lastFrame = performance.now();
let unitId = 0;
let primaryAction = null;
let savedProgress = loadProgress();

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
    ? `Đã mở đến ải ${String(savedProgress).padStart(2, "0")} · 5 loại bùa`
    : "10 chiến trường · 5 loại bùa";
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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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
  startLevel();
}

function startLevel() {
  const difficulty = level - 1;
  state = "playing";
  gold = 220 + difficulty * 18;
  command = "attack";
  units = [];
  projectiles = [];
  particles = [];
  trainingQueue = [];
  trainingElapsed = 0;
  enemySpawnTimer = 2.8;
  enemySpawnCount = 0;
  baseShotTimers = { player: 0, enemy: 0 };
  playerBase = { hp: 1200, maxHp: 1200 };
  const enemyHp = 760 + difficulty * 165 + (level === 10 ? 250 : 0);
  enemyBase = { hp: enemyHp, maxHp: enemyHp };
  spellCharges = createSpellCharges(level);
  spellEffects = { miner: 0, swordsman: 0, shield: 0, giant: 0 };
  arrowRain = null;
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
  spawnUnit("miner", "player", { x: 165 });
  if (level >= 4) spawnUnit("swordsman", "player", { x: 210 });
  if (level >= 7) spawnUnit("shield", "enemy", { x: 1090 });
  renderSpells();
  updateInterface();
  showNotice(level === 10 ? "Cảnh báo: Khổng Lồ Ma Vương đang đến!" : `Ải ${String(level).padStart(2, "0")} · ${BASES[level - 1].name}`, 2.8);
  lastFrame = performance.now();
}

function restartLevel() {
  startLevel();
}

function restartJourney() {
  level = 1;
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
    mineTimer: randomBetween(.2, 1.2),
    walkPhase: Math.random() * Math.PI * 2,
    hitFlash: 0,
    actionTimer: 0,
    actionDuration: 0,
    moving: false,
    scale: definition.size * scaleMultiplier,
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
  const playerCount = units.filter((unit) => unit.side === "player" && unit.alive).length + trainingQueue.length;
  if (playerCount >= MAX_ARMY) {
    showNotice("Đội quân đã đạt giới hạn 18");
    return;
  }
  if (gold < definition.cost) {
    showNotice(`Cần thêm ${formatNumber(definition.cost - gold)} vàng`);
    return;
  }
  if (trainingQueue.length >= 5) {
    showNotice("Hàng chờ huấn luyện đã đầy");
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
  const pool = ["swordsman", "swordsman", "swordsman"];
  if (level >= 2) pool.push("archer");
  if (level >= 3) pool.push("shield");
  if (level >= 5) pool.push("archer", "shield");
  if (level >= 6) pool.push("giant");
  if (level >= 8) pool.push("giant", "shield");
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateEnemySpawns(deltaTime) {
  enemySpawnTimer -= deltaTime;
  if (enemySpawnTimer > 0) return;

  if (level === 10 && enemySpawnCount === 0) {
    spawnUnit("giant", "enemy", { boss: true });
    showNotice("Khổng Lồ Ma Vương đã xuất hiện!", 3);
    enemySpawnCount += 1;
    enemySpawnTimer = 7.5;
    return;
  }

  const activeEnemies = units.filter((unit) => unit.side === "enemy" && unit.alive).length;
  if (activeEnemies < 5 + Math.floor(level / 2)) {
    const type = chooseEnemyType();
    spawnUnit(type, "enemy");
    enemySpawnCount += 1;
  }
  const pace = clamp(7.2 - level * .38, 3.25, 7);
  enemySpawnTimer = randomBetween(pace * .82, pace * 1.18);
}

function closestOpponent(unit) {
  let closest = null;
  let closestDistance = Infinity;
  units.forEach((candidate) => {
    if (!candidate.alive || candidate.side === unit.side || candidate.type === "miner" && Math.abs(candidate.x - unit.x) > 120) return;
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
  if (target.type === "shield") finalDamage *= .78;
  if (target.side === "player" && target.type === "shield" && spellEffects.shield > 0) finalDamage *= .5;
  target.hp -= finalDamage;
  target.hitFlash = .12;
  burst(target.x, target.y - 31 * target.scale, attackerSide === "player" ? "#34d399" : "#ef7777", attackerType === "giant" ? 7 : 3);
  if (target.hp <= 0) {
    target.alive = false;
    burst(target.x, target.y - 20, target.side === "player" ? "#10b981" : "#d94f4f", target.type === "giant" ? 18 : 9);
  }
}

function beginAttack(unit) {
  const durations = { miner: .62, swordsman: .42, archer: .48, shield: .58, giant: .92 };
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

function updateMiner(unit, deltaTime) {
  if (unit.side !== "player") return;
  unit.mineTimer -= deltaTime;
  unit.walkPhase += deltaTime * 1.7;
  unit.x = 202 + Math.sin(unit.walkPhase) * 35;
  unit.moving = unit.actionTimer <= 0;
  if (unit.mineTimer <= 0) {
    beginAttack(unit);
    const multiplier = spellEffects.miner > 0 ? 2 : 1;
    const earned = 13 * multiplier;
    gold += earned;
    unit.mineTimer = 2.15;
    particles.push({ x: unit.x, y: unit.y - 45, vx: 0, vy: -22, life: 1.1, maxLife: 1.1, color: "#d9a51c", text: `+${earned}` });
  }
}

function updateUnit(unit, deltaTime) {
  if (!unit.alive) return;
  unit.hitFlash = Math.max(0, unit.hitFlash - deltaTime);
  unit.attackCooldown -= deltaTime;
  unit.actionTimer = Math.max(0, unit.actionTimer - deltaTime);
  unit.moving = false;
  unit.walkPhase += deltaTime * 4;

  if (unit.type === "miner") {
    updateMiner(unit, deltaTime);
    return;
  }

  const definition = UNIT_TYPES[unit.type];
  const { target, distance } = closestOpponent(unit);
  const reach = definition.range + (target ? unitRadius(target) : 0);
  if (target && distance <= reach) {
    if (unit.attackCooldown <= 0) {
      attackUnit(unit, target);
      unit.attackCooldown = definition.attackRate;
    }
    return;
  }

  if (unit.side === "player" && command === "hold") return;

  if (unit.side === "player" && command === "defend") {
    if (unit.x > 330) {
      unit.x -= definition.speed * deltaTime;
      unit.moving = true;
    } else if (target && distance < 165) {
      unit.x += Math.sign(target.x - unit.x) * definition.speed * deltaTime;
      unit.moving = true;
    }
    return;
  }

  const enemyBaseDistance = unit.side === "player" ? ENEMY_BASE_X - unit.x : unit.x - PLAYER_BASE_X;
  const baseReach = definition.range + 56;
  if (enemyBaseDistance <= baseReach) {
    if (unit.attackCooldown <= 0) {
      attackBase(unit);
      unit.attackCooldown = definition.attackRate;
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

function updateBaseDefenses(deltaTime) {
  ["player", "enemy"].forEach((side) => {
    baseShotTimers[side] -= deltaTime;
    if (baseShotTimers[side] > 0) return;
    const baseX = side === "player" ? PLAYER_BASE_X : ENEMY_BASE_X;
    const target = units
      .filter((unit) => unit.alive && unit.side !== side && Math.abs(unit.x - baseX) < 235)
      .sort((first, second) => Math.abs(first.x - baseX) - Math.abs(second.x - baseX))[0];
    if (!target) return;
    projectiles.push({ kind: "arrow", side, x: baseX, y: GROUND_Y - 105, target, damage: 15 + level * .8, speed: 470, life: 2 });
    baseShotTimers[side] = 2.5;
  });
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
  const playerCount = units.filter((unit) => unit.side === "player" && unit.alive).length;
  armyValue.textContent = `${playerCount} / ${MAX_ARMY}`;
  modeLabel.textContent = mode === "campaign" ? "Vượt ải" : "Bất ngờ";
  levelValue.textContent = `Ải ${String(level).padStart(2, "0")} / 10`;
  enemyBaseName.textContent = BASES[level - 1].name;
  playerBaseHealth.style.width = `${clamp(playerBase.hp / playerBase.maxHp * 100, 0, 100)}%`;
  enemyBaseHealth.style.width = `${clamp(enemyBase.hp / enemyBase.maxHp * 100, 0, 100)}%`;

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
    button.disabled = state !== "playing" || gold < definition.cost || playerCount + trainingQueue.length >= MAX_ARMY || trainingQueue.length >= 5;
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
  resultKeyHint.textContent = won ? "Nhấn Space hoặc Enter để tiếp tục" : "Nhấn Space hoặc Enter để chơi lại màn";
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
    resultTitle.textContent = "Trận chiến đang được giữ lại";
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
  updateEnemySpawns(deltaTime);
  updateSpellEffects(deltaTime);
  updateArrowRain(deltaTime);
  units.forEach((unit) => updateUnit(unit, deltaTime));
  updateProjectiles(deltaTime);
  updateBaseDefenses(deltaTime);
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

function drawScenery(now) {
  const dark = isDarkTheme();
  const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, dark ? "#13292f" : "#a9dce7");
  sky.addColorStop(1, dark ? "#28443f" : "#e7f1dc");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, GROUND_Y + 1);

  context.fillStyle = dark ? "rgba(234,198,111,.12)" : "rgba(255,224,139,.28)";
  context.beginPath();
  context.arc(1008, 91, 61, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = dark ? "#e8c56f" : "#f3c65e";
  context.beginPath();
  context.arc(1008, 91, 39, 0, Math.PI * 2);
  context.fill();

  drawCloud(160 + Math.sin(now * .000035) * 18, 91, .78, dark ? "rgba(213,230,225,.18)" : "rgba(255,255,255,.68)");
  drawCloud(687 + Math.sin(now * .000025 + 2) * 22, 139, .56, dark ? "rgba(213,230,225,.13)" : "rgba(255,255,255,.48)");

  context.fillStyle = dark ? "#294a48" : "#8eb7a8";
  context.beginPath();
  context.moveTo(0, 335);
  context.bezierCurveTo(95, 305, 115, 199, 181, 183);
  context.bezierCurveTo(244, 217, 264, 310, 338, 327);
  context.bezierCurveTo(398, 296, 414, 181, 493, 169);
  context.bezierCurveTo(575, 211, 596, 310, 680, 331);
  context.bezierCurveTo(754, 305, 772, 224, 836, 214);
  context.bezierCurveTo(909, 245, 925, 322, 1000, 330);
  context.bezierCurveTo(1076, 306, 1094, 197, 1160, 192);
  context.bezierCurveTo(1222, 226, 1242, 306, 1280, 322);
  context.lineTo(1280, GROUND_Y);
  context.lineTo(0, GROUND_Y);
  context.closePath();
  context.fill();

  context.fillStyle = dark ? "#355d54" : "#6f9d79";
  context.beginPath();
  context.moveTo(0, 369);
  context.bezierCurveTo(150, 286, 250, 374, 390, 337);
  context.bezierCurveTo(535, 297, 625, 382, 766, 346);
  context.bezierCurveTo(917, 307, 1027, 385, 1130, 344);
  context.bezierCurveTo(1199, 316, 1245, 340, 1280, 355);
  context.lineTo(1280, GROUND_Y);
  context.lineTo(0, GROUND_Y);
  context.closePath();
  context.fill();

  context.fillStyle = dark ? "#28453a" : "#5f864f";
  [302, 657, 875].forEach((x, index) => {
    const width = index === 1 ? 76 : 92;
    context.beginPath();
    context.moveTo(x - width / 2, GROUND_Y);
    context.bezierCurveTo(x - width / 2, GROUND_Y - 27, x - 19, GROUND_Y - 29, x - 10, GROUND_Y - 20);
    context.bezierCurveTo(x + 4, GROUND_Y - 42, x + 25, GROUND_Y - 31, x + 29, GROUND_Y - 17);
    context.bezierCurveTo(x + 47, GROUND_Y - 23, x + width / 2, GROUND_Y - 10, x + width / 2, GROUND_Y);
    context.fill();
  });

  context.fillStyle = dark ? "#34483a" : "#718b50";
  context.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  context.fillStyle = dark ? "#4a4b3b" : "#9c8c64";
  context.fillRect(0, GROUND_Y + 38, WIDTH, 44);
  context.fillStyle = dark ? "rgba(235,231,201,.09)" : "rgba(255,251,220,.28)";
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

function drawPlayerCastle() {
  context.save();
  context.translate(PLAYER_BASE_X, GROUND_Y);
  context.fillStyle = "rgba(17,31,26,.2)";
  context.beginPath();
  context.ellipse(0, 7, 79, 13, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#24483d";
  roundedPath(-50, -138, 100, 138, 4);
  context.fill();
  context.fillStyle = "#315f50";
  roundedPath(-72, -111, 34, 111, 4);
  context.fill();
  roundedPath(38, -111, 34, 111, 4);
  context.fill();
  drawBattlements(-72, -126, 34, 2, "#315f50");
  drawBattlements(38, -126, 34, 2, "#315f50");
  drawBattlements(-50, -154, 100, 5, "#24483d");

  context.fillStyle = "rgba(255,255,255,.08)";
  context.fillRect(-39, -130, 7, 83);
  context.fillRect(46, -100, 5, 53);
  context.fillStyle = "#142a24";
  roundedPath(-23, -51, 46, 51, 22);
  context.fill();
  context.fillStyle = "#8fe3c2";
  roundedPath(-9, -105, 18, 27, 8);
  context.fill();
  context.fillStyle = "#173a31";
  context.fillRect(-1, -105, 2, 27);

  context.fillStyle = "#17332b";
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
    const height = base.kind === "mountain" ? 224 : 178;
    context.fillStyle = base.color;
    context.beginPath();
    context.moveTo(-94, 0);
    context.bezierCurveTo(-77, -63, -51, -100, -27, -127);
    context.bezierCurveTo(-13, -146, -6, -height, 4, -height);
    context.bezierCurveTo(16, -height, 22, -147, 38, -122);
    context.bezierCurveTo(63, -88, 79, -50, 93, 0);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(255,255,255,.08)";
    context.beginPath();
    context.moveTo(-47, -102);
    context.quadraticCurveTo(-17, -148, -5, -183);
    context.quadraticCurveTo(4, -154, 18, -128);
    context.closePath();
    context.fill();
    context.fillStyle = base.kind === "volcano" ? "#d65b38" : "#252124";
    roundedPath(-37, -54, 74, 54, 31);
    context.fill();
    if (base.kind === "volcano") {
      context.fillStyle = "#f08a42";
      context.beginPath();
      context.moveTo(-15, -166);
      context.quadraticCurveTo(0, -153, 15, -166);
      context.lineTo(8, -187);
      context.lineTo(-8, -187);
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
    context.fillStyle = "rgba(255,255,255,.1)";
    context.fillRect(-42, keepY + 12, 8, -keepY - 29);
    context.fillStyle = base.color;
    roundedPath(-77, -108, 35, 108, 4);
    context.fill();
    roundedPath(42, -108, 35, 108, 4);
    context.fill();
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

function drawGoldMine() {
  context.fillStyle = "rgba(27,30,23,.18)";
  context.beginPath();
  context.ellipse(220, GROUND_Y + 25, 48, 9, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#76644a";
  context.beginPath();
  context.moveTo(178, GROUND_Y + 24);
  context.lineTo(197, GROUND_Y - 5);
  context.lineTo(226, GROUND_Y + 1);
  context.lineTo(250, GROUND_Y + 24);
  context.closePath();
  context.fill();
  context.fillStyle = "#e4b22b";
  [[196, 13, 7], [214, 3, 8], [233, 15, 6]].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, GROUND_Y + y, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = "#ffe18a";
  context.beginPath();
  context.arc(211, GROUND_Y, 2.5, 0, Math.PI * 2);
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
  if (!unit.alive) return;
  const sideDirection = unit.side === "player" ? 1 : -1;
  const bodyColor = unit.hitFlash > 0 ? "#ffffff" : unit.side === "player" ? "#10b981" : "#d94f4f";
  const outlineColor = unit.side === "player" ? "#075342" : "#6e2930";
  const accentColor = unit.side === "player" ? "#0a6c52" : "#812f35";
  const scale = unit.scale;
  const gait = unit.moving ? Math.sin(unit.walkPhase) : 0;
  const bob = unit.moving ? Math.abs(Math.cos(unit.walkPhase)) * -1.7 : 0;
  const progress = unit.actionTimer > 0 ? 1 - unit.actionTimer / unit.actionDuration : 0;
  const strike = unit.actionTimer > 0 ? Math.sin(progress * Math.PI) : 0;
  const lean = strike * 3;
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
    context.moveTo(lean, -40);
    context.quadraticCurveTo(lean + 1, -29, lean, -18);
    context.moveTo(lean, -18);
    context.lineTo(frontFoot, 0);
    context.moveTo(lean, -18);
    context.lineTo(backFoot, 0);
    context.stroke();
  };
  drawSkeleton(outlineColor, bodyWidth + 3);
  drawSkeleton(bodyColor, bodyWidth);

  context.fillStyle = outlineColor;
  context.beginPath();
  context.arc(0, -49, unit.type === "giant" ? 11.5 : 9.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = bodyColor;
  context.beginPath();
  context.arc(0, -49, unit.type === "giant" ? 9 : 7, 0, Math.PI * 2);
  context.fill();

  if (unit.type === "miner") {
    const angle = -.78 + strike * 1.5;
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
    context.strokeStyle = "#6b4a32";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-8, 0);
    context.lineTo(34, 0);
    context.stroke();
    context.strokeStyle = "#c8d3d0";
    context.lineWidth = 2.5;
    context.beginPath();
    context.arc(-10, 0, 5, -Math.PI / 2, Math.PI / 2);
    context.stroke();
    context.fillStyle = "#9eaaa7";
    context.beginPath();
    context.moveTo(31, -6);
    context.quadraticCurveTo(43, 0, 31, 7);
    context.lineTo(26, 4);
    context.lineTo(26, -4);
    context.closePath();
    context.fill();
    context.restore();
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
    context.fillStyle = "#d7e2df";
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
    if (unit.actionTimer > 0) {
      context.strokeStyle = spellEffects.swordsman > 0 && unit.side === "player" ? "rgba(255,122,34,.72)" : "rgba(230,241,237,.42)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(10, -29, 43, -1.05, .72);
      context.stroke();
    }
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
    context.strokeStyle = "#d8e2df";
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
    context.fillStyle = "#dce7e4";
    context.beginPath();
    context.moveTo(41, -31);
    context.lineTo(34, -35);
    context.lineTo(34, -27);
    context.closePath();
    context.fill();
  } else if (unit.type === "shield") {
    const spearAngle = -.42 + strike * .48;
    context.strokeStyle = outlineColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(10, -30);
    context.moveTo(lean, -31);
    context.lineTo(-10, -23);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(lean, -34);
    context.lineTo(10, -30);
    context.moveTo(lean, -31);
    context.lineTo(-10, -23);
    context.stroke();
    context.save();
    context.translate(8, -31);
    context.rotate(spearAngle);
    context.strokeStyle = "#785033";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-10, 0);
    context.lineTo(48, 0);
    context.stroke();
    context.fillStyle = "#d8e2df";
    context.beginPath();
    context.moveTo(57, 0);
    context.lineTo(46, -5);
    context.lineTo(46, 5);
    context.closePath();
    context.fill();
    context.restore();
    context.fillStyle = spellEffects.shield > 0 && unit.side === "player" ? "#d9aa21" : accentColor;
    context.beginPath();
    context.moveTo(10, -41);
    context.quadraticCurveTo(23, -43, 29, -35);
    context.lineTo(27, -13);
    context.quadraticCurveTo(20, -5, 12, -10);
    context.lineTo(8, -34);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.38)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(14, -37);
    context.lineTo(18, -12);
    context.stroke();
    context.fillStyle = "#d3ddd9";
    context.beginPath();
    context.arc(18, -25, 3.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = outlineColor;
    context.beginPath();
    context.arc(0, -51, 10.5, Math.PI, 0);
    context.lineTo(10, -47);
    context.lineTo(-10, -47);
    context.closePath();
    context.fill();
    context.fillRect(-1.5, -51, 3, 10);
  } else if (unit.type === "giant") {
    context.strokeStyle = outlineColor;
    context.lineWidth = 9;
    context.beginPath();
    context.moveTo(lean, -35);
    context.lineTo(12, -29);
    context.moveTo(lean, -31);
    context.lineTo(8, -22);
    context.stroke();
    context.strokeStyle = bodyColor;
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(lean, -35);
    context.lineTo(12, -29);
    context.moveTo(lean, -31);
    context.lineTo(8, -22);
    context.stroke();
    const malletAngle = -.96 + strike * 1.55;
    context.save();
    context.translate(10, -27);
    context.rotate(malletAngle);
    context.strokeStyle = "#68462e";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(-8, 0);
    context.lineTo(43, 0);
    context.stroke();
    context.fillStyle = unit.boss ? "#49304e" : "#354944";
    roundedPath(38, -13, 29, 26, 7);
    context.fill();
    context.fillStyle = "rgba(255,255,255,.16)";
    roundedPath(42, -9, 6, 18, 3);
    context.fill();
    context.restore();
    if (unit.actionTimer > 0) {
      context.strokeStyle = "rgba(255,255,255,.22)";
      context.lineWidth = 4;
      context.beginPath();
      context.arc(9, -28, 59, -1.05, .58);
      context.stroke();
    }
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
  drawGoldMine();
  drawPlayerCastle();
  drawEnemyBase();
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
updateInterface();
draw();
window.requestAnimationFrame(gameLoop);
