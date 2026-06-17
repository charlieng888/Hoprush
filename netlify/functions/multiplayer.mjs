import { getStore } from "@netlify/blobs";

const onlineWindowMs = 45_000;
const maxGift = 100;
const raceTarget = 300;
const allowedReactions = new Set(["Hi!", "Nice!", "Race me!"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function cleanName(value) {
  return String(value || "Player")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 18) || "Player";
}

function cleanId(value) {
  const id = String(value || "");
  return /^[a-zA-Z0-9-]{8,64}$/.test(id) ? id : null;
}

function cleanRoomCode(value) {
  const code = String(value || "PUBLIC").toUpperCase();
  return code === "PUBLIC" || /^[A-Z0-9]{4,6}$/.test(code) ? code : null;
}

async function readState(store) {
  return (await store.get("state", { type: "json", consistency: "strong" })) || {
    players: {},
    gifts: {},
    reactions: {},
  };
}

function removeOfflinePlayers(state, now) {
  for (const [id, player] of Object.entries(state.players)) {
    if (now - player.lastSeen > onlineWindowMs) delete state.players[id];
  }
}

function publicPlayers(state, roomCode) {
  return Object.entries(state.players)
    .filter(([, player]) => player.roomCode === roomCode)
    .map(([id, player]) => ({
      id,
      name: player.name,
      coins: player.coins,
      inRace: Boolean(player.inRace),
      raceScore: Math.max(0, Number(player.raceScore) || 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function updateRace(state, roomCode, now) {
  state.raceWinners ||= {};
  if (state.raceWinners[roomCode] && now - state.raceWinners[roomCode].wonAt > 30_000) {
    delete state.raceWinners[roomCode];
  }
  const racers = publicPlayers(state, roomCode).filter((player) => player.inRace);
  if (!state.raceWinners[roomCode] && racers.length >= 2) {
    const winner = racers.filter((player) => player.raceScore >= raceTarget).sort((a, b) => b.raceScore - a.raceScore)[0];
    if (winner) state.raceWinners[roomCode] = { id: winner.id, name: winner.name, wonAt: now };
  }
  return { target: raceTarget, racers, winner: state.raceWinners[roomCode] || null };
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "POST required" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const store = getStore("road-hop-multiplayer");
  const state = await readState(store);
  state.players ||= {};
  state.gifts ||= {};
  state.reactions ||= {};
  state.raceWinners ||= {};
  const now = Date.now();
  removeOfflinePlayers(state, now);

  if (body.action === "list") {
    const roomCode = cleanRoomCode(body.roomCode);
    if (!roomCode) return json({ error: "Invalid room code" }, 400);
    return json({ players: publicPlayers(state, roomCode), race: updateRace(state, roomCode, now) });
  }

  if (body.action === "heartbeat") {
    const playerId = cleanId(body.playerId);
    const roomCode = cleanRoomCode(body.roomCode);
    if (!playerId || !roomCode) return json({ error: "Invalid player or room" }, 400);

    state.players[playerId] = {
      name: cleanName(body.name),
      coins: Math.max(0, Math.floor(Number(body.coins) || 0)),
      inRace: Boolean(body.inRace),
      raceScore: Math.max(0, Math.floor(Number(body.raceScore) || 0)),
      roomCode,
      lastSeen: now,
    };

    const gifts = state.gifts[playerId] || [];
    const reactions = state.reactions[playerId] || [];
    delete state.gifts[playerId];
    delete state.reactions[playerId];
    const race = updateRace(state, roomCode, now);
    await store.setJSON("state", state);
    return json({ players: publicPlayers(state, roomCode), gifts, reactions, race });
  }

  if (body.action === "gift") {
    const fromId = cleanId(body.fromId);
    const toId = cleanId(body.toId);
    const amount = Math.floor(Number(body.amount));
    const roomCode = cleanRoomCode(body.roomCode);
    if (!fromId || !toId || !roomCode || fromId === toId || amount < 1 || amount > maxGift) {
      return json({ error: "Invalid gift" }, 400);
    }
    if (!state.players[fromId] || !state.players[toId]) {
      return json({ error: "Player is offline" }, 409);
    }
    if (state.players[fromId].roomCode !== roomCode || state.players[toId].roomCode !== roomCode) {
      return json({ error: "Player is not in your room" }, 403);
    }
    if (state.players[fromId].coins < amount) {
      return json({ error: "Not enough coins" }, 409);
    }

    state.players[fromId].coins -= amount;
    state.gifts[toId] ||= [];
    state.gifts[toId].push({
      from: state.players[fromId].name,
      amount,
      sentAt: now,
    });
    state.gifts[toId] = state.gifts[toId].slice(-50);
    await store.setJSON("state", state);
    return json({ ok: true });
  }

  if (body.action === "reaction") {
    const fromId = cleanId(body.fromId);
    const toId = cleanId(body.toId);
    const message = String(body.message || "");
    const roomCode = cleanRoomCode(body.roomCode);
    if (!fromId || !toId || !roomCode || fromId === toId || !allowedReactions.has(message)) {
      return json({ error: "Invalid reaction" }, 400);
    }
    if (!state.players[fromId] || !state.players[toId]) {
      return json({ error: "Player is offline" }, 409);
    }
    if (state.players[fromId].roomCode !== roomCode || state.players[toId].roomCode !== roomCode) {
      return json({ error: "Player is not in your room" }, 403);
    }
    state.reactions[toId] ||= [];
    state.reactions[toId].push({ from: state.players[fromId].name, message, sentAt: now });
    state.reactions[toId] = state.reactions[toId].slice(-20);
    await store.setJSON("state", state);
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
};
