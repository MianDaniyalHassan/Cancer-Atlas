@echo off
cd /d "%~dp0"
python main.py
echo.
echo Servers stopped. Press any key to close this window.
pause >nul
