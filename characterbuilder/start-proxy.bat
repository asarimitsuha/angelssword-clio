@echo off
echo ⚔  Starting Angel's Sword API Proxy...
echo.
cd /d "%~dp0.."
node proxy-server.js
pause
