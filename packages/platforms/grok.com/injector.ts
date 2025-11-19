// packages/platforms/grok.com/injector.ts
// Simple, working, zero errors – injects the badge instantly

export function injectBadge() {
  // Remove old badge if exists
  document.querySelectorAll("#token-cop-root").forEach(el => el.remove());

  const root = document.createElement("div");
  root.id = "token-cop-root";
  root.innerHTML = `
    <div id="token-cop-badge-app"></div>
    <script type="module">
      import Badge from "/@token-cop/ui/src/badge.svelte";
      new Badge({ target: document.getElementById("token-cop-badge-app") });
    </script>
  `;
  document.body.appendChild(root);
}

export function destroyBadge() {
  document.querySelector("#token-cop-root")?.remove();
}