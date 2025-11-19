// packages/platforms/grok.com/scraper.ts
// Live-scrapes the full conversation from grok.x.ai

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function scrapeGrokConversation(): Message[] {
  const messages: Message[] = [];

  // Grok's DOM structure (as of Nov 2025)
  const messageElements = document.querySelectorAll('div[data-testid^="message-"]');

  messageElements.forEach((el) => {
    const isUser = el.querySelector('[data-testid="user-message"]') !== null ||
                   el.textContent?.includes("You:") ||
                   el.closest('[class*="user"]');

    const isAssistant = el.querySelector('[data-testid="assistant-message"]') !== null ||
                        el.closest('[class*="assistant"]');

    const textEl = el.querySelector('p, div[class*="markdown"], div[role="paragraph"]');
    const content = textEl?.textContent?.trim() || "";

    if (!content) return;

    if (isUser) {
      messages.push({ role: "user", content });
    } else if (isAssistant) {
      messages.push({ role: "assistant", content });
    }
  });

  // Fallback: if no structured messages, grab raw text and alternate
  if (messages.length === 0) {
    const allText = document.body.innerText;
    const lines = allText.split("\n").filter(l => l.trim());
    let currentRole: "user" | "assistant" = "user";
    for (const line of lines) {
      if (line.includes("Grok") || line.includes("xAI")) currentRole = "assistant";
      messages.push({ role: currentRole, content: line });
    }
  }

  return messages;
}