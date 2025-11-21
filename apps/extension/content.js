// TOKEN COP 3.2 — LOCAL FORK BUS
// No ?prompt, no execCommand, no BroadcastChannel, no window.name.
// Just localStorage + aggressive input hunting + raw swagger.

(() => {
  "use strict";

  // ---------- STATE ----------

  let PARODY_MODE = true;
  try {
    PARODY_MODE = localStorage.getItem("tcParody") !== "false";
  } catch (e) {
    PARODY_MODE = true;
  }

  let isReaping = false;
  const TC_TAB_ID =
    "tc_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8);

  const FORK_KEY = "tcForkPayload_v1";
  let forkAdopted = false;

  const GROK_ROOT = location.origin;

  const P = {
    fork: "FORKING REALITY — STAND BY",
    reaping: "REAPING YOUR CONTEXT, SIR",
    reaped: "Token Cop is impressed. Carry on.",
    death: "Step out of the context. Cold burgers again.",
    red: "License and registration.",
    yellow: "Slow it down, partner.",
    safe: "You're good to go, citizen."
  };

  // ---------- HOTKEYS ----------

  document.addEventListener("keydown", e => {
    if (!e.ctrlKey || !e.shiftKey) return;
    const key = (e.key || "").toUpperCase();

    if (key === "P") {
      PARODY_MODE = !PARODY_MODE;
      try {
        localStorage.setItem("tcParody", PARODY_MODE);
      } catch (err) {}
      location.reload();
    }
  });

  // ---------- SAFE TEXT ----------

  function tcSafeText(node) {
    try {
      if (!node) return "";
      const v = node.innerText;
      if (typeof v === "string") return v;
      if (typeof node.textContent === "string") return node.textContent;
      return "";
    } catch (e) {
      return "";
    }
  }

  // ---------- MESSAGE HARVEST ----------

  function getAllMessages() {
    try {
      let h = 0;
      for (let i = 0; i < 20; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        const nh = document.body.scrollHeight;
        if (nh === h) break;
        h = nh;
      }
      window.scrollTo(0, 0);
    } catch (e) {}

    const msgs = [];
    try {
      document
        .querySelectorAll(
          '[class*="message"], article, [data-testid*="message"], [class*="turn"]'
        )
        .forEach(el => {
          const text = tcSafeText(el).trim();
          if (!text || text.length < 20) return;
          const isUser =
            /you:|human|^You/i.test(text) ||
            !!el.querySelector('img[alt="You"]');
          msgs.push({ role: isUser ? "user" : "assistant", content: text });
        });
    } catch (e) {
      console.warn("Token Cop: getAllMessages failed", e);
    }
    return msgs;
  }

  function getMessagesUpToElement(targetEl) {
    const msgs = [];
    try {
      const nodes = document.querySelectorAll(
        '[class*="message"], article, [data-testid*="message"], [class*="turn"]'
      );
      for (const el of nodes) {
        const text = tcSafeText(el).trim();
        if (text && text.length >= 20) {
          const isUser =
            /you:|human|^You/i.test(text) ||
            !!el.querySelector('img[alt="You"]');
          msgs.push({ role: isUser ? "user" : "assistant", content: text });
        }
        if (el === targetEl) break;
      }
    } catch (e) {
      console.warn("Token Cop: getMessagesUpToElement failed", e);
    }
    return msgs;
  }

  const est = t => Math.ceil(((t || "").length) / 3.77) + 8;

  // ---------- BADGE ----------

  let badge = document.createElement("div");
  badge.innerHTML = PARODY_MODE
    ? `🚔 TOKEN COP 🚔 <span id="tc-tokens">0</span>/128k`
    : `TOKEN COP · <span id="tc-tokens">0</span>/128k · <span id="tc-pct">0%</span>`;
  badge.style.cssText =
    "position:fixed;bottom:24px;right:24px;padding:20px 44px;background:#000;color:#0f0;font:bold 21px 'Courier New';border:6px solid #0f0;border-radius:60px;box-shadow:0 0 60px #0f0;z-index:999999999;animation:p 1.4s infinite;transition:all .5s;user-select:none;";
  document.body.appendChild(badge);

  try {
    document.head.insertAdjacentHTML(
      "beforeend",
      "<style>@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}} .tc-fork{pointer-events:auto}</style>"
    );
  } catch (e) {}

  // ---------- INPUT HUNTER (SHADOW-DOM AWARE) ----------

  function findInputElement() {
    const selectors = [
      "textarea",
      "input[type='text']",
      "input[type='search']",
      "input:not([type])",
      "[role='textbox']",
      "div[contenteditable='true']"
    ];

    function search(root) {
      if (!root) return null;

      for (const sel of selectors) {
        try {
          const el = root.querySelector(sel);
          if (el) return el;
        } catch (e) {}
      }

      let all;
      try {
        all = root.querySelectorAll("*");
      } catch (e) {
        return null;
      }

      for (const node of all) {
        try {
          if (node.shadowRoot) {
            const inner = search(node.shadowRoot);
            if (inner) return inner;
          }
        } catch (e) {
          // ignore
        }
      }

      return null;
    }

    return search(document);
  }

  function injectPromptIntoInput(prompt) {
    const el = findInputElement();
    if (!el) return false;

    const text = String(prompt || "");

    try {
      if ("value" in el) {
        el.value = text;
      } else {
        el.textContent = text;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.focus();
      return true;
    } catch (e) {
      console.warn("Token Cop: injectPromptIntoInput failed", e);
      return false;
    }
  }

  // ---------- LOCAL FORK BUS ----------

  function spawnFork(prompt, mode) {
    const payload = {
      id:
        "fork_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),
      from: TC_TAB_ID,
      mode: mode || "fork",
      prompt: String(prompt || ""),
      ts: Date.now()
    };

    try {
      localStorage.setItem(FORK_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Token Cop: localStorage fork write failed", e);
    }

    // nice-to-have clipboard backup
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload.prompt).catch(() => {});
      }
    } catch (e) {}

    let tab = null;
    try {
      tab = window.open(GROK_ROOT, "_blank");
    } catch (e) {
      tab = null;
    }

    if (!tab) {
      badge.innerHTML =
        "POPUP BLOCKED — FORK PROMPT COPIED. ALLOW POPUPS FOR GROK.";
      badge.style.borderColor = "#f00";
      badge.style.color = "#f00";
      return;
    }

    badge.innerHTML = PARODY_MODE
      ? `🚔 ${P.fork} 🚔`
      : "FORKING REALITY...";
    badge.style.borderColor = "#ff0";
  }

  function tryAdoptFork() {
    if (forkAdopted) return;

    let raw = null;
    try {
      raw = localStorage.getItem(FORK_KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.warn("Token Cop: fork payload parse failed", e);
      try {
        localStorage.removeItem(FORK_KEY);
      } catch (_) {}
      return;
    }

    if (!payload || !payload.prompt) {
      try {
        localStorage.removeItem(FORK_KEY);
      } catch (_) {}
      return;
    }

    // Don't adopt our own fork in the origin tab.
    if (payload.from === TC_TAB_ID) return;

    const ok = injectPromptIntoInput(payload.prompt);
    if (!ok) return; // wait until the UI actually mounts

    forkAdopted = true;
    try {
      localStorage.removeItem(FORK_KEY);
    } catch (_) {}

    if (badge) {
      if (payload.mode === "reap") {
        badge.innerHTML = PARODY_MODE
          ? `🚔 ${P.reaped} 🚔`
          : "∞ INFINITE CONTEXT UNLOCKED ∞";
      } else {
        badge.innerHTML = PARODY_MODE
          ? "FORK SUCCESSFUL. NEW UNIVERSE ACTIVE 🚔🪐"
          : "FORKED REALITY CREATED — EDIT & SEND.";
      }
      badge.style.borderColor = "#0f0";
      badge.style.color = "#0f0";
      badge.style.boxShadow = "0 0 80px lime";
    }
  }

  // ---------- FULL-CHAIN FORK BUTTONS ----------

  function injectForkButtons() {
    let nodes;
    try {
      nodes = document.querySelectorAll(
        '[class*="message"], article, [data-testid*="message"], [class*="turn"]'
      );
    } catch (e) {
      return;
    }

    nodes.forEach((el, i) => {
      try {
        if (el.querySelector(".tc-fork")) return;

        const btn = document.createElement("div");
        btn.className = "tc-fork";
        btn.innerHTML = "↔";
        btn.title = "Fork from here — spawn parallel universe";
        btn.style.cssText =
          "position:absolute;top:12px;right:16px;font-size:26px;cursor:pointer;opacity:0;transition:opacity .25s;z-index:99999;filter:drop-shadow(0 0 8px lime);";

        const cs = getComputedStyle(el);
        if (!cs.position || cs.position === "static") {
          el.style.position = "relative";
        }
        el.appendChild(btn);

        el.addEventListener("mouseenter", () => {
          btn.style.opacity = "1";
        });
        el.addEventListener("mouseleave", () => {
          btn.style.opacity = "0";
        });

        btn.addEventListener("click", e => {
          e.stopPropagation();

          badge.innerHTML = PARODY_MODE
            ? `🚔 ${P.fork} 🚔`
            : "FORKING REALITY...";
          badge.style.borderColor = "#ff0";

          let history = getMessagesUpToElement(el);

          if (!history.length) {
            const text = tcSafeText(el).trim();
            if (text) history.push({ role: "user", content: text });
          }

          if (!history.length) {
            history.push({
              role: "system",
              content:
                "Token Cop fork created with no captured context. Continue as a fresh parallel universe."
            });
          }

          const prompt =
            history
              .map(m => `${m.role.toUpperCase()}:\n${m.content}`)
              .join("\n\n") +
            "\n\n(Continued from Token Cop Full-Chain Fork — parallel universe active 🚔↔️)";

          spawnFork(prompt, "fork");
        });
      } catch (e) {}
    });
  }

  // ---------- AUTO-REAP ----------

  function autoReap() {
    if (isReaping) return;
    isReaping = true;

    badge.innerHTML = PARODY_MODE ? `🚔 ${P.reaping} 🚔` : "REAPING...";
    badge.style.borderColor = "#00f";
    badge.style.color = "#00f";

    const messages = getAllMessages();
    const text = messages.map(m => m.content).join("\n\n");

    const prompt =
      "Summarize this entire conversation in under 800 words. Keep facts, decisions, tone, inside jokes. Output ONLY the summary:" +
      "\n\n" +
      text +
      "\n\n(Continued by Token Cop — infinite mode active 🚔)";

    spawnFork(prompt, "reap");

    setTimeout(() => {
      if (!forkAdopted) {
        badge.innerHTML = PARODY_MODE
          ? `🚔 ${P.reaped} 🚔`
          : "∞ INFINITE CONTEXT REQUESTED ∞";
        badge.style.borderColor = "#0f0";
        badge.style.color = "#0f0";
        badge.style.boxShadow = "0 0 80px lime";
      }
      isReaping = false;
    }, 5000);
  }

  // ---------- MAIN LOOP ----------

  setInterval(() => {
    injectForkButtons();
    tryAdoptFork();

    const messages = getAllMessages();
    if (!messages.length) return;

    let total = 3;
    messages.forEach(m => {
      total +=
        est(m.role) +
        est(m.content) +
        3 +
        (m.role === "user" ? 2 : 0);
    });

    const pct = Math.min(99.9, total / 1280);

    const tokNode = document.getElementById("tc-tokens");
    if (tokNode) tokNode.textContent = Math.round(total).toLocaleString();

    if (!PARODY_MODE) {
      const pctNode = document.getElementById("tc-pct");
      if (pctNode) pctNode.textContent = pct.toFixed(1) + "%";
    }

    if (pct >= 97 && !isReaping) autoReap();

    if (PARODY_MODE) {
      if (pct >= 98) badge.innerHTML = `🚨 ${P.death} 🚨`;
      else if (pct >= 90) badge.innerHTML = `🚓 ${P.red}`;
      else if (pct >= 80) badge.innerHTML = `🚔 ${P.yellow}`;
      else
        badge.innerHTML = `🚔 ${P.safe} · <span id="tc-tokens">${Math.round(
          total
        ).toLocaleString()}</span>/128k`;
    } else {
      if (pct >= 98) {
        badge.innerHTML = "☠️ CONTEXT DEATH IMMINENT ☠️";
        badge.style.borderColor = "#f00";
        badge.style.color = "#f00";
        badge.style.boxShadow = "0 0 60px red";
      } else if (pct >= 90) {
        badge.style.borderColor = "#f00";
      } else if (pct >= 80) {
        badge.style.borderColor = "#ff0";
      } else {
        badge.style.borderColor = "#0f0";
        badge.style.color = "#0f0";
      }
    }
  }, 2500);

  console.log(
    "%cTOKEN COP 3.2 — Local Fork Bus online. Shadow DOM can't hide.",
    "color:lime;font-size:18px;font-weight:bold"
  );
})();
