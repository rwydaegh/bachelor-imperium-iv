# 🛸 Bachelor Imperium IV

Companion app for Jeroen's bachelor weekend (1–3 May 2026). A static site
with two views — projector (cast onto the wall) and operator console (Robin's
laptop) — synced in real-time via Firebase.

See [`DESIGN.md`](DESIGN.md) for the full architecture and feature spec.

---

## Quick start (cold-boot, ~5 minutes)

You need three things hooked up: a Firebase database, a GitHub Pages
deployment, and the firebase-config.js file pointing the site at your DB.

### 1. Firebase Realtime Database (free tier)

1. Open https://console.firebase.google.com/ → **Add project** → name it
   `bachelor-imperium-iv` (or anything) → skip Analytics.
2. Inside the project, **Build → Realtime Database → Create database**.
   - Region: `europe-west1` (closest to BE)
   - Start in **test mode** (rules: `read/write: true`). Test mode rules
     auto-expire in 30 days, which is fine — we only need 3 days.
3. **Project Overview** (gear icon) → **Project settings** → **Your apps** →
   click `</>` to register a web app → name it `web`. **Skip hosting**.
4. Copy the `firebaseConfig` object Google gives you. Paste its values into
   [`firebase-config.js`](firebase-config.js) (replace the `REPLACE_ME`s).
5. Commit & push.

### 2. GitHub Pages

1. Push this repo to GitHub (already done if you cloned with `gh`).
2. Repo → **Settings → Pages** → Source: `Deploy from branch`, Branch:
   `main` / `(root)`, Save.
3. Wait ~30s. Site goes live at:
   `https://<your-username>.github.io/bachelor-imperium-iv/`

### 3. Open the URLs

| URL | Where | What |
|---|---|---|
| `…/bachelor-imperium-iv/` | Z Fold 4 (Tap-to-Cast → Project Freestyle) | Projector view |
| `…/bachelor-imperium-iv/op.html` | Robin's laptop | Operator console |

Both subscribe to the same Firebase doc. Tap a fire button on `op.html`,
the projector animates and shows the card.

---

## Local demo mode (no Firebase needed)

If `firebase-config.js` still has `REPLACE_ME` values, the app automatically
falls back to **local-only sync** — two browser windows on the **same device**
will sync via `BroadcastChannel` and `localStorage`. Useful for previewing
the dashboard before doing the Firebase setup.

This will NOT work cross-device (Z Fold ↔ laptop). For real use you need
Firebase configured.

## Keyboard shortcuts (operator)

| Key | Action |
|---|---|
| `Space` | Random spin |
| `P` | Fire PUBLIC |
| `S` | Fire SECRET (staging) |
| `T` | Fire TARGETED (staging) |
| `E` | Toggle eyes-closed |
| `D` | Dismiss current card |
| `X` | Door-applause flash |
| `B` | Show scoreboard |
| `A` | Show album |
| `?` | Show this help |

## Connectivity

Firebase requires internet. Either:
- Cottage wifi.
- Phone hotspot (your phone or someone else's). Z Fold can be its own
  hotspot too.
- If wifi drops mid-weekend, both devices keep the app loaded; Firebase queues
  writes locally and syncs when reconnected.

---

## Operator cheat-sheet

| Button | Effect |
|---|---|
| 🔴 PUBLIC | Random Law/Directive → projector |
| 🟡 SECRET | Random Secret → staging (eyes-closed flow) |
| 🟣 TARGETED | Random Targeted → staging (eyes-closed flow) |
| 🎲 SPIN | Weighted random across all three piles |
| ✋ Dismiss | Clear projector card → scoreboard |
| 📌 Pin | Keep current card on screen indefinitely |
| 👁 Eyes Closed | Toggle eyes-closed mode (says "eyes closed" — projects card big) |
| 👏 Door Applause | 1.5s applause flash on projector |
| 🖼 Album / 📊 Scoreboard | Manual projector mode |

### Eyes-closed reveal flow (the critical one)

1. Hit **SECRET** or **TARGETED**.
2. Card appears on operator screen in a yellow "Pending reveal" panel.
   - For TARGETED: pick the target name from the dropdown.
   - For cards with `[WORD]` placeholders: type a word.
3. Say "eyes closed."
4. Hit **🟢 PROJECT EYES-CLOSED REVEAL**.
5. Walk the table, tap shoulders.
6. Hit **👁 Eyes Closed** again (toggles off) → projector returns to scoreboard.

### Score adjustments

- `+`/`−` buttons per player.
- 🚫 +1 (forbidden word violation) — also auto-decrements score by 1.
- 📵 +1 (phubben violation) — also auto-decrements score by 1.
- Free pass checkbox per player — manually flip when used.

### Live laws

The bottom strip on the projector shows currently-active laws + the forbidden
words list. When wheel draws a Law card, it auto-appends. Use the "repeal"
buttons in the laws panel to remove (or when the **REPEAL A LAW** card fires).

When **ADD A FORBIDDEN WORD** fires, the group nominates → type the new word
into the Forbidden Words section → it appears on the strip.

### Briefing helper (Friday 13:30)

Top of operator: 4-step briefing buttons. Walk through them in order:
1. Forbidden Words (lists current set)
2. Door Applause card
3. No Phubben card
4. Rehearse Eyes-Closed (fires a dummy SECRET card so the table practices once)

### Sunday lunch

Hit **🏆 CROWN THE WINNER** → projector switches to podium view with confetti.

---

## File map

```
.
├── index.html              ← projector view (cast this)
├── op.html                 ← operator console (laptop only)
├── firebase-config.js      ← EDIT THIS: paste Firebase keys
├── DESIGN.md               ← full design spec
├── asset_generation.md     ← what art/audio is needed (mostly nothing)
├── css/style.css
├── js/
│   ├── cards.js            ← all 30 cards' data
│   ├── state.js            ← Firebase wrapper
│   ├── projector.js
│   └── operator.js
├── cards/                  ← 30 PNGs, copied from card_prompts/generated
├── photos/                 ← drop family/group photos here, list in index.json
└── sounds/                 ← optional bell/drumroll/applause MP3s
```

---

## Troubleshooting

- **Site loads but no state syncs**: open browser console. If you see
  "permission denied" — your Firebase rules are still locked. In
  Firebase console → Realtime Database → Rules, paste:
  ```json
  { "rules": { ".read": true, ".write": true } }
  ```
  Publish. (This is fine for a 3-day game; URL is unguessable.)
- **Operator: "FIREBASE_CONFIG REPLACE_ME"**: you forgot step 1.4 above.
- **Z Fold cast looks tiny / letterboxed on Freestyle**: that's correct.
  The Fold mirrors at ~1.2:1; the projector frames it.
- **Wheel doesn't spin**: toggle "Wheel animation" on in operator config.
- **Card image missing**: a text fallback renders automatically in the same
  style. The projector still shows something.

---

## Resetting between days

- **↺ Reset scores** — clears scores, forbidden-word/phubben tallies, free
  passes. Keeps active laws and forbidden words list. Good for "fresh
  Saturday."
- **⚠ Reset everything** — full wipe back to default state. Use only if
  things go sideways.

You can also **💾 Export state** at any time to download a JSON backup.
