@echo off
cd /d "%~dp0"
SET PATH=C:\Program Files\nodejs;%PATH%
SET NODE_PATH=C:\Program Files\nodejs
"C:\Program Files\nodejs\node.exe" "./node_modules/vite/bin/vite.js" build
