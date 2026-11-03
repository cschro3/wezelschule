@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js 24 LTS installieren und dieses Fenster erneut starten.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo Dieses Testpaket benoetigt Node.js 24 oder neuer.
  pause
  exit /b 1
)
if not exist node_modules\.modules.yaml (
  call npx --yes pnpm@11.25.0 install --frozen-lockfile
  if errorlevel 1 goto failed
)
call npm run local:build
if errorlevel 1 goto failed
call npm run local:setup
if errorlevel 1 goto failed
echo Im Browser oeffnen: http://localhost:3000/__local
call npm run local:start
if errorlevel 1 goto failed
exit /b 0
:failed
echo Der lokale Start ist fehlgeschlagen. Bitte die Fehlermeldung oberhalb pruefen.
pause
exit /b 1
