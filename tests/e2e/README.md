# End-to-end tests

One command runs the full round against a fresh dev server with its own data:

```bash
npm run test:e2e
```

It builds the widget and the Chrome extension, starts the app on port 8099 (data in `.data-e2e/`, removed afterwards)
and a fake customer website on port 8091, then runs:

| Suite | What it checks |
| --- | --- |
| `api/billing.sh` | Rates, starting credits, credit charges per load / chat / voice minute, out-of-credit cut-off, top-ups, ledger, monthly CSV statement |
| `api/leads.sh` | Widget settings validation, public config never exposing prompt/webhook, lead capture, status, CSV export, erasure, webhook failure recording, per-IP limits |
| `api/report.sh` | Client report links: format, data, lead details opt-in, rotate, disable, private headers |
| `browser/widget.cjs` | The website widget on another origin: lazy voice bundle, teaser, starters, handoff links, disclosure, focus, typing kept across re-renders, Esc, phone layout, lead call with CORS |
| `browser/arabic.cjs` | Arabic widget: translated interface, right-to-left, translated errors, launcher stays in its corner |
| `browser/console.cjs` | Admin console: sign-in cookie, every widget setting, leads, Chrome card + extension download, report link, sign-out |
| `browser/extension.cjs` | The Chrome extension loaded unpacked: fixed id, settings check, assistant on any site, steps aside on sites with their own widget, popup commands, per-site and master switches, background allow-list |
| `api/security.sh` | Sessions, tampered cookies, CSRF, private headers, token and login rate limits (runs last: it locks out the test IP) |

Requirements: bash, curl, python3 and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).
No AI key is needed: the suites check that sessions reach the AI step and handle its failure; a real conversation is a
manual check with `GEMINI_API_KEY` set.

The rate-limit checks fake visitor IPs with `X-Forwarded-For`, which the dev server honours. Cloudflare ignores that header
(it sets the real IP), so against a production build those few checks are expected to differ.
