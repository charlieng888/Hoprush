window.addEventListener("error", (event) => {
  const status = document.querySelector("#statusText");
  const overlay = document.querySelector("#overlay");
  const overlayKicker = document.querySelector("#overlayKicker");
  const overlayTitle = document.querySelector("#overlayTitle");
  if (status) status.textContent = "Script error: " + event.message;
  if (overlay && overlayKicker && overlayTitle) {
    overlay.classList.add("is-visible");
    overlayKicker.textContent = "Error";
    overlayTitle.textContent = "Reload needed";
  }
});

const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const coinsEl = document.querySelector("#coins");
const menuCoinsEl = document.querySelector("#menuCoins");
const rowEl = document.querySelector("#row");
const overlay = document.querySelector("#overlay");
const overlayKicker = document.querySelector("#overlayKicker");
const overlayTitle = document.querySelector("#overlayTitle");
const startButton = document.querySelector("#startButton");
const skinMenuButton = document.querySelector("#skinMenuButton");
const skinMenu = document.querySelector("#skinMenu");
const skinButtons = document.querySelectorAll("[data-skin]");
const secretMenuButton = document.querySelector("#secretMenuButton");
const secretMenu = document.querySelector("#secretMenu");
const secretStatus = document.querySelector("#secretStatus");
const multiplayerMenuButton = document.querySelector("#multiplayerMenuButton");
const multiplayerMenu = document.querySelector("#multiplayerMenu");
const multiplayerStatus = document.querySelector("#multiplayerStatus");
const playerNameInput = document.querySelector("#playerNameInput");
const playerList = document.querySelector("#playerList");
const refreshPlayersButton = document.querySelector("#refreshPlayersButton");
const freezeGunBuyButton = document.querySelector("#freezeGunBuyButton");
const freezeGunShopButton = document.querySelector("#freezeGunShopButton");
const freezeButton = document.querySelector("#freezeButton");
const doNotClickButton = document.querySelector("#doNotClickButton");
const doNotClickButtonTwo = document.querySelector("#doNotClickButtonTwo");
const doNotClickButtonThree = document.querySelector("#doNotClickButtonThree");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const soundButton = document.querySelector("#soundButton");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");

const columns = 12;
const rows = 16;
const tile = canvas.width / columns;
const playerStart = { x: 5, y: 15 };
const maxCarWidth = 2;
const maxRoadSection = 4;
const freezeGunCost = 100;
const iceCubeCost = 1;
const freezeDurationMs = 5000;
const giftAmount = 10;
const skins = {
  lime: { body: "#f4f7fb", cap: "#8ee35f", eye: "#101216" },
  berry: { body: "#fff3fb", cap: "#ff6fba", eye: "#21101a" },
  sky: { body: "#eefaff", cap: "#59d4ff", eye: "#0b2633" },
  gold: { body: "#fff8dc", cap: "#ffd15c", eye: "#35230a" },
};

const laneTemplates = [
  { type: "safe", color: "#3a8c56" },
  { type: "road", color: "#252a33", speed: 5, direction: 1, spacing: 7, vehicle: "#ff6f7d" },
  { type: "grass", color: "#2f7849", trees: [4, 11] },
  { type: "grass", color: "#2f7849", trees: [1, 8] },
  { type: "river", color: "#1d5d7c", speed: 3, direction: 1, spacing: 4 },
  { type: "river", color: "#1f688a", speed: 4, direction: -1, spacing: 5 },
  { type: "safe", color: "#397f51" },
  { type: "road", color: "#252a33", speed: 10, direction: 1, spacing: 7, vehicle: "#ffd15c" },
  { type: "grass", color: "#2f7849", trees: [2, 9] },
  { type: "road", color: "#2c3039", speed: 6, direction: -1, spacing: 8, vehicle: "#b48cff" },
  { type: "grass", color: "#2f7849", trees: [1, 6] },
  { type: "safe", color: "#3a8c56" },
  { type: "river", color: "#1d5d7c", speed: 3, direction: 1, spacing: 5 },
  { type: "grass", color: "#2f7849", trees: [3, 10] },
  { type: "road", color: "#2c3039", speed: 7, direction: -1, spacing: 8, vehicle: "#ff9f5c" },
  { type: "safe", color: "#3c8c56" },
];

