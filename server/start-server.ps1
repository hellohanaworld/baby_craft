# Baby Craft 서버 켜기 (Windows)
# 채널마다 화면 없는 크롬으로 index.html?server={채널} 을 띄워, 그 채널의 세상(동물, 아이템, 보스, 바뀐 칸)을 돌린다.
# 사람 기기(GitHub Pages)는 모두 손님으로 들어온다. 이 창을 닫거나 Ctrl+C 하면 서버가 꺼진다 (세상은 Firebase 에 남는다).
#
#   server\start-server.bat 더블클릭  (또는 powershell -ExecutionPolicy Bypass -File server\start-server.ps1)
#   채널을 바꾸려면: -Channels 1111,2222
param(
  [string[]]$Channels = @('1111'),
  [int]$Port = 8090
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot           # 레포 폴더 (index.html 이 있는 곳)
$Here = $PSScriptRoot
$Logs = Join-Path $Here 'logs'
New-Item -ItemType Directory -Force $Logs | Out-Null

$Chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $Chrome) { throw '크롬을 찾지 못했어요 (Google Chrome 설치 필요)' }

# 1) 게임 파일을 이 컴퓨터 안에서만 보여 주는 웹 서버 (127.0.0.1: 밖에서는 못 들어온다)
$web = Start-Process python -ArgumentList '-m', 'http.server', $Port, '--bind', '127.0.0.1', '--directory', "`"$Root`"" `
  -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $Logs 'web.log')
Start-Sleep -Seconds 1

# 2) 채널마다 화면 없는 크롬 (채널마다 프로필 폴더를 따로 써서 저장소가 섞이지 않게)
$procs = @()
foreach ($ch in $Channels) {
  if ($ch -notmatch '^\d{4}$') { Write-Warning "채널 번호는 숫자 4자리: $ch"; continue }
  $prof = Join-Path $Here ".profile-$ch"
  $url = "http://127.0.0.1:$Port/index.html?server=$ch&t=$(Get-Date -Format yyyyMMddHHmmss)"
  $cargs = @(
    '--headless=new', "--user-data-dir=`"$prof`"", '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--disk-cache-size=1', '--enable-logging=stderr', '--v=0', $url
  )
  $procs += Start-Process $Chrome -ArgumentList $cargs -WindowStyle Hidden -PassThru `
    -RedirectStandardError (Join-Path $Logs "$ch.log")
  Write-Host "채널 $ch 서버 켬  (기록: server\logs\$ch.log)"
}

Write-Host ''
Write-Host '서버가 돌고 있어요. 이 창을 닫거나 Ctrl+C 를 누르면 꺼져요.'
try {
  while ($true) {
    Start-Sleep -Seconds 5
    foreach ($p in $procs) { if ($p.HasExited) { Write-Warning "크롬 서버가 꺼졌어요 (pid $($p.Id)). 다시 켜 주세요." } }
  }
} finally {
  foreach ($p in $procs + $web) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }
  Write-Host '서버를 껐어요.'
}
