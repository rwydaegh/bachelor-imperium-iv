# Bachelor Imperium IV — Design Spec

> Companion app for Jeroen's bachelor weekend (1–3 May 2026). Mirrors TI4's
> agenda-card mechanic onto a bachelor-party meta-game. Single static site,
> two views, real-time sync via Firebase. KISS — operator drives everything,
> minimal logic in code.

---

## 1. Devices & connectivity

| Role | Device | Connection |
|---|---|---|
| Projector view | Z Fold 4 (open, landscape) → Tap-to-Cast (Miracast) → Samsung Project Freestyle | Wifi (cottage or phone hotspot) |
| Operator console | Robin's laptop, Chrome | Same wifi |
| State sync | Firebase Realtime Database (free tier) | Both devices subscribe to one game document |

**Hosting**: GitHub Pages, single static site. URL is unguessable-ish but **no auth**. Two routes: `/` (projector) and `/op` (operator).

**Aspect ratio**: Z Fold inner display ≈ 1.2:1 (2176×1812). Designed for that; projector letterboxes naturally.

## 2. Game state (the one Firebase document)

All state lives in a single Firebase doc, `game/main`:

```js
{
  players: {
    jeroen:  { name: "Jeroen",  score: 0, forbiddenWords: 0, phubben: 0, freePassUsed: false },
    kurt:    { ... },
    firdoz:  { ... },
    pieter:  { ... },
    thomas:  { ... },
    olivier: { ... },
    glen:    { ... }   // optional, may be absent
  },
  forbiddenWords: ["sorry", "engels taalgebruik", "spel", "spaghetti"],
  activeLaws: [
    { id: "door_applause", title: "Door Applause", source: "starting" },
    { id: "no_phubben",    title: "No Phubben",    source: "starting" },
    // wheel-drawn laws appended here with source: "wheel"
  ],
  wheelWeights: { public: 50, secret: 30, targeted: 20 },
  cardDurationSec: 12,
  wheelAnimation: true,
  projectorMode: "scoreboard",  // scoreboard | album | card | eyes_closed | door_applause | wheel_spin | winner
  currentCard: null,            // { type, id, title, body, headerColor, imageUrl }
  cardPinned: false,
  targetedHistory: [
    // { ts, target: "jeroen", cardId: "compliment_storm", note: "" }
  ],
  recentDraws: [
    // { ts, type, cardId } — last ~20, used by operator UI for "don't repeat" hints
  ]
}
```

Robin can hand-edit any field through the operator UI. The projector subscribes and re-renders on any change.

## 3. Card data (static, bundled in JS)

Cards are stored as a hardcoded JS object — no Firebase needed for the deck itself, only for "which card is currently shown." Image paths point at `/cards/<filename>.png` (copied from `card_prompts/generated/`).

Each card:
```js
{ id, type: "law|directive|secret|targeted", title, body, image, weightInDeck: 1 }
```

`Add a Forbidden Word` has `weightInDeck: 4` (per plan §5.2).

## 4. Public vs private split

### PROJECTOR (`/`) — public

- **Idle / scoreboard mode** (default). Big board: 7 player tiles × {score, forbidden-word tally, phubben tally}. Background: photo slideshow from `/photos/` directory cycling every 8s. Bottom strip: active laws list + forbidden words list.
- **Wheel-spin mode**. ~2s spinning 3-slice wheel (red/gold/purple), decelerates, council-bell ding, lands on the chosen category. Auto-transitions to card mode.
- **Card mode** (Law / Directive only). Card image fills 70% of screen, fades in, sits for `cardDurationSec`, fades out → back to scoreboard. If pinned, stays until operator dismisses.
- **Eyes Closed mode**. Full-screen black with "👁 EYES CLOSED 👁" banner. The Secret/Targeted card image is shown big underneath. Stays until operator toggles back.
- **Door applause flash**. 👏 emoji overlay, 1.5s, then back to previous mode.
- **Winner mode** (Sunday lunch). Sorted scoreboard with crown 👑 on the top score, confetti, music sting.

### OPERATOR (`/op`) — private

Single page, sectioned. All controls write directly to the Firebase doc.

#### Section A — Fire (top of page, biggest buttons)
- 🔴 **PUBLIC** | 🟡 **SECRET** | 🟣 **TARGETED** — random draw from that pile.
- 🎲 **SPIN (weighted random)** — uses the wheel-weight sliders.
- ✋ **DISMISS CURRENT CARD** — back to scoreboard mode.
- 📌 **PIN / UNPIN** — keep current card on screen.
- 👁 **EYES CLOSED** — toggle.
- 👏 **DOOR APPLAUSE FLASH**.

#### Section B — Card browser
Tabs: Public / Secret / Targeted. Grid of card thumbnails. Click → fires that specific card to projector. Recently drawn cards have a small ⟲ badge.

