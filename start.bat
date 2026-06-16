@echo off
REM ============================================================
REM  Hanzi Adventure - one-click local server launcher
REM  Double-click this file to run the site and open a browser.
REM ============================================================
setlocal

REM Work in this .bat file's own folder, wherever it is placed
cd /d "%~dp0"

set "PORT=8123"

REM Find Python (try "python", then the "py" launcher)
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY (
  where py >nul 2>nul && set "PY=py"
)
if not defined PY (
  echo.
  echo  [!] Python was not found on this computer.
  echo      Install it from https://www.python.org/  ^(check "Add to PATH"^),
  echo      or just double-click index.html to open the site without a server.
  echo.
  pause
  exit /b 1
)

echo.
echo  ============================================
echo   Hanzi Adventure  -  local server
echo   URL:   http://localhost:%PORT%/
echo   Stop:  press Ctrl+C, or close this window
echo  ============================================
echo.

REM Open the default browser (returns immediately), then start the server
start "" "http://localhost:%PORT%/"
%PY% -m http.server %PORT%

REM If the server exits (e.g. port already in use), keep the window open
echo.
echo  Server stopped. If the port was busy, edit PORT at the top of this file.
pause