let lanes = [];
let player = { ...playerStart };
let hopOffset = { x: 0, y: 0 };
let score = 0;
let runCoins = 0;
let walletCoins = loadWalletCoins();
walletCoins += claimPrivateCoinGrant();
walletCoins += claimBigPrivateCoinGrant();
let bestRow = 0;
let completedRows = 0;
let bestScore = loadBestScore();
let gameState = "ready";
let lastTime = 0;
let animationFrame = null;
let soundOn = true;
let audioContext = null;
let lastStartActivation = 0;
let selectedSkinId = loadSelectedSkin();
let hasFreezeGun = loadFreezeGunOwnership();
hasFreezeGun = claimPrivateFreezeGunGrant();
let iceCubes = loadIceCubes();
iceCubes += claimPrivateIceCubeGrant();
let freezeTimerMs = 0;
let playerId = loadPlayerId();
let playerName = loadPlayerName();
let onlinePlayers = [];
let multiplayerBusy = false;
const doNotClickSound = new Audio("sounds/do-not-click.mp3");
doNotClickSound.volume = 0.8;
const doNotClickSoundTwo = new Audio("sounds/do-not-click-2.mp3");
doNotClickSoundTwo.volume = 0.8;
const doNotClickSoundThree = new Audio("sounds/do-not-click-3.mp3");
doNotClickSoundThree.volume = 0.8;

bestScoreEl.textContent = bestScore;
resetGame();
draw();
updateSkinButtons();
updateFreezeControls();
playerNameInput.value = playerName;

window.roadHopStart = activateStart;
window.roadHopPause = togglePause;
window.roadHopRestart = startGame;

function startGame() {
  resetGame();
  gameState = "running";
  overlay.classList.remove("is-visible");
  updateStatus("running", "In play");
  updateFreezeControls();
  lastTime = performance.now();
  animationFrame = requestAnimationFrame(loop);
}

function resetGame() {
  cancelAnimationFrame(animationFrame);
  completedRows = 0;
  lanes = createLanes();
  player = { ...playerStart };
  hopOffset = { x: 0, y: 0 };
  score = 0;
  runCoins = 0;
  bestRow = 0;
  freezeTimerMs = 0;
  updateHud();
  updateFreezeControls();
  draw();
}

function createLanes() {
  return laneTemplates.map((template, y) => createLane(template, y));
}

function createLane(template, y) {
  const speedFactor = 1 + Math.min(0.65, completedRows * 0.012);
  const lane = { ...template, y, speed: template.speed ? template.speed * speedFactor : 0, actors: [], coins: [] };
  if (template.type === "road") {
    for (let x = -2; x < columns + 4; x += template.spacing) {
      lane.actors.push({
        x: template.direction > 0 ? x : columns - x,
        width: Math.random() > 0.62 ? 2 : 1.35,
        color: template.vehicle,
      });
    }
  }

  if (template.type === "river") {
    for (let x = -3; x < columns + 5; x += template.spacing) {
      lane.actors.push({
        x: template.direction > 0 ? x : columns - x,
        width: Math.random() > 0.55 ? 1.8 : 1.3,
        color: "#8b5f36",
      });
    }
  }

  if (["grass", "safe"].includes(template.type) && y !== playerStart.y && Math.random() > 0.4) {
    lane.coins.push({ x: Math.floor(1 + Math.random() * (columns - 2)), collected: false });
  }

  return lane;
}

function loop(time) {
  const delta = Math.min(40, time - lastTime);
  lastTime = time;
  update(delta);
  draw();
  if (gameState === "running") {
    animationFrame = requestAnimationFrame(loop);
  }
}

