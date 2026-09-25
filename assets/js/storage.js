/* ==========================================================================
 * Subtext Surfers – storage.js
 * Player logins, highscores, trick points and unlockables, kept in
 * localStorage so they persist across runs. A player can optionally be
 * verified against the company GitHub (see netlify/functions).
 * ========================================================================== */
'use strict';

const Storage = (() => {
  const KEY = 'subtextSurfers.players.v1';

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveAll(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function listPlayers() {
    const db = loadAll();
    return Object.values(db).sort((a, b) => b.highscore - a.highscore);
  }

  function getPlayer(name) {
    if (!name) return null;
    const db = loadAll();
    return db[name.toLowerCase()] || null;
  }

  /* Password hashing: SHA-256 via Web Crypto (async), with a synchronous
   * FNV-1a fallback for exotic environments. The hash is only a local gate
   * for the browser profile – it never leaves the device. */
  async function hashPassword(pw) {
    const data = new TextEncoder().encode('subtext-surfers::' + pw);
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      try {
        const digest = await crypto.subtle.digest('SHA-256', data);
        return 'sha256:' + Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { /* fall through to FNV */ }
    }
    let h = 0x811c9dc5;
    for (const b of data) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return 'fnv:' + h.toString(16);
  }

  /* Creates a new player with a password hash. Returns null if the name
   * is already taken. */
  function createPlayer(name, passHash) {
    const id = name.trim().toLowerCase();
    if (!id) return null;
    const db = loadAll();
    if (db[id]) return null;
    db[id] = {
      name: name.trim(),
      passHash: passHash || null,
      highscore: 0,
      trickPoints: 0,
      runs: 0,
      tutorialSeen: false,
      character: 'wave',
      loadout: { board: 'classic', hat: null, rainbowWater: false, lippo: false, lippoBoard: 'classic', lippoSparkles: false, lippoHat: null },
      unlocked: [],
      createdAt: Date.now(),
    };
    saveAll(db);
    return db[id];
  }

  /* Verifies a login. Returns:
   *   { ok: true,  player }              – password matches (or legacy
   *                                         account claimed with this password)
   *   { ok: false, reason: 'unknown' }   – no such player
   *   { ok: false, reason: 'password' }  – wrong password
   */
  function verifyPlayer(name, passHash) {
    const id = name.trim().toLowerCase();
    const db = loadAll();
    const p = db[id];
    if (!p) return { ok: false, reason: 'unknown' };
    if (!p.passHash) {
      // legacy account without a password: claim it with this password
      p.passHash = passHash;
      saveAll(db);
      return { ok: true, player: p };
    }
    if (p.passHash === passHash) return { ok: true, player: p };
    return { ok: false, reason: 'password' };
  }

  function updatePlayer(name, patch) {
    const id = name.trim().toLowerCase();
    const db = loadAll();
    if (!db[id]) return null;
    Object.assign(db[id], patch);
    saveAll(db);
    return db[id];
  }

  /* Returns true if a new highscore was set */
  function recordRun(name, score, trickPointsEarned) {
    const id = name.trim().toLowerCase();
    const db = loadAll();
    if (!db[id]) return false;
    const p = db[id];
    const isBest = score > p.highscore;
    if (isBest) p.highscore = score;
    p.trickPoints += trickPointsEarned;
    p.runs += 1;
    saveAll(db);
    return isBest;
  }

  function unlock(name, itemId) {
    const id = name.trim().toLowerCase();
    const db = loadAll();
    if (!db[id] || db[id].unlocked.includes(itemId)) return db[id] || null;
    db[id].unlocked.push(itemId);
    saveAll(db);
    return db[id];
  }

  /* Ranking helpers */
  function getRanking(name) {
    const players = listPlayers();
    const idx = players.findIndex(p => p.name.toLowerCase() === name.trim().toLowerCase());
    return { position: idx >= 0 ? idx + 1 : null, total: players.length, players };
  }

  return { listPlayers, getPlayer, createPlayer, verifyPlayer, hashPassword,
           updatePlayer, recordRun, unlock, getRanking };
})();

/* ------------------------- unlockable items ------------------------- */
const SHOP_ITEMS = [
  { id: 'board_rainbow',  kind: 'board',  name: 'Rainbow Board',  cost: 150,  desc: 'A glittering rainbow surfboard', icon: '🌈' },
  { id: 'board_galaxy',  kind: 'board',  name: 'Galaxy Board',   cost: 400,  desc: 'Deep-space purple nebula board',  icon: '🌌' },
  { id: 'hat_party',     kind: 'hat',    name: 'Party Hat',     cost: 200,  desc: 'Pointy, striped, fabulous',       icon: '🥳' },
  { id: 'hat_propeller', kind: 'hat',    name: 'Propeller Cap',  cost: 350,  desc: 'The propeller really spins',      icon: '🧢' },
  { id: 'hat_crown',     kind: 'hat',    name: 'Crown',          cost: 500,  desc: 'For the ranking royalty',         icon: '👑' },
  { id: 'water_rainbow', kind: 'water',  name: 'Rainbow Water',  cost: 600,  desc: 'The whole ocean turns into rainbows', icon: '🌊' },
  { id: 'lippo',         kind: 'lippo',  name: 'Lippo 🐶',       cost: 800,  desc: 'The team dog surfs along with you', icon: '🐶' },
  { id: 'lippo_board_sparkle', kind: 'lippoBoard', name: 'Lippo: Sparkle Board', cost: 200, desc: 'A tiny glittering board for Lippo', icon: '✨' },
  { id: 'lippo_board_paddle',  kind: 'lippoBoard', name: 'Lippo: Paddle Board',   cost: 400, desc: 'Extra buoyant dog paddle board',   icon: '🐾' },
  { id: 'lippo_sparkles', kind: 'lippoFx', name: 'Lippo Sparkles', cost: 250, desc: 'Sparkle effects around Lippo', icon: '💫' },
  { id: 'lippo_hat_party', kind: 'lippoHat', name: 'Lippo: Tiny Party Hat', cost: 150, desc: 'A very small hat for a very good dog', icon: '🎉' },
  { id: 'lippo_hat_crown',  kind: 'lippoHat', name: 'Lippo: Tiny Crown',      cost: 300, desc: 'Lippo is royalty now', icon: '👑' },
];

const EQUIP_KINDS = {
  board:        ['board_classic', 'board_rainbow', 'board_galaxy'],
  hat:          [null, 'hat_party', 'hat_propeller', 'hat_crown'],
  water:        ['water_rainbow'],
  lippo:        ['lippo'],
  lippoBoard:   ['board_classic', 'lippo_board_sparkle', 'lippo_board_paddle'],
  lippoFx:      ['lippo_sparkles'],
  lippoHat:     [null, 'lippo_hat_party', 'lippo_hat_crown'],
};
