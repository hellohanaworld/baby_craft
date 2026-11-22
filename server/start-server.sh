#!/usr/bin/env bash
# Baby Craft 서버 켜기 (리눅스 / 유료 서버용). start-server.ps1 과 같은 일을 한다.
#   ./server/start-server.sh            # 채널 1111
#   ./server/start-server.sh 1111 2222  # 채널 여러 개
# 필요: python3, chromium (또는 google-chrome)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
PORT="${PORT:-8090}"
CHANNELS=("${@:-1111}")
mkdir -p "$HERE/logs"

CHROME="$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)"
[ -n "$CHROME" ] || { echo '크롬(chromium)을 찾지 못했어요'; exit 1; }

# 예전에 켜 둔 서버가 남아 있으면 먼저 끈다 (같은 채널 크롬이 살아 있으면 새 크롬이 프로필을 못 써서 옛 버전이 계속 돈다)
for ch in "${CHANNELS[@]}"; do pkill -f -- "\.profile-$ch.*server=$ch" 2>/dev/null && echo "예전 채널 $ch 서버를 껐어요" || true; done
pkill -f -- "http\.server $PORT .*--directory $ROOT" 2>/dev/null || true
sleep 1

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" 2>"$HERE/logs/web.log" &
PIDS=($!)
trap 'kill "${PIDS[@]}" 2>/dev/null; echo "서버를 껐어요."' EXIT
sleep 1

for ch in "${CHANNELS[@]}"; do
  [[ "$ch" =~ ^[0-9]{4}$ ]] || { echo "채널 번호는 숫자 4자리: $ch"; continue; }
  "$CHROME" --headless=new --user-data-dir="$HERE/.profile-$ch" --no-first-run --no-default-browser-check \
    --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows \
    --disk-cache-size=1 --enable-logging=stderr --v=0 \
    "http://127.0.0.1:$PORT/index.html?server=$ch&t=$(date +%s)" 2>"$HERE/logs/$ch.log" &
  PIDS+=($!)
  echo "채널 $ch 서버 켬 (기록: server/logs/$ch.log)"
done
echo '서버가 돌고 있어요. Ctrl+C 를 누르면 꺼져요.'
wait
