// =====================================================================
// FIREBASE CONFIG — paste your Realtime Database project values here.
// Get these from https://console.firebase.google.com/ → Project settings →
// "Your apps" → Web app → SDK setup config.
// =====================================================================

window.FIREBASE_CONFIG = {
  apiKey:       "REPLACE_ME",
  authDomain:   "REPLACE_ME.firebaseapp.com",
  databaseURL:  "https://REPLACE_ME-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:    "REPLACE_ME",
};

// Warning banner if config still has REPLACE_ME values.
(function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const looksUnset = Object.values(cfg).some((v) => String(v).includes("REPLACE_ME"));
  if (!looksUnset) return;

  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: #b91c1c; color: white;
      padding: 16px 24px; font-family: system-ui, sans-serif;
      font-size: 15px; line-height: 1.5; text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,.4);
    `;
    banner.innerHTML = `
      <strong style="font-size:17px">⚠ Firebase not configured</strong><br>
      Edit <code>firebase-config.js</code> and replace the <code>REPLACE_ME</code>
      values with your project's keys from
      <a href="https://console.firebase.google.com/" target="_blank" style="color:#fde047;">Firebase Console</a>.
      See <code>README.md</code> §1 for the 5-step walkthrough.
    `;
    document.body.appendChild(banner);
  });
})();
