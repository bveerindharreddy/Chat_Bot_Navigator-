# Lead capture, webhooks, widget settings validation. Run through tests/e2e/run.sh (needs B, PW, S).
B=${B:-http://127.0.0.1:8099}; J=$S/jar2.txt; rm -f $J $S/hook/received.jsonl
pass=0; fail=0; chk() { if [ "$2" == "$3" ]; then echo "PASS $1 ($2)"; pass=$((pass+1)); else echo "FAIL $1: got '$2' want '$3'"; fail=$((fail+1)); fi; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
curl -s -c $J -o /dev/null -X POST -H 'content-type: application/json' $B/api/console/login -d '{"password":"'"$PW"'"}'
A=(-b $J -H 'content-type: application/json')
chk "webhook must be https" "$(code "${A[@]}" -X POST $B/api/console/widgets -d '{"name":"Aria","url":"https://www.acme.com","prompt":"You are the assistant for Acme plumbing. Callout fee is $50.","icon":"bot","color":"#7c3aed","leadWebhook":"http://insecure.example"}')" "400"
chk "bad whatsapp rejected" "$(code "${A[@]}" -X POST $B/api/console/widgets -d '{"name":"Aria","url":"https://www.acme.com","prompt":"You are the assistant for Acme plumbing. Callout fee is $50.","icon":"bot","color":"#7c3aed","handoffWhatsapp":"call me"}')" "400"
chk "5 starters rejected" "$(code "${A[@]}" -X POST $B/api/console/widgets -d '{"name":"Aria","url":"https://www.acme.com","prompt":"You are the assistant for Acme plumbing. Callout fee is $50.","icon":"bot","color":"#7c3aed","starters":["a1","b2","c3","d4","e5"]}')" "400"
R=$(curl -s "${A[@]}" -X POST $B/api/console/widgets -d '{"name":"Aria","url":"http://127.0.0.1:8091","prompt":"You are the assistant for Acme plumbing. Callout fee is $50.","greeting":"Hi there!","icon":"bot","color":"#7c3aed","position":"right","language":"English","starters":["What do you fix?","How much is a callout?"],"teaser":"Leaking tap? Ask me!","teaserDelay":2,"handoffPhone":"+971 4 123 4567","handoffWhatsapp":"971501234567","handoffEmail":"help@acme.com","privacyUrl":"https://www.acme.com/privacy","showBranding":true}')
ID=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["widget"]["id"])'); echo "WID=$ID" > $S/wid.env
CFG=$(curl -s -X POST -H 'content-type: application/json' -H 'origin: http://127.0.0.1:8091' $B/api/widget/config -d "{\"key\":\"$ID\"}")
chk "public config has new fields" "$(echo "$CFG" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["starters"],d["teaser"],d["teaserDelay"],d["handoff"],d["privacyUrl"],d["showBranding"])')" "['What do you fix?', 'How much is a callout?'] Leaking tap? Ask me! 2 {'phone': '+971 4 123 4567', 'whatsapp': '971501234567', 'email': 'help@acme.com'} https://www.acme.com/privacy True"
chk "public config hides prompt, webhook, origins" "$(echo "$CFG" | grep -cE 'Callout|leadWebhook|origins|prompt')" "0"
O=(-H 'content-type: application/json' -H 'origin: http://127.0.0.1:8091')
chk "lead needs email or phone" "$(code "${O[@]}" -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Ann\"}")" "400"
chk "lead bad email" "$(code "${O[@]}" -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Ann\",\"email\":\"ann@@x\"}")" "400"
chk "lead from wrong origin" "$(code -H 'content-type: application/json' -H 'origin: https://evil.com' -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Ann\",\"email\":\"ann@x.com\"}")" "403"
chk "lead saved" "$(curl -s "${O[@]}" -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Ann Lee\",\"email\":\"ann@example.com\",\"phone\":\"+971 50 111 2222\",\"message\":\"Leaking tap in kitchen\",\"page\":\"/services\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["ok"])')" "True"
LEADS=$(curl -s -b $J "$B/api/console/leads?id=$ID")
chk "console lists lead" "$(echo "$LEADS" | python3 -c 'import sys,json;l=json.load(sys.stdin)["leads"][0];print(l["name"],l["email"],l["phone"],l["status"],l["page"])')" "Ann Lee ann@example.com +971 50 111 2222 new /services"
LID=$(echo "$LEADS" | python3 -c 'import sys,json;print(json.load(sys.stdin)["leads"][0]["id"])')
chk "status -> contacted" "$(code "${A[@]}" -X PATCH "$B/api/console/leads?id=$ID" -d "{\"lead\":$LID,\"status\":\"contacted\"}")" "200"
chk "bad status rejected" "$(code "${A[@]}" -X PATCH "$B/api/console/leads?id=$ID" -d "{\"lead\":$LID,\"status\":\"won\"}")" "400"
chk "lead of another widget can't be touched" "$(code "${A[@]}" -X PATCH "$B/api/console/leads?id=wid_AAAAAAAAAAAAAAAAAAAA" -d "{\"lead\":$LID,\"status\":\"closed\"}")" "404"
CSV=$(curl -s -b $J "$B/api/console/leads?id=$ID&format=csv")
chk "CSV export (phone kept, formula-safe prefix)" "$(echo "$CSV" | python3 -c 'import sys; print(sum(1 for l in sys.stdin if "\"Ann Lee\",\"ann@example.com\",\"\x27+971 50 111 2222\",\"Leaking tap in kitchen\",\"/services\",\"contacted\"" in l))')" "1"
chk "leads need admin" "$(code "$B/api/console/leads?id=$ID")" "401"
# webhook: add it via edit, submit a lead, check delivery
FORM=$(curl -s -b $J $B/api/console/widgets/$ID | python3 -c 'import sys,json;w=json.load(sys.stdin)["widget"];[w.pop(k) for k in ("id","origins","status","created","updated")];w["leadWebhook"]="https://hooks.example.test/x";print(json.dumps(w))')
chk "edit saves webhook" "$(code "${A[@]}" -X PUT $B/api/console/widgets/$ID -d "$FORM")" "200"
curl -s -o /dev/null "${O[@]}" -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Bo\",\"phone\":\"+97150\"}"
chk "unreachable webhook recorded as failed, lead still saved" "$(curl -s -b $J "$B/api/console/leads?id=$ID" | python3 -c 'import sys,json;l=json.load(sys.stdin)["leads"][0];print(l["name"], l["webhook"].startswith("failed"))')" "Bo True"
# lead rate limit: 10 per 10 min per IP+widget (2 used)
L=""; for i in $(seq 1 9); do L="$L $(code "${O[@]}" -H 'x-forwarded-for: 192.0.2.50' -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Spam$i\",\"email\":\"s$i@x.com\"}")"; done
chk "lead flood limited per IP" "$(echo $L | tr ' ' '\n' | sort | uniq -c | tr -s ' ' | tr '\n' ';')" " 9 200;"
L2=""; for i in $(seq 1 2); do L2="$L2 $(code "${O[@]}" -H 'x-forwarded-for: 192.0.2.50' -X POST $B/api/widget/lead -d "{\"key\":\"$ID\",\"name\":\"Spam\",\"email\":\"s@x.com\"}")"; done
chk "11th lead from same IP is 429" "$(echo $L2)" "200 429"
chk "erase lead" "$(code "${A[@]}" -X DELETE "$B/api/console/leads?id=$ID" -d "{\"lead\":$LID}")" "200"
chk "erased lead gone" "$(curl -s -b $J "$B/api/console/leads?id=$ID" | grep -c 'Ann Lee')" "0"
echo "== $pass passed, $fail failed"
