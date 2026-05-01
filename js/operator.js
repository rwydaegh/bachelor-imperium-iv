// Operator console: writes to Firebase. Robin's only screen during the weekend.
import {
  subscribe, writeState, writePlayer, watchConnection,
  resetAll, resetScoresOnly, getStateOnce, defaultState,
} from "./state.js";
import { CARDS, cardsByType, publicPile, pickWeighted, HEADER_COLOR } from "./cards.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let state = null;
let activeTab = "law";
let pendingReveal = null; // { card, substitutions: {TARGET, WORD,...} }

// ============================================================ FIRE
$("#fire-public").addEventListener("click", () => firePile("public"));
$("#fire-secret").addEventListener("click", () => firePile("secret"));
$("#fire-targeted").addEventListener("click", () => firePile("targeted"));
$("#fire-spin").addEventListener("click", () => {
  const w = state?.wheelWeights || { public: 50, secret: 30, targeted: 20 };
  const total = (w.public || 0) + (w.secret || 0) + (w.targeted || 0);
  if (total === 0) return firePile("public");
  let r = Math.random() * total;
  if ((r -= w.public) <= 0) return firePile("public");
  if ((r -= w.secret) <= 0) return firePile("secret");
  return firePile("targeted");
});

async function firePile(slice) {
  // slice: "public" | "secret" | "targeted"
  let pile;
  if (slice === "public") pile = publicPile();
  else pile = cardsByType(slice);
  const recent = (state?.recentDraws || []).slice(-5).map((d) => d.cardId);
  const card = pickWeighted(pile, recent);
  await fireCard(card);
}

async function fireCard(card) {
  // For SECRET / TARGETED cards: stage them first (eyes-closed reveal flow).
  // For LAW / DIRECTIVE: project immediately.
  if (card.type === "secret" || card.type === "targeted") {
    pendingReveal = { card, substitutions: {} };
    showStaging();
    return;
  }
  // Public: optionally play wheel animation, then card
  await projectCard(card, "card");
}

async function projectCard(card, mode) {
  const sliceType = card.type;
  const wantWheel = state?.wheelAnimation && mode === "card";
  const fullCard = { ...card };
  if (wantWheel) {
    await writeState({
      currentCard: fullCard,
      projectorMode: "wheel_spin",
      cardPinned: false,
    });
    await sleep(2600);
  }
  await writeState({
    currentCard: fullCard,
    projectorMode: mode,
    cardPinned: false,
    recentDraws: [...(state?.recentDraws || []), { ts: Date.now(), type: card.type, cardId: card.id }].slice(-30),
  });
  // Auto-dismiss after duration if not pinned & not eyes-closed
  if (mode === "card") {
    const dur = (state?.cardDurationSec || 12) * 1000;
    setTimeout(async () => {
      const cur = await getStateOnce();
      if (cur?.projectorMode === "card" && !cur.cardPinned && cur.currentCard?.id === card.id) {
        await writeState({ projectorMode: "scoreboard", currentCard: null });
      }
    }, dur);
  }
  // Auto-add law to active list
  if (card.type === "law" && card.id !== "law_repeal" && card.id !== "law_add_forbidden_word") {
    const laws = state?.activeLaws || [];
    if (!laws.some((l) => l.id === card.id)) {
      await writeState({ activeLaws: [...laws, { id: card.id, title: card.title, source: "wheel" }] });
    }
  }
}

// ============================================================ STAGING
function showStaging() {
  if (!pendingReveal) return $("#staging").classList.add("hidden");
  const { card, substitutions } = pendingReveal;
  const fields = (card.placeholders || []).map((ph) => {
    const isTarget = ph === "TARGET";
    const opts = isTarget
      ? presentPlayers().map((p) => `<option value="${escapeAttr(p.name)}">${escapeHtml(p.name)}</option>`).join("")
      : "";
    return `
      <label>${ph}
        ${isTarget
          ? `<select data-ph="${ph}"><option value="">— pick —</option>${opts}</select>`
          : `<input data-ph="${ph}" placeholder="${ph.toLowerCase()}…">`}
      </label>`;
  }).join("");
  $("#staging-content").innerHTML = `
    <div class="staging-card">
      <img src="${card.image}" alt="" onerror="this.style.display='none'">
      <div class="sc-text">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.body)}</p>
        ${card.tapCount ? `<p style="margin-top:10px;color:var(--accent);"><b>Recommended tap count:</b> ${card.tapCount}</p>` : ""}
        ${card.twoAgents ? `<p style="margin-top:10px;color:var(--accent);"><b>Tap 2 agents</b> — they will invent the fake fact themselves.</p>` : ""}
        ${fields ? `<div class="staging-fields">${fields}</div>` : ""}
      </div>
    </div>
  `;
  $("#staging").classList.remove("hidden");
  $$('#staging-content [data-ph]').forEach((el) => {
    el.addEventListener("input", () => {
      pendingReveal.substitutions[el.dataset.ph] = el.value.trim();
    });
  });
}

