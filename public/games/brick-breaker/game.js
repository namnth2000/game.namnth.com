"use strict";

const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const board = document.querySelector("#board");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const launchButton = document.querySelector("#launchButton");
const introOverlay = document.querySelector("#introOverlay");
const messageOverlay = document.querySelector("#messageOverlay");
const messageIcon = document.querySelector("#messageIcon");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const scoreValue = document.querySelector("#scoreValue");
const highScoreValue = document.querySelector("#highScoreValue");
const levelValue = document.querySelector("#levelValue");
const brickValue = document.querySelector("#brickValue");
const campaignLabel = document.querySelector("#campaignLabel");
const campaignTrack = document.querySelector("#campaignTrack");
const levelHint = document.querySelector("#levelHint");
const effectBar = document.querySelector("#effectBar");
const itemToast = document.querySelector("#itemToast");
const helpDialog = document.querySelector("#helpDialog");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_Y = 618;
const BALL_RADIUS = 8;
const LEVELS = [
  { rows: 4, speed: 410, drop: .15, bomb: 0, hint: "Làm quen với nhịp bóng và thanh đỡ." },
  { rows: 4, speed: 425, drop: .16, bomb: 0, hint: "Gạch có số 2 cần thêm một lần va chạm." },
  { rows: 5, speed: 440, drop: .17, bomb: 0, hint: "Giữ góc bóng thấp để quét nhanh hai cánh." },
  { rows: 5, speed: 450, drop: .17, bomb: 6.5, hint: "Bom bắt đầu rơi — đừng để chúng chạm thanh." },
  { rows: 5, speed: 462, drop: .18, bomb: 5.9, hint: "Gạch 3 lớp xuất hiện, hãy săn Bóng nổ." },
  { rows: 6, speed: 474, drop: .18, bomb: 5.4, hint: "Gạch xám bất hoại sẽ đổi đường bóng." },
  { rows: 6, speed: 486, drop: .19, bomb: 5, hint: "Khoảng trống hẹp đòi hỏi góc đánh chính xác." },
  { rows: 6, speed: 500, drop: .2, bomb: 4.6, hint: "Nhiều gạch cứng hơn và bom rơi nhanh hơn." },
  { rows: 6, speed: 514, drop: .2, bomb: 4.2, hint: "Dùng Lazer để mở lối qua các cụm gạch dày." },
  { rows: 7, speed: 528, drop: .21, bomb: 3.8, hint: "Màn cuối — phối hợp vật phẩm để sống sót." },
];

const POWER_UPS = {
  laser: { label: "Lazer", short: "L", color: "#10b981" },
  triple: { label: "x3 bóng", short: "×3", color: "#0ea5e9" },
  blast: { label: "Bóng nổ", short: "✦", color: "#f97316" },
  barrier: { label: "Thanh chặn", short: "━", color: "#6366f1" },
  magnet: { label: "Nam châm", short: "U", color: "#e11d48" },
  expand: { label: "Mở rộng", short: "↔", color: "#f0b429" },
};

let state = "idle";
let currentLevel = 1;
let score = 0;
let scoreAtLevelStart = 0;
let highScore = Number.parseInt(localStorage.getItem("brick-breaker-high-score") || "0", 10) || 0;
let bricks = [];
let balls = [];
let drops = [];
let bombs = [];
let lasers = [];
let lastFrame = performance.now();
let bombClock = 0;
let toastTimer = 0;
let lastEffectSignature = "";
let keyLeft = false;
let keyRight = false;
let pointerActive = false;
let messageActions = { primary: null, secondary: null };

const paddle = {
  x: WIDTH / 2 - 65,
  y: PADDLE_Y,
  width: 130,
  height: 14,
  baseWidth: 130,
  speed: 720,
  frozenUntil: 0,
};

const effects = {
  blastUntil: 0,
  barrierUntil: 0,
  expandUntil: 0,
  penaltyUntil: 0,
  magnetCharges: 0,
};

