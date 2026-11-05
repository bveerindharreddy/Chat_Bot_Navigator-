# Client report links. Run through tests/e2e/run.sh (needs B, PW, S).
source $S/wid.env; B=${B:-http://127.0.0.1:8099}; J=$S/j5; rm -f $J
pass=0; fail=0; chk() { if [ "$2" == "$3" ]; then echo "PASS $1 ($2)"; pass=$((pass+1)); else echo "FAIL $1: got '$2' want '$3'"; fail=$((fail+1)); fi; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
curl -s -c $J -o /dev/null -X POST -H 'content-type: application/json' $B/api/console/login -d '{"password":"'"$PW"'"}'
A=(-b $J -H 'content-type: application/json')
chk "report admin route needs login" "$(code -X POST -H 'content-type: application/json' $B/api/console/report -d "{\"id\":\"$WID\",\"action\":\"create\"}")" "401"
P=$(curl -s "${A[@]}" -X POST $B/api/console/report -d "{\"id\":\"$WID\",\"action\":\"create\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["path"])')
chk "link format" "$(echo $P | grep -cE "^/report/$WID\.[A-Za-z0-9]{24}$")" "1"
R=$(curl -s $B/api$P)
chk "report data without login" "$(echo "$R" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["days"],len(d["daily"]),d["showLeads"],d["leads"])')" "30 30 False []"
chk "no prompt/webhook/origins/secret in report" "$(echo "$R" | grep -cE 'Callout|leadWebhook|origins|reportSecret|prompt')" "0"
chk "wrong secret 404" "$(code $B/api/report/$WID.AAAAAAAAAAAAAAAAAAAAAAAA)" "404"
curl -s -o /dev/null "${A[@]}" -X POST $B/api/console/report -d "{\"id\":\"$WID\",\"action\":\"leads\",\"leads\":true}"
chk "lead details when enabled" "$(curl -s $B/api$P | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["showLeads"], len(d["leads"])>0)')" "True True"
P2=$(curl -s "${A[@]}" -X POST $B/api/console/report -d "{\"id\":\"$WID\",\"action\":\"create\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["path"])')
chk "rotate" "$(code $B/api$P) $(code $B/api$P2)" "404 200"
chk "private headers on report page" "$(curl -s -D - -o /dev/null $B$P2 | tr -d '\r' | grep -ciE '^(cache-control: no-store|x-frame-options: DENY|x-robots-tag: noindex, nofollow|referrer-policy: no-referrer)')" "4"
curl -s -o /dev/null "${A[@]}" -X POST $B/api/console/report -d "{\"id\":\"$WID\",\"action\":\"disable\"}"
chk "disabled 404" "$(code $B/api$P2)" "404"
echo "== $pass passed, $fail failed"
