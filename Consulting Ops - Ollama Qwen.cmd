@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Consulting Ops Launcher
cd /d "%~dp0"
set "MODEL=qwen3.5:latest"

echo.
echo Consulting Ops launcher
echo =======================
echo 1. Codex + Qwen        [recommended; tested repo tools]
echo 2. Claude Code + Qwen  [experimental; skills may be ignored]
echo 3. Plain Ollama Qwen   [chat only; no repo tools]
echo 4. Google Antigravity  [Google account; repo tools]
echo.
set /p "MODE=Choose 1, 2, 3, or 4 [default 1]: "
if not defined MODE set "MODE=1"

if "%MODE%"=="2" goto claude_code
if "%MODE%"=="3" goto plain_chat
if "%MODE%"=="4" goto antigravity

where ollama >nul 2>&1 || (
  echo Ollama is not installed or is not on PATH.
  echo Install it from https://ollama.com and run this launcher again.
  pause
  exit /b 1
)

ollama show "%MODEL%" >nul 2>&1 || (
  echo %MODEL% is not installed. Pulling it now...
  ollama pull "%MODEL%" || (
    echo Could not install %MODEL%.
    pause
    exit /b 1
  )
)

echo.
node consulting-ops.mjs
echo.
echo Starting Codex with local %MODEL% in:
echo   %CD%
echo.
echo Use natural-language commands such as: Run consulting-ops scan
echo Slash commands are not guaranteed in Codex.
echo.
set "CODEX_CONFIG=%USERPROFILE%\.codex\config.toml"
set "CODEX_BACKUP=%USERPROFILE%\.codex\config.toml.pre-ollama-launch.bak"
if exist "%CODEX_CONFIG%" copy /y "%CODEX_CONFIG%" "%CODEX_BACKUP%" >nul
ollama launch codex --model "%MODEL%" --yes
if exist "%CODEX_CONFIG%" if exist "%CODEX_BACKUP%" (
  fc /b "%CODEX_CONFIG%" "%CODEX_BACKUP%" >nul
  if errorlevel 1 (
    echo.
    echo WARNING: Your primary Codex config.toml changed during the Ollama session.
    set /p "RESTORE=Restore the pre-launch backup now? [Y/n]: "
    if not defined RESTORE set "RESTORE=Y"
    if /I "!RESTORE!"=="Y" copy /y "%CODEX_BACKUP%" "%CODEX_CONFIG%" >nul
  )
)
goto finished

:claude_code
where ollama >nul 2>&1 || (
  echo Ollama is not installed or is not on PATH.
  echo Install it from https://ollama.com and run this launcher again.
  pause
  exit /b 1
)

ollama show "%MODEL%" >nul 2>&1 || (
  echo %MODEL% is not installed. Pulling it now...
  ollama pull "%MODEL%" || (
    echo Could not install %MODEL%.
    pause
    exit /b 1
  )
)

echo.
echo Starting experimental Claude Code integration in:
echo   %CD%
echo.
echo Once open, use /consulting-ops or ask: Show the consulting-ops menu.
echo Qwen may ignore Claude Code skills; option 1 is the tested agent path.
echo To leave Claude Code, press Ctrl+C or use /exit.
echo.
ollama launch claude --model "%MODEL%" --yes -- --append-system-prompt "LOCAL OPS ROUTING: When /consulting-ops is invoked, follow that skill literally and execute node consulting-ops.mjs with the supplied arguments before analysis. Never substitute Git inspection, repository status, or recent-change review."
goto finished

:plain_chat
where ollama >nul 2>&1 || (
  echo Ollama is not installed or is not on PATH.
  echo Install it from https://ollama.com and run this launcher again.
  pause
  exit /b 1
)

ollama show "%MODEL%" >nul 2>&1 || (
  echo %MODEL% is not installed. Pulling it now...
  ollama pull "%MODEL%" || (
    echo Could not install %MODEL%.
    pause
    exit /b 1
  )
)

echo.
echo Starting plain Qwen chat. This mode cannot operate consulting-ops files or commands.
echo Use /bye to exit.
echo.
ollama run "%MODEL%"
goto finished

:antigravity
where agy >nul 2>&1 || (
  echo.
  echo Google Antigravity CLI ^(agy^) is not installed or is not on PATH.
  echo In PowerShell, install it with:
  echo   irm https://antigravity.google/cli/install.ps1 ^| iex
  echo Then reopen this launcher and choose option 4 again.
  pause
  exit /b 1
)

echo.
echo Starting Google Antigravity in:
echo   %CD%
echo.
echo Once open, use /consulting-ops or ask: Show the consulting-ops menu.
echo Antigravity will prompt for Google sign-in if this computer is not authenticated.
echo.
agy

:finished
echo.
echo Session ended.
pause
