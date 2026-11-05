// Chrome extension loaded unpacked, end to end. Run through tests/e2e/run.sh.
// Loads dist-extension into Chromium like a user would ("Load unpacked") and drives it end to end.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const EXT = process.env.EXT_DIR, B = process.env.B || 'http://127.0.0.1:8099', EXPECTED_ID = 'aaipjeeigojieiglmagglkckofoeambn';
const { EXTW, NOEXT } = process.env;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ext-'));
  const ctx = await chromium.launchPersistentContext(dir, { headless: false, viewport: { width: 1200, height: 800 },
    args: ['--headless=new', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  try {
    let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
    const id = new URL(sw.url()).host;
    ok(id === EXPECTED_ID, 'extension loads with the fixed id ' + id);
    // first install opens the settings page
    await new Promise(r => setTimeout(r, 1500));
    let opt = ctx.pages().find(p => p.url().includes('/options.html'));
    ok(!!opt, 'settings page opens on first install');
    if (!opt) { opt = await ctx.newPage(); await opt.goto(`chrome-extension://${id}/options.html`); }
    await opt.waitForSelector('#ext-id'); ok((await opt.textContent('#ext-id')) === EXPECTED_ID, 'settings page shows the extension id');
    // wrong widget (extension not allowed) -> clear refusal
    await opt.fill('#server', B + '/'); await opt.fill('#key', NOEXT); await opt.click('button[type=submit]');
    await opt.waitForFunction(() => document.querySelector('#result').dataset.ok === 'false');
    ok((await opt.textContent('#result')).includes('Allow in the TechThrust Chrome extension'), 'widget without the switch is refused with instructions');
    ok((await opt.inputValue('#server')) === B, 'server address normalised (trailing slash removed)');
    await opt.fill('#key', 'not-a-key'); await opt.click('button[type=submit]'); await opt.waitForTimeout(200);
    ok((await opt.textContent('#result')).includes('wid_'), 'malformed key rejected before saving');
    await opt.fill('#key', EXTW); await opt.click('button[type=submit]');
    await opt.waitForFunction(() => document.querySelector('#result').dataset.ok === 'true' && document.querySelector('#result').textContent.startsWith('Connected'));
    ok((await opt.textContent('#result')).includes('Browsing Buddy'), 'allowed widget connects: ' + (await opt.textContent('#result')));
    await opt.screenshot({ path: require('path').join(process.env.S || '.', 'ext-options.png') });
    // any website without an embed gets the assistant
    const p = await ctx.newPage(); await p.goto('http://127.0.0.1:8091/plain.html'); await p.waitForTimeout(2500);
    const has = await p.evaluate(() => !!document.getElementById('techthrust-ext-widget'));
    ok(has, 'assistant appears on a website with no embed');
    // shadow root is open: check the panel the same way as the website widget
    await p.evaluate(() => document.getElementById('techthrust-ext-widget').shadowRoot.querySelector('.fab').click()); await p.waitForTimeout(400);
    const ui = await p.evaluate(() => { const r = document.getElementById('techthrust-ext-widget').shadowRoot; return { name: r.querySelector('.panel header b')?.textContent, chips: [...r.querySelectorAll('.chips button')].map(b => b.textContent) }; });
    ok(ui.name === 'Browsing Buddy' && ui.chips.join('|') === 'Summarise this page|Where is the contact page?', 'panel shows the widget name and suggested questions');
    await p.screenshot({ path: require('path').join(process.env.S || '.', 'ext-site.png') });
    await p.evaluate(() => document.getElementById('techthrust-ext-widget').shadowRoot.querySelector('.chips button').click()); await p.waitForTimeout(3000);
    const err = await p.evaluate(() => document.getElementById('techthrust-ext-widget').shadowRoot.querySelector('.err')?.textContent);
    ok(err === 'Could not start the assistant. Please try again.', 'session request reaches the server through the extension (no AI key here, so "could not start", not "unavailable"): ' + err);
    // the site-only widget's own embed page: extension stays out of the way
    const p2 = await ctx.newPage(); await p2.goto('http://127.0.0.1:8091/index.html'); await p2.waitForTimeout(2500);
    const both = await p2.evaluate(() => [!!document.getElementById('techthrust-widget'), !!document.getElementById('techthrust-ext-widget')]);
    ok(both[0] && !both[1], 'on a site with its own assistant, the extension does not add a second one');
    // popup commands + per-site switch (driven from an extension page, like the popup does)
    const tabs = await opt.evaluate(async () => { const all = await chrome.tabs.query({}); const out = []; for (const t of all) { try { out.push(await chrome.tabs.sendMessage(t.id, { type: 'status' })); } catch {} } return out; });
    ok(tabs.some(t => t.site === '127.0.0.1:8091' && t.mounted), 'status message: mounted on 127.0.0.1:8091');
    ok(tabs.some(t => t.reason === 'site-has-widget'), 'status message explains why it is not on the embed page');
    await p.evaluate(() => document.getElementById('techthrust-ext-widget').shadowRoot.querySelector('[data-a="close"]').click());
    await opt.evaluate(async () => { const [t] = (await chrome.tabs.query({})).filter(x => true); for (const x of await chrome.tabs.query({})) { try { await chrome.tabs.sendMessage(x.id, { type: 'open' }); } catch {} } });
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => !!document.getElementById('techthrust-ext-widget').shadowRoot.querySelector('.panel')), '"Open the assistant" opens the panel');
    await opt.evaluate(() => chrome.storage.sync.set({ disabledSites: ['127.0.0.1:8091'] })); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.getElementById('techthrust-ext-widget')), 'hide on this site: removed live, no reload');
    await opt.evaluate(() => chrome.storage.sync.set({ disabledSites: [] })); await p.waitForTimeout(2000);
    ok(await p.evaluate(() => !!document.getElementById('techthrust-ext-widget')), 'show on this site again: comes back');
    await opt.evaluate(() => chrome.storage.sync.set({ enabled: false })); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.getElementById('techthrust-ext-widget')), 'master switch off: removed everywhere');
    await opt.evaluate(() => chrome.storage.sync.set({ enabled: true })); await p.waitForTimeout(2000);
    // background only proxies the widget API, and always with the saved key
    const blocked = await opt.evaluate(() => chrome.runtime.sendMessage({ type: 'api', path: '/api/console/widgets', body: {} }));
    ok(blocked && blocked.ok === false && blocked.status === 0, 'background refuses anything but the widget API');
    const lead = await opt.evaluate(() => chrome.runtime.sendMessage({ type: 'api', path: '/api/widget/lead', body: { key: 'wid_AAAAAAAAAAAAAAAAAAAA', name: 'Extension Visitor', email: 'ext@example.com', page: '/plain.html' } }));
    ok(lead && lead.ok && lead.body && lead.body.ok, 'lead saved through the extension (server accepted its origin; spoofed key ignored)');
    // popup page renders
    const pop = await ctx.newPage(); await pop.setViewportSize({ width: 300, height: 360 }); await pop.goto(`chrome-extension://${id}/popup.html`); await pop.waitForTimeout(600);
    ok((await pop.textContent('#server')) === '127.0.0.1:8099', 'popup shows the connected server');
    await pop.screenshot({ path: require('path').join(process.env.S || '.', 'ext-popup.png') });
  } catch (e) { fail++; console.log('FAIL exception', e.message.slice(0, 300)); }
  console.log(`== ${pass} passed, ${fail} failed`); await ctx.close();
})();