$("#project-eyes").addEventListener("click", async () => {
  if (!pendingReveal) return;
  const { card, substitutions } = pendingReveal;
  const fullCard = { ...card, substitutions };
  await writeState({
    currentCard: fullCard,
    projectorMode: "eyes_closed",
    cardPinned: true,
  });
  // Log targeted history
  if (card.type === "targeted" && substitutions.TARGET) {
    const entry = { ts: Date.now(), target: substitutions.TARGET, cardId: card.id, cardTitle: card.title, note: "" };
    await writeState({ targetedHistory: [...(state?.targetedHistory || []), entry].slice(-30) });
  }
  pendingReveal = null;
  $("#staging").classList.add("hidden");
});
$("#cancel-staging").addEventListener("click", () => {
  pendingReveal = null;
  $("#staging").classList.add("hidden");
});

// ============================================================ SECONDARY FIRE BUTTONS
$("#dismiss-card").addEventListener("click", () => writeState({ projectorMode: "scoreboard", currentCard: null, cardPinned: false }));
$("#pin-card").addEventListener("click", () => writeState({ cardPinned: !state?.cardPinned }));
$("#eyes-toggle").addEventListener("click", () => {
  const next = state?.projectorMode === "eyes_closed" ? "scoreboard" : "eyes_closed";
  writeState({ projectorMode: next });
});
$("#applause-trigger").addEventListener("click", async () => {
  const prev = state?.projectorMode || "scoreboard";
  await writeState({ projectorMode: "door_applause" });
  setTimeout(() => writeState({ projectorMode: prev }), 1500);
});
$("#show-album").addEventListener("click", () => writeState({ projectorMode: "album" }));
$("#show-scoreboard").addEventListener("click", () => writeState({ projectorMode: "scoreboard" }));

// ============================================================ BROWSER
$$(".tab").forEach((t) => t.addEventListener("click", () => {
  $$(".tab").forEach((x) => x.classList.remove("active"));
  t.classList.add("active");
  activeTab = t.dataset.tab;
  renderBrowser();
}));
function renderBrowser() {
  const recent = (state?.recentDraws || []).map((d) => d.cardId);
  const cards = cardsByType(activeTab);
  $("#browser-grid").innerHTML = cards.map((c) => `
    <div class="browser-card ${recent.includes(c.id) ? "recent" : ""}" data-card="${c.id}">
      <img src="${c.image}" alt="" onerror="this.style.display='none'">
      <div class="bc-name">${escapeHtml(c.title)}</div>
    </div>
  `).join("");
  $$("#browser-grid .browser-card").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.card;
      const card = CARDS.find((c) => c.id === id);
      if (card) fireCard(card);
    });
  });
}

// ============================================================ SCOREBOARD EDITOR
function renderEditor() {
  const tbody = $("#editor-tbody");
  const players = Object.entries(state?.players || {});
  tbody.innerHTML = players.map(([id, p]) => `
    <tr class="${p.present === false ? "absent" : ""}" data-id="${id}">
      <td class="pname">${escapeHtml(p.name)}</td>
      <td><input type="checkbox" data-act="present" ${p.present !== false ? "checked" : ""}></td>
      <td>
        <div class="score-cell">
          <button data-act="score-down">−</button>
          <span class="v">${p.score ?? 0}</span>
          <button data-act="score-up">+</button>
        </div>
      </td>
      <td><button class="tally-btn" data-act="fw">🚫 +1 <span class="v">${p.forbiddenWords ?? 0}</span></button></td>
      <td><button class="tally-btn" data-act="ph">📵 +1 <span class="v">${p.phubben ?? 0}</span></button></td>
      <td><label><input type="checkbox" data-act="fp" ${p.freePassUsed ? "checked" : ""}> used</label></td>
    </tr>
  `).join("");
  $$("#editor-tbody [data-act]").forEach((el) => {
    el.addEventListener("click", async (e) => {
      const tr = el.closest("tr"); const id = tr.dataset.id;
      const p = state.players[id];
      const act = el.dataset.act;
      if (act === "score-up") return writePlayer(id, { score: (p.score ?? 0) + 1 });
      if (act === "score-down") return writePlayer(id, { score: (p.score ?? 0) - 1 });
      if (act === "fw") return writePlayer(id, { forbiddenWords: (p.forbiddenWords ?? 0) + 1, score: (p.score ?? 0) - 1 });
      if (act === "ph") return writePlayer(id, { phubben: (p.phubben ?? 0) + 1, score: (p.score ?? 0) - 1 });
    });
    el.addEventListener("change", async (e) => {
      const tr = el.closest("tr"); const id = tr.dataset.id;
      const act = el.dataset.act;
      if (act === "present") return writePlayer(id, { present: el.checked });
      if (act === "fp") return writePlayer(id, { freePassUsed: el.checked });
    });
  });
}