function levelConfig() {
  return LEVELS[currentLevel - 1];
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function formatNumber(number) {
  return new Intl.NumberFormat("vi-VN").format(number);
}

function roundedRectangle(x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function isDarkTheme() {
  return document.documentElement.dataset.theme === "dark";
}

function resetEffects() {
  effects.blastUntil = 0;
  effects.barrierUntil = 0;
  effects.expandUntil = 0;
  effects.penaltyUntil = 0;
  effects.magnetCharges = 0;
  lastEffectSignature = "";
  renderEffects(performance.now());
}

function createLevelBricks() {
  bricks = [];
  const config = levelConfig();
  const columns = 10;
  const gap = 7;
  const side = 48;
  const brickWidth = (WIDTH - side * 2 - gap * (columns - 1)) / columns;
  const brickHeight = 25;
  const startY = 69;

  for (let row = 0; row < config.rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const patternValue = row * columns + column + currentLevel;
      const skip = (currentLevel === 2 && row === 0 && column % 3 === 1)
        || (currentLevel === 3 && patternValue % 11 === 0)
        || (currentLevel >= 7 && (row + column * 2 + currentLevel) % 17 === 0);
      if (skip) continue;

      const unbreakable = currentLevel >= 6
        && row > 0
        && row < config.rows - 1
        && (column * 3 + row * 5 + currentLevel) % (currentLevel >= 9 ? 11 : 14) === 0;
      let hitPoints = 1;
      if (currentLevel >= 2 && patternValue % 4 === 0) hitPoints = 2;
      if (currentLevel >= 5 && (column * 2 + row + currentLevel) % 7 === 0) hitPoints = 3;
      if (currentLevel >= 8 && (column + row * 2) % 5 === 0) hitPoints = Math.max(hitPoints, 2);

      bricks.push({
        x: side + column * (brickWidth + gap),
        y: startY + row * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        hitPoints: unbreakable ? Infinity : hitPoints,
        maxHitPoints: unbreakable ? Infinity : hitPoints,
        unbreakable,
        alive: true,
      });
    }
  }
}

function createBall(stuck = true, source = null, angleOffset = 0) {
  const config = levelConfig();
  if (source) {
    const speed = Math.hypot(source.vx, source.vy) || config.speed;
    const currentAngle = Math.atan2(source.vy, source.vx) + angleOffset;
    return {
      x: source.x,
      y: source.y,
      vx: Math.cos(currentAngle) * speed,
      vy: Math.sin(currentAngle) * speed,
      radius: BALL_RADIUS,
      stuck: false,
      stickOffset: 0,
    };
  }

  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - BALL_RADIUS - 2,
    vx: config.speed * .48,
    vy: -config.speed * .88,
    radius: BALL_RADIUS,
    stuck,
    stickOffset: 0,
  };
}

function resetPaddleAndBall() {
  paddle.width = paddle.baseWidth;
  paddle.x = WIDTH / 2 - paddle.width / 2;
  paddle.frozenUntil = 0;
  balls = [createBall(true)];
}

function prepareLevel() {
  createLevelBricks();
  drops = [];
  bombs = [];
  lasers = [];
  bombClock = 0;
  resetEffects();
  resetPaddleAndBall();
  updateInterface();
  draw();
}

function startJourney() {
  currentLevel = 1;
  score = 0;
  scoreAtLevelStart = 0;
  state = "running";
  prepareLevel();
  beginPlayInterface();
}

function restartCurrentLevel() {
  score = scoreAtLevelStart;
  state = "running";
  messageActions = { primary: null, secondary: null };
  messageOverlay.hidden = true;
  prepareLevel();
  beginPlayInterface();
}

function nextLevel() {
  currentLevel += 1;
  scoreAtLevelStart = score;
  state = "running";
  messageActions = { primary: null, secondary: null };
  messageOverlay.hidden = true;
  prepareLevel();
  beginPlayInterface();
}

function beginPlayInterface() {
  introOverlay.hidden = true;
  messageOverlay.hidden = true;
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "Đang chinh phục";
  pauseButton.disabled = false;
  pauseButton.dataset.state = "pause";
  pauseButton.setAttribute("aria-label", "Tạm dừng");
  restartButton.disabled = false;
  launchButton.textContent = "Thả bóng";
}

