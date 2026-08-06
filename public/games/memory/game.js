"use strict";

const LEVELS = [
  { pairs: 3, columns: 3, moves: 6, preview: 2200 },
  { pairs: 4, columns: 4, moves: 8, preview: 2100 },
  { pairs: 4, columns: 4, moves: 7, preview: 1800 },
  { pairs: 5, columns: 5, moves: 9, preview: 1700 },
  { pairs: 6, columns: 4, moves: 11, preview: 1600 },
  { pairs: 6, columns: 4, moves: 10, preview: 1400 },
  { pairs: 8, columns: 4, moves: 14, preview: 1300 },
  { pairs: 8, columns: 4, moves: 13, preview: 1100 },
  { pairs: 10, columns: 5, moves: 18, preview: 1000 },
  { pairs: 10, columns: 5, moves: 16, preview: 850 },
];

const ICONS = [
  { id: "pizza", symbol: "🍕", name: "Pizza" },
  { id: "burger", symbol: "🍔", name: "Bánh burger" },
  { id: "fries", symbol: "🍟", name: "Khoai tây chiên" },
  { id: "hot-dog", symbol: "🌭", name: "Bánh hot dog" },
  { id: "popcorn", symbol: "🍿", name: "Bắp rang" },
  { id: "salt", symbol: "🧂", name: "Muối" },
  { id: "bacon", symbol: "🥓", name: "Thịt xông khói" },
  { id: "salad", symbol: "🥗", name: "Salad" },
  { id: "kiwi", symbol: "🥝", name: "Kiwi" },
  { id: "grapes", symbol: "🍇", name: "Nho" },
  { id: "coconut", symbol: "🥥", name: "Dừa" },
  { id: "melon", symbol: "🍈", name: "Dưa lưới" },
  { id: "watermelon", symbol: "🍉", name: "Dưa hấu" },
  { id: "orange", symbol: "🍊", name: "Cam" },
  { id: "lemon", symbol: "🍋", name: "Chanh" },
  { id: "banana", symbol: "🍌", name: "Chuối" },
  { id: "pineapple", symbol: "🍍", name: "Dứa" },
  { id: "mango", symbol: "🥭", name: "Xoài" },
  { id: "red-apple", symbol: "🍎", name: "Táo đỏ" },
  { id: "green-apple", symbol: "🍏", name: "Táo xanh" },
  { id: "pear", symbol: "🍐", name: "Lê" },
  { id: "peach", symbol: "🍑", name: "Đào" },
  { id: "cherries", symbol: "🍒", name: "Anh đào" },
  { id: "strawberry", symbol: "🍓", name: "Dâu tây" },
  { id: "eggplant", symbol: "🍆", name: "Cà tím" },
  { id: "chili", symbol: "🌶️", name: "Ớt" },
  { id: "corn", symbol: "🌽", name: "Ngô" },
  { id: "mushroom", symbol: "🍄", name: "Nấm" },
  { id: "avocado", symbol: "🥑", name: "Bơ" },
  { id: "cucumber", symbol: "🥒", name: "Dưa chuột" },
  { id: "leafy-greens", symbol: "🥬", name: "Rau xanh" },
  { id: "broccoli", symbol: "🥦", name: "Bông cải xanh" },
  { id: "potato", symbol: "🥔", name: "Khoai tây" },
  { id: "carrot", symbol: "🥕", name: "Cà rốt" },
  { id: "brown-mushroom", symbol: "🍄‍🟫", name: "Nấm nâu" },
  { id: "rose", symbol: "🌹", name: "Hoa hồng" },
  { id: "maple-leaf", symbol: "🍁", name: "Lá phong" },
  { id: "clover", symbol: "🍀", name: "Cỏ bốn lá" },
  { id: "rice", symbol: "🌾", name: "Bông lúa" },
  { id: "cactus", symbol: "🌵", name: "Xương rồng" },
  { id: "evergreen", symbol: "🌲", name: "Cây thông" },
];

