// Capture the wheel mid-spin and at rest.
import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 2176, height: 1812 } });
const page = await ctx.newPage();
await page.goto("https://rwydaegh.github.io/bachelor-imperium-iv/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Trigger a wheel-spin state directly
await page.evaluate(async () => {
  const { writeState } = await import("/bachelor-imperium-iv/js/state.js");
  const { CARDS } = await import("/bachelor-imperium-iv/js/cards.js");
  await writeState({ currentCard: CARDS.find((c) => c.id === "law_compliment_mode"), projectorMode: "wheel_spin" });
});

await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/wheel-anticipation.png" });
await page.waitForTimeout(2000);
await page.screenshot({ path: "screenshots/wheel-mid-spin.png" });
await page.waitForTimeout(3500);
await page.screenshot({ path: "screenshots/wheel-landed.png" });

// Reset
await page.evaluate(async () => {
  const { writeState } = await import("/bachelor-imperium-iv/js/state.js");
  await writeState({ projectorMode: "scoreboard", currentCard: null });
});

await browser.close();
console.log("Done");
