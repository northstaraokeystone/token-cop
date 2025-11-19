<!-- packages/ui/src/badge.svelte -->
<script>
  import { onMount } from 'svelte';
  let tokens = 0;
  let limit = 128000;
  let percentage = 0;
  let badgeClass = 'green';

  async function update() {
    const messages = Array.from(document.querySelectorAll('div[data-testid^="message-"]'))
      .map(el => {
        const isUser = el.textContent.includes('You:') || el.closest('[class*="user"]');
        const text = el.textContent || '';
        return { role: isUser ? 'user' : 'assistant', content: text };
      });

    // Super-simple token estimate (good enough for live badge)
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    tokens = Math.round(totalChars / 3.8); // 3.8 chars per token average for cl100k_base
    limit = 128000;
    percentage = (tokens / limit) * 100;

    if (percentage >= 98) badgeClass = 'red-skull';
    else if (percentage >= 90) badgeClass = 'red';
    else if (percentage >= 80) badgeClass = 'yellow';
    else badgeClass = 'green';
  }

  onMount(() => {
    update();
    setInterval(update, 2000);
  });
</script>

<div class="token-cop-badge {badgeClass}">
  {#if badgeClass === 'red-skull'}☠️{/if}
  {tokens.toLocaleString()} / 128k
  <div class="percent">{percentage.toFixed(1)}%</div>
  <div class="label">TOKEN COP</div>
</div>

<style>
  .token-cop-badge {position:fixed;bottom:20px;right:20px;padding:12px 20px;border-radius:50px;font-family:"Courier New",monospace;font-weight:bold;font-size:16px;color:white;box-shadow:0 4px 20px rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;gap:12px;transition:all 0.3s;}
  .green {background:#0a0;border:3px solid #0f0;}
  .yellow {background:#990;border:3px solid yellow;animation:pulse 2s infinite;}
  .red {background:#900;border:3px solid red;animation:pulse 1s infinite;}
  .red-skull {background:#000;border:3px solid red;animation:flash 0.5s infinite;}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  @keyframes flash{0%,100%{box-shadow:0 0 20px red}50%{box-shadow:0 0 50px red}}
  .percent{font-size:12px;opacity:0.9}
  .label{font-size:10px;letter-spacing:2px;margin-left:8px;opacity:0.8}
</style>