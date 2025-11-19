// apps/extension/content.js
// Real tokenizer + live accurate counting + skull when close to death

console.log("TOKEN COP V2 – Real tokenizer activated");

// Load tiktoken-wasm (100% offline)
import { Tiktoken } from "@dqbd/tiktoken";
import { getEncoding } from "@dqbd/tiktoken/encoders";

let encoder = null;
async function getEncoder() {
  if (encoder) return encoder;
  const enc = getEncoding("cl100k_base");
  encoder = new Tiktoken(enc.bpe_ranks, enc.special_tokens, enc.pat_str);
  return encoder;
}

// Scrape Grok messages
function scrapeMessages() {
  const messages = [];
  document.querySelectorAll('div[data-testid^="message-"]').forEach(el => {
    const isUser = el.textContent.includes("You:") || el.closest('[class*="user"]');
    const text = el.textContent || "";
    if (text.trim()) messages.push({ role: isUser ? "user" : "assistant", content: text });
  });
  return messages;
}

// Badge
const badge = document.createElement("div");
badge.innerHTML = `TOKEN COP · <span id="tokens">0</span>/128k · <span id="percent">0%</span>`;
badge.style.cssText = `position:fixed;bottom:20px;right:20px;padding:15px 30px;background:#000;color:#0f0;font-family:Courier New;font-weight:bold;font-size:18px;border:5px solid #0f0;border-radius:50px;box-shadow:0 0 30px #0f0;z-index:999999;animation:pulse 2s infinite;`;
document.body.appendChild(badge);

const style = document.createElement("style");
style.innerHTML = `@keyframes pulse {0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}`;
document.head.appendChild(style);

// Update loop
setInterval(async () => {
  const messages = scrapeMessages();
  if (messages.length === 0) return;

  const enc = await getEncoder();
  let tokens = 0;
  for (const m of messages) {
    tokens += 3 + enc.encode(m.role).length + enc.encode(m.content).length + (m.role !== "assistant" ? 2 : 0);
  }
  tokens += 3;

  const percent = (tokens / 128000) * 100;

  document.getElementById("tokens").textContent = tokens.toLocaleString();
  document.getElementById("percent").textContent = percent.toFixed(1) + "%";

  // Color + skull
  if (percent >= 98) {
    badge.style.borderColor = badge.style.color = "#f00";
    badge.style.boxShadow = "0 0 40px red";
    badge.innerHTML = "☠️ TOKEN COP · DEATH IMMINENT ☠️";
  } else if (percent >= 90) badge.style.borderColor = "#f00";
  else if (percent >= 80) badge.style.borderColor = "#ff0";
}, 2000);