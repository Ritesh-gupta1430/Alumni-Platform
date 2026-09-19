@echo off
echo ===================================================
echo   Starting AlumNetra Institutional Platform (TCET)
echo ===================================================
echo.

echo Starting Python AI Microservice on port 8000...
start cmd /k "cd ai_service && uvicorn main:app --reload --port 8000"

echo Starting Node.js Backend Server on port 5000...
start cmd /k "cd server && npm run dev"

echo Starting Vite React Frontend on port 5173...
start cmd /k "cd client && npm run dev"

echo.
echo All services launched!
echo Web Portal: http://localhost:5173
echo Backend API: http://localhost:5000
echo Python AI Service: http://localhost:8000
echo ===================================================
pause
