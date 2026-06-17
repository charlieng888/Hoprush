import { getStore } from "@netlify/blobs";

const onlineWindowMs = 45_000;
const maxGift = 100;

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

async function readState(store) {
  return (await store.get("state", { type: "json", consistency: "strong" })) || {
    players: {},
    gifts: {},
  };
}

function removeOfflinePlayers(state, now) {
  for (const [id, player] of Object.entries(state.players)) {
    if (now - player.lastSeen > onlineWindowMs) delete state.players[id];
  }
}

function publicPlayers(state) {
  return Object.entries(state.players)
    .map(([id, player]) => ({ id, name: player.name, coins: player.coins }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
  const now = Date.now();
  removeOfflinePlayers(state, now);

  if (body.action === "list") {
    return json({ players: publicPlayers(state) });
  }

  if (body.action === "heartbeat") {
    const playerId = cleanId(body.playerId);
    if (!playerId) return json({ error: "Invalid player" }, 400);

    state.players[playerId] = {
      name: cleanName(body.name),
      coins: Math.max(0, Math.floor(Number(body.coins) || 0)),
      lastSeen: now,
    };

    const gifts = state.gifts[playerId] || [];
    delete state.gifts[playerId];
    await store.setJSON("state", state);
    return json({ players: publicPlayers(state), gifts });
  }

  if (body.action === "gift") {
    const fromId = cleanId(body.fromId);
    const toId = cleanId(body.toId);
    const amount = Math.floor(Number(body.amount));
    if (!fromId || !toId || fromId === toId || amount < 1 || amount > maxGift) {
      return json({ error: "Invalid gift" }, 400);
    }
    if (!state.players[fromId] || !state.players[toId]) {
      return json({ error: "Player is offline" }, 409);
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

  return json({ error: "Unknown action" }, 400);
};