function updateInterface() {
  const breakableCount = bricks.filter((brick) => brick.alive && !brick.unbreakable).length;
  scoreValue.textContent = formatNumber(score);
  highScoreValue.textContent = formatNumber(highScore);
  levelValue.textContent = `${String(currentLevel).padStart(2, "0")}/10`;
  brickValue.textContent = breakableCount || "—";
  campaignLabel.textContent = `Màn ${String(currentLevel).padStart(2, "0")} / 10`;
  levelHint.textContent = levelConfig().hint;
  [...campaignTrack.children].forEach((item, index) => {
    item.classList.toggle("is-done", index + 1 < currentLevel);
    item.classList.toggle("is-current", index + 1 === currentLevel);
  });
}

function saveHighScore() {
  if (score <= highScore) return;
  highScore = score;
  localStorage.setItem("brick-breaker-high-score", String(highScore));
}

function launchBalls() {
  if (state !== "running") return;
  const stuckBalls = balls.filter((ball) => ball.stuck);
  stuckBalls.forEach((ball, index) => {
    const speed = levelConfig().speed;
    const direction = index % 2 === 0 ? 1 : -1;
    ball.stuck = false;
    ball.vx = speed * (.38 + index * .06) * direction;
    ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * .5));
  });
  if (stuckBalls.length) launchButton.textContent = "Đang chơi";
}

function movePaddleTo(clientX) {
  const rectangle = canvas.getBoundingClientRect();
  const canvasX = (clientX - rectangle.left) * WIDTH / rectangle.width;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, canvasX - paddle.width / 2));
  syncStuckBalls();
}

function syncStuckBalls() {
  balls.forEach((ball) => {
    if (!ball.stuck) return;
    const minimumOffset = -paddle.width / 2 + ball.radius + 3;
    const maximumOffset = paddle.width / 2 - ball.radius - 3;
    ball.stickOffset = Math.max(minimumOffset, Math.min(maximumOffset, ball.stickOffset));
    ball.x = paddle.x + paddle.width / 2 + ball.stickOffset;
    ball.y = paddle.y - ball.radius - 2;
  });
}

function updatePaddle(deltaTime, now) {
  let targetWidth = paddle.baseWidth;
  if (effects.expandUntil > now) targetWidth = 192;
  if (effects.penaltyUntil > now) targetWidth *= .7;
  if (Math.abs(paddle.width - targetWidth) > .2) {
    const center = paddle.x + paddle.width / 2;
    paddle.width += (targetWidth - paddle.width) * Math.min(1, deltaTime * 9);
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, center - paddle.width / 2));
  }

  if (now >= paddle.frozenUntil) {
    const direction = Number(keyRight) - Number(keyLeft);
    paddle.x += direction * paddle.speed * deltaTime;
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
  }
  syncStuckBalls();
}

function circleHitsRectangle(ball, rectangle) {
  const closestX = Math.max(rectangle.x, Math.min(ball.x, rectangle.x + rectangle.width));
  const closestY = Math.max(rectangle.y, Math.min(ball.y, rectangle.y + rectangle.height));
  const deltaX = ball.x - closestX;
  const deltaY = ball.y - closestY;
  return deltaX * deltaX + deltaY * deltaY <= ball.radius * ball.radius;
}

function bounceFromPaddle(ball, now) {
  if (ball.vy <= 0 || !circleHitsRectangle(ball, paddle)) return false;
  ball.y = paddle.y - ball.radius - 1;
  const relativeHit = Math.max(-1, Math.min(1, (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)));
  const speed = Math.max(levelConfig().speed, Math.hypot(ball.vx, ball.vy));
  const angle = relativeHit * 1.08;
  ball.vx = Math.sin(angle) * speed;
  ball.vy = -Math.cos(angle) * speed;

  if (effects.magnetCharges > 0) {
    effects.magnetCharges -= 1;
    ball.stuck = true;
    ball.stickOffset = ball.x - (paddle.x + paddle.width / 2);
    launchButton.textContent = "Thả bóng";
    renderEffects(now);
  }
  return true;
}

