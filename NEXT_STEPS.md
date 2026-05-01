# NEXT STEPS — when you're back

Everything that I (Claude) could do without your hands is done. Live site:
**https://rwydaegh.github.io/bachelor-imperium-iv/**

You should be able to verify it loads (you'll see a red Firebase-not-configured
banner — that's expected and harmless until you do step 1).

There are exactly **two manual steps left** before the party:

---

## 1. Set up Firebase (≈4 minutes)

Without this, the dashboard works in single-device demo mode only — two windows
on your laptop can sync, but the Z Fold projector view cannot sync with your
laptop operator console. Firebase enables cross-device.

1. https://console.firebase.google.com → **Add project** → call it whatever →
   skip Analytics.
2. **Build → Realtime Database → Create database** → region `europe-west1` →
   **Start in test mode**.
3. Top-left gear → **Project settings → Your apps** → click `</>` (web) →
   register app, name "web", **skip hosting**.
4. Copy the `firebaseConfig` block Google shows. Replace the `REPLACE_ME`
   values in [`firebase-config.js`](firebase-config.js).
5. `git add firebase-config.js && git commit -m "fb config" && git push` — Pages
   auto-rebuilds in ~30s.

**Firebase rules:** if test mode is locked or expired, go to Realtime Database →
Rules and paste:

```json
{ "rules": { ".read": true, ".write": true } }
```

This is fine for a 3-day game with an unguessable URL.

## 2. Drop in photos + sounds (optional, ≈2 minutes)

- **Photos** → drop JPGs/PNGs into `photos/` and list filenames in
  `photos/index.json` (`["foo.jpg", "bar.png"]`). Empty = no slideshow,
  fine. Push.
- **Sounds** → grab `bell.mp3`, `drumroll.mp3`, `applause.mp3` from
  freesound.org (or skip — silent works). Drop into `sounds/`. Push.

---

## On the day

- Open laptop → `https://rwydaegh.github.io/bachelor-imperium-iv/op.html` (operator)
- Z Fold → `https://rwydaegh.github.io/bachelor-imperium-iv/` (projector). F11
  fullscreen. Tap-to-Cast to Freestyle.
- Friday 13:30: hit the briefing helper buttons in order (4 clicks).
- Then drive the table by feel — `Space` for random spins, `P/S/T` for direct
  fires, `?` for full key list.

## What's in the box

- 30 TI4-styled card images (already in `cards/`)
- Wheel animation, eyes-closed reveal, scoreboard, album backdrop, winner podium
- Real-time sync between operator and projector
- Forbidden-words and phubben tallies tied to score (auto -1 when you tally up)
- Active-laws strip on projector, repeal buttons in operator
- Reset / export / pin / dismiss / pin-card / 4-step briefing helper / final
  reveal

## Repo

GitHub: https://github.com/rwydaegh/bachelor-imperium-iv
Pages:  https://rwydaegh.github.io/bachelor-imperium-iv/

See [`README.md`](README.md) for full operator manual + troubleshooting and
[`DESIGN.md`](DESIGN.md) for the architecture spec.

🛸 Have a good party.