#### Section C — Scoreboard editor
For each player row: `name` | `score (-/+)` | `forbidden words (+1)` | `phubben (+1)` | `free pass [used?]` | `note`. All increments are single-tap; long-press undoes.

#### Section D — Active laws panel
List of active laws with [repeal] button each. Bottom: "Add a law" picker for manual additions (e.g., starting briefing).

#### Section E — Forbidden words list
Tag-style chips. Add new word (text input + Enter). Click chip × to remove. Updates projector strip live.

#### Section F — Wheel & display config
- Sliders: Public %, Secret %, Targeted % (sum normalized to 100).
- Slider: Card display duration (5–30s).
- Toggle: wheel animation on/off.
- Dropdown: projector mode (manual override — scoreboard/album/card/eyes_closed/winner).

#### Section G — Targeted history log
Latest 10 entries. Each: timestamp, target name, card title, free-text note. "+ Log entry" button (mostly auto-filled when a Targeted card fires; can edit/delete).

#### Section H — Briefing helper (collapsible, top of page on Friday)
Sequence buttons:
1. Project "Forbidden Words" (verbal, just shows the list big)
2. Project "Door Applause" card
3. Project "No Phubben" card
4. Rehearse Eyes-Closed (fires a dummy card in eyes-closed mode)

#### Section I — Final reveal
Big red button: "🏆 CROWN THE WINNER" — switches projector to winner mode.

#### Section J — Reset / Export
- "Reset day" (clears scores back to 0, keeps laws)
- "Reset all" (full wipe, with confirm)
- "Export JSON" (download current state as backup)

## 5. Eyes-Closed Reveal flow (the critical mechanic)

When operator hits SECRET or TARGETED:
1. Card is drawn but NOT shown on projector yet.
2. Operator console shows the drawn card big with a "🟢 PROJECT EYES-CLOSED REVEAL" button.
3. Operator says aloud: "Eyes closed."
4. Operator hits the button → projector switches to Eyes Closed mode with card shown.
5. Operator walks the table, taps shoulders. Tapped players open eyes, read, close.
6. Operator hits "👁 EYES OPEN" → projector returns to scoreboard.

For TARGETED cards, operator types or selects the target name first; the projector substitutes `[TARGET]` placeholder text in the card with the actual name. Same for `[WORD]` placeholders on Secret cards.

## 6. Tech stack (KISS)

- Vanilla HTML/CSS/JS. **No framework.** No build step.
- Firebase JS SDK v10 (modular, ESM via CDN).
- One CSS file. One JS file per route + one shared `state.js`.
- All cards in `card_prompts/generated/` are copied into `bachelor-imperium-iv/cards/` at build time (just a copy script).
- Photos for album go in `bachelor-imperium-iv/photos/` (you supply later, optional).
- Sounds: `bell.mp3`, `drumroll.mp3`, `applause.mp3` in `sounds/` — sourced from freesound.org or similar (cited in `asset_generation.md`).

## 7. File layout

```
bachelor-imperium-iv/
├── index.html              # projector view (/)
├── op.html                 # operator view (/op via static rewrite or just direct path)
├── css/
│   └── style.css
├── js/
│   ├── state.js            # Firebase init + state subscribe/write helpers
│   ├── cards.js            # static deck data
│   ├── projector.js
│   └── operator.js
├── cards/                  # PNGs copied from ../card_prompts/generated/
├── photos/                 # background slideshow images (you drop these in)
├── sounds/                 # bell, drumroll, applause
├── DESIGN.md               # this file
├── asset_generation.md     # what art/audio is needed and where to source it
└── README.md               # how to run / deploy / configure Firebase
```

## 8. Error handling / edge cases (kept tight)

- **Network drops**: Firebase queues writes locally and syncs when reconnected. Both views show a small "🔌 reconnecting" badge if offline > 3s.
- **Projector reload**: rejoins same game doc, picks up current state. No data loss.
- **Two operators by accident**: last write wins. Robin is sole operator; no concurrency design needed.
- **Card image missing**: text-only fallback rendered inline (header band + title + body) in the matching color.
- **Glen attendance unknown**: a checkbox in operator's reset screen toggles whether Glen appears on the scoreboard.

## 9. Out of scope (explicitly NOT built)

- Auth / login / PINs
- Tap-roster suggester or recent-tap tracking
- Auto-cooldowns or pity timers
- WhatsApp integration of any kind
- Mobile-friendly operator UI (laptop-only, per Q3)
- Offline mode beyond Firebase's built-in queue
- Tests (it's a one-weekend tool)
- Build pipeline (no bundler, no transpiler)

## 10. Open items needing your input before deploy

1. **Firebase project creation** — I'll walk you through 4 clicks; takes ~2 min.
2. **GitHub repo + Pages enablement** — same, 2 min.
3. **Photos for album slideshow** — drop into `photos/` whenever, app picks them up automatically.
4. **Free-pass enforcement** — display only, you toggle "used" by hand. Confirmed?
5. **Sunday final reveal music** — pick a track? (default: silence + confetti)