function bounceFromBrick(ball, brick, previousX, previousY) {
  const cameFromLeft = previousX + ball.radius <= brick.x;
  const cameFromRight = previousX - ball.radius >= brick.x + brick.width;
  const cameFromTop = previousY + ball.radius <= brick.y;
  const cameFromBottom = previousY - ball.radius >= brick.y + brick.height;

  if (cameFromLeft || cameFromRight) ball.vx *= -1;
  else if (cameFromTop || cameFromBottom) ball.vy *= -1;
  else {
    const horizontalDistance = Math.min(Math.abs(ball.x - brick.x), Math.abs(ball.x - (brick.x + brick.width)));
    const verticalDistance = Math.min(Math.abs(ball.y - brick.y), Math.abs(ball.y - (brick.y + brick.height)));
    if (horizontalDistance < verticalDistance) ball.vx *= -1;
    else ball.vy *= -1;
  }
}

function damageBrick(brick, damage, canDrop = true) {
  if (!brick.alive || brick.unbreakable) return false;
  brick.hitPoints -= damage;
  score += 20 * Math.min(damage, brick.maxHitPoints);
  if (brick.hitPoints > 0) return false;

  brick.alive = false;
  score += 80 + brick.maxHitPoints * 25;
  if (canDrop && Math.random() < levelConfig().drop) spawnDrop(brick);
  saveHighScore();
  updateInterface();
  return true;
}

function updateBalls(deltaTime, now) {
  for (const ball of balls) {
    if (ball.stuck) continue;
    const previousX = ball.x;
    const previousY = ball.y;
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime;

    if (ball.x - ball.radius <= 0 && ball.vx < 0) {
      ball.x = ball.radius;
      ball.vx *= -1;
    } else if (ball.x + ball.radius >= WIDTH && ball.vx > 0) {
      ball.x = WIDTH - ball.radius;
      ball.vx *= -1;
    }
    if (ball.y - ball.radius <= 0 && ball.vy < 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
    }

    if (effects.barrierUntil > now && ball.y + ball.radius >= HEIGHT - 8 && ball.vy > 0) {
      ball.y = HEIGHT - 8 - ball.radius;
      ball.vy *= -1;
    }

    bounceFromPaddle(ball, now);

    for (const brick of bricks) {
      if (!brick.alive || !circleHitsRectangle(ball, brick)) continue;
      bounceFromBrick(ball, brick, previousX, previousY);
      const damage = effects.blastUntil > now ? 3 : 1;
      damageBrick(brick, damage);
      break;
    }
  }

  balls = balls.filter((ball) => ball.y - ball.radius <= HEIGHT + 18);
  if (!balls.length) loseRound();
}

function spawnDrop(brick) {
  const types = Object.keys(POWER_UPS);
  const type = types[Math.floor(Math.random() * types.length)];
  drops.push({
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
    width: 36,
    height: 25,
    speed: 145,
    type,
  });
}

function updateDrops(deltaTime, now) {
  for (const drop of drops) {
    drop.y += drop.speed * deltaTime;
    const rectangle = {
      x: drop.x - drop.width / 2,
      y: drop.y - drop.height / 2,
      width: drop.width,
      height: drop.height,
    };
    if (rectangle.y + rectangle.height >= paddle.y
      && rectangle.y <= paddle.y + paddle.height
      && rectangle.x + rectangle.width >= paddle.x
      && rectangle.x <= paddle.x + paddle.width) {
      drop.collected = true;
      applyPowerUp(drop.type, drop.x, now);
    }
  }
  drops = drops.filter((drop) => !drop.collected && drop.y < HEIGHT + 40);
}

function applyPowerUp(type, columnX, now) {
  if (type === "laser") fireLaser(columnX);
  if (type === "triple") tripleBalls();
  if (type === "blast") effects.blastUntil = Math.max(effects.blastUntil, now) + 12000;
  if (type === "barrier") effects.barrierUntil = Math.max(effects.barrierUntil, now) + 10000;
  if (type === "magnet") effects.magnetCharges += 2;
  if (type === "expand") effects.expandUntil = Math.max(effects.expandUntil, now) + 14000;
  showItemToast(`+ ${POWER_UPS[type].label}`);
  renderEffects(now);
}

