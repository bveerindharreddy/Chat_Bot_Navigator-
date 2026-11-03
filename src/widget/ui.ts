import type { WidgetIcon } from "@/lib/widget/shared";

const svg = (inner: string, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const PATHS = {
  headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  micOff: '<line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/>',
  volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  spin: '<path class="spin" d="M21 12a9 9 0 1 1-6.2-8.55"/>',
};

export const ICONS = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [k, svg(v)])) as Record<keyof typeof PATHS, string>;
export const launcherIcon = (icon: WidgetIcon) => svg(PATHS[icon] ?? PATHS.chat, 26);

/** Black or white, whichever reads better on the chosen colour. */
export const onColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.5 ? "#0b1220" : "#ffffff";
};

// Scoped inside the widget's shadow root: the host site cannot restyle the widget and the widget cannot restyle the site.
export const STYLES = `
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{position:fixed;bottom:16px;display:flex;flex-direction:column;gap:10px;max-width:calc(100vw - 32px);color:#e5e7eb}
.wrap.right{right:16px;align-items:flex-end}.wrap.left{left:16px;align-items:flex-start}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.bar{display:flex;align-items:center;gap:10px}.wrap.left .bar{flex-direction:row-reverse}
.fab{width:60px;height:60px;border-radius:50%;background:__ACCENT__;color:__ON__;box-shadow:0 8px 24px rgba(0,0,0,.35);position:relative;transition:transform .15s}
.fab:hover{transform:scale(1.06)}
.fab svg{width:26px;height:26px}
.fab.live{box-shadow:0 0 0 4px color-mix(in srgb,__ACCENT__ 40%,transparent),0 8px 24px rgba(0,0,0,.35);animation:pulse 1.6s infinite}
@keyframes pulse{50%{box-shadow:0 0 0 10px color-mix(in srgb,__ACCENT__ 15%,transparent),0 8px 24px rgba(0,0,0,.35)}}
.pill{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:999px;background:#111827;border:1px solid #374151;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.pill .t{font:12px ui-monospace,Menlo,monospace;min-width:34px;color:#9ca3af}
.pill button{width:36px;height:36px;border-radius:50%;background:#1f2937}
.pill .red{background:#dc2626;color:#fff}
.panel{width:min(370px,calc(100vw - 32px));background:#0b1220;border:1px solid #1f2937;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden}
.panel header{display:flex;align-items:center;gap:8px;padding:12px 14px;background:__ACCENT__;color:__ON__}
.panel header b{flex:1;font-size:14px}
.panel header button{width:32px;height:32px;border-radius:50%;background:color-mix(in srgb,__ON__ 16%,transparent)}
.panel header small{font-size:11px;opacity:.85}
.dot{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,__ON__ 45%,transparent)}.dot.on{background:#34d399}
.log{height:300px;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.4}
.row{display:flex}.row.me{justify-content:flex-end}
.msg{padding:9px 13px;border-radius:16px;max-width:86%;white-space:pre-wrap;word-break:break-word}
.msg.bot{background:#1f2937;border-bottom-left-radius:4px}
.msg.me{background:color-mix(in srgb,__ACCENT__ 35%,#0b1220);border-bottom-right-radius:4px}
.dots{display:flex;gap:4px;width:fit-content}.dots i{width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:b 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes b{50%{transform:translateY(-4px);opacity:.5}}
form{display:flex;gap:8px;padding:10px;border-top:1px solid #1f2937;align-items:center}
form input{flex:1;min-width:0;background:#111827;border:1px solid #374151;border-radius:999px;padding:10px 14px;color:#fff;font-size:14px;outline:none}
form input:focus{border-color:__ACCENT__}
form button{width:40px;height:40px;border-radius:50%;flex:none}
form button[type=submit]{background:__ACCENT__;color:__ON__}
form button.call{background:#1f2937;border:1px solid #374151}form button.call.live{background:#dc2626;border-color:#dc2626;color:#fff}
.err{padding:0 14px 8px;color:#f87171;font-size:12px}
.toast{max-width:320px;background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:10px 14px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.4);color:#d1d5db}
.toast.err{color:#f87171}button.toast{text-align:left;color:#fff;border-color:__ACCENT__}
.spin{transform-origin:center;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(360deg)}}
`;
