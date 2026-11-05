# Admin sessions, CSRF, rate limits, private headers (run LAST: it locks out the test IP). Run through tests/e2e/run.sh (needs B, PW, S).
B=${B:-http://127.0.0.1:8099}; J=$S/jar.txt; rm -f $J
pass=0; fail=0; chk() { if [ "$2" == "$3" ]; then echo "PASS $1 ($2)"; pass=$((pass+1)); else echo "FAIL $1: got '$2' want '$3'"; fail=$((fail+1)); fi; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
chk "no session -> 401" "$(code $B/api/console/widgets)" "401"
chk "old password header no longer works" "$(code -H "x-admin-password: $PW" $B/api/console/widgets)" "401"
chk "session says signed out" "$(curl -s $B/api/console/session)" '{"authenticated":false}'
chk "wrong password" "$(code -X POST -H 'content-type: application/json' $B/api/console/login -d '{"password":"nope"}')" "401"
chk "cross-site login refused" "$(code -X POST -H 'content-type: application/json' -H 'origin: https://evil.com' $B/api/console/login -d '{"password":"'"$PW"'"}')" "403"
H=$(curl -s -D - -o /dev/null -c $J -X POST -H 'content-type: application/json' $B/api/console/login -d '{"password":"'"$PW"'"}' | tr -d '\r' | grep -i '^set-cookie')
chk "login sets HttpOnly SameSite=Strict cookie" "$(echo "$H" | grep -c 'tt_admin=.*HttpOnly; SameSite=Strict; Max-Age=43200')" "1"
chk "cookie has no password in it" "$(echo "$H" | grep -c "$PW")" "0"
chk "session says signed in" "$(curl -s -b $J $B/api/console/session)" '{"authenticated":true}'
chk "list with cookie" "$(code -b $J $B/api/console/widgets)" "200"
chk "tampered cookie refused" "$(code -H "cookie: $(awk '/tt_admin/{print $6"="$7"x"}' $J)" $B/api/console/widgets)" "401"
chk "forged cookie (valid shape, bad sig) refused" "$(code -H 'cookie: tt_admin=eyJleHAiOjk5OTk5OTk5OTk5OTl9.AAAA' $B/api/console/widgets)" "401"
chk "cross-site mutation with cookie refused (CSRF)" "$(code -b $J -X POST -H 'content-type: application/json' -H 'origin: https://evil.com' $B/api/console/widgets -d '{}')" "403"
chk "same-site mutation ok (validation 400)" "$(code -b $J -X POST -H 'content-type: application/json' -H "origin: $B" $B/api/console/widgets -d '{}')" "400"
ID=$(curl -s -b $J -X POST -H 'content-type: application/json' $B/api/console/widgets -d '{"name":"Aria","url":"https://www.acme.com","extraDomains":[],"prompt":"You are the assistant for Acme plumbing. Callout fee is $50.","greeting":"Hi","icon":"bot","color":"#7c3aed","position":"left"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["widget"]["id"])')
chk "private headers on console API" "$(curl -s -D - -o /dev/null -b $J $B/api/console/widgets | tr -d '\r' | grep -ciE '^(cache-control: no-store|x-frame-options: DENY|x-robots-tag: noindex, nofollow|referrer-policy: no-referrer)')" "4"
chk "private headers on /console page" "$(curl -s -D - -o /dev/null $B/console | tr -d '\r' | grep -ciE '^(cache-control: no-store|x-frame-options: DENY|content-security-policy: frame-ancestors .none.)')" "3"
chk "public site not marked private" "$(curl -s -D - -o /dev/null $B/ | tr -d '\r' | grep -ciE '^x-frame-options')" "0"
# token rate limit: 20 per 10 min per IP+widget (each fails at the Gemini step with 500 because there is no key, but counts)
R=""; for i in $(seq 1 22); do R="$R $(code -X POST -H 'content-type: application/json' -H 'origin: https://acme.com' -H 'x-forwarded-for: 203.0.113.7' $B/api/widget/token -d "{\"key\":\"$ID\",\"mode\":\"chat\"}")"; done
chk "token: 21st request from one IP is 429" "$(echo $R | awk '{print $20, $21, $22}')" "500 429 429"
chk "token: another IP is not affected" "$(code -X POST -H 'content-type: application/json' -H 'origin: https://acme.com' -H 'x-forwarded-for: 203.0.113.8' $B/api/widget/token -d "{\"key\":\"$ID\",\"mode\":\"chat\"}")" "500"
chk "429 has Retry-After" "$(curl -s -D - -o /dev/null -X POST -H 'content-type: application/json' -H 'origin: https://acme.com' -H 'x-forwarded-for: 203.0.113.7' $B/api/widget/token -d "{\"key\":\"$ID\"}" | tr -d '\r' | grep -ci '^retry-after: [0-9]')" "1"
# login brute force: 10 attempts per 15 min per IP
L=""; for i in $(seq 1 11); do L="$L $(code -X POST -H 'content-type: application/json' -H 'x-forwarded-for: 198.51.100.9' $B/api/console/login -d '{"password":"guess'$i'"}')"; done
chk "login: 11th attempt from one IP is 429" "$(echo $L | awk '{print $10, $11}')" "401 429"
chk "login: even the right password is blocked while limited" "$(code -X POST -H 'content-type: application/json' -H 'x-forwarded-for: 198.51.100.9' $B/api/console/login -d '{"password":"'"$PW"'"}')" "429"
chk "logout clears session" "$(curl -s -b $J -c $J -X DELETE $B/api/console/session >/dev/null; code -b $J $B/api/console/widgets)" "401"
echo "== $pass passed, $fail failed"