function fireLaser(columnX) {
  lasers.push({ x: columnX, expiresAt: performance.now() + 260 });
  bricks.forEach((brick) => {
    if (!brick.alive || brick.unbreakable) return;
    if (columnX >= brick.x - 9 && columnX <= brick.x + brick.width + 9) {
      damageBrick(brick, brick.hitPoints, false);
    }
  });
}

function tripleBalls() {
  if (!balls.length) return;
  const sources = [...balls];
  const targetCount = Math.min(6, Math.max(3, sources.length * 3));
  let index = 0;
  while (balls.length < targetCount) {
    const source = sources[index % sources.length];
    const direction = index % 2 === 0 ? 1 : -1;
    const clone = createBall(false, source, direction * (.22 + Math.floor(index / 2) * .08));
    if (source.stuck) {
      clone.stuck = true;
      clone.stickOffset = source.stickOffset + direction * 18;
    }
    balls.push(clone);
    index += 1;
  }
  syncStuckBalls();
}

function spawnBomb() {
  bombs.push({
    x: randomBetween(42, WIDTH - 42),
    y: -24,
    radius: 13,
    speed: randomBetween(126, 158) + currentLevel * 4,
    drift: randomBetween(-30, 30),
  });
}

function updateBombs(deltaTime, now) {
  if (levelConfig().bomb && balls.some((ball) => !ball.stuck)) {
    bombClock += deltaTime;
    if (bombClock >= levelConfig().bomb) {
      bombClock = 0;
      spawnBomb();
    }
  }

  for (const bomb of bombs) {
    bomb.y += bomb.speed * deltaTime;
    bomb.x += bomb.drift * deltaTime;
    if (bomb.x < bomb.radius || bomb.x > WIDTH - bomb.radius) bomb.drift *= -1;
    if (circleHitsRectangle(bomb, paddle)) {
      bomb.hit = true;
      paddle.frozenUntil = now + 650;
      effects.penaltyUntil = now + 5000;
      score = Math.max(scoreAtLevelStart, score - 250);
      showItemToast("Bom trúng! Thanh bị co lại");
      updateInterface();
    }
  }
  bombs = bombs.filter((bomb) => !bomb.hit && bomb.y < HEIGHT + 35);
}

function renderEffects(now) {
  const active = [];
  const timedEffects = [
    ["blastUntil", "Bóng nổ"],
    ["barrierUntil", "Thanh chặn"],
    ["expandUntil", "Mở rộng"],
    ["penaltyUntil", "Co thanh"],
  ];
  timedEffects.forEach(([key, label]) => {
    if (effects[key] > now) active.push(`${label} ${Math.ceil((effects[key] - now) / 1000)}s`);
  });
  if (effects.magnetCharges > 0) active.push(`Nam châm ×${effects.magnetCharges}`);
  const signature = active.join("|");
  if (signature === lastEffectSignature) return;
  lastEffectSignature = signature;
  effectBar.replaceChildren(...active.map((label) => {
    const item = document.createElement("span");
    item.className = "effect-pill";
    item.textContent = label;
    return item;
  }));
}

function showItemToast(text) {
  window.clearTimeout(toastTimer);
  itemToast.textContent = text;
  itemToast.hidden = false;
  toastTimer = window.setTimeout(() => {
    itemToast.hidden = true;
  }, 1500);
}

function checkLevelComplete() {
  if (state !== "running" || bricks.some((brick) => brick.alive && !brick.unbreakable)) return;
  saveHighScore();
  if (currentLevel === LEVELS.length) {
    state = "won";
    showMessage("★", "Bạn đã chinh phục 10 màn!", `Tổng điểm: ${formatNumber(score)}. Một hành trình phá gạch hoàn hảo.`, [
      { label: "Chơi lại từ đầu", action: startJourney, primary: true },
      { label: "Xem hướng dẫn", action: openHelp },
    ]);
    resetMainControls();
    return;
  }

  state = "level-complete";
  showMessage("✓", `Hoàn thành màn ${currentLevel}`, `Điểm hiện tại: ${formatNumber(score)}. Màn kế tiếp sẽ nhanh và khó hơn.`, [
    { label: `Sang màn ${currentLevel + 1}`, action: nextLevel, primary: true },
    { label: "Chơi lại màn", action: restartCurrentLevel },
  ]);
  pauseButton.disabled = true;
}

