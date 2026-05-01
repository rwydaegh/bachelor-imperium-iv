// Projector view: subscribes to game state and renders it onto the wall.
// Single page; flips between modes (scoreboard/wheel/card/eyes/applause/winner)
// based on `state.projectorMode`.

import { subscribe, watchConnection } from "./state.js";
import { CARDS, HEADER_COLOR } from "./cards.js";

const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

const $ = (sel) => document.querySelector(sel);

const screens = {
  scoreboard: $("#scoreboard"),
  wheel:      $("#wheel-screen"),
  card:       $("#card-screen"),
  eyes_closed:$("#eyes-closed"),
  door_applause: $("#applause-flash"),
  winner:     $("#winner-screen"),
};
const album = $("#album");

let lastState = null;
let albumPhotos = [];
let albumIdx = 0;
let albumTimer = null;
let lastWheelMode = null;

function showOnly(mode) {
  for (const [key, el] of Object.entries(screens)) {
    if (!el) continue;
    el.classList.toggle("hidden", key !== mode);
  }
  // album visible behind everything except winner & eyes_closed
  album.classList.toggle("hidden", ["winner", "eyes_closed", "door_applause"].includes(mode));
}

function render(state) {
  if (!state) return;
  lastState = state;
  renderScoreboard(state);
  renderForbiddenAndLaws(state);

  const mode = state.projectorMode || "scoreboard";

  if (mode === "wheel_spin") {
    spinWheel(state.currentCard?.type || "law");
    return;
  }
  if (mode === "card") {
    renderCard(state.currentCard);
    showOnly("card");
    return;
  }
  if (mode === "eyes_closed") {
    renderEyesClosedCard(state.currentCard);
    showOnly("eyes_closed");
    return;
  }
  if (mode === "door_applause") {
    showOnly("door_applause");
    playSfx("sfx-applause");
    setTimeout(() => {
      // Auto-revert; operator can re-trigger
    }, 1500);
    return;
  }
  if (mode === "winner") {
    renderWinner(state);
    showOnly("winner");
    spawnConfetti();
    return;
  }
  if (mode === "album") {
    showOnly("scoreboard"); // scoreboard is invisible? we just show album fully
    $("#scoreboard").classList.add("hidden");
    return;
  }
  // default: scoreboard
  showOnly("scoreboard");
}

function renderScoreboard(state) {
  const grid = $("#player-grid");
  const players = Object.entries(state.players || {});
  const presentPlayers = players.filter(([, p]) => p.present !== false);
  const maxScore = Math.max(...presentPlayers.map(([, p]) => p.score ?? 0), 0);
  const tiles = players.map(([id, p]) => {
    const isLeader = p.present !== false && (p.score ?? 0) === maxScore && maxScore !== 0;
    const isAbsent = p.present === false;
    const score = p.score ?? 0;
    const fw = p.forbiddenWords ?? 0;
    const ph = p.phubben ?? 0;
    return `
      <div class="player-tile ${isLeader ? "leader" : ""} ${isAbsent ? "absent" : ""}">
        <div class="pname">${escapeHtml(p.name || id)}</div>
        <div class="pscore ${score < 0 ? "negative" : ""}">${score >= 0 ? "+" : ""}${score}</div>
        <div class="ptags">
          <span class="ptag ${fw === 0 ? "zero" : "ptag-fp"}">🚫 ${fw}</span>
          <span class="ptag ${ph === 0 ? "zero" : "ptag-fpp"}">📵 ${ph}</span>
          ${p.freePassUsed ? "" : "<span class='ptag'>🎟</span>"}
        </div>
      </div>`;
  }).join("");
  grid.innerHTML = tiles;
}

function renderForbiddenAndLaws(state) {
  const fb = state.forbiddenWords || [];
  $("#forbidden-strip").innerHTML = fb.map((w) => `<span class="fb-chip">${escapeHtml(w)}</span>`).join("");
  const laws = state.activeLaws || [];
  $("#laws-strip").innerHTML = laws.map((l) => {
    const card = CARD_BY_ID[l.id];
    if (card?.image) {
      return `
        <div class="law-thumb">
          <img src="${card.image}" alt="${escapeAttr(l.title)}">
          <div class="law-thumb-title">${escapeHtml(l.title)}</div>
        </div>`;
    }
    return `<div class="law-thumb law-thumb-text"><div class="law-thumb-title">${escapeHtml(l.title)}</div></div>`;
  }).join("");
}

