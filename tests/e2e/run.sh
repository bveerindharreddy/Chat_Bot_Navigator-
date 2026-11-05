#!/usr/bin/env bash
# Full end-to-end round for the widget product: API suites, browser suites (website widget, Arabic widget, console,
# Chrome extension). Starts its own dev server on isolated data (.data-e2e) and a fake customer website.
#   npm run test:e2e
# Needs: bash, curl, python3, and Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
# Ports: app 8099, customer website 8091. No AI key is needed: tests check that sessions reach the AI step.
set -u
cd "$(dirname "$0")/../.."
ROOT=$(pwd)
export PW=${PW:-e2e-secret} B=http://127.0.0.1:8099 S=$(mktemp -d)
SITE=$S/site; mkdir -p "$SITE"
export NODE_PATH=${NODE_PATH:-$ROOT/node_modules:$(npm root -g)}
APP_PID=""; SITE_PID=""
cleanup() { [ -n "$APP_PID" ] && kill -- -"$APP_PID" 2>/dev/null; [ -n "$SITE_PID" ] && kill "$SITE_PID" 2>/dev/null; rm -rf "$ROOT/.data-e2e"; }
trap cleanup EXIT

echo "== building widget and extension"
{ npm run --silent build:widget && npm run --silent build:extension; } >"$S/build.log" 2>&1 || { echo "build failed (see $S/build.log)"; tail -20 "$S/build.log"; exit 1; }

echo "== starting app (port 8099) and customer website (port 8091)"
rm -rf .data-e2e
ADMIN_PASSWORD=$PW WIDGET_DEV_DATA_DIR=.data-e2e setsid npx vite dev --port 8099 --host 127.0.0.1 >"$S/app.log" 2>&1 &
APP_PID=$!
(cd "$SITE" && exec python3 -I -m http.server 8091 --bind 127.0.0.1 >/dev/null 2>&1) &
SITE_PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null "$B/console" && break; sleep 1; done
curl -s -o /dev/null "$B/console" || { echo "app did not start"; tail -20 "$S/app.log"; exit 1; }

TOTAL_PASS=0; TOTAL_FAIL=0
record() { local line; line=$(grep -E "^== [0-9]+ passed" "$S/$1.out" | tail -1); printf "%-11s %s\n" "$1" "${line:-== did not finish}";
  local p f; p=$(echo "$line" | sed -E 's/== ([0-9]+) passed, ([0-9]+) failed/\1/'); f=$(echo "$line" | sed -E 's/== ([0-9]+) passed, ([0-9]+) failed/\2/');
  TOTAL_PASS=$((TOTAL_PASS + ${p:-0})); TOTAL_FAIL=$((TOTAL_FAIL + ${f:-1})); grep "^FAIL" "$S/$1.out" | sed 's/^/    /'; }
api() { bash "tests/e2e/api/$1.sh" >"$S/$1.out" 2>&1; record "$1"; }
browser() { node "tests/e2e/browser/$1.cjs" >"$S/$1.out" 2>&1; record "$1"; }
login() { curl -s -c "$S/jar" -o /dev/null -X POST -H 'content-type: application/json' "$B/api/console/login" -d "{\"password\":\"$PW\"}"; }
widget() { curl -s -b "$S/jar" -H 'content-type: application/json' -X POST "$B/api/console/widgets" -d "$1" | python3 -c 'import sys,json;print(json.load(sys.stdin)["widget"]["id"])'; }

echo "== API suites"
api billing; api leads; api report

echo "== preparing the customer website"
. "$S/wid.env"   # WID: the English widget created by the leads suite (allowed on 127.0.0.1:8091)
login
AR=$(widget '{"name":"سارة","url":"http://127.0.0.1:8091","prompt":"أنتِ سارة، مساعدة عيادة بلوم لطب الأسنان في دبي. ساعدي الزوار في حجز المواعيد.","icon":"headset","color":"#0e7fae","language":"Arabic","starters":["احجز موعداً","ساعات العمل"],"handoffWhatsapp":"971501234567","privacyUrl":"https://bloomclinic.ae/privacy"}')
export EXTW=$(widget '{"name":"Browsing Buddy","url":"https://www.techthrust.ae","prompt":"You are a helpful browsing companion. Help the user understand and navigate whatever page they are on.","icon":"sparkle","color":"#16a34a","allowExtension":true,"starters":["Summarise this page","Where is the contact page?"]}')
export NOEXT=$(widget '{"name":"Site Only","url":"https://www.techthrust.ae","prompt":"You are a helpful assistant for the TechThrust website only.","icon":"chat","color":"#2563eb"}')
page() { printf '<!doctype html><html lang="%s"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title></head><body style="font-family:system-ui;margin:40px"><h1>%s</h1><p>%s</p><a href="/services.html">Services</a>%s</body></html>\n' "$@"; }
page en "Acme Plumbing (test site)" "Acme Plumbing" "Customer test website on a different origin." "<script src=\"$B/widget.js\" data-key=\"$WID\" defer></script>" >"$SITE/index.html"
page ar "Acme Plumbing (test site)" "Acme Plumbing" "Customer test website on a different origin." "<script src=\"$B/widget.js\" data-key=\"$AR\" defer></script>" >"$SITE/ar.html"
page en "Some news site" "Any website" "No widget is embedded on this page; the extension adds the assistant." "<h2>Section two</h2>" >"$SITE/plain.html"

echo "== browser suites"
export WID EXT_DIR=$ROOT/dist-extension
browser widget; browser arabic; browser console; browser extension

echo "== security suite (last: it locks out the test IP)"
api security

echo
echo "TOTAL: $TOTAL_PASS passed, $TOTAL_FAIL failed   (logs and screenshots: $S)"
[ "$TOTAL_FAIL" -eq 0 ]