function loseRound() {
  if (state !== "running") return;
  state = "game-over";
  saveHighScore();
  showMessage("×", "Bóng đã rơi khỏi sân", `Bạn dừng ở màn ${currentLevel} với ${formatNumber(score)} điểm.`, [
    { label: "Thử lại màn", action: restartCurrentLevel, primary: true },
    { label: "Chơi từ màn 1", action: startJourney },
  ]);
  resetMainControls();
}

function resetMainControls() {
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
  const buttons = [messagePrimary, messageSecondary];
  const keys = ["primary", "secondary"];
  messageActions = { primary: null, secondary: null };
  buttons.forEach((button, index) => {
    const config = actions[index];
    button.hidden = !config;
    if (!config) return;
    button.textContent = config.label;
    button.classList.toggle("button--primary", Boolean(config.primary));
    button.classList.toggle("button--secondary", !config.primary);
    messageActions[keys[index]] = config.action;
  });
  messageOverlay.hidden = false;
}

function runMessageAction(key) {
  const action = messageActions[key];
  messageActions = { primary: null, secondary: null };
  action?.();
}

function togglePause() {
  if (state === "running") {
    state = "paused";
    showMessage("Ⅱ", "Tạm dừng", "Tiếp tục ván chơi hoặc bắt đầu lại màn hiện tại.", [
      { label: "Tiếp tục", action: togglePause, primary: true },
      { label: "Chơi lại màn", action: restartCurrentLevel },
    ]);
    pauseButton.dataset.state = "play";
    pauseButton.setAttribute("aria-label", "Tiếp tục");
  } else if (state === "paused") {
    state = "running";
    messageActions = { primary: null, secondary: null };
    messageOverlay.hidden = true;
    pauseButton.dataset.state = "pause";
    pauseButton.setAttribute("aria-label", "Tạm dừng");
    lastFrame = performance.now();
  }
}

function openHelp() {
  if (state === "running") togglePause();
  if (typeof helpDialog.showModal === "function") helpDialog.showModal();
}

function update(deltaTime, now) {
  updatePaddle(deltaTime, now);
  updateBalls(deltaTime, now);
  if (state !== "running") return;
  updateDrops(deltaTime, now);
  updateBombs(deltaTime, now);
  lasers = lasers.filter((laser) => laser.expiresAt > now);
  renderEffects(now);
  checkLevelComplete();
}

function drawBrick(brick) {
  if (!brick.alive) return;
  if (brick.unbreakable) {
    context.fillStyle = isDarkTheme() ? "#475569" : "#64748b";
    roundedRectangle(brick.x, brick.y, brick.width, brick.height, 3);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.lineWidth = 1.5;
    for (let offset = -10; offset < brick.width; offset += 16) {
      context.beginPath();
      context.moveTo(brick.x + Math.max(0, offset), brick.y + brick.height);
      context.lineTo(brick.x + Math.min(brick.width, offset + 18), brick.y);
      context.stroke();
    }
    return;
  }

  const colors = { 1: "#10b981", 2: "#059669", 3: "#047857" };
  context.fillStyle = colors[Math.min(3, brick.hitPoints)];
  roundedRectangle(brick.x, brick.y, brick.width, brick.height, 3);
  context.fill();
  context.fillStyle = brick.hitPoints === 1 ? "#073f30" : "#ffffff";
  context.font = "800 12px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  if (brick.hitPoints > 1) context.fillText(String(brick.hitPoints), brick.x + brick.width / 2, brick.y + brick.height / 2 + .5);
}

