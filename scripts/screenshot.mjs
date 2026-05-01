// Screenshot the live projector in various states using Playwright.
// Usage: node scripts/screenshot.mjs [card_id]
//
// Z Fold inner display ~ 2176x1812 (1.2:1). We emulate that viewport.

import { chromium } from "playwright";
import fs from "fs";

// pass --laptop to use 1920x1080 instead of Z Fold dimensions
const LAPTOP = process.argv.includes("--laptop");
const VIEWPORT = LAPTOP ? { width: 1920, height: 1080 } : { width: 2176, height: 1812 };
const URL_BASE = "https://rwydaegh.github.io/bachelor-imperium-iv";
const OUT_DIR = "screenshots";
fs.mkdirSync(OUT_DIR, { recursive: true });

const positionals = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const cardId = positionals[0] || "law_compliment_mode";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
const page = await ctx.newPage();

console.log(`> projector idle/scoreboard`);
await page.goto(`${URL_BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT_DIR}/01-scoreboard.png`, fullPage: false });

console.log(`> firing card ${cardId} via direct Firebase write`);
await page.evaluate(async (id) => {
  const { writeState } = await import("/bachelor-imperium-iv/js/state.js");
  const { CARDS } = await import("/bachelor-imperium-iv/js/cards.js");
  const card = CARDS.find((c) => c.id === id);
  await writeState({ currentCard: card, projectorMode: "card", cardPinned: true });
}, cardId);
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT_DIR}/02-card-${cardId}.png`, fullPage: false });

console.log(`> firing eyes-closed`);
await page.evaluate(async (id) => {
  const { writeState } = await import("/bachelor-imperium-iv/js/state.js");
  const { CARDS } = await import("/bachelor-imperium-iv/js/cards.js");
  const card = CARDS.find((c) => c.id === "secret_silent_laugh");
  await writeState({ currentCard: card, projectorMode: "eyes_closed", cardPinned: true });
}, cardId);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT_DIR}/03-eyes-closed.png`, fullPage: false });

console.log(`> back to scoreboard for laws strip`);
await page.evaluate(async () => {
  const { writeState } = await import("/bachelor-imperium-iv/js/state.js");
  await writeState({ projectorMode: "scoreboard", currentCard: null, cardPinned: false });
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT_DIR}/04-scoreboard-laws.png`, fullPage: false });

await browser.close();
console.log(`Done. Screenshots in ${OUT_DIR}/`);
