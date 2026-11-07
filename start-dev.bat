@echo off
title SOILEX Life Science ERP Launcher
echo ==========================================================
echo Starting SOILEX Life Science ERP (HTTPS Development Mode)
echo ==========================================================

start "FastAPI Backend (HTTPS: 8000)" cmd /k "backend\venv\Scripts\python.exe backend\run.py"
start "Vite Frontend (HTTPS: 3000)" cmd /k "node node_modules\vite\bin\vite.js"

echo.
echo Backend and Frontend have been launched in dedicated windows!
echo - Frontend: https://localhost:3000
echo - Backend:  https://127.0.0.1:8000/docs
echo.
pause

