@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "Cape Motion Lab server" py -m http.server 8000
) else (
  start "Cape Motion Lab server" python -m http.server 8000
)
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/index.html"
