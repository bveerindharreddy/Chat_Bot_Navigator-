// Admin console end to end. Run through tests/e2e/run.sh.
// End-to-end console test: sign-in (cookie), create a widget with every new setting, leads panel, report card, sign-out.
const { chromium } = require('playwright');
const B = process.env.B || 'http://127.0.0.1:8099';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/status of 40[13]/.test(m.text()) && errs.push(m.text()));
  p.on('dialog', d => d.accept());
  let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  await p.goto(B + '/console', { waitUntil: 'networkidle' }); await p.waitForSelector('input[type=password]');
  await p.fill('input[type=password]', 'wrong'); await p.click('button[type=submit]'); await p.waitForSelector('[role=alert]');
  ok((await p.textContent('[role=alert]')).includes('Wrong admin password'), 'wrong password rejected');
  await p.fill('input[type=password]', process.env.PW); await p.click('button[type=submit]'); await p.waitForSelector('#w-name');
  const cookies = await ctx.cookies(); const c = cookies.find(x => x.name === 'tt_admin');
  ok(c && c.httpOnly && c.sameSite === 'Strict', 'session cookie is HttpOnly + SameSite=Strict');
  ok(await p.evaluate(() => !Object.keys(sessionStorage).some(k => /pw|password/i.test(k)) && !document.cookie.includes('tt_admin')), 'password not stored; cookie not readable by scripts');
  await p.fill('#w-name', 'Bloom Dental'); await p.fill('#w-url', 'https://bloomclinic.ae');
  await p.fill('textarea', 'You are Sam, the front-desk assistant for Bloom Dental Clinic. Help visitors book on /appointments.');
  await p.fill('#w-lang', 'Arabic'); await p.fill('#w-teaser', 'Need a check-up? Ask me!');
  await p.fill('input[aria-label="Suggested question 1"]', 'Book a cleaning'); await p.fill('input[aria-label="Suggested question 2"]', 'Opening hours?');
  await p.fill('input[aria-label="Handoff WhatsApp number"]', '971501234567'); await p.fill('#w-hook', 'https://hooks.example.test/bloom');
  await p.fill('#w-privacy', 'https://bloomclinic.ae/privacy'); await p.click('button[aria-label=\'Show "Powered by TechThrust"\']');
  const prev = await p.textContent('.card-premium:has(h2:text("Preview"))');
  ok(prev.includes('Book a cleaning') && prev.includes('Talk to a human: WhatsApp') && prev.includes('Need a check-up? Ask me!') && !prev.includes('Powered by'), 'preview shows chips, handoff, teaser; branding off');
  await p.click('text=Generate widget'); await p.waitForSelector('pre code');
  const id = (await p.textContent('pre code')).match(/wid_\w+/)[0];
  ok(await p.isVisible('#leads-h') && await p.isVisible('text=No leads yet'), 'leads panel shown (empty)');
  const r = await p.evaluate(async (id) => (await fetch('/api/console/widgets/' + id)).json(), id);
  ok(r.widget.language === 'Arabic' && r.widget.starters.join('|') === 'Book a cleaning|Opening hours?' && r.widget.handoffWhatsapp === '971501234567' && r.widget.showBranding === false && r.widget.leadWebhook === 'https://hooks.example.test/bloom', 'all new settings saved');
  // a lead arrives (as the widget's save_lead would send it) and shows up
  await p.evaluate(async (key) => fetch('/api/widget/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, name: 'Mona', phone: '+971 50 222 3333', message: 'Cleaning next week' }) }), id);
  await p.click('aside li:has-text("Bloom Dental") >> text=Edit'); await p.waitForSelector('text=Mona');
  const lh = await p.textContent('#leads-h'); ok(lh.includes('1 new'), 'lead appears with "1 new" -> ' + JSON.stringify(lh) + ' count=' + (await p.locator('#leads-h').count()));
  await p.selectOption('select[aria-label="Status of the lead from Mona"]', 'contacted'); await p.waitForTimeout(400);
  ok(!(await p.textContent('#leads-h')).includes('new'), 'status change to contacted');
  // Chrome extension switch -> "Use it in Chrome" card with a working download
  ok(!(await p.isVisible('h2:text("Use it in Chrome")')), 'no Chrome card while the switch is off');
  await p.click('button[aria-label="Allow in the TechThrust Chrome extension"]'); await p.click('text=Save changes'); await p.waitForSelector('text=Changes saved');
  await p.waitForSelector('h2:text("Use it in Chrome")');
  const card = await p.textContent('section:has(h2:text("Use it in Chrome"))');
  ok(card.includes(id) && card.includes('chrome://extensions'), 'Chrome card shows the steps and this widget key');
  const zip = await p.evaluate(async () => { const r = await fetch('/techthrust-assistant-extension.zip'); const b = new Uint8Array(await r.arrayBuffer()); return [r.status, b[0], b[1], b.length]; });
  ok(zip[0] === 200 && zip[1] === 0x50 && zip[2] === 0x4b && zip[3] > 50000, 'extension download is a real zip (' + zip[3] + ' bytes)');
  const origins = (await p.evaluate(async (id) => (await fetch('/api/console/widgets/' + id)).json(), id)).widget.origins;
  ok(origins.includes('chrome-extension://aaipjeeigojieiglmagglkckofoeambn'), 'switch adds the extension origin');
  // report link
  await p.click('text=Create report link'); await p.waitForSelector('code:has-text("/report/")');
  const link = await p.textContent('code:has-text("/report/")');
  const rp = await ctx.newPage(); await rp.goto(link, { waitUntil: 'networkidle' }); await rp.waitForSelector('text=Leads captured');
  ok((await rp.textContent('h1')) === 'Bloom Dental' && !(await rp.isVisible('text=Latest leads')), 'report link opens; lead details hidden by default');
  await p.click('button[aria-label="Show lead details in the report"]'); await p.waitForTimeout(500);
  await rp.reload({ waitUntil: 'networkidle' }); await rp.waitForSelector('text=Latest leads');
  ok(await rp.isVisible('text=Mona'), 'lead details appear after opting in');
  await rp.close();
  await p.screenshot({ path: require('path').join(process.env.S || '.', 'console-final.png'), fullPage: true });
  // sign out kills the session
  await p.click('text=Sign out'); await p.waitForSelector('input[type=password]');
  const after = await p.evaluate(async () => (await fetch('/api/console/widgets')).status);
  ok(after === 401, 'after sign-out the API refuses (401)');
  ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs));
  console.log(`== ${pass} passed, ${fail} failed`); await b.close();
})().catch(e => { console.log('FAIL exception', e.message.slice(0, 400)); process.exit(1); });
