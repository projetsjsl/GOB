@echo off
title GOB Dev Server - Propulsé par JSL AI
color 0B
cd /d "%~dp0"

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║          🚀  SERVEUR DE DÉVELOPPEMENT GOB         ║
echo ║              Propulsé par JSL AI                  ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

timeout /t 2 /nobreak >nul

REM Ouvrir Chrome avec le cache désactivé
start chrome --auto-open-devtools-for-tabs "http://localhost:5173"

echo.
echo ✅ Chrome ouvert avec DevTools (cache désactivé)
echo.
echo 💡 Le cache est automatiquement désactivé !
echo.

call npm run dev

pause