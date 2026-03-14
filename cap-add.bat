@echo off
cd /d "%~dp0"
SET PATH=C:\Program Files\nodejs;%PATH%
SET NODE_PATH=C:\Program Files\nodejs
echo Adding iOS...
call ".\node_modules\.bin\cap.cmd" add ios
echo Adding Android...
call ".\node_modules\.bin\cap.cmd" add android
echo Done!
pause
