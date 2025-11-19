// packages/platforms/grok.com/detector.ts
// Returns confidence 0-1 that we are currently on grok.x.ai

export function isGrokDotCom(): boolean {
  const hostname = window.location.hostname;
  return hostname === "grok.x.ai" || hostname.endsWith(".grok.x.ai");
}

// Confidence level (used later for multi-site fallback)
export function detectionConfidence(): number {
  if (!isGrokDotCom()) return 0;

  // Extra check: look for Grok-specific DOM markers
  const hasGrokHeader = document.querySelector('[data-testid="grok-chat"]') !== null ||
                        document.querySelector('div[class*="grok"]') !== null ||
                        document.body.innerHTML.includes("xAI");

  return hasGrokHeader ? 1.0 : 0.9;
}