// ============================================================ LAWS
function renderLaws() {
  const list = $("#laws-list");
  const laws = state?.activeLaws || [];
  list.innerHTML = laws.map((l, i) => `
    <li data-i="${i}" data-id="${escapeAttr(l.id)}">
      <span class="law-name" title="Click to re-project this card">
        ${escapeHtml(l.title)}<span class="src">${escapeHtml(l.source || "")}</span>
      </span>
      <button class="repeal-btn" data-act="repeal">repeal</button>
    </li>`).join("") || "<li><i>No active laws</i></li>";
  $$("#laws-list .repeal-btn").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const i = +b.closest("li").dataset.i;
    writeState({ activeLaws: laws.filter((_, j) => j !== i) });
  }));
  $$("#laws-list .law-name").forEach((el) => el.addEventListener("click", () => {
    const id = el.closest("li").dataset.id;
    const card = CARDS.find((c) => c.id === id);
    if (card) projectCard(card, "card");
  }));
  // Populate add-law dropdown
  const sel = $("#add-law-select");
  const candidates = cardsByType("law").filter((c) => !laws.some((l) => l.id === c.id) && c.id !== "law_repeal" && c.id !== "law_add_forbidden_word");
  sel.innerHTML = `<option value="">Add a law…</option>` + candidates.map((c) => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("");
}
$("#add-law-btn").addEventListener("click", () => {
  const id = $("#add-law-select").value;
  if (!id) return;
  const card = CARDS.find((c) => c.id === id);
  if (!card) return;
  const laws = state?.activeLaws || [];
  if (laws.some((l) => l.id === id)) return;
  writeState({ activeLaws: [...laws, { id, title: card.title, source: "manual" }] });
});

// ============================================================ FORBIDDEN WORDS
function renderForbidden() {
  const fb = state?.forbiddenWords || [];
  $("#forbidden-chips").innerHTML = fb.map((w, i) => `
    <span class="chip">${escapeHtml(w)} <span class="x" data-i="${i}">×</span></span>
  `).join("");
  $$("#forbidden-chips .x").forEach((x) => x.addEventListener("click", () => {
    const i = +x.dataset.i;
    writeState({ forbiddenWords: fb.filter((_, j) => j !== i) });
  }));
}
$("#add-forbidden-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const inp = $("#add-forbidden-input");
  const w = inp.value.trim();
  if (!w) return;
  const fb = state?.forbiddenWords || [];
  if (fb.includes(w)) return inp.value = "";
  writeState({ forbiddenWords: [...fb, w] });
  inp.value = "";
});

// ============================================================ CONFIG
function bindRange(id, key, valKey) {
  const el = $(id), vEl = $(valKey);
  el.addEventListener("input", () => {
    vEl.textContent = el.value;
  });
  el.addEventListener("change", () => {
    if (key.startsWith("w-")) {
      const k = key.slice(2);
      const w = { ...(state?.wheelWeights || { public: 50, secret: 30, targeted: 20 }), [k]: +el.value };
      writeState({ wheelWeights: w });
    } else if (key === "card-dur") {
      writeState({ cardDurationSec: +el.value });
    }
  });
}
bindRange("#w-public",   "w-public",   "#w-public-v");
bindRange("#w-secret",   "w-secret",   "#w-secret-v");
bindRange("#w-targeted", "w-targeted", "#w-targeted-v");
bindRange("#card-dur",   "card-dur",   "#card-dur-v");
$("#wheel-anim").addEventListener("change", (e) => writeState({ wheelAnimation: e.target.checked }));

// ============================================================ HISTORY
function renderHistory() {
  const list = state?.targetedHistory || [];
  $("#history-list").innerHTML = list.slice().reverse().map((e) => `
    <li><span class="ts">${new Date(e.ts).toLocaleTimeString()}</span> — <b>${escapeHtml(e.target)}</b> · ${escapeHtml(e.cardTitle || e.cardId)}</li>
  `).join("") || "<li><i>No targets fired yet</i></li>";
}

