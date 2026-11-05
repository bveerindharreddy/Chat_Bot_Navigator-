// Website widget embedded on another origin (English). Run through tests/e2e/run.sh.
const { chromium, devices } = require('playwright');
const SITE = 'http://127.0.0.1:8091/';
(async () => {
  const b = await chromium.launch();
  let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const reqs = []; p.on('request', r => reqs.push(r.url()));
  await p.goto(SITE); await p.waitForSelector('#techthrust-widget', { state: 'attached' }); await p.waitForTimeout(500);
  const sr = (sel) => p.evaluate((s) => !!document.querySelector('#techthrust-widget').shadowRoot.querySelector(s), sel);
  const txt = (sel) => p.evaluate((s) => document.querySelector('#techthrust-widget').shadowRoot.querySelector(s)?.textContent ?? null, sel);
  const click = (sel) => p.evaluate((s) => document.querySelector('#techthrust-widget').shadowRoot.querySelector(s).click(), sel);
  ok(await sr('.fab') && !(await sr('.teaser')), 'widget loads cross-origin; no teaser yet');
  ok(!reqs.some(u => u.includes('widget-live.js')), 'heavy voice bundle NOT loaded on page view');
  await p.waitForTimeout(2300);
  ok((await txt('.teaser .tbody')) === 'Leaking tap? Ask me!', 'teaser appears after 2s');
  await p.screenshot({ path: require('path').join(process.env.S || '.', 'ux-teaser.png') });
  await click('.teaser .tx'); ok(!(await sr('.teaser')), 'teaser dismissable');
  await p.reload(); await p.waitForSelector('#techthrust-widget', { state: 'attached' }); await p.waitForTimeout(2600);
  ok(!(await sr('.teaser')), 'teaser shown only once per visit');
  await click('.fab'); await p.waitForTimeout(200);
  ok(['Aria', 'Aria 2'].includes(await txt('.panel header b')) && (await txt('.log .msg.bot')) === 'Hi there!', 'panel opens with greeting');
  await p.waitForTimeout(800);
  ok(reqs.some(u => /widget-live\.js\?v=/.test(u)) && await p.evaluate(() => !!window.__techthrustWidgetLive), 'voice bundle loads when the chat opens');
  const chips = await p.evaluate(() => [...document.querySelector('#techthrust-widget').shadowRoot.querySelectorAll('.chips button')].map(b => b.textContent));
  ok(JSON.stringify(chips) === '["What do you fix?","How much is a callout?"]', 'starter chips: ' + chips);
  const human = await p.evaluate(() => [...document.querySelector('#techthrust-widget').shadowRoot.querySelectorAll('.human a')].map(a => a.textContent + '=' + a.getAttribute('href')));
  ok(JSON.stringify(human) === '["Call=tel:+97141234567","WhatsApp=https://wa.me/971501234567","Email=mailto:help@acme.com"]', 'talk-to-human links: ' + human.join(' '));
  const legal = await txt('.legal');
  ok(legal === 'AI assistant · may make mistakes · Privacy · Powered by TechThrust', 'disclosure line: ' + legal);
  ok(await p.evaluate(() => document.querySelector('#techthrust-widget').shadowRoot.activeElement?.id === 'inp'), 'input focused on open');
  ok(await p.evaluate(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('#log').getAttribute('aria-live') === 'polite'), 'conversation is an aria-live log');
  await p.screenshot({ path: require('path').join(process.env.S || '.', 'ux-panel.png') });
  // typing survives re-renders: type, then clicking a chip triggers several renders (connecting -> error, no Gemini key)
  await p.keyboard.type('half typed'); await click('.chips button'); await p.waitForTimeout(2500);
  const kept = await p.evaluate(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('#inp').value);
  ok(kept === 'half typed', `typed text kept across re-renders ("${kept}")`);
  ok((await txt('.row.me .msg')) === 'What do you fix?', 'chip sends its question');
  // Escape minimises and keeps the conversation
  await p.evaluate(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('#inp').focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(!(await sr('.panel')) && (await sr('.fab .badge')), 'Esc minimises; unread dot on launcher');
  await click('.fab'); await p.waitForTimeout(200);
  ok((await txt('.row.me .msg')) === 'What do you fix?', 'conversation kept after minimise');
  await click('[data-a="reset"]'); await p.waitForTimeout(200);
  ok(!(await sr('.row.me')) && (await sr('.chips')), 'New conversation clears it and shows chips again');
  // lead endpoint from the customer site (what the save_lead tool does), cross-origin with CORS
  const lead = await p.evaluate(async (key) => { const r = await fetch('http://127.0.0.1:8099/api/widget/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, name: 'Cara', email: 'cara@example.com', page: '/' }) }); return r.status + ' ' + JSON.stringify(await r.json()); }, process.env.WID);
  ok(/^200 \{"ok":true,"id":\d+\}$/.test(lead), 'save_lead call from customer site (CORS) ' + lead);
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  // phone: full screen
  const m = await b.newContext({ ...devices['iPhone 13'] }); const mp = await m.newPage();
  await mp.goto(SITE); await mp.waitForSelector('#techthrust-widget', { state: 'attached' }); await mp.waitForTimeout(400);
  await mp.evaluate(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('.fab').click()); await mp.waitForTimeout(300);
  const box = await mp.evaluate(() => { const r = document.querySelector('#techthrust-widget').shadowRoot.querySelector('.panel').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), innerWidth, innerHeight]; });
  ok(box[0] === box[2] && Math.abs(box[1] - box[3]) <= 2, 'phone: panel is full screen ' + box);
  await mp.screenshot({ path: require('path').join(process.env.S || '.', 'ux-mobile.png') });
  console.log(`== ${pass} passed, ${fail} failed`); await b.close();
})().catch(e => { console.log('FAIL exception', e.message.slice(0, 300)); process.exit(1); });
