// TOKEN COP 4.0 — Local Fork Bus / TruthRun Shadow Ledger / Context Proof

(() => {
  "use strict";

  const VERSION = "4.0";
  const TOKEN_LIMIT = 128_000;
  const AUTO_REAP_COOLDOWN = 30_000;

  const PARODY_STORAGE_KEY = "tcParody";
  const FORK_STORAGE_KEY = "tcForkPayload_v1";
  const LEDGER_STORAGE_KEY = "tcTruthRunLedger";

  const MESSAGE_SELECTOR =
    'article,[data-testid*="message"],[class*="message"],[class*="turn"]';

  const INPUT_SELECTORS = [
    "textarea",
    'input[type="text"]',
    'input[type="search"]',
    "input:not([type])",
    '[role="textbox"]',
    'div[contenteditable="true"]'
  ];

  const GROK_ROOT = location.origin;
  const TAB_ID =
    "tc_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8);

  const P = {
    fork: "FORKING REALITY — STAND BY",
    reaping: "REAPING YOUR CONTEXT, SIR",
    reaped: "Token Cop is impressed. Carry on.",
    death: "Step out of the context. Cold burgers again.",
    red: "License and registration.",
    yellow: "Slow it down, partner.",
    safe: "You're good to go, citizen."
  };

  let parodyMode = true;
  try {
    parodyMode = localStorage.getItem(PARODY_STORAGE_KEY) !== "false";
  } catch (_) {}

  let isReaping = false;
  let forkAdopted = false;
  let badge = null;
  let inputCache = null;

  let ledgerCache = null;
  let lastTokenEstimate = 0;
  let lastPctEstimate = 0;
  let sweepScheduled = false;
  let lastAutoReapAt = 0;

  const safeText = node => {
    try {
      if (!node) return "";
      const t =
        typeof node.innerText === "string" ? node.innerText : node.textContent;
      return typeof t === "string" ? t : "";
    } catch (_) {
      return "";
    }
  };

  const estTokens = t => {
    if (!t) return 0;
    const len = t.length || 0;
    return len ? Math.ceil(len / 3.77) + 8 : 0;
  };

  const safeGet = key => {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const safeSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  };

  const safeRemove = key => {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  };

  const parseJSON = raw => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };

  const newId = prefix => {
    try {
      if (self.crypto && crypto.randomUUID) {
        return prefix + crypto.randomUUID();
      }
    } catch (_) {}
    return (
      prefix +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36)
    );
  };

  const defaultBadgeHTML = () =>
    parodyMode
      ? `🚔 TOKEN COP 🚔 <span id="tc-tokens">${lastTokenEstimate.toLocaleString()}</span>/128k`
      : `TOKEN COP · <span id="tc-tokens">${lastTokenEstimate.toLocaleString()}</span>/128k · <span id="tc-pct">${lastPctEstimate.toFixed(
          1
        )}%</span>`;

  const ensureBadge = () => {
    if (badge && document.body.contains(badge)) return badge;

    badge = document.createElement("div");
    badge.innerHTML = defaultBadgeHTML();
    badge.style.cssText =
      "position:fixed;bottom:24px;right:24px;padding:20px 44px;background:#000;color:#0f0;font:bold 21px 'Courier New',monospace;border:6px solid #0f0;border-radius:60px;box-shadow:0 0 60px #0f0;z-index:2147483647;animation:tc-pulse 1.4s infinite;transition:all .5s;user-select:none;pointer-events:none;";
    document.body.appendChild(badge);

    try {
      if (!document.getElementById("tc-style")) {
        const style = document.createElement("style");
        style.id = "tc-style";
        style.textContent =
          "@keyframes tc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}}.tc-fork{pointer-events:auto}";
        document.head.appendChild(style);
      }
    } catch (_) {}

    return badge;
  };

  const paintBadge = (label, borderColor, textColor, boxShadow) => {
    const b = ensureBadge();
    if (label) b.innerHTML = label;
    if (borderColor) b.style.borderColor = borderColor;
    if (textColor) b.style.color = textColor;
    if (boxShadow) b.style.boxShadow = boxShadow;
  };

  const getLedger = () => {
    if (ledgerCache) return ledgerCache;
    const raw = safeGet(LEDGER_STORAGE_KEY) || "[]";
    const parsed = parseJSON(raw);
    ledgerCache = Array.isArray(parsed) ? parsed : [];
    return ledgerCache;
  };

  const saveLedger = () => {
    const ledger = ledgerCache || [];
    try {
      safeSet(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    } catch (e) {
      console.warn("Token Cop: Ledger full — pruning", e);
      ledgerCache = ledger.slice(-50);
      try {
        safeSet(LEDGER_STORAGE_KEY, JSON.stringify(ledgerCache));
      } catch (_) {}
    }
  };

  const hashData = async data => {
    try {
      if (!(self.crypto && crypto.subtle)) return null;
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (_) {
      return null;
    }
  };

  const addLedgerEntry = async (type, data) => {
    const ledger = getLedger();

    const base = {
      id: newId("ledger_"),
      ts: Date.now(),
      type,
      data
    };

    const prev = ledger.length ? ledger[ledger.length - 1].hash || null : null;
    const hash = await hashData({ ...base, prev });
    const entry = { ...base, prev, hash };

    ledger.push(entry);
    ledgerCache = ledger;
    saveLedger();

    const b = ensureBadge();
    const revertHTML = defaultBadgeHTML();
    b.innerHTML = "LEDGER ENTRY LOCKED 🧠";
    b.style.borderColor = "#0ff";

    setTimeout(() => {
      b.innerHTML = revertHTML;
      b.style.borderColor = "#0f0";
      b.style.color = "#0f0";
      b.style.boxShadow = "0 0 60px #0f0";
    }, 3000);

    try {
      document.documentElement.dataset.tcLedgerHead = (hash || "").slice(0, 16);
    } catch (_) {}

    return entry;
  };

  const verifyLedger = async () => {
    const ledger = getLedger();
    let prev = null;
    for (let i = 0; i < ledger.length; i++) {
      const { id, ts, type, data, hash, prev: recordedPrev } = ledger[i];
      if (recordedPrev !== prev) return false;
      const expected = await hashData({ id, ts, type, data, prev });
      if (hash !== expected) return false;
      prev = hash;
    }
    return true;
  };

  const findInputElement = () => {
    if (inputCache && document.contains(inputCache)) return inputCache;

    const search = root => {
      if (!root) return null;

      for (let i = 0; i < INPUT_SELECTORS.length; i++) {
        try {
          const el = root.querySelector(INPUT_SELECTORS[i]);
          if (el) return el;
        } catch (_) {}
      }

      let all;
      try {
        all = root.querySelectorAll("*");
      } catch (_) {
        return null;
      }

      for (let i = 0; i < all.length; i++) {
        const node = all[i];
        if (!node) continue;
        try {
          if (node.shadowRoot) {
            const inner = search(node.shadowRoot);
            if (inner) return inner;
          }
        } catch (_) {}
      }

      return null;
    };

    const found = search(document);
    if (found) inputCache = found;
    return found;
  };

  const injectPromptIntoInput = prompt => {
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
  };

  const harvestMessages = (opts = {}) => {
    const { upToElement = null, scrollAll = false } = opts;

    if (scrollAll) {
      try {
        let lastHeight = 0;
        for (let i = 0; i < 24; i++) {
          window.scrollTo(0, document.body.scrollHeight);
          const h = document.body.scrollHeight || 0;
          if (!h || h === lastHeight) break;
          lastHeight = h;
        }
        window.scrollTo(0, 0);
      } catch (_) {}
    }

    let nodes;
    try {
      nodes = document.querySelectorAll(MESSAGE_SELECTOR);
    } catch (e) {
      console.warn("Token Cop: message query failed", e);
      nodes = [];
    }

    const messages = [];
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const text = safeText(el).trim();
      if (text && text.length >= 20) {
        const isUser =
          /you:|human|^you/i.test(text) ||
          !!(el.querySelector && el.querySelector('img[alt="You"]'));
        messages.push({
          role: isUser ? "user" : "assistant",
          content: text,
          el
        });
      }
      if (upToElement && el === upToElement) break;
    }

    if (!messages.length) {
      const pageText = safeText(document.body).trim();
      if (pageText) {
        messages.push({ role: "system", content: pageText });
      }
    }

    return messages;
  };

  const readForkPayload = () => {
    let raw = safeGet(FORK_STORAGE_KEY);

    if (!raw) {
      const altKey = `${FORK_STORAGE_KEY}:${GROK_ROOT}`;
      raw = safeGet(altKey) || null;
      if (!raw) {
        try {
          raw = sessionStorage.getItem(FORK_STORAGE_KEY) || null;
        } catch (_) {}
        if (!raw) {
          try {
            raw = document.documentElement.dataset.tcFork || null;
          } catch (_) {
            raw = null;
          }
        }
      }
    }

    const payload = parseJSON(raw);
    if (!payload || !payload.prompt) return null;
    return payload;
  };

  const persistForkPayload = payload => {
    const json = JSON.stringify(payload);
    safeSet(FORK_STORAGE_KEY, json);
    safeSet(`${FORK_STORAGE_KEY}:${GROK_ROOT}`, json);
    try {
      sessionStorage.setItem(FORK_STORAGE_KEY, json);
    } catch (_) {}
    try {
      document.documentElement.dataset.tcFork = json;
    } catch (_) {}
  };

  const clearForkPayload = () => {
    safeRemove(FORK_STORAGE_KEY);
    safeRemove(`${FORK_STORAGE_KEY}:${GROK_ROOT}`);
    try {
      sessionStorage.removeItem(FORK_STORAGE_KEY);
    } catch (_) {}
    try {
      delete document.documentElement.dataset.tcFork;
    } catch (_) {}
  };

  const spawnFork = (prompt, mode) => {
    const payload = {
      id: newId("fork_"),
      from: TAB_ID,
      mode: mode || "fork",
      prompt: String(prompt || ""),
      ts: Date.now()
    };

    persistForkPayload(payload);

    void addLedgerEntry(mode === "reap" ? "reap" : mode || "fork", {
      id: payload.id,
      from: payload.from,
      mode: payload.mode,
      ts: payload.ts,
      preview: payload.prompt.slice(0, 4000)
    });

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload.prompt).catch(() => {});
      }
    } catch (_) {}

    const url = `${GROK_ROOT}#tcFork=${payload.id}`;
    let tab = null;

    try {
      tab = window.open(url, "_blank", "noopener");
    } catch (_) {}

    if (!tab) {
      setTimeout(() => {
        try {
          location.href = url;
        } catch (_) {}
      }, 50);

      paintBadge(
        "POPUP BLOCKED — FORK PROMPT COPIED.",
        "#f00",
        "#f00",
        "0 0 60px red"
      );
      return;
    }

    paintBadge(
      parodyMode ? `🚔 ${P.fork} 🚔` : "FORKING REALITY...",
      "#ff0",
      undefined
    );
  };

  const tryAdoptFork = () => {
    if (forkAdopted) return;

    const payload = readForkPayload();
    if (!payload || !payload.prompt) return;
    if (payload.from === TAB_ID) return;

    const ok = injectPromptIntoInput(payload.prompt);
    if (!ok) return;

    forkAdopted = true;
    clearForkPayload();

    void addLedgerEntry("fork:adopt", {
      id: payload.id,
      from: payload.from,
      mode: payload.mode,
      ts: payload.ts,
      tab: TAB_ID
    });

    const b = ensureBadge();
    if (payload.mode === "reap") {
      b.innerHTML = parodyMode
        ? `🚔 ${P.reaped} 🚔`
        : "∞ INFINITE CONTEXT UNLOCKED ∞";
    } else {
      b.innerHTML = parodyMode
        ? "FORK SUCCESSFUL. NEW UNIVERSE ACTIVE 🚔🪐"
        : "FORKED REALITY CREATED — EDIT & SEND.";
    }
    b.style.borderColor = "#0f0";
    b.style.color = "#0f0";
    b.style.boxShadow = "0 0 80px lime";
  };

  const forkedNodes = new WeakSet();

  const attachForkButtons = () => {
    let nodes;
    try {
      nodes = document.querySelectorAll(MESSAGE_SELECTOR);
    } catch (_) {
      return;
    }

    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (forkedNodes.has(el)) continue;

      try {
        const btn = document.createElement("div");
        btn.className = "tc-fork";
        btn.textContent = "↔";
        btn.title = "Fork from here — spawn parallel universe";
        btn.style.cssText =
          "position:absolute;top:12px;right:16px;font-size:26px;cursor:pointer;opacity:0;transition:opacity .25s;z-index:2147483647;filter:drop-shadow(0 0 8px lime);";

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

        btn.addEventListener("click", ev => {
          ev.stopPropagation();

          paintBadge(
            parodyMode ? `🚔 ${P.fork} 🚔` : "FORKING REALITY...",
            "#ff0"
          );

          const history = harvestMessages({ upToElement: el });
          const msgs =
            history.length > 0
              ? history
              : (() => {
                  const text = safeText(el).trim();
                  if (text) {
                    return [{ role: "user", content: text }];
                  }
                  return [
                    {
                      role: "system",
                      content:
                        "Token Cop fork created with no captured context. Continue as a fresh parallel universe."
                    }
                  ];
                })();

          const prompt =
            msgs
              .map(m => `${m.role.toUpperCase()}:\n${m.content}`)
              .join("\n\n") +
            "\n\n(Continued from Token Cop Full-Chain Fork — parallel universe active 🚔↔️)";

          spawnFork(prompt, "fork");
        });

        forkedNodes.add(el);
      } catch (_) {}
    }
  };

  const autoReap = () => {
    const now = Date.now();
    if (isReaping || now - lastAutoReapAt < AUTO_REAP_COOLDOWN) return;

    isReaping = true;
    lastAutoReapAt = now;

    paintBadge(
      parodyMode ? `🚔 ${P.reaping} 🚔` : "REAPING...",
      "#00f",
      "#00f"
    );

    const messages = harvestMessages({ scrollAll: true });
    const text = messages.map(m => m.content).join("\n\n");

    const summaryPrompt =
      "Summarize this entire conversation in under 800 words. Keep facts, decisions, tone, and inside jokes. Output ONLY the summary:" +
      "\n\n" +
      text +
      "\n\n(Continued by Token Cop — infinite mode active 🚔)";

    spawnFork(summaryPrompt, "reap");

    setTimeout(() => {
      if (!forkAdopted) {
        paintBadge(
          parodyMode ? `🚔 ${P.reaped} 🚔` : "∞ INFINITE CONTEXT REQUESTED ∞",
          "#0f0",
          "#0f0",
          "0 0 80px lime"
        );
      }
      isReaping = false;
    }, 5000);
  };

  const runContextSweep = () => {
    const messages = harvestMessages();
    if (!messages.length) return;

    let totalTokens = 3;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      totalTokens +=
        estTokens(m.role) +
        estTokens(m.content) +
        3 +
        (m.role === "user" ? 2 : 0);
    }

    lastTokenEstimate = totalTokens;
    let pct = (totalTokens / TOKEN_LIMIT) * 100;
    if (!Number.isFinite(pct)) pct = 0;
    lastPctEstimate = Math.min(99.9, pct);

    const b = ensureBadge();

    const tokNode = b.querySelector("#tc-tokens");
    if (tokNode) {
      tokNode.textContent = Math.round(totalTokens).toLocaleString();
    }

    if (!parodyMode) {
      const pctNode = b.querySelector("#tc-pct");
      if (pctNode) {
        pctNode.textContent = `${lastPctEstimate.toFixed(1)}%`;
      }
    }

    if (lastPctEstimate >= 97 && !isReaping) {
      autoReap();
    }

    if (parodyMode) {
      if (lastPctEstimate >= 98) {
        b.innerHTML = `🚨 ${P.death} 🚨`;
      } else if (lastPctEstimate >= 90) {
        b.innerHTML = `🚓 ${P.red}`;
      } else if (lastPctEstimate >= 80) {
        b.innerHTML = `🚔 ${P.yellow}`;
      } else {
        b.innerHTML = `🚔 ${P.safe} · <span id="tc-tokens">${Math.round(
          totalTokens
        ).toLocaleString()}</span>/128k`;
      }
    } else {
      if (lastPctEstimate >= 98) {
        b.innerHTML = "☠️ CONTEXT DEATH IMMINENT ☠️";
        b.style.borderColor = "#f00";
        b.style.color = "#f00";
        b.style.boxShadow = "0 0 60px red";
      } else if (lastPctEstimate >= 90) {
        b.style.borderColor = "#f00";
      } else if (lastPctEstimate >= 80) {
        b.style.borderColor = "#ff0";
        b.style.color = "#0f0";
      } else {
        b.style.borderColor = "#0f0";
        b.style.color = "#0f0";
        b.style.boxShadow = "0 0 60px #0f0";
      }
    }
  };

  const scheduleContextSweep = () => {
    if (sweepScheduled) return;
    sweepScheduled = true;

    const run = () => {
      sweepScheduled = false;
      try {
        runContextSweep();
      } catch (e) {
        console.warn("Token Cop: context sweep failed", e);
      }
    };

    if (typeof self.requestIdleCallback === "function") {
      self.requestIdleCallback(run, { timeout: 1000 });
    } else {
      setTimeout(run, 0);
    }
  };

  const contextProof = () => {
    const messages = harvestMessages({ scrollAll: true });
    if (!messages.length) return;

    const payload = {
      origin: location.href,
      ts: Date.now(),
      tokens: lastTokenEstimate,
      head: document.documentElement.dataset.tcLedgerHead || null,
      tail: messages.slice(-16).map(m => [m.role, m.content.slice(0, 280)])
    };

    hashData(payload).then(hash => {
      if (!hash) return;
      const proof = `TC-PROOF-${hash}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(proof).catch(() => {});
        }
      } catch (_) {}

      void addLedgerEntry("proof", { hash, origin: payload.origin, ts: payload.ts });

      const b = ensureBadge();
      b.innerHTML = "CONTEXT FINGERPRINT COPIED ✅";
      b.style.borderColor = "#0ff";
      b.style.color = "#0ff";
      b.style.boxShadow = "0 0 80px #0ff";

      setTimeout(() => {
        b.innerHTML = defaultBadgeHTML();
        b.style.borderColor = "#0f0";
        b.style.color = "#0f0";
        b.style.boxShadow = "0 0 60px #0f0";
      }, 2600);
    });
  };

  const showLedgerOverlay = () => {
    const existing = document.getElementById("tc-ledger-overlay");
    if (existing) {
      existing.remove();
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "tc-ledger-overlay";
    overlay.style.cssText =
      "position:fixed;inset:5%;background:#000;border:4px solid #0f0;border-radius:20px;box-shadow:0 0 80px #0f0;z-index:2147483647;color:#0f0;font-family:'Courier New',monospace;padding:20px;overflow:auto;";

    const header = document.createElement("div");
    header.style.cssText = "text-align:center;font-size:28px;margin-bottom:12px;";
    header.textContent = "🚔 TRUTHRUN SHADOW LEDGER 🚔";

    const status = document.createElement("div");
    status.style.cssText = "text-align:center;font-size:12px;margin-bottom:12px;opacity:.8;";
    status.textContent = "verifying chain…";

    const list = document.createElement("div");
    list.style.cssText = "font-size:13px;line-height:1.6;";

    const ledger = getLedger().slice().reverse();
    for (let i = 0; i < ledger.length; i++) {
      const entry = ledger[i];
      const row = document.createElement("div");
      row.style.cssText = "border-bottom:1px solid #0f0;padding:8px 0;";
      const id = String(entry.id || "").slice(-8);
      const hash = String(entry.hash || "").slice(0, 18);
      const when = entry.ts ? new Date(entry.ts).toLocaleString() : "n/a";
      const msgCount = entry.data && typeof entry.data.messageCount === "number"
        ? entry.data.messageCount
        : entry.data && entry.data.preview
        ? "~"
        : "n/a";
      row.innerHTML =
        `<strong>#${id}</strong> · ${when}<br>` +
        `Type: ${entry.type} · Hash: ${hash}…<br>` +
        `Messages: ${msgCount}`;
      list.appendChild(row);
    }

    const footer = document.createElement("div");
    footer.style.cssText = "text-align:center;margin-top:16px;";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close Ledger";
    closeBtn.style.cssText =
      "background:#000;color:#0f0;border:2px solid #0f0;padding:8px 20px;border-radius:30px;cursor:pointer;font-family:'Courier New',monospace;";
    closeBtn.addEventListener("click", () => overlay.remove());

    footer.appendChild(closeBtn);

    overlay.appendChild(header);
    overlay.appendChild(status);
    overlay.appendChild(list);
    overlay.appendChild(footer);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    verifyLedger().then(ok => {
      status.textContent = ok ? "chain verified ✔︎" : "ledger tampered ⚠︎";
      status.style.color = ok ? "#0f0" : "#f00";
    });
  };

  document.addEventListener("keydown", e => {
    if (!e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
    const key = (e.key || "").toUpperCase();

    if (key === "P") {
      e.preventDefault();
      e.stopPropagation();

      parodyMode = !parodyMode;
      try {
        localStorage.setItem(PARODY_STORAGE_KEY, String(parodyMode));
      } catch (_) {}

      const b = ensureBadge();
      b.innerHTML = defaultBadgeHTML();
      b.style.borderColor = "#0f0";
      b.style.color = "#0f0";
      b.style.boxShadow = "0 0 60px #0f0";
    } else if (key === "L") {
      e.preventDefault();
      e.stopPropagation();

      const messages = harvestMessages();
      void addLedgerEntry("manual", {
        origin: location.href,
        messageCount: messages.length,
        tail: messages.slice(-8).map(m => ({
          role: m.role,
          content: m.content
        }))
      });
    } else if (key === "O") {
      e.preventDefault();
      e.stopPropagation();
      showLedgerOverlay();
    } else if (key === "K") {
      e.preventDefault();
      e.stopPropagation();
      contextProof();
    }
  });

  try {
    const observer = new MutationObserver(() => attachForkButtons());
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  } catch (_) {}

  const start = () => {
    ensureBadge();
    attachForkButtons();
    scheduleContextSweep();
    tryAdoptFork();

    setInterval(() => {
      tryAdoptFork();
      attachForkButtons();
      scheduleContextSweep();
    }, 2500);

    window.addEventListener("focus", () => {
      tryAdoptFork();
      scheduleContextSweep();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        tryAdoptFork();
        scheduleContextSweep();
      }
    });
  };

  start();

  console.log(
    `%cTOKEN COP ${VERSION} — Local Fork Bus online. Shadow DOM can't hide.`,
    "color:lime;font-size:18px;font-weight:bold"
  );
})();

// Easter egg — type "cop" in the Grok input to make the badge salute
document.addEventListener("input", e => {
  if (e.target.tagName === "TEXTAREA" && e.data === "cop") {
    badge.innerHTML = "🚔🫡 TOKEN COP REPORTING FOR DUTY 🫡🚔";
    badge.style.borderColor = "#00f";
    badge.style.color = "#00f";
    badge.style.boxShadow = "0 0 100px blue";
    badge.style.boxShadow = "0 0 100px blue";
    setTimeout(() => badge.innerHTML = defaultBadgeHTML(), 4000);
  }
});