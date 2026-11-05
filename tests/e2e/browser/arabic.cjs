// Arabic widget: translated interface, right-to-left. Run through tests/e2e/run.sh.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 760 } });
  let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  await p.goto('http://127.0.0.1:8091/ar.html'); await p.waitForSelector('#techthrust-widget', { state: 'attached' }); await p.waitForTimeout(500);
  const q = (fn) => p.evaluate(fn);
  await q(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('.fab').click()); await p.waitForTimeout(300);
  const info = await q(() => { const r = document.querySelector('#techthrust-widget').shadowRoot; const w = r.querySelector('.wrap'); return { dir: r.querySelector('.panel').getAttribute('dir'), lang: w.getAttribute('lang'), ph: r.querySelector('#inp').placeholder, legal: r.querySelector('.legal').textContent, human: r.querySelector('.human span').textContent, hello: r.querySelector('.log .msg.bot').textContent }; });
  ok(info.dir === 'rtl' && info.lang === 'ar', 'right-to-left Arabic layout: ' + info.dir + '/' + info.lang);
  ok(info.ph === 'اكتب رسالتك…', 'Arabic placeholder: ' + info.ph);
  ok(info.legal.startsWith('مساعد ذكاء اصطناعي') && info.legal.includes('الخصوصية') && info.legal.includes('بدعم من TechThrust'), 'Arabic disclosure line: ' + info.legal);
  ok(info.human === 'تحدّث مع موظف', 'Arabic handoff label');
  ok(info.hello.startsWith('مرحباً! أنا سارة'), 'Arabic default greeting with the name: ' + info.hello.slice(0, 30));
  await q(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('.chips button').click()); await p.waitForTimeout(2500);
  const err = await q(() => document.querySelector('#techthrust-widget').shadowRoot.querySelector('.err')?.textContent);
  ok(err === 'تعذّر تشغيل المساعد. حاول مرة أخرى.', 'error shown in Arabic (no AI key here): ' + err);
  const align = await q(() => { const r = document.querySelector('#techthrust-widget').shadowRoot; const me = r.querySelector('.row.me .msg').getBoundingClientRect(); const panel = r.querySelector('.panel').getBoundingClientRect(); return me.left - panel.left < panel.right - me.right ? 'left' : 'right'; });
  ok(align === 'left', 'visitor bubble mirrors to the left in RTL');
  const fab = await q(() => { const r = document.querySelector('#techthrust-widget').shadowRoot; const f = r.querySelector('.fab').getBoundingClientRect(); return Math.round(innerWidth - f.right); });
  ok(fab === 16, 'launcher stays in the bottom-right corner (16px from edge): ' + fab);
  await p.screenshot({ path: require('path').join(process.env.S || '.', 'ar-widget.png') });
  console.log(`== ${pass} passed, ${fail} failed`); await b.close();
})();