const STORAGE_KEY = "namnth-memory-progress";
const board = document.querySelector("#board");
const cardGrid = document.querySelector("#cardGrid");
const campaignLabel = document.querySelector("#campaignLabel");
const campaignTrack = [...document.querySelectorAll("#campaignTrack li")];
const levelHint = document.querySelector("#levelHint");
const levelValue = document.querySelector("#levelValue");
const movesValue = document.querySelector("#movesValue");
const pairsValue = document.querySelector("#pairsValue");
const bestValue = document.querySelector("#bestValue");
const statusText = document.querySelector("#statusText");
const statusDetail = document.querySelector("#statusDetail");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const messageOverlay = document.querySelector("#messageOverlay");
const messageSymbol = document.querySelector("#messageSymbol");
const messageEyebrow = document.querySelector("#messageEyebrow");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const messagePrimary = document.querySelector("#messagePrimary");
const messageSecondary = document.querySelector("#messageSecondary");
const helpDialog = document.querySelector("#helpDialog");

let currentLevel = 0;
let movesRemaining = LEVELS[0].moves;
let pairsRemaining = LEVELS[0].pairs;
let totalMoves = 0;
let movesAtLevelStart = 0;
let state = "idle";
let selectedCards = [];
let previewTimer = 0;
let resolveTimer = 0;
let messageActions = { primary: null, secondary: null };

