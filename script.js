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
const effectBar = document.querySelector("#effectBar");
const overlay = document.querySelector("#overlay");
const overlayKicker = document.querySelector("#overlayKicker");
const overlayTitle = document.querySelector("#overlayTitle");
const startButton = document.querySelector("#startButton");
const skinMenuButton = document.querySelector("#skinMenuButton");
const skinMenu = document.querySelector("#skinMenu");
const skinButtons = document.querySelectorAll("[data-skin]");
const mapMenuButton = document.querySelector("#mapMenuButton");
const mapMenu = document.querySelector("#mapMenu");
const mapButtons = document.querySelectorAll("[data-map]");
const dailyRewardButton = document.querySelector("#dailyRewardButton");
const secretMenuButton = document.querySelector("#secretMenuButton");
const secretMenu = document.querySelector("#secretMenu");
const secretStatus = document.querySelector("#secretStatus");
const multiplayerMenuButton = document.querySelector("#multiplayerMenuButton");
const multiplayerMenu = document.querySelector("#multiplayerMenu");
const multiplayerStatus = document.querySelector("#multiplayerStatus");
const playerNameInput = document.querySelector("#playerNameInput");
const playerList = document.querySelector("#playerList");
const refreshPlayersButton = document.querySelector("#refreshPlayersButton");
const raceButton = document.querySelector("#raceButton");
const raceStatus = document.querySelector("#raceStatus");
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
const raceTarget = 300;
const dailyRewardCoins = 50;
const skins = {
  lime: { body: "#f4f7fb", cap: "#8ee35f", eye: "#101216", cost: 0 },
  berry: { body: "#fff3fb", cap: "#ff6fba", eye: "#21101a", cost: 0 },
  sky: { body: "#eefaff", cap: "#59d4ff", eye: "#0b2633", cost: 0 },
  gold: { body: "#fff8dc", cap: "#ffd15c", eye: "#35230a", cost: 0 },
  frog: { body: "#d8ffd8", cap: "#44c767", eye: "#102a18", cost: 50 },
  chicken: { body: "#fff8e8", cap: "#ff865c", eye: "#3b170d", cost: 75 },
  robot: { body: "#dce4ec", cap: "#a7b4c4", eye: "#102c3a", cost: 100 },
  penguin: { body: "#f4f7fb", cap: "#26364a", eye: "#090f17", cost: 125 },
};
const mapThemes = {
  meadow: { safe: "#3a8c56", grass: "#2f7849", road: "#252a33", river: "#1d5d7c", tree: "#2fa45c" },
  snow: { safe: "#d7eef4", grass: "#b9dce5", road: "#3b414b", river: "#73b9d2", tree: "#5b9f8f" },
  desert: { safe: "#d6b45f", grass: "#c99a46", road: "#4b4038", river: "#3a9bb7", tree: "#64943d" },
  night: { safe: "#294d3a", grass: "#1d3b2b", road: "#171b25", river: "#193f66", tree: "#26724a" },
  space: { safe: "#4b416d", grass: "#342d55", road: "#151322", river: "#314c86", tree: "#8b6fd1" },
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
let playerScaleX = 1;
let playerScaleY = 1;
let playerLift = 0;
let playerRotation = 0;
let playerAnimationFrame = null;
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
let shieldCharges = 0;
let shieldInvulnerableMs = 0;
let magnetTimerMs = 0;
let speedTimerMs = 0;
let slowTrafficTimerMs = 0;
let selectedMap = loadSelectedMap();
let unlockedSkins = loadUnlockedSkins();
let playerId = loadPlayerId();
let playerName = loadPlayerName();
let onlinePlayers = [];
let multiplayerBusy = false;
let raceMode = false;
let raceStartScore = 0;
let latestRace = null;
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
updateMapButtons();
updateDailyRewardButton();
updateFreezeControls();
renderRaceStatus();
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
  cancelAnimationFrame(playerAnimationFrame);
  completedRows = 0;
  lanes = createLanes();
  player = { ...playerStart };
  hopOffset = { x: 0, y: 0 };
  resetPlayerTransform();
  score = 0;
  if (raceMode) raceStartScore = 0;
  runCoins = 0;
  bestRow = 0;
  freezeTimerMs = 0;
  shieldCharges = 0;
  shieldInvulnerableMs = 0;
  magnetTimerMs = 0;
  speedTimerMs = 0;
  slowTrafficTimerMs = 0;
  updateHud();
  updateFreezeControls();
  updateEffectBar();
  draw();
}

