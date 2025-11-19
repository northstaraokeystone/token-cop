// packages/core/limits.ts
// Auto-detects the correct context limit for Grok, ChatGPT, Claude, Gemini, etc.

export const MODEL_LIMITS: Record<string, number> = {
  "grok": 128_000,
  "gpt-4o": 128_000,
  "gpt-4-turbo": 128_000,
  "gpt-4": 32_000,
  "claude-3-opus": 200_000,
  "claude-3-sonnet": 200_000,
  "claude-3-haiku": 200_000,
  "claude-3-5-sonnet": 200_000,
  "gemini-1.5-pro": 1_048_576,
  "gemini-1.5-flash": 1_048_576,
};

// Simple heuristic detection from page URL + DOM clues
export function detectContextLimit(): number {
  const url = window.location.hostname;

  if (url.includes("grok.x.ai") || url.includes("x.ai")) return MODEL_LIMITS["grok"];
  if (url.includes("chatgpt.com") || url.includes("openai.com")) return MODEL_LIMITS["gpt-4o"];
  if (url.includes("claude.ai")) return MODEL_LIMITS["claude-3-5-sonnet"];
  if (url.includes("gemini.google.com")) return MODEL_LIMITS["gemini-1.5-pro"];

  // Fallback – assume safest common limit
  return 128_000;
}

// Helper for UI percentage
export function getPercentage(tokens: number): number {
  const limit = detectContextLimit();
  return Math.min(100, Math.round((tokens / limit) * 100));
}