function escapeAttr(s) { return escapeHtml(s); }

function renderCard(card) {
  if (!card) return;
  const img = $("#card-image");
  const fb = $("#card-fallback");
  img.classList.add("hidden"); fb.classList.add("hidden");
  if (card.image) {
    img.src = card.image;
    img.alt = card.title || "";
    img.onload = () => { img.classList.remove("hidden"); };
    img.onerror = () => showFallback(card);
    // try anyway after a short timeout
    setTimeout(() => { if (img.classList.contains("hidden")) showFallback(card); }, 400);
    img.classList.remove("hidden");
  } else {
    showFallback(card);
  }
}

function showFallback(card) {
  $("#card-image").classList.add("hidden");
  const fb = $("#card-fallback");
  fb.classList.remove("hidden");
  $("#card-header").textContent = (card.type || "").toUpperCase();
  $("#card-header").style.background = HEADER_COLOR[card.type] || "#333";
  $("#card-title").textContent = card.title || "";
  $("#card-body").textContent = substitute(card.body || "", card);
}

function renderEyesClosedCard(card) {
  if (!card) return;
  const ec = $("#eyes-card");
  ec.className = `eyes-card ${card.type}-color`;
  ec.innerHTML = `
    <div class="ec-title">${escapeHtml(card.title || "")}</div>
    <div class="ec-body">${escapeHtml(substitute(card.body || "", card))}</div>
  `;
}

function substitute(body, card) {
  let out = body;
  const sub = card.substitutions || {};
  for (const [k, v] of Object.entries(sub)) {
    const re = new RegExp(`\\[${k}\\]`, "g");
    out = out.replace(re, v);
  }
  return out;
}