function update(delta) {
  lanes.forEach((lane) => {
    if (!["road", "river"].includes(lane.type)) return;
    if (lane.type === "road" && freezeTimerMs > 0) return;
    const movement = (lane.speed / 1000) * delta * lane.direction;
    lane.actors.forEach((actor) => {
      actor.x += movement;
      if (lane.direction > 0 && actor.x > columns + maxCarWidth) {
        actor.x = -actor.width - Math.random() * 2;
      }
      if (lane.direction < 0 && actor.x + actor.width < -maxCarWidth) {
        actor.x = columns + Math.random() * 2;
      }
    });
  });

  if (freezeTimerMs > 0) {
    freezeTimerMs = Math.max(0, freezeTimerMs - delta);
    updateFreezeControls();
  }

  const lane = lanes[player.y];
  if (lane.type === "river") {
    const raft = getActorAt(lane, player.x + 0.5);
    if (!raft) {
      endGame("Splash!");
      return;
    }
    player.x += ((lane.speed / 1000) * delta * lane.direction);
    if (player.x < -0.35 || player.x > columns - 0.65) {
      endGame("Swept away");
    }
  }

  if (lane.type === "road" && getActorAt(lane, player.x + 0.5)) {
    endGame("Traffic got you");
  }
}

function hop(dx, dy) {
  if (gameState === "ready" || gameState === "ended") {
    startGame();
  }

  if (gameState !== "running") return;

  const next = {
    x: Math.round(player.x) + dx,
    y: player.y + dy,
  };

  if (next.x < 0 || next.x >= columns || next.y < 0 || next.y >= rows) return;
  if (isTree(next.x, next.y)) {
    bump();
    return;
  }

  const oldX = player.x;
  const oldY = player.y;
  player = next;
  hopOffset = { x: oldX - player.x, y: oldY - player.y };
  animateHop();
  collectCoin();
  bestRow = Math.max(bestRow, completedRows + playerStart.y - player.y);
  score = Math.max(score, bestRow * 10 + runCoins * 25);
  updateHud();
  beep(360 + bestRow * 12, 0.035, "triangle");

  if (dy < 0 && player.y <= Math.floor(rows * 0.25)) {
    continueMap(1);
  }
}

function continueMap(laneCount) {
  if (gameState !== "running") return;
  completedRows += laneCount;
  const newTemplates = createNextLaneTemplates(laneCount, countRoadRunFromTop());
  lanes.forEach((lane) => {
    lane.y += laneCount;
  });
  const addedLanes = newTemplates.map((template, y) => createLane(template, y));
  lanes = addedLanes.concat(lanes).slice(0, rows);
  lanes.forEach((lane, y) => {
    lane.y = y;
  });
  player.y += laneCount;
  hopOffset = { x: 0, y: 0 };
  updateHud();
  beep(660, 0.05, "sine");
}

function createNextLaneTemplates(count, startingRoadRun) {
  const roadOptions = laneTemplates.filter((lane) => lane.type === "road");
  const riverOptions = laneTemplates.filter((lane) => lane.type === "river");
  const grassOptions = laneTemplates.filter((lane) => lane.type === "grass" || lane.type === "safe");
  const templates = [];
  let roadRun = startingRoadRun;

  for (let index = 0; index < count; index += 1) {
    const mustBreakRoad = roadRun >= maxRoadSection;
    const shouldAddRoad = !mustBreakRoad && Math.random() < 0.55;
    const template = shouldAddRoad
      ? randomItem(roadOptions)
      : Math.random() > 0.35
        ? randomItem(grassOptions)
        : randomItem(riverOptions);

    templates.push({ ...template });
    roadRun = template.type === "road" ? roadRun + 1 : 0;
  }

  return templates;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function countRoadRunFromTop() {
  let roadRun = 0;
  for (const lane of lanes) {
    if (lane.type !== "road") break;
    roadRun += 1;
  }
  return roadRun;
}

function animateHop() {
  const start = performance.now();
  const duration = 110;
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    hopOffset.x *= 1 - eased;
    hopOffset.y *= 1 - eased;
    if (progress < 1 && gameState === "running") {
      requestAnimationFrame(frame);
    } else {
      hopOffset = { x: 0, y: 0 };
    }
  }
  requestAnimationFrame(frame);
}

