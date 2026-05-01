// Real-time state sync. Two transports:
//   1. Firebase Realtime Database (default for production)
//   2. Local fallback: BroadcastChannel + localStorage (no internet, same device)
//
// The fallback activates automatically when firebase-config.js still has
// REPLACE_ME values. That lets Robin preview the dashboard in two browser
// windows on his laptop without setting up Firebase first.

import { PLAYERS_DEFAULT } from "./cards.js";

const cfg = window.FIREBASE_CONFIG || {};
const FIREBASE_OK = cfg.apiKey && !String(cfg.apiKey).includes("REPLACE_ME");

export function defaultState() {
  const players = {};
  for (const p of PLAYERS_DEFAULT) {
    players[p.id] = {
      name: p.name, score: 0,
      forbiddenWords: 0, phubben: 0,
      freePassUsed: false, present: true,
    };
  }
  return {
    players,
    forbiddenWords: ["sorry", "Engels taalgebruik", "spel", "spaghetti"],
    activeLaws: [
      { id: "law_door_applause", title: "Door Applause", source: "starting" },
      { id: "law_no_phubben",    title: "No Phubben",    source: "starting" },
    ],
    wheelWeights: { public: 50, secret: 30, targeted: 20 },
    cardDurationSec: 12,
    wheelAnimation: true,
    projectorMode: "scoreboard",
    currentCard: null,
    cardPinned: false,
    targetedHistory: [],
    recentDraws: [],
    lastUpdate: Date.now(),
  };
}

// ============================================================
// FIREBASE TRANSPORT
// ============================================================
let fb = null;
async function fbInit() {
  if (fb) return fb;
  const [{ initializeApp }, { getDatabase, ref, onValue, set, update, get }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"),
  ]);
  const app = initializeApp(cfg);
  const db = getDatabase(app);
  fb = { db, ref, onValue, set, update, get, gameRef: ref(db, "game/main") };
  return fb;
}

async function fbSubscribe(cb) {
  const f = await fbInit();
  return f.onValue(f.gameRef, (snap) => {
    const v = snap.val();
    if (!v) {
      f.set(f.gameRef, defaultState());
      cb(defaultState());
    } else {
      cb(v);
    }
  });
}

async function fbWriteState(patch) {
  const f = await fbInit();
  return f.update(f.gameRef, { ...patch, lastUpdate: Date.now() });
}

async function fbWritePlayer(playerId, patch) {
  const f = await fbInit();
  return f.update(f.ref(f.db, `game/main/players/${playerId}`), patch);
}

async function fbGetState() {
  const f = await fbInit();
  const snap = await f.get(f.gameRef);
  return snap.val();
}

async function fbReplaceAll(s) {
  const f = await fbInit();
  return f.set(f.gameRef, s);
}

async function fbWatchConn(cb) {
  const f = await fbInit();
  const cRef = f.ref(f.db, ".info/connected");
  return f.onValue(cRef, (snap) => cb(!!snap.val()));
}

// ============================================================
// LOCAL TRANSPORT (BroadcastChannel + localStorage)
// ============================================================
const LS_KEY = "bachelor-imperium-iv-state";
const channel = (typeof BroadcastChannel !== "undefined")
  ? new BroadcastChannel("bachelor-imperium-iv")
  : null;
let localSubs = [];

function lsRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function lsWrite(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
}

function localBroadcast(state) {
  for (const cb of localSubs) {
    try { cb(state); } catch (_) {}
  }
  if (channel) channel.postMessage({ kind: "state", state });
}

if (channel) {
  channel.onmessage = (ev) => {
    if (ev.data?.kind === "state") {
      lsWrite(ev.data.state);
      for (const cb of localSubs) {
        try { cb(ev.data.state); } catch (_) {}
      }
    }
  };
}
window.addEventListener("storage", (e) => {
  if (e.key === LS_KEY && e.newValue) {
    try {
      const s = JSON.parse(e.newValue);
      for (const cb of localSubs) cb(s);
    } catch (_) {}
  }
});

function localSubscribe(cb) {
  localSubs.push(cb);
  let s = lsRead();
  if (!s) { s = defaultState(); lsWrite(s); }
  cb(s);
  return () => { localSubs = localSubs.filter((x) => x !== cb); };
}
function localWriteState(patch) {
  const s = { ...(lsRead() || defaultState()), ...patch, lastUpdate: Date.now() };
  lsWrite(s); localBroadcast(s);
  return Promise.resolve();
}
function localWritePlayer(id, patch) {
  const s = lsRead() || defaultState();
  s.players = s.players || {};
  s.players[id] = { ...s.players[id], ...patch };
  s.lastUpdate = Date.now();
  lsWrite(s); localBroadcast(s);
  return Promise.resolve();
}
function localGetState() { return Promise.resolve(lsRead()); }
function localReplaceAll(s) { lsWrite(s); localBroadcast(s); return Promise.resolve(); }
function localWatchConn(cb) { cb(true); return () => {}; }

// ============================================================
// PUBLIC API (transport-agnostic)
// ============================================================
export const TRANSPORT = FIREBASE_OK ? "firebase" : "local";

export function subscribe(cb) {
  return FIREBASE_OK ? fbSubscribe(cb) : localSubscribe(cb);
}
export function writeState(patch) {
  return FIREBASE_OK ? fbWriteState(patch) : localWriteState(patch);
}
export function writePlayer(id, patch) {
  return FIREBASE_OK ? fbWritePlayer(id, patch) : localWritePlayer(id, patch);
}
export function getStateOnce() {
  return FIREBASE_OK ? fbGetState() : localGetState();
}
export async function resetAll() {
  return FIREBASE_OK ? fbReplaceAll(defaultState()) : localReplaceAll(defaultState());
}
export async function resetScoresOnly() {
  const s = await getStateOnce();
  if (!s) return;
  const players = {};
  for (const id of Object.keys(s.players || {})) {
    players[id] = { ...s.players[id], score: 0, forbiddenWords: 0, phubben: 0, freePassUsed: false };
  }
  return writeState({ players });
}
export function watchConnection(cb) {
  return FIREBASE_OK ? fbWatchConn(cb) : localWatchConn(cb);
}

// Diagnostic: log mode on first import
console.info(`[state] sync transport: ${TRANSPORT}${FIREBASE_OK ? "" : " (local-only — Firebase not configured)"}`);