let spinning = false;
// Generate tick marks once
(function buildWheelTicks() {
  const g = document.getElementById("wheel-ticks");
  if (!g) return;
  for (let i = 0; i < 24; i++) {
    const a = (i * 15) * Math.PI / 180;
    const x1 = Math.sin(a) * 96, y1 = -Math.cos(a) * 96;
    const x2 = Math.sin(a) * 100, y2 = -Math.cos(a) * 100;
    const isMajor = i % 8 === 0;
    g.insertAdjacentHTML("beforeend",
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke-width="${isMajor ? 1.5 : 0.6}"/>`);
  }
})();

// Multi-stage spin animation:
// 1. Anticipation: rotor jerks slightly back (0.35s)
// 2. Main spin: 8 full rotations + lands on target slice (4.0s, deep deceleration)
// 3. Settle: small overshoot bounce (0.5s)
// 4. Glow: winning slice ring pulses (1.0s)
// Total ~ 5.85s
const WHEEL_TIMING = {
  anticipate: 350,
  spin:       4000,
  settle:     500,
  glow:       1000,
};
const WHEEL_TOTAL = WHEEL_TIMING.anticipate + WHEEL_TIMING.spin + WHEEL_TIMING.settle + 200;

function spinWheel(landingType) {
  if (spinning) return;
  spinning = true;
  showOnly("wheel");

  const rotor = document.querySelector(".wheel-rotor");
  const glow = document.getElementById("wheel-glow");
  const sectorOf = { law: "public", directive: "public", secret: "secret", targeted: "targeted" };
  const sector = sectorOf[landingType] || "public";
  // Sector centers (degrees on the wheel itself, 0 = top, clockwise):
  // PUBLIC at 60°, SECRET at 180°, TARGETED at 300°
  const sectorCenter = { public: 60, secret: 180, targeted: 300 }[sector];
  // To bring a wheel-degree X to the top (under the pointer at 0°), rotate by (360 - X)
  const turns = 8; // more rotations = more drama
  const finalDeg = 360 * turns + (360 - sectorCenter);
  // Overshoot then settle: spin slightly past, then back
  const overshoot = finalDeg + 8;

  // Reset
  rotor.classList.remove("anticipating", "spinning", "settling");
  rotor.style.transition = "none";
  rotor.style.transform = "rotate(0deg)";
  glow.classList.add("hidden");
  glow.classList.remove("public-win", "secret-win", "targeted-win");
  void rotor.offsetWidth; // reflow

  // Stage 1: anticipation
  rotor.classList.add("anticipating");
  rotor.style.transform = "rotate(-12deg)";

  setTimeout(() => {
    // Stage 2: main spin to overshoot position
    rotor.classList.remove("anticipating");
    rotor.classList.add("spinning");
    rotor.style.transition = `transform ${WHEEL_TIMING.spin}ms cubic-bezier(.10,.62,.20,1.0)`;
    rotor.style.transform = `rotate(${overshoot}deg)`;
    playSfx("sfx-drumroll");
  }, WHEEL_TIMING.anticipate);

  setTimeout(() => {
    // Stage 3: settle back to exact target with bounce
    rotor.classList.remove("spinning");
    rotor.classList.add("settling");
    rotor.style.transition = `transform ${WHEEL_TIMING.settle}ms cubic-bezier(.34,1.56,.64,1)`;
    rotor.style.transform = `rotate(${finalDeg}deg)`;
    playSfx("sfx-bell");
  }, WHEEL_TIMING.anticipate + WHEEL_TIMING.spin);

  setTimeout(() => {
    // Stage 4: winning-sector glow
    glow.classList.remove("hidden");
    glow.classList.add(`${sector}-win`);
  }, WHEEL_TIMING.anticipate + WHEEL_TIMING.spin + WHEEL_TIMING.settle);

  setTimeout(() => {
    spinning = false;
  }, WHEEL_TOTAL);
}

function renderWinner(state) {
  const players = Object.entries(state.players || {})
    .filter(([, p]) => p.present !== false)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top3 = players.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  $("#winner-podium").innerHTML = order.map((p, i) => {
    const realRank = top3.indexOf(p) + 1;
    return `
      <div class="podium-tile rank-${realRank}">
        <div class="rank">${["🥇","🥈","🥉"][realRank-1]}</div>
        <div class="pname">${escapeHtml(p.name)}</div>
        <div class="pscore">${(p.score ?? 0) >= 0 ? "+" : ""}${p.score ?? 0}</div>
      </div>`;
  }).join("");
}

function spawnConfetti() {
  const root = $("#confetti");
  if (root.dataset.running) return;
  root.dataset.running = "1";
  const colors = ["#e8c468","#8B1A1A","#5B21B6","#1E3A8A","#16a34a","#ef4444"];
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "vw";
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.animationDuration = (3 + Math.random() * 4) + "s";
    s.style.animationDelay = (Math.random() * 2) + "s";
    root.appendChild(s);
  }
}

function playSfx(id) {
  const a = document.getElementById(id);
  if (!a) return;
  try { a.currentTime = 0; a.play(); } catch (_) {}
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// ---------- ALBUM ----------
async function loadAlbum() {
  try {
    const res = await fetch("photos/index.json", { cache: "no-cache" });
    if (!res.ok) return;
    albumPhotos = await res.json();
    if (albumPhotos.length) startAlbumCycle();
  } catch (_) { /* no album */ }
}
function startAlbumCycle() {
  if (albumTimer) clearInterval(albumTimer);
  setAlbumPhoto();
  albumTimer = setInterval(setAlbumPhoto, 8000);
}
function setAlbumPhoto() {
  if (!albumPhotos.length) return;
  const photo = albumPhotos[albumIdx % albumPhotos.length];
  album.style.backgroundImage = `url("photos/${photo}")`;
  albumIdx++;
}

// ---------- BOOT ----------
watchConnection((connected) => {
  $("#conn-badge").classList.toggle("hidden", connected);
});
subscribe(render);
loadAlbum();

// First-tap audio unlock (some browsers block autoplay)
document.addEventListener("click", () => {
  ["sfx-bell","sfx-drumroll","sfx-applause"].forEach((id) => {
    const a = document.getElementById(id);
    if (a) { a.muted = true; a.play().then(() => { a.pause(); a.muted = false; }).catch(() => {}); }
  });
}, { once: true });
