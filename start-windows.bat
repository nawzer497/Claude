@echo off
REM Double-click this file to start the website on Windows.
REM It sets your admin password the first time, then opens the site.

cd /d "%~dp0"

echo.
echo   The Madras Diaries
echo   ------------------
echo.

where node >nul 2>nul
if errorlevel 1 goto nonode

if not exist "content\.auth.json" goto setpassword
goto run

:setpassword
echo   First time setup.
echo   Choose the password you'll use to sign in to the admin.
echo   At least 8 characters.
echo.
set /p ADMIN_PW=  Password: 
node server.js --set-password "%ADMIN_PW%"
if errorlevel 1 goto failed
echo.
goto run

:run
start "" "http://localhost:3000/"
echo   Starting. Your browser will open in a moment.
echo   Leave this window open while you use the site.
echo   To stop, close this window or press Ctrl-C.
echo.
node server.js
goto end

:nonode
echo   Node.js isn't installed yet - it's what runs the website.
echo   Opening nodejs.org. Download the LTS version, install it,
echo   then double-click this file again.
start "" "https://nodejs.org/"
pause
goto end

:failed
echo   Couldn't set the password.
pause

:end