function createLanes() {
  return laneTemplates.map((template, y) => createLane(template, y));
}

function createLane(template, y) {
  const speedFactor = 1 + Math.min(0.65, completedRows * 0.012);
  const lane = { ...template, y, speed: template.speed ? template.speed * speedFactor : 0, actors: [], coins: [], powerups: [] };
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
  if (["grass", "safe"].includes(template.type) && y !== playerStart.y && Math.random() < 0.14) {
    lane.powerups.push({
      x: Math.floor(1 + Math.random() * (columns - 2)),
      type: randomItem(["shield", "magnet", "speed", "slow"]),
      collected: false,
    });
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
    const trafficFactor = lane.type === "road" && slowTrafficTimerMs > 0 ? 0.35 : 1;
    const movement = (lane.speed / 1000) * delta * lane.direction * trafficFactor;
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
  magnetTimerMs = Math.max(0, magnetTimerMs - delta);
  speedTimerMs = Math.max(0, speedTimerMs - delta);
  slowTrafficTimerMs = Math.max(0, slowTrafficTimerMs - delta);
  shieldInvulnerableMs = Math.max(0, shieldInvulnerableMs - delta);
  if (magnetTimerMs > 0) collectNearbyCoins();
  updateEffectBar();

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
  animateHop(dx);
  collectCoin();
  collectPowerup();
  bestRow = Math.max(bestRow, completedRows + playerStart.y - player.y);
  const speedBonus = speedTimerMs > 0 && dy < 0 ? 10 : 0;
  score = Math.max(score, bestRow * 10 + runCoins * 25) + speedBonus;
  updateHud();
  if (raceMode) renderRaceStatus();
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

function animateHop(horizontalDirection) {
  cancelAnimationFrame(playerAnimationFrame);
  const start = performance.now();
  const duration = speedTimerMs > 0 ? 78 : 145;
  const startOffset = { ...hopOffset };
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const arc = Math.sin(progress * Math.PI);
    hopOffset.x = startOffset.x * (1 - eased);
    hopOffset.y = startOffset.y * (1 - eased);
    playerLift = -arc * tile * 0.18;
    playerScaleX = 1 - arc * 0.08;
    playerScaleY = 1 + arc * 0.16;
    playerRotation = horizontalDirection * arc * 0.08;
    if (progress < 1 && gameState === "running") {
      playerAnimationFrame = requestAnimationFrame(frame);
    } else {
      hopOffset = { x: 0, y: 0 };
      resetPlayerTransform();
    }
  }
  playerAnimationFrame = requestAnimationFrame(frame);
}

function collectCoin() {
  const lane = lanes[player.y];
  const coin = lane.coins.find((item) => !item.collected && item.x === Math.round(player.x));
  if (coin) awardCoin(coin);
}

function collectNearbyCoins() {
  lanes.forEach((lane) => {
    if (Math.abs(lane.y - player.y) > 2) return;
    lane.coins.forEach((coin) => {
      if (!coin.collected && Math.abs(coin.x - player.x) <= 2.5) awardCoin(coin, false);
    });
  });
}

function awardCoin(coin, playSound = true) {
  if (coin.collected) return;
  coin.collected = true;
  runCoins += 1;
  walletCoins += 1;
  saveWalletCoins(walletCoins);
  updateHud();
  updateFreezeControls();
  if (playSound) {
    beep(620, 0.055, "sine");
    noise(0.04, 0.018);
  }
}

function collectPowerup() {
  const powerup = lanes[player.y].powerups.find((item) => !item.collected && item.x === Math.round(player.x));
  if (!powerup) return;
  powerup.collected = true;
  if (powerup.type === "shield") shieldCharges += 1;
  if (powerup.type === "magnet") magnetTimerMs = 10_000;
  if (powerup.type === "speed") speedTimerMs = 8_000;
  if (powerup.type === "slow") slowTrafficTimerMs = 10_000;
  updateEffectBar();
  updateStatus("running", `${powerup.type} power-up`);
  beep(760, 0.08, "triangle");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lanes.forEach(drawLane);
  drawPlayer();
}

function drawLane(lane) {
  const y = lane.y * tile;
  const theme = mapThemes[selectedMap] || mapThemes.meadow;
  ctx.fillStyle = theme[lane.type] || lane.color;
  ctx.fillRect(0, y, canvas.width, tile);

  if (lane.type === "road") drawRoadMarks(y);
  if (lane.type === "river") drawRiver(y);

  lane.coins.forEach((coin) => {
    if (!coin.collected) drawCoin(coin.x, lane.y);
  });
  lane.powerups.forEach((powerup) => {
    if (!powerup.collected) drawPowerup(powerup.x, lane.y, powerup.type);
  });

  if (lane.trees) {
    lane.trees.forEach((x) => drawTree(x, lane.y));
  }
  lane.actors.forEach((actor) => {
    if (lane.type === "road") drawVehicle(actor, lane.y, lane.direction);
    if (lane.type === "river") drawLog(actor, lane.y);
  });
}

function drawPowerup(x, y, type) {
  const colors = { shield: "#59d4ff", magnet: "#ff6fba", speed: "#ffd15c", slow: "#b48cff" };
  const labels = { shield: "S", magnet: "M", speed: ">", slow: "T" };
  const cx = x * tile + tile / 2;
  const cy = y * tile + tile / 2;
  ctx.fillStyle = colors[type];
  ctx.beginPath();
  ctx.arc(cx, cy, tile * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101216";
  ctx.font = `900 ${tile * 0.22}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labels[type], cx, cy + 1);
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
  ctx.fillStyle = (mapThemes[selectedMap] || mapThemes.meadow).tree;
  ctx.beginPath();
  ctx.arc(left + tile * 0.38, top + tile * 0.37, tile * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const skin = skins[selectedSkinId] || skins.lime;
  const displayX = (player.x + hopOffset.x) * tile;
  const displayY = (player.y + hopOffset.y) * tile;
  const cx = displayX + tile / 2;
  const groundY = displayY + tile / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + tile * 0.24, tile * 0.24 * playerScaleX, tile * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  if (shieldCharges > 0 || shieldInvulnerableMs > 0) {
    ctx.strokeStyle = "rgba(89, 212, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, groundY + playerLift, tile * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(cx, groundY + playerLift);
  ctx.rotate(playerRotation);
  ctx.scale(playerScaleX, playerScaleY);
  ctx.fillStyle = skin.body;
  roundedRect(-tile * 0.23, -tile * 0.21, tile * 0.46, tile * 0.46, 8);
  ctx.fill();
  ctx.fillStyle = skin.cap;
  roundedRect(-tile * 0.16, -tile * 0.31, tile * 0.32, tile * 0.18, 7);
  ctx.fill();
  ctx.fillStyle = skin.eye;
  ctx.beginPath();
  ctx.arc(-tile * 0.09, -tile * 0.03, 3.5, 0, Math.PI * 2);
  ctx.arc(tile * 0.09, -tile * 0.03, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101216";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, tile * 0.08, tile * 0.08, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function resetPlayerTransform() {
  playerScaleX = 1;
  playerScaleY = 1;
  playerLift = 0;
  playerRotation = 0;
}

function animatePlayerRecoil(intensity = 1) {
  cancelAnimationFrame(playerAnimationFrame);
  const start = performance.now();
  const duration = 180;
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const impact = Math.sin(progress * Math.PI);
    playerScaleX = 1 + impact * 0.22 * intensity;
    playerScaleY = 1 - impact * 0.18 * intensity;
    playerRotation = Math.sin(progress * Math.PI * 2) * 0.06 * intensity;
    if (progress < 1 && gameState === "running") {
      playerAnimationFrame = requestAnimationFrame(frame);
    } else {
      resetPlayerTransform();
    }
  }
  playerAnimationFrame = requestAnimationFrame(frame);
}

function animatePlayerCrash() {
  cancelAnimationFrame(playerAnimationFrame);
  const start = performance.now();
  const duration = 360;
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    playerScaleX = 1 + eased * 0.45;
    playerScaleY = Math.max(0.3, 1 - eased * 0.7);
    playerLift = eased * tile * 0.17;
    playerRotation = eased * 0.35;
    draw();
    if (progress < 1) {
      playerAnimationFrame = requestAnimationFrame(frame);
    }
  }
  playerAnimationFrame = requestAnimationFrame(frame);
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
  animatePlayerRecoil(1);
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
  if (shieldInvulnerableMs > 0) return;
  if (shieldCharges > 0) {
    shieldCharges -= 1;
    shieldInvulnerableMs = 1_200;
    player.y = Math.min(rows - 1, player.y + 1);
    updateEffectBar();
    updateStatus("running", "Shield saved you");
    animatePlayerRecoil(1.2);
    beep(860, 0.1, "square");
    return;
  }
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
  animatePlayerCrash();
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

function updateEffectBar() {
  const effects = [];
  if (shieldCharges > 0) effects.push(`Shield x${shieldCharges}`);
  if (magnetTimerMs > 0) effects.push(`Magnet ${Math.ceil(magnetTimerMs / 1000)}s`);
  if (speedTimerMs > 0) effects.push(`Speed ${Math.ceil(speedTimerMs / 1000)}s`);
  if (slowTrafficTimerMs > 0) effects.push(`Slow traffic ${Math.ceil(slowTrafficTimerMs / 1000)}s`);
  effectBar.textContent = effects.length ? effects.join(" | ") : "No power-ups active";
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
      inRace: raceMode,
      raceScore: raceMode ? Math.max(0, score - raceStartScore) : 0,
    });
    onlinePlayers = result.players || [];
    applyReceivedGifts(result.gifts || []);
    applyReceivedReactions(result.reactions || []);
    latestRace = result.race || null;
    renderOnlinePlayers();
    renderRaceStatus();
    multiplayerStatus.textContent = `${onlinePlayers.length} player${onlinePlayers.length === 1 ? "" : "s"} online`;
  } catch (error) {
    multiplayerStatus.textContent = error.message;
  } finally {
    multiplayerBusy = false;
  }
}

function applyReceivedReactions(reactions) {
  if (!reactions.length) return;
  const reaction = reactions[reactions.length - 1];
  updateStatus(gameState, `${reaction.from}: ${reaction.message}`);
}

function renderRaceStatus() {
  const racers = latestRace ? latestRace.racers || [] : [];
  raceButton.textContent = raceMode ? "Leave race" : "Join 300-point race";
  if (latestRace && latestRace.winner) {
    raceStatus.textContent = `${latestRace.winner.name} won the race!`;
    return;
  }
  if (!raceMode) {
    raceStatus.textContent = `${racers.length} racer${racers.length === 1 ? "" : "s"} waiting`;
    return;
  }
  const myProgress = Math.max(0, score - raceStartScore);
  raceStatus.textContent = `${myProgress}/${raceTarget} points | ${racers.length} racers`;
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
    coins.textContent = onlinePlayer.inRace
      ? `${onlinePlayer.coins} coins | Race ${onlinePlayer.raceScore}/${raceTarget}`
      : `${onlinePlayer.coins} coins`;
    details.append(name, coins);
    row.append(details);

    if (onlinePlayer.id !== playerId) {
      const actions = document.createElement("div");
      actions.className = "player-actions";
      const giftButton = document.createElement("button");
      giftButton.className = "gift-button";
      giftButton.type = "button";
      giftButton.textContent = `Gift ${giftAmount}`;
      giftButton.disabled = walletCoins < giftAmount;
      giftButton.addEventListener("click", () => giftCoins(onlinePlayer));
      actions.append(giftButton);
      [
        ["H", "Hi!"],
        ["N", "Nice!"],
        ["R", "Race me!"],
      ].forEach(([label, message]) => {
        const reactionButton = document.createElement("button");
        reactionButton.className = "reaction-button";
        reactionButton.type = "button";
        reactionButton.textContent = label;
        reactionButton.title = message;
        reactionButton.addEventListener("click", () => sendReaction(onlinePlayer, message));
        actions.append(reactionButton);
      });
      row.append(actions);
    }
    playerList.append(row);
  });
}

async function sendReaction(recipient, message) {
  try {
    await multiplayerRequest({ action: "reaction", fromId: playerId, toId: recipient.id, message });
    multiplayerStatus.textContent = `Sent ${message} to ${recipient.name}`;
  } catch (error) {
    multiplayerStatus.textContent = error.message;
  }
}

function toggleRaceMode() {
  raceMode = !raceMode;
  raceStartScore = score;
  renderRaceStatus();
  multiplayerHeartbeat();
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
    await multiplayerRequest({
      action: "heartbeat",
      playerId,
      name: playerName,
      coins: walletCoins,
      inRace: raceMode,
      raceScore: raceMode ? Math.max(0, score - raceStartScore) : 0,
    });
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

function loadUnlockedSkins() {
  const defaults = ["lime", "berry", "sky", "gold"];
  try {
    const saved = JSON.parse(window.localStorage.getItem("road-hop-rush-unlocked-skins") || "[]");
    return new Set(defaults.concat(Array.isArray(saved) ? saved : []));
  } catch (error) {
    return new Set(defaults);
  }
}

function saveUnlockedSkins() {
  try {
    window.localStorage.setItem("road-hop-rush-unlocked-skins", JSON.stringify([...unlockedSkins]));
  } catch (error) {
    // Unlocks still work for the current session when storage is blocked.
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
  if (!unlockedSkins.has(skinId)) {
    const cost = skins[skinId].cost;
    if (walletCoins < cost) {
      updateStatus(gameState, `Need ${cost} coins`);
      return;
    }
    walletCoins -= cost;
    unlockedSkins.add(skinId);
    saveWalletCoins(walletCoins);
    saveUnlockedSkins();
    updateHud();
  }
  selectedSkinId = skinId;
  saveSelectedSkin(skinId);
  updateSkinButtons();
  draw();
}

function updateSkinButtons() {
  skinButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.skin === selectedSkinId);
    button.classList.toggle("is-locked", !unlockedSkins.has(button.dataset.skin));
  });
}

function loadSelectedMap() {
  try {
    const saved = window.localStorage.getItem("road-hop-rush-map");
    return mapThemes[saved] ? saved : "meadow";
  } catch (error) {
    return "meadow";
  }
}

function chooseMap(mapId) {
  if (!mapThemes[mapId]) return;
  selectedMap = mapId;
  try {
    window.localStorage.setItem("road-hop-rush-map", mapId);
  } catch (error) {
    // The selected map still applies for this session.
  }
  updateMapButtons();
  draw();
}

function updateMapButtons() {
  mapButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.map === selectedMap));
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function claimDailyReward() {
  try {
    if (window.localStorage.getItem("road-hop-rush-daily") === todayKey()) return;
    window.localStorage.setItem("road-hop-rush-daily", todayKey());
  } catch (error) {
    if (dailyRewardButton.dataset.claimed === todayKey()) return;
    dailyRewardButton.dataset.claimed = todayKey();
  }
  walletCoins += dailyRewardCoins;
  saveWalletCoins(walletCoins);
  updateHud();
  updateDailyRewardButton();
  updateStatus(gameState, `Daily reward: ${dailyRewardCoins} coins`);
  beep(820, 0.1, "sine");
}

function updateDailyRewardButton() {
  let claimed = false;
  try {
    claimed = window.localStorage.getItem("road-hop-rush-daily") === todayKey();
  } catch (error) {
    claimed = dailyRewardButton.dataset.claimed === todayKey();
  }
  dailyRewardButton.textContent = claimed ? "Daily claimed" : `Daily +${dailyRewardCoins}`;
  dailyRewardButton.disabled = claimed;
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
  animatePlayerRecoil(0.65);
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

mapMenuButton.addEventListener("click", () => {
  mapMenu.classList.toggle("is-hidden");
});

dailyRewardButton.addEventListener("click", claimDailyReward);

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
raceButton.addEventListener("click", toggleRaceMode);
window.setInterval(multiplayerHeartbeat, 15_000);

skinButtons.forEach((button) => {
  button.addEventListener("click", () => chooseSkin(button.dataset.skin));
});

mapButtons.forEach((button) => {
  button.addEventListener("click", () => chooseMap(button.dataset.map));
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