function drawBall(ball, now) {
  context.save();
  context.shadowColor = effects.blastUntil > now ? "rgba(249,115,22,.7)" : "rgba(16,185,129,.45)";
  context.shadowBlur = effects.blastUntil > now ? 14 : 8;
  context.fillStyle = effects.blastUntil > now ? "#f97316" : "#f8b84e";
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawDrop(drop) {
  const definition = POWER_UPS[drop.type];
  context.fillStyle = definition.color;
  roundedRectangle(drop.x - drop.width / 2, drop.y - drop.height / 2, drop.width, drop.height, 5);
  context.fill();
  context.fillStyle = drop.type === "expand" || drop.type === "laser" ? "#082d22" : "#ffffff";
  context.font = "900 10px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(definition.short, drop.x, drop.y + .5);
}

function drawBomb(bomb) {
  context.fillStyle = "#26342f";
  context.beginPath();
  context.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#f97316";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(bomb.x + 6, bomb.y - 10);
  context.quadraticCurveTo(bomb.x + 13, bomb.y - 20, bomb.x + 17, bomb.y - 14);
  context.stroke();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(bomb.x - 4, bomb.y - 4, 3, 0, Math.PI * 2);
  context.fill();
}

function draw(now = performance.now()) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  bricks.forEach(drawBrick);

  if (effects.barrierUntil > now) {
    context.fillStyle = "#6366f1";
    context.fillRect(0, HEIGHT - 8, WIDTH, 8);
  }

  lasers.forEach((laser) => {
    context.fillStyle = "rgba(16,185,129,.25)";
    context.fillRect(laser.x - 8, 0, 16, paddle.y);
    context.fillStyle = "#6ee7b7";
    context.fillRect(laser.x - 2, 0, 4, paddle.y);
  });

  drops.forEach(drawDrop);
  bombs.forEach(drawBomb);
  balls.forEach((ball) => drawBall(ball, now));

  context.fillStyle = now < paddle.frozenUntil ? "#e34c4c" : "#10b981";
  roundedRectangle(paddle.x, paddle.y, paddle.width, paddle.height, 5);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.42)";
  roundedRectangle(paddle.x + 8, paddle.y + 3, Math.max(0, paddle.width - 16), 3, 2);
  context.fill();
}

function gameLoop(now) {
  const deltaTime = Math.min((now - lastFrame) / 1000, .025);
  lastFrame = now;
  if (state === "running") update(deltaTime, now);
  if (state === "running" || state === "paused") draw(now);
  window.requestAnimationFrame(gameLoop);
}

function setTouchDirection(direction, active) {
  if (direction === "left") keyLeft = active;
  if (direction === "right") keyRight = active;
}

startButton.addEventListener("click", startJourney);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartCurrentLevel);
launchButton.addEventListener("click", launchBalls);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));

document.addEventListener("keydown", (event) => {
  if (helpDialog.open) return;
  if (["ArrowLeft", "ArrowRight", " ", "a", "A", "d", "D"].includes(event.key)) event.preventDefault();
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keyLeft = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keyRight = true;
  if (event.key === " " && state === "running") launchBalls();
  else if (event.key === " " && ["level-complete", "game-over", "won"].includes(state)) runMessageAction("primary");
  if (event.key.toLowerCase() === "p" && ["running", "paused"].includes(state)) togglePause();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keyLeft = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keyRight = false;
});

board.addEventListener("pointerdown", (event) => {
  if (state !== "running") return;
  pointerActive = true;
  board.setPointerCapture?.(event.pointerId);
  movePaddleTo(event.clientX);
  launchBalls();
});

board.addEventListener("pointermove", (event) => {
  if (pointerActive && state === "running") movePaddleTo(event.clientX);
});

board.addEventListener("pointerup", () => { pointerActive = false; });
board.addEventListener("pointercancel", () => { pointerActive = false; });

[["moveLeftButton", "left"], ["moveRightButton", "right"]].forEach(([id, direction]) => {
  const button = document.querySelector(`#${id}`);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setTouchDirection(direction, true);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    button.addEventListener(eventName, () => setTouchDirection(direction, false));
  });
});

document.querySelector("#helpButton").addEventListener("click", openHelp);
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "running") togglePause();
});

new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

highScoreValue.textContent = formatNumber(highScore);
createLevelBricks();
resetPaddleAndBall();
updateInterface();
draw();
window.requestAnimationFrame(gameLoop);
