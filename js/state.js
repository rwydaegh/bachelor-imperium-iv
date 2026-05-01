// Firebase Realtime DB sync layer. One game document at /game/main.
// All state mutations go through writeState(). Subscribers get the full doc.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, onValue, set, update, get, child, onDisconnect,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import { PLAYERS_DEFAULT } from "./cards.js";

// EDIT THIS BLOCK with your Firebase project config (from console.firebase.google.com)
export const FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  databaseURL: "https://REPLACE_ME-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "REPLACE_ME",
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
const GAME_PATH = "game/main";
const gameRef = ref(db, GAME_PATH);

export function defaultState() {
  const players = {};
  for (const p of PLAYERS_DEFAULT) {
    players[p.id] = {
      name: p.name, score: 0,
      forbiddenWords: 0, phubben: 0,
      freePassUsed: false, present: p.id !== "glen",
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

export function subscribe(cb) {
  return onValue(gameRef, (snap) => {
    const v = snap.val();
    if (!v) {
      // First boot: seed.
      set(gameRef, defaultState());
      cb(defaultState());
    } else {
      cb(v);
    }
  });
}

export async function writeState(patch) {
  return update(gameRef, { ...patch, lastUpdate: Date.now() });
}

export async function writePlayer(playerId, patch) {
  return update(ref(db, `${GAME_PATH}/players/${playerId}`), patch);
}

export async function getStateOnce() {
  const snap = await get(gameRef);
  return snap.val();
}

export async function resetAll() {
  return set(gameRef, defaultState());
}

export async function resetScoresOnly() {
  const snap = await get(gameRef);
  const v = snap.val();
  if (!v) return;
  const players = {};
  for (const id of Object.keys(v.players || {})) {
    players[id] = { ...v.players[id], score: 0, forbiddenWords: 0, phubben: 0, freePassUsed: false };
  }
  return update(gameRef, { players });
}

// Connection status: emit a "connected" boolean to a callback.
export function watchConnection(cb) {
  const cRef = ref(db, ".info/connected");
  return onValue(cRef, (snap) => cb(!!snap.val()));
}
