@echo off
rem Baby Craft 서버 켜기: 더블클릭
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1" %*
pause