const progress = loadProgress();

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      highestLevel: Math.min(10, Math.max(1, Number(saved?.highestLevel) || 1)),
      bestMoves: Number(saved?.bestMoves) || null,
    };
  } catch {
    return { highestLevel: 1, bestMoves: null };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function levelConfig() {
  return LEVELS[currentLevel];
}

function formatLevel(level) {
  return String(level + 1).padStart(2, "0");
}

function createDeck() {
  const icons = shuffle([...ICONS]).slice(0, levelConfig().pairs);
  return shuffle(icons.flatMap((icon) => [icon, icon]));
}

function createCard(icon, index) {
  const card = document.createElement("button");
  card.className = "memory-card";
  card.type = "button";
  card.dataset.icon = icon.id;
  card.dataset.index = String(index);
  card.setAttribute("aria-label", `Thẻ ${index + 1}, đang úp`);
  card.innerHTML = `
    <span class="memory-card__inner">
      <span class="memory-card__face memory-card__back" aria-hidden="true"></span>
      <span class="memory-card__face memory-card__front" aria-hidden="true">
        <span class="memory-card__icon">${icon.symbol}</span>
      </span>
    </span>`;
  card.addEventListener("click", () => selectCard(card, icon));
  return card;
}

function renderDeck() {
  cardGrid.style.setProperty("--columns", levelConfig().columns);
  cardGrid.replaceChildren(...createDeck().map(createCard));
}

function updateCampaign() {
  const levelNumber = currentLevel + 1;
  campaignLabel.textContent = `Màn ${formatLevel(currentLevel)} / 10`;
  levelValue.textContent = `${formatLevel(currentLevel)}/10`;
  levelHint.textContent = `${levelConfig().pairs} cặp · ${levelConfig().moves} lượt`;
  campaignTrack.forEach((item, index) => {
    item.classList.toggle("is-complete", index < currentLevel);
    item.classList.toggle("is-current", index === currentLevel);
    item.setAttribute("aria-label", index === currentLevel ? `Màn ${index + 1}, hiện tại` : `Màn ${index + 1}`);
  });
  progress.highestLevel = Math.max(progress.highestLevel, levelNumber);
  bestValue.textContent = progress.bestMoves ? `${progress.bestMoves} lượt` : `Màn ${String(progress.highestLevel).padStart(2, "0")}`;
  saveProgress();
}

function updateHud() {
  movesValue.textContent = String(movesRemaining);
  pairsValue.textContent = String(pairsRemaining);
  movesValue.parentElement.classList.toggle("is-danger", movesRemaining <= 2 && state !== "idle");
  updateCampaign();
}

function setStatus(title, detail) {
  statusText.textContent = title;
  statusDetail.textContent = detail;
}

function clearTimers() {
  window.clearTimeout(previewTimer);
  window.clearTimeout(resolveTimer);
}

function revealAllCards() {
  [...cardGrid.children].forEach((card) => {
    card.classList.add("is-flipped");
    const icon = ICONS.find((item) => item.id === card.dataset.icon);
    card.setAttribute("aria-label", `${icon.name}, đang mở`);
  });
}

function hideAllCards() {
  [...cardGrid.children].forEach((card) => {
    card.classList.remove("is-flipped");
    card.setAttribute("aria-label", `Thẻ ${Number(card.dataset.index) + 1}, đang úp`);
  });
}

function beginPreview() {
  state = "preview";
  selectedCards = [];
  messageOverlay.hidden = true;
  pauseButton.disabled = true;
  restartButton.disabled = false;
  revealAllCards();
  setStatus("Ghi nhớ!", "Các thẻ sắp úp xuống.");
  previewTimer = window.setTimeout(() => {
    hideAllCards();
    state = "playing";
    pauseButton.disabled = false;
    setStatus("Đến lượt bạn", "Chọn hai thẻ để tìm một cặp.");
    cardGrid.querySelector(".memory-card")?.focus({ preventScroll: true });
  }, levelConfig().preview);
}

function startLevel({ restart = false } = {}) {
  clearTimers();
  if (restart) totalMoves = movesAtLevelStart;
  else movesAtLevelStart = totalMoves;
  movesRemaining = levelConfig().moves;
  pairsRemaining = levelConfig().pairs;
  renderDeck();
  updateHud();
  startButton.querySelector("span").textContent = "Chơi lại từ đầu";
  beginPreview();
}

function startJourney() {
  currentLevel = 0;
  totalMoves = 0;
  movesAtLevelStart = 0;
  startLevel();
}

function restartLevel() {
  startLevel({ restart: true });
}

function setCardLabel(card, icon, visible) {
  card.setAttribute("aria-label", visible ? `${icon.name}, đang mở` : `Thẻ ${Number(card.dataset.index) + 1}, đang úp`);
}

function selectCard(card, icon) {
  if (state !== "playing" || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;

  card.classList.add("is-flipped");
  setCardLabel(card, icon, true);
  selectedCards.push({ card, icon });
  if (selectedCards.length < 2) {
    setStatus("Chọn thêm một thẻ", "Tìm hình giống với thẻ vừa mở.");
    return;
  }

  state = "resolving";
  pauseButton.disabled = true;
  movesRemaining -= 1;
  totalMoves += 1;
  updateHud();

  const [first, second] = selectedCards;
  const isMatch = first.icon.id === second.icon.id;
  setStatus(isMatch ? "Đúng một cặp!" : "Chưa trùng nhau", isMatch ? "Hai thẻ sẽ biến mất." : "Ghi nhớ vị trí và thử lại.");
  resolveTimer = window.setTimeout(() => resolvePair(isMatch), isMatch ? 420 : 720);
}

function resolvePair(isMatch) {
  if (isMatch) {
    selectedCards.forEach(({ card, icon }) => {
      card.classList.add("is-matched");
      card.disabled = true;
      card.setAttribute("aria-label", `${icon.name}, đã ghép`);
    });
    pairsRemaining -= 1;
  } else {
    selectedCards.forEach(({ card, icon }) => {
      card.classList.remove("is-flipped");
      setCardLabel(card, icon, false);
    });
  }
  selectedCards = [];
  updateHud();

  if (pairsRemaining === 0) {
    finishLevel();
    return;
  }
  if (movesRemaining === 0) {
    loseLevel();
    return;
  }
  state = "playing";
  pauseButton.disabled = false;
  setStatus("Tiếp tục", `Còn ${pairsRemaining} cặp cần tìm.`);
}

function showMessage({ symbol, eyebrow, title, text, primary, secondary }) {
  messageSymbol.textContent = symbol;
  messageEyebrow.textContent = eyebrow;
  messageTitle.textContent = title;
  messageText.textContent = text;
  messagePrimary.textContent = primary.label;
  messageSecondary.hidden = !secondary;
  messageActions.primary = primary.action;
  messageActions.secondary = secondary?.action || null;
  if (secondary) messageSecondary.textContent = secondary.label;
  messageOverlay.hidden = false;
}

function finishLevel() {
  state = currentLevel === LEVELS.length - 1 ? "complete" : "level-complete";
  pauseButton.disabled = true;
  setStatus("Hoàn thành", `Bạn đã ghép xong màn ${currentLevel + 1}.`);

  if (state === "complete") {
    if (!progress.bestMoves || totalMoves < progress.bestMoves) progress.bestMoves = totalMoves;
    progress.highestLevel = 10;
    saveProgress();
    updateHud();
    showMessage({
      symbol: "★",
      eyebrow: "Hoàn thành hành trình",
      title: "Trí nhớ tuyệt vời!",
      text: `Bạn đã chinh phục 10 màn trong ${totalMoves} lượt. Kỷ lục tốt nhất đã được lưu trên thiết bị này.`,
      primary: { label: "Chơi lại từ đầu", action: startJourney },
      secondary: { label: "Xem hướng dẫn", action: openHelp },
    });
    return;
  }

  showMessage({
    symbol: "✓",
    eyebrow: `Hoàn thành màn ${formatLevel(currentLevel)}`,
    title: `${movesRemaining} lượt còn lại`,
    text: "Màn kế tiếp sẽ có nhiều thẻ hơn hoặc ít thời gian quan sát hơn.",
    primary: { label: `Sang màn ${currentLevel + 2}`, action: nextLevel },
    secondary: { label: "Chơi lại màn", action: restartLevel },
  });
}

function nextLevel() {
  currentLevel += 1;
  startLevel();
}

function loseLevel() {
  state = "lost";
  pauseButton.disabled = true;
  setStatus("Đã hết lượt", `Màn ${currentLevel + 1} vẫn còn ${pairsRemaining} cặp.`);
  showMessage({
    symbol: "×",
    eyebrow: `Màn ${formatLevel(currentLevel)}`,
    title: "Bạn đã dùng hết lượt",
    text: `Còn ${pairsRemaining} cặp chưa tìm thấy. Quan sát kỹ hơn rồi thử lại nhé.`,
    primary: { label: "Thử lại màn", action: restartLevel },
    secondary: { label: "Chơi từ màn 1", action: startJourney },
  });
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    pauseButton.disabled = false;
    setStatus("Đang tạm dừng", "Các thẻ được che để giữ công bằng.");
    showMessage({
      symbol: "Ⅱ",
      eyebrow: `Màn ${formatLevel(currentLevel)}`,
      title: "Đang tạm dừng",
      text: "Tiếp tục khi bạn đã sẵn sàng.",
      primary: { label: "Tiếp tục", action: togglePause },
      secondary: { label: "Chơi lại màn", action: restartLevel },
    });
  } else if (state === "paused") {
    state = "playing";
    messageOverlay.hidden = true;
    setStatus("Tiếp tục", `Còn ${pairsRemaining} cặp cần tìm.`);
  }
}

function openHelp() {
  if (state === "playing") togglePause();
  if (typeof helpDialog.showModal === "function") helpDialog.showModal();
}

function runMessageAction(key) {
  const action = messageActions[key];
  messageActions = { primary: null, secondary: null };
  action?.();
}

startButton.addEventListener("click", startJourney);
restartButton.addEventListener("click", restartLevel);
pauseButton.addEventListener("click", togglePause);
messagePrimary.addEventListener("click", () => runMessageAction("primary"));
messageSecondary.addEventListener("click", () => runMessageAction("secondary"));
document.querySelector("#helpButton").addEventListener("click", openHelp);
document.querySelector("#closeHelpButton").addEventListener("click", () => helpDialog.close());
document.querySelector("#gotItButton").addEventListener("click", () => helpDialog.close());

helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "p" && ["playing", "paused"].includes(state)) togglePause();
  if (event.key === "Escape" && state === "playing" && !helpDialog.open) togglePause();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "playing") togglePause();
});

messageActions.primary = startJourney;
updateHud();
