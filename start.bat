@echo off
cd /d "%~dp0"
title vgallery offline server

rem =========================================================================
rem  vgallery offline launcher  (ASCII only - do not add non-ASCII text)
rem  Usage:  double-click this file   -> default port 8080
rem          start.bat 8090          -> custom port
rem =========================================================================

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8080"

rem ------------------------- 1) locate Node.js ----------------------------
set "NODE_EXE="
for %%I in (node.exe) do if not defined NODE_EXE if exist "%%~$PATH:I" set "NODE_EXE=%%~$PATH:I"
if not defined NODE_EXE if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE_EXE if exist "%USERPROFILE%\.workbuddy\binaries\node\versions" for /f "delims=" %%D in ('dir /b /ad /o-n "%USERPROFILE%\.workbuddy\binaries\node\versions" 2^>nul') do if not defined NODE_EXE if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\%%D\node.exe" set "NODE_EXE=%USERPROFILE%\.workbuddy\binaries\node\versions\%%D\node.exe"

rem ------------------------- 2) locate Python -----------------------------
set "PY_CMD="
for %%I in (python.exe) do if not defined PY_CMD if exist "%%~$PATH:I" set "PY_CMD="%%~$PATH:I""
if not defined PY_CMD if exist "C:\Python314\python.exe" set "PY_CMD="C:\Python314\python.exe""
if not defined PY_CMD if exist "C:\Python313\python.exe" set "PY_CMD="C:\Python313\python.exe""
if not defined PY_CMD if exist "C:\Python312\python.exe" set "PY_CMD="C:\Python312\python.exe""
if not defined PY_CMD if exist "%USERPROFILE%\.workbuddy\binaries\python\versions" for /f "delims=" %%D in ('dir /b /ad /o-n "%USERPROFILE%\.workbuddy\binaries\python\versions" 2^>nul') do if not defined PY_CMD if exist "%USERPROFILE%\.workbuddy\binaries\python\versions\%%D\python.exe" set "PY_CMD="%USERPROFILE%\.workbuddy\binaries\python\versions\%%D\python.exe""
if not defined PY_CMD for %%I in (py.exe) do if not defined PY_CMD if exist "%%~$PATH:I" set "PY_CMD=py"

rem ------------------- 3) neither engine available ------------------------
if not defined NODE_EXE if not defined PY_CMD goto :nofound

rem ------------- 4) port already in use -> just open browser --------------
netstat -ano | findstr /c:":%PORT% " | findstr /c:"LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo [vgallery] port %PORT% is already serving - opening browser...
  start "" "http://127.0.0.1:%PORT%/index.html"
  goto :end
)

rem ---------- 5) start server, then open browser after 2 seconds ---------
if defined NODE_EXE (
  echo [vgallery] engine : Node.js  %NODE_EXE%
) else (
  echo [vgallery] engine : Python   %PY_CMD%
)
echo [vgallery] url    : http://127.0.0.1:%PORT%/index.html
echo [vgallery] keep this window open. Ctrl+C or close it to stop the server.
echo.

start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start http://127.0.0.1:%PORT%/index.html"

if defined NODE_EXE (
  "%NODE_EXE%" "%~dp0server.js" %PORT%
) else (
  %PY_CMD% "%~dp0serve.py" %PORT%
)

echo.
echo [vgallery] server stopped.
pause
goto :end

:nofound
echo [vgallery] Node.js or Python was not found. Please install one of them.
pause

:end