function collectCoin() {
  const lane = lanes[player.y];
  const coin = lane.coins.find((item) => !item.collected && item.x === Math.round(player.x));
  if (coin) {
    coin.collected = true;
    runCoins += 1;
    walletCoins += 1;
    saveWalletCoins(walletCoins);
    updateFreezeControls();
    beep(620, 0.055, "sine");
    noise(0.04, 0.018);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lanes.forEach(drawLane);
  drawPlayer();
}

function drawLane(lane) {
  const y = lane.y * tile;
  ctx.fillStyle = lane.color;
  ctx.fillRect(0, y, canvas.width, tile);

  if (lane.type === "road") drawRoadMarks(y);
  if (lane.type === "river") drawRiver(y);

  lane.coins.forEach((coin) => {
    if (!coin.collected) drawCoin(coin.x, lane.y);
  });

  if (lane.trees) {
    lane.trees.forEach((x) => drawTree(x, lane.y));
  }
  lane.actors.forEach((actor) => {
    if (lane.type === "road") drawVehicle(actor, lane.y, lane.direction);
    if (lane.type === "river") drawLog(actor, lane.y);
  });
}

function drawRoadMarks(y) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let x = 0; x < columns; x += 2) {
    ctx.fillRect(x * tile + tile * 0.28, y + tile * 0.47, tile * 0.8, 4);
  }
}

function drawRiver(y) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 3;
  for (let x = 0; x < canvas.width; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, y + tile * 0.72);
    ctx.quadraticCurveTo(x + 18, y + tile * 0.58, x + 36, y + tile * 0.72);
    ctx.quadraticCurveTo(x + 54, y + tile * 0.86, x + 72, y + tile * 0.72);
    ctx.stroke();
  }
}