// ============================================================ BRIEFING
$$(".briefing-steps button").forEach((b) => b.addEventListener("click", async () => {
  const what = b.dataset.brief;
  if (what === "forbidden") {
    const fb = state?.forbiddenWords || [];
    await writeState({
      currentCard: {
        type: "law", title: "FORBIDDEN WORDS",
        body: fb.join("  ·  ") + "\n\nEach violation = -1 point. One free pass per player.",
        image: null, id: "briefing_forbidden",
      },
      projectorMode: "card", cardPinned: true,
    });
  }
  if (what === "door") {
    const card = CARDS.find((c) => c.id === "law_door_applause");
    await projectCard(card, "card");
  }
  if (what === "phubben") {
    const card = CARDS.find((c) => c.id === "law_no_phubben");
    await projectCard(card, "card");
  }
  if (what === "rehearse") {
    const card = CARDS.find((c) => c.id === "secret_silent_laugh");
    await writeState({
      currentCard: { ...card },
      projectorMode: "eyes_closed",
      cardPinned: true,
    });
  }
}));

// ============================================================ WINNER & META
$("#crown-winner").addEventListener("click", () => writeState({ projectorMode: "winner" }));
$("#reset-scores").addEventListener("click", async () => {
  if (!confirm("Reset all scores, forbidden-word tallies, phubben tallies and free passes? Laws stay.")) return;
  await resetScoresOnly();
});
$("#reset-all").addEventListener("click", async () => {
  if (!confirm("Wipe ALL state and start over? (laws, scores, history)")) return;
  await resetAll();
});
$("#export-json").addEventListener("click", async () => {
  const s = await getStateOnce();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bachelor-imperium-${new Date().toISOString().replace(/[:.]/g,"-")}.json`;
  a.click();
});

// ============================================================ HELPERS
function presentPlayers() {
  return Object.entries(state?.players || {})
    .filter(([, p]) => p.present !== false)
    .map(([id, p]) => ({ id, ...p }));
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ============================================================ SUBSCRIBE
watchConnection((connected) => {
  $("#conn-dot").classList.toggle("disconnected", !connected);
});
subscribe((s) => {
  state = s || defaultState();
  $("#projector-mode-label").textContent = state.projectorMode || "scoreboard";
  // Sync controls only if user not actively dragging
  syncConfigControls(state);
  renderBrowser();
  renderEditor();
  renderLaws();
  renderForbidden();
  renderHistory();
});

// ============================================================ KEYBOARD SHORTCUTS
document.addEventListener("keydown", (e) => {
  // Skip when typing in an input/textarea
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === " ") { e.preventDefault(); $("#fire-spin").click(); return; }
  if (k === "p") { $("#fire-public").click(); return; }
  if (k === "s") { $("#fire-secret").click(); return; }
  if (k === "t") { $("#fire-targeted").click(); return; }
  if (k === "e") { $("#eyes-toggle").click(); return; }
  if (k === "d") { $("#dismiss-card").click(); return; }
  if (k === "x") { $("#applause-trigger").click(); return; }
  if (k === "b") { $("#show-scoreboard").click(); return; }
  if (k === "a") { $("#show-album").click(); return; }
  if (k === "?") { alert(KB_HELP); return; }
});
const KB_HELP = `Keyboard shortcuts
─────────────────────
SPACE   Random spin
P       Fire PUBLIC
S       Fire SECRET (eyes-closed)
T       Fire TARGETED (eyes-closed)
E       Toggle eyes-closed
D       Dismiss current card
X       Door-applause flash
B       Show scoreboard
A       Show album
?       This help`;

function syncConfigControls(s) {
  const w = s.wheelWeights || { public: 50, secret: 30, targeted: 20 };
  if (document.activeElement?.id !== "w-public")   $("#w-public").value = w.public;
  if (document.activeElement?.id !== "w-secret")   $("#w-secret").value = w.secret;
  if (document.activeElement?.id !== "w-targeted") $("#w-targeted").value = w.targeted;
  $("#w-public-v").textContent = w.public;
  $("#w-secret-v").textContent = w.secret;
  $("#w-targeted-v").textContent = w.targeted;
  if (document.activeElement?.id !== "card-dur") $("#card-dur").value = s.cardDurationSec ?? 12;
  $("#card-dur-v").textContent = s.cardDurationSec ?? 12;
  $("#wheel-anim").checked = s.wheelAnimation !== false;
}
