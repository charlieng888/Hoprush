import { getStore } from "@netlify/blobs";

const onlineWindowMs = 45_000;
const maxGift = 100;
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

function cleanSettings(value = {}) {
  const target = [100, 300, 500].includes(Number(value.target)) ? Number(value.target) : 300;
  const map = ["meadow", "snow", "desert", "night", "space"].includes(value.map) ? value.map : "meadow";
  const limit = [2, 4, 8].includes(Number(value.limit)) ? Number(value.limit) : 4;
  return { target, map, limit };
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
      x: Math.max(0, Math.min(11, Number(player.x) || 0)),
      worldRow: Math.max(0, Number(player.worldRow) || 0),
      skin: String(player.skin || "lime").slice(0, 12),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function updateRace(state, roomCode, now) {
  state.raceWinners ||= {};
  if (state.raceWinners[roomCode] && now - state.raceWinners[roomCode].wonAt > 30_000) {
    delete state.raceWinners[roomCode];
  }
  const racers = publicPlayers(state, roomCode).filter((player) => player.inRace);
  const target = (state.rooms[roomCode] || cleanSettings()).target;
  if (!state.raceWinners[roomCode] && racers.length >= 2) {
    const winner = racers.filter((player) => player.raceScore >= target).sort((a, b) => b.raceScore - a.raceScore)[0];
    if (winner) state.raceWinners[roomCode] = { id: winner.id, name: winner.name, wonAt: now };
  }
  return { target, racers, winner: state.raceWinners[roomCode] || null };
}

function publicLeaderboard(state) {
  return Object.entries(state.leaderboard)
    .map(([id, entry]) => ({ id, name: entry.name, bestScore: Math.max(0, Number(entry.bestScore) || 0), raceWins: Math.max(0, Number(entry.raceWins) || 0) }))
    .sort((a, b) => b.bestScore - a.bestScore || b.raceWins - a.raceWins)
    .slice(0, 20);
}

function publicFriends(state, ids) {
  const wanted = new Set(Array.isArray(ids) ? ids.map(cleanId).filter(Boolean).slice(0, 30) : []);
  return Object.entries(state.players)
    .filter(([id]) => wanted.has(id))
    .map(([id, player]) => ({ id, name: player.name, roomCode: player.roomCode }));
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
  state.rooms ||= {};
  state.leaderboard ||= {};
  state.referrals ||= {};
  const now = Date.now();
  removeOfflinePlayers(state, now);

  if (body.action === "list") {
    const roomCode = cleanRoomCode(body.roomCode);
    if (!roomCode) return json({ error: "Invalid room code" }, 400);
    const settings = state.rooms[roomCode] || cleanSettings();
    return json({ players: publicPlayers(state, roomCode), race: updateRace(state, roomCode, now), settings, leaderboard: publicLeaderboard(state) });
  }

  if (body.action === "heartbeat") {
    const playerId = cleanId(body.playerId);
    const roomCode = cleanRoomCode(body.roomCode);
    if (!playerId || !roomCode) return json({ error: "Invalid player or room" }, 400);
    state.rooms[roomCode] ||= cleanSettings();
    const existingInRoom = state.players[playerId] && state.players[playerId].roomCode === roomCode;
    if (!existingInRoom && publicPlayers(state, roomCode).length >= state.rooms[roomCode].limit) {
      return json({ error: "Room is full" }, 409);
    }

    state.players[playerId] = {
      name: cleanName(body.name),
      coins: Math.max(0, Math.floor(Number(body.coins) || 0)),
      inRace: Boolean(body.inRace),
      raceScore: Math.max(0, Math.floor(Number(body.raceScore) || 0)),
      roomCode,
      x: Math.max(0, Math.min(11, Number(body.x) || 0)),
      worldRow: Math.max(0, Number(body.worldRow) || 0),
      skin: String(body.skin || "lime").slice(0, 12),
      lastSeen: now,
    };
    const previous = state.leaderboard[playerId] || {};
    state.leaderboard[playerId] = {
      name: cleanName(body.name),
      bestScore: Math.max(Number(previous.bestScore) || 0, Math.floor(Number(body.bestScore) || 0)),
      raceWins: Math.max(Number(previous.raceWins) || 0, Math.floor(Number(body.raceWins) || 0)),
    };

    const gifts = state.gifts[playerId] || [];
    const reactions = state.reactions[playerId] || [];
    delete state.gifts[playerId];
    delete state.reactions[playerId];
    const race = updateRace(state, roomCode, now);
    await store.setJSON("state", state);
    return json({ players: publicPlayers(state, roomCode), gifts, reactions, race, settings: state.rooms[roomCode], leaderboard: publicLeaderboard(state), friends: publicFriends(state, body.friendIds) });
  }

  if (body.action === "settings") {
    const playerId = cleanId(body.playerId);
    const roomCode = cleanRoomCode(body.roomCode);
    if (!playerId || !roomCode || roomCode === "PUBLIC" || !state.players[playerId] || state.players[playerId].roomCode !== roomCode) {
      return json({ error: "Join the private room first" }, 403);
    }
    state.rooms[roomCode] = cleanSettings(body.settings);
    delete state.raceWinners[roomCode];
    await store.setJSON("state", state);
    return json({ ok: true, settings: state.rooms[roomCode] });
  }

  if (body.action === "referral") {
    const inviterId = cleanId(body.inviterId);
    const inviteeId = cleanId(body.inviteeId);
    if (!inviterId || !inviteeId || inviterId === inviteeId || !state.players[inviteeId] || !state.leaderboard[inviterId]) {
      return json({ error: "Invalid invite" }, 400);
    }
    if (state.referrals[inviteeId]) return json({ error: "Invite already claimed" }, 409);
    state.referrals[inviteeId] = { inviterId, claimedAt: now };
    state.gifts[inviterId] ||= [];
    state.gifts[inviterId].push({ from: state.players[inviteeId].name, amount: 50, sentAt: now });
    state.gifts[inviterId] = state.gifts[inviterId].slice(-50);
    await store.setJSON("state", state);
    return json({ ok: true, reward: 50 });
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
