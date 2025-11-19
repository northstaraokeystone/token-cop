// content.js – TOKEN COP FINAL: Pure JS + ZERO-CLICK AUTO-REAP + HIGHWAY PATROL PARODY MODE
console.log("TOKEN COP – Pure JS estimation + AUTO-REAP + PARODY MODE ACTIVE");

// HIGHWAY PATROL PARODY MODE – toggle with Ctrl+Shift+P or set true for default
let PARODY_MODE = true;  // Set to true for instant chaos, or toggle live with Ctrl+Shift+P

const parody = {
  safe: "You're good to go, citizen. Have a nice day.",
  yellow: "Slow it down there, partner.",
  red: "License and registration.",
  death: "Step out of the context, sir. You've been eating cold burgers again, haven't you?",
  reaping: "REAPING YOUR CONTEXT, SIR",
  reaped: "Token Cop is impressed. Carry on."
};

// Secret toggle: Ctrl+Shift+P
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "P") {
    PARODY_MODE = !PARODY_MODE;
    location.reload();
  }
});

function scrapeMessages() {
  const messages = [];

  // Force-load all old messages with rapid sync scrolling
  let lastHeight = 0;
  let attempts = 0;
  while (attempts < 20) {
    window.scrollTo(0, document.body.scrollHeight);
    const current = document.body.scrollHeight;
    if (current === lastHeight) break;
    lastHeight = current;
    attempts++;
    const start = Date.now();
    while (Date.now() - start < 200) {}
  }
  window.scrollTo(0, 0);

  const selectors = [
    'div[class*="message"]', 'article', 'div[data-testid*="message"]',
    'div[class*="turn"]', 'div[class*="chat-message"]', 'main div > div > div'
  ];

  let elements = [];
  for (const sel of selectors) {
    elements = document.querySelectorAll(sel);
    if (elements.length > 2) break;
  }

  elements.forEach(el => {
    const text = (el.innerText || el.textContent || "").trim();
    if (text.length < 20) return;

    const isUser = text.includes("You:") || 
                   el.innerText.startsWith("You") || 
                   el.querySelector('img[alt="You"]') ||
                   /you|human|user/i.test(text.slice(0, 30));

    messages.push({ role: isUser ? "user" : "assistant", content: text });
  });

  console.log(`TOKEN COP – Found ${messages.length} messages (full history)`);
  return messages;
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.round((text.length / 3.8) + (text.split(/\s+/).length * 0.05)) + 5;
}

// Badge
const badge = document.createElement("div");
if (PARODY_MODE) {
  badge.innerHTML = `🚔 TOKEN COP 🚔 · <span id="tokens">0</span>/128k`;
  badge.style.fontSize = "20px";
  badge.style.padding = "18px 40px";
} else {
  badge.innerHTML = `TOKEN COP · <span id="tokens">0</span>/128k · <span id="percent">0%</span>`;
}
badge.style.cssText = `position:fixed;bottom:20px;right:20px;padding:15px 30px;background:#000;color:#0f0;font-family:"Courier New",monospace;font-weight:bold;font-size:18px;border:5px solid #0f0;border-radius:50px;box-shadow:0 0 40px #0f0;z-index:999999;animation:pulse 1.5s infinite;transition:all 0.4s;`;
document.body.appendChild(badge);

document.head.insertAdjacentHTML("beforeend", `<style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>`);

// AUTO-REAP ENGINE
let isReaping = false;
function autoReap() {
  if (isReaping) return;
  isReaping = true;

  badge.innerHTML = PARODY_MODE ? `🚔 ${parody.reaping} 🚔` : "REAPING CONTEXT...";
  badge.style.borderColor = "#00f";
  badge.style.color = "#00f";
  badge.style.boxShadow = "0 0 50px blue";

  const messages = scrapeMessages();
  const conversationText = messages.map(m => m.content).join("\n\n");

  const summaryPrompt = `Summarize this entire conversation in under 800 words. Keep all key facts, decisions, tone, and inside jokes. Make it feel natural to continue from. Output ONLY the summary:`;

  const fullPrompt = summaryPrompt + "\n\n" + conversationText + "\n\n(Continued automatically by Token Cop – infinite context mode 🚔)";

  const newTab = window.open("https://grok.x.ai", "_blank");
  if (newTab) {
    const check = setInterval(() => {
      const textarea = newTab.document.querySelector('textarea');
      if (textarea) {
        textarea.value = fullPrompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
        clearInterval(check);
      }
    }, 300);
  }

  setTimeout(() => {
    badge.innerHTML = PARODY_MODE ? `🚔 ${parody.reaped} 🚔` : "∞ INFINITE CONTEXT UNLOCKED ∞";
    badge.style.borderColor = "#0f0";
    badge.style.color = "#0f0";
    badge.style.boxShadow = "0 0 80px lime";
    isReaping = false;
  }, 5000);
}

// Update loop
setInterval(() => {
  const messages = scrapeMessages();
  if (messages.length === 0) return;

  let totalTokens = 3;
  for (const m of messages) {
    totalTokens += estimateTokens(m.content) + estimateTokens(m.role) + 3 + (m.role === "user" ? 2 : 0);
  }

  const percent = Math.min(99.9, (totalTokens / 128000) * 100);

  document.getElementById("tokens").textContent = Math.round(totalTokens).toLocaleString();
  if (!PARODY_MODE) document.getElementById("percent").textContent = percent.toFixed(1) + "%";

  if (percent >= 97 && !isReaping) {
    autoReap();
  } else if (PARODY_MODE) {
    if (percent >= 98) {
      badge.innerHTML = `🚨 ${parody.death} 🚨`;
      badge.style.borderColor = badge.style.color = "#f00";
      badge.style.boxShadow = "0 0 60px red";
    } else if (percent >= 90) {
      badge.innerHTML = `🚓 ${parody.red}`;
      badge.style.borderColor = "#f00";
    } else if (percent >= 80) {
      badge.innerHTML = `🚔 ${parody.yellow}`;
      badge.style.borderColor = "#ff0";
      badge.style.color = "#ff0";
    } else {
      badge.innerHTML = `🚔 ${parody.safe} · <span id="tokens">${Math.round(totalTokens).toLocaleString()}</span>/128k`;
      badge.style.borderColor = badge.style.color = "#0f0";
    }
  } else {
    if (percent >= 98) {
      badge.innerHTML = "☠️ CONTEXT DEATH IMMINENT ☠️";
      badge.style.borderColor = badge.style.color = "#f00";
      badge.style.boxShadow = "0 0 60px red";
    } else if (percent >= 90) {
      badge.style.borderColor = "#f00";
    } else if (percent >= 80) {
      badge.style.borderColor = "#ff0";
    }
  }
}, 2500);

console.log("TOKEN COP – Production ready with Parody Mode (Ctrl+Shift+P to toggle)");