function drawVehicle(actor, y, direction) {
  const x = actor.x * tile;
  const top = y * tile + tile * 0.21;
  const width = actor.width * tile;
  const height = tile * 0.58;
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  roundedRect(x + 5, top + 7, width - 8, height, 8);
  ctx.fill();
  ctx.fillStyle = actor.color;
  roundedRect(x, top, width - 8, height, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  const windshieldX = direction > 0 ? x + width * 0.58 : x + width * 0.14;
  roundedRect(windshieldX, top + 9, width * 0.22, height * 0.32, 4);
  ctx.fill();
  ctx.fillStyle = "#111318";
  ctx.fillRect(x + width * 0.16, top + height - 4, tile * 0.18, 6);
  ctx.fillRect(x + width * 0.68, top + height - 4, tile * 0.18, 6);
}

function drawLog(actor, y) {
  const x = actor.x * tile;
  const top = y * tile + tile * 0.26;
  const width = actor.width * tile;
  const height = tile * 0.48;
  ctx.fillStyle = "#6f4726";
  roundedRect(x, top, width, height, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 224, 175, 0.2)";
  ctx.fillRect(x + 14, top + height * 0.3, width - 28, 4);
  ctx.fillRect(x + 12, top + height * 0.62, width - 24, 3);
}

function drawCoin(x, y) {
  const cx = x * tile + tile / 2;
  const cy = y * tile + tile / 2;
  ctx.fillStyle = "rgba(255, 209, 92, 0.22)";
  ctx.beginPath();
  ctx.arc(cx, cy, tile * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd15c";
  ctx.beginPath();
  ctx.arc(cx, cy, tile * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8c5b12";
  ctx.fillRect(cx - 2, cy - tile * 0.12, 4, tile * 0.24);
}

function drawTree(x, y) {
  const left = x * tile;
  const top = y * tile;
  ctx.fillStyle = "#7a4f2c";
  ctx.fillRect(left + tile * 0.43, top + tile * 0.52, tile * 0.14, tile * 0.25);
  ctx.fillStyle = "#174f32";
  ctx.beginPath();
  ctx.arc(left + tile * 0.5, top + tile * 0.42, tile * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2fa45c";
  ctx.beginPath();
  ctx.arc(left + tile * 0.38, top + tile * 0.37, tile * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const skin = skins[selectedSkinId] || skins.lime;
  const displayX = (player.x + hopOffset.x) * tile;
  const displayY = (player.y + hopOffset.y) * tile;
  const cx = displayX + tile / 2;
  const cy = displayY + tile / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + tile * 0.24, tile * 0.24, tile * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.body;
  roundedRect(cx - tile * 0.23, cy - tile * 0.21, tile * 0.46, tile * 0.46, 8);
  ctx.fill();
  ctx.fillStyle = skin.cap;
  roundedRect(cx - tile * 0.16, cy - tile * 0.31, tile * 0.32, tile * 0.18, 7);
  ctx.fill();
  ctx.fillStyle = skin.eye;
  ctx.beginPath();
  ctx.arc(cx - tile * 0.09, cy - tile * 0.03, 3.5, 0, Math.PI * 2);
  ctx.arc(cx + tile * 0.09, cy - tile * 0.03, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101216";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy + tile * 0.08, tile * 0.08, 0, Math.PI);
  ctx.stroke();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function getActorAt(lane, pointX) {
  return lane.actors.find((actor) => pointX >= actor.x && pointX <= actor.x + actor.width);
}

function isTree(x, y) {
  return Boolean(lanes[y].trees && lanes[y].trees.includes(x));
}

function bump() {
  beep(140, 0.04, "square");
  noise(0.05, 0.035);
}

function togglePause() {
  if (gameState === "ready") {
    startGame();
    return;
  }

  if (gameState === "ended") return;

  if (gameState === "running") {
    gameState = "paused";
    cancelAnimationFrame(animationFrame);
    overlayKicker.textContent = "Paused";
    overlayTitle.textContent = "Hold steady";
    startButton.textContent = "Resume";
    overlay.classList.add("is-visible");
    updateStatus("paused", "Paused");
    updateFreezeControls();
  } else {
    gameState = "running";
    overlay.classList.remove("is-visible");
    updateStatus("running", "In play");
    updateFreezeControls();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(loop);
  }
}

function endGame(reason) {
  if (gameState !== "running") return;
  gameState = "ended";
  cancelAnimationFrame(animationFrame);
  bestScore = Math.max(bestScore, score);
  saveBestScore(bestScore);
  updateHud();
  overlayKicker.textContent = reason;
  overlayTitle.textContent = `${score} points`;
  startButton.textContent = "Play Again";
  overlay.classList.add("is-visible");
  updateStatus("ended", "Game over");
  updateFreezeControls();
  beep(120, 0.14, "sawtooth");
  noise(0.22, 0.055);
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  coinsEl.textContent = walletCoins;
  menuCoinsEl.textContent = walletCoins;
  rowEl.textContent = bestRow;
}

function updateStatus(state, text) {
  statusDot.className = "status-dot";
  if (state === "running") statusDot.classList.add("is-running");
  if (state === "ended") statusDot.classList.add("is-ended");
  statusText.textContent = text;
}

function loadBestScore() {
  try {
    return Number(window.localStorage.getItem("road-hop-rush-best") || 0);
  } catch (error) {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    window.localStorage.setItem("road-hop-rush-best", String(value));
  } catch (error) {
    // Some file-based browsers block localStorage. Scores still work for this session.
  }
}

function loadWalletCoins() {
  try {
    return Number(window.localStorage.getItem("road-hop-rush-wallet") || 0);
  } catch (error) {
    return 0;
  }
}

function saveWalletCoins(value) {
  try {
    window.localStorage.setItem("road-hop-rush-wallet", String(value));
  } catch (error) {
    // Wallet coins still work for this session when storage is blocked.
  }
}

function loadPlayerId() {
  try {
    let id = window.localStorage.getItem("road-hop-rush-player-id");
    if (!id) {
      id = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem("road-hop-rush-player-id", id);
    }
    return id;
  } catch (error) {
    return `player-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function loadPlayerName() {
  try {
    return window.localStorage.getItem("road-hop-rush-player-name") || `Player ${playerId.slice(-4)}`;
  } catch (error) {
    return `Player ${playerId.slice(-4)}`;
  }
}

function savePlayerName(value) {
  playerName = String(value || "Player").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 18) || "Player";
  playerNameInput.value = playerName;
  try {
    window.localStorage.setItem("road-hop-rush-player-name", playerName);
  } catch (error) {
    // The current session still keeps the chosen name when storage is blocked.
  }
}

async function multiplayerRequest(payload) {
  const response = await fetch("/api/multiplayer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Multiplayer unavailable");
  return result;
}

async function multiplayerHeartbeat() {
  if (window.location.protocol === "file:") {
    multiplayerStatus.textContent = "Multiplayer works on the Netlify website";
    return;
  }
  if (multiplayerBusy) return;
  multiplayerBusy = true;
  try {
    const result = await multiplayerRequest({
      action: "heartbeat",
      playerId,
      name: playerName,
      coins: walletCoins,
    });
    onlinePlayers = result.players || [];
    applyReceivedGifts(result.gifts || []);
    renderOnlinePlayers();
    multiplayerStatus.textContent = `${onlinePlayers.length} player${onlinePlayers.length === 1 ? "" : "s"} online`;
  } catch (error) {
    multiplayerStatus.textContent = error.message;
  } finally {
    multiplayerBusy = false;
  }
}

function applyReceivedGifts(gifts) {
  if (!gifts.length) return;
  const total = gifts.reduce((sum, gift) => sum + Math.max(0, Number(gift.amount) || 0), 0);
  walletCoins += total;
  saveWalletCoins(walletCoins);
  updateHud();
  const lastGift = gifts[gifts.length - 1];
  updateStatus(gameState, `${lastGift.from} gave you ${total} coins`);
}

function renderOnlinePlayers() {
  playerList.replaceChildren();
  onlinePlayers.forEach((onlinePlayer) => {
    const row = document.createElement("div");
    row.className = "player-row";
    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "player-name";
    name.textContent = onlinePlayer.id === playerId ? `${onlinePlayer.name} (You)` : onlinePlayer.name;
    const coins = document.createElement("span");
    coins.className = "player-coins";
    coins.textContent = `${onlinePlayer.coins} coins`;
    details.append(name, coins);
    row.append(details);

    if (onlinePlayer.id !== playerId) {
      const giftButton = document.createElement("button");
      giftButton.className = "gift-button";
      giftButton.type = "button";
      giftButton.textContent = `Gift ${giftAmount}`;
      giftButton.disabled = walletCoins < giftAmount;
      giftButton.addEventListener("click", () => giftCoins(onlinePlayer));
      row.append(giftButton);
    }
    playerList.append(row);
  });
}

async function giftCoins(recipient) {
  if (walletCoins < giftAmount || multiplayerBusy) return;
  multiplayerBusy = true;
  try {
    await multiplayerRequest({
      action: "gift",
      fromId: playerId,
      toId: recipient.id,
      amount: giftAmount,
    });
    walletCoins -= giftAmount;
    saveWalletCoins(walletCoins);
    updateHud();
    multiplayerStatus.textContent = `Sent ${giftAmount} coins to ${recipient.name}`;
    await multiplayerRequest({ action: "heartbeat", playerId, name: playerName, coins: walletCoins });
    renderOnlinePlayers();
  } catch (error) {
    multiplayerStatus.textContent = error.message;
  } finally {
    multiplayerBusy = false;
  }
}

function loadFreezeGunOwnership() {
  try {
    return window.localStorage.getItem("road-hop-rush-freeze-gun") === "owned";
  } catch (error) {
    return false;
  }
}

function saveFreezeGunOwnership() {
  try {
    window.localStorage.setItem("road-hop-rush-freeze-gun", "owned");
  } catch (error) {
    // Ownership still works for this session when storage is blocked.
  }
}

function loadIceCubes() {
  try {
    return Number(window.localStorage.getItem("road-hop-rush-ice-cubes") || 0);
  } catch (error) {
    return 0;
  }
}

function saveIceCubes() {
  try {
    window.localStorage.setItem("road-hop-rush-ice-cubes", String(iceCubes));
  } catch (error) {
    // Ammo still works for this session when storage is blocked.
  }
}

function claimPrivateIceCubeGrant() {
  try {
    const grantKey = "road-hop-rush-private-ice-cubes-25";
    if (window.localStorage.getItem(grantKey)) return 0;
    window.localStorage.setItem(grantKey, "claimed");
    window.localStorage.setItem("road-hop-rush-ice-cubes", String(iceCubes + 25));
    return 25;
  } catch (error) {
    return 25;
  }
}

function claimPrivateFreezeGunGrant() {
  if (hasFreezeGun) return true;
  try {
    const grantKey = "road-hop-rush-private-freeze-gun";
    if (window.localStorage.getItem(grantKey)) return loadFreezeGunOwnership();
    window.localStorage.setItem(grantKey, "claimed");
    saveFreezeGunOwnership();
    return true;
  } catch (error) {
    return true;
  }
}

function claimPrivateCoinGrant() {
  try {
    const grantKey = "road-hop-rush-private-grant-1000";
    if (window.localStorage.getItem(grantKey)) return 0;
    window.localStorage.setItem(grantKey, "claimed");
    saveWalletCoins(walletCoins + 1000);
    return 1000;
  } catch (error) {
    return 1000;
  }
}

function claimBigPrivateCoinGrant() {
  try {
    const grantKey = "road-hop-rush-private-grant-99999";
    if (window.localStorage.getItem(grantKey)) return 0;
    window.localStorage.setItem(grantKey, "claimed");
    saveWalletCoins(walletCoins + 99999);
    return 99999;
  } catch (error) {
    return 99999;
  }
}

function loadSelectedSkin() {
  try {
    const savedSkin = window.localStorage.getItem("road-hop-rush-skin");
    return skins[savedSkin] ? savedSkin : "lime";
  } catch (error) {
    return "lime";
  }
}

function saveSelectedSkin(value) {
  try {
    window.localStorage.setItem("road-hop-rush-skin", value);
  } catch (error) {
    // Skin still applies for this session when storage is blocked.
  }
}

function chooseSkin(skinId) {
  if (!skins[skinId]) return;
  selectedSkinId = skinId;
  saveSelectedSkin(skinId);
  updateSkinButtons();
  draw();
}

function updateSkinButtons() {
  skinButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.skin === selectedSkinId);
  });
}

function buyFreezeGun() {
  if (hasFreezeGun) return;

  if (walletCoins < freezeGunCost) {
    updateStatus(gameState, "Need 100 coins");
    beep(150, 0.04, "square");
    return;
  }

  walletCoins -= freezeGunCost;
  hasFreezeGun = true;
  saveWalletCoins(walletCoins);
  saveFreezeGunOwnership();
  updateHud();
  updateFreezeControls();
  updateStatus(gameState, "Freeze Gun bought");
  beep(700, 0.08, "sine");
  noise(0.08, 0.025);
}

function buyIceCube() {
  if (!hasFreezeGun) {
    updateStatus(gameState, "Buy Freeze Gun first");
    beep(150, 0.04, "square");
    return;
  }

  if (walletCoins < iceCubeCost) {
    updateStatus(gameState, "Need 1 coin");
    beep(150, 0.04, "square");
    return;
  }

  walletCoins -= iceCubeCost;
  iceCubes += 1;
  saveWalletCoins(walletCoins);
  saveIceCubes();
  updateHud();
  updateFreezeControls();
  updateStatus(gameState, "Ice cube loaded");
  beep(700, 0.07, "sine");
  noise(0.06, 0.02);
}

function activateFreezeGun() {
  if (gameState !== "running" || !hasFreezeGun || iceCubes <= 0 || freezeTimerMs > 0) return;
  iceCubes -= 1;
  saveIceCubes();
  freezeTimerMs = freezeDurationMs;
  updateFreezeControls();
  updateStatus("running", "Cars frozen");
  beep(520, 0.08, "triangle");
  noise(0.28, 0.045);
}

function updateFreezeControls() {
  const frozenSeconds = Math.ceil(freezeTimerMs / 1000);
  freezeButton.textContent = freezeTimerMs > 0 ? `Frozen ${frozenSeconds}s` : `Freeze Gun x${iceCubes}`;
  freezeButton.disabled = gameState !== "running" || !hasFreezeGun || iceCubes <= 0 || freezeTimerMs > 0;
  freezeGunBuyButton.textContent = hasFreezeGun ? "Freeze Gun owned" : "Freeze Gun - 100 coins";
  freezeGunBuyButton.disabled = hasFreezeGun || walletCoins < freezeGunCost;
  freezeGunShopButton.disabled = !hasFreezeGun || walletCoins < iceCubeCost;
  secretStatus.textContent = `Freeze Gun: ${hasFreezeGun ? "Owned" : "Locked"} | Ice Cubes: ${iceCubes}`;
}

function beep(frequency, duration, type) {
  if (!soundOn) return;
  const BrowserAudioContext = window.AudioContext || window.webkitAudioContext;
  if (!BrowserAudioContext) return;
  if (!audioContext) {
    audioContext = new BrowserAudioContext();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.045;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function noise(duration, volume) {
  if (!soundOn) return;
  const BrowserAudioContext = window.AudioContext || window.webkitAudioContext;
  if (!BrowserAudioContext) return;
  if (!audioContext) {
    audioContext = new BrowserAudioContext();
  }

  const bufferSize = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    const fade = 1 - index / bufferSize;
    data[index] = (Math.random() * 2 - 1) * fade;
  }

  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  filter.type = "highpass";
  filter.frequency.value = 520;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

const hops = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

document.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (hops[event.code]) {
    event.preventDefault();
    hop(...hops[event.code]);
  }
});

function activateHop(button) {
    const map = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    hop(...map[button.dataset.hop]);
}

document.querySelectorAll("[data-hop]").forEach((button) => {
  button.addEventListener("click", () => activateHop(button));
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    activateHop(button);
  });
});

function activateStart(event) {
  if (event) {
    event.preventDefault();
  }
  const now = performance.now();
  if (now - lastStartActivation < 180) return;
  lastStartActivation = now;

  if (gameState === "paused") {
    togglePause();
  } else {
    startGame();
  }
}

startButton.addEventListener("click", activateStart);
startButton.addEventListener("pointerup", activateStart);

skinMenuButton.addEventListener("click", () => {
  skinMenu.classList.toggle("is-hidden");
});

secretMenuButton.addEventListener("click", () => {
  secretMenu.classList.toggle("is-hidden");
});

multiplayerMenuButton.addEventListener("click", () => {
  multiplayerMenu.classList.toggle("is-hidden");
  if (!multiplayerMenu.classList.contains("is-hidden")) multiplayerHeartbeat();
});

playerNameInput.addEventListener("change", () => {
  savePlayerName(playerNameInput.value);
  multiplayerHeartbeat();
});

refreshPlayersButton.addEventListener("click", multiplayerHeartbeat);
window.setInterval(multiplayerHeartbeat, 15_000);

skinButtons.forEach((button) => {
  button.addEventListener("click", () => chooseSkin(button.dataset.skin));
});

freezeGunBuyButton.addEventListener("click", buyFreezeGun);
freezeGunShopButton.addEventListener("click", buyIceCube);
freezeButton.addEventListener("click", activateFreezeGun);
doNotClickButton.addEventListener("click", () => {
  doNotClickSound.currentTime = 0;
  doNotClickSound.play();
});
doNotClickButtonTwo.addEventListener("click", () => {
  doNotClickSoundTwo.currentTime = 0;
  doNotClickSoundTwo.play();
});
doNotClickButtonThree.addEventListener("click", () => {
  doNotClickSoundThree.currentTime = 0;
  doNotClickSoundThree.play();
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startGame);

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.classList.toggle("is-muted", !soundOn);
  soundButton.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
});
