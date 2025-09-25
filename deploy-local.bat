@echo off
setlocal enabledelayedexpansion

echo Starting JesusLetter local deployment...

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js and try again.
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo npm is not available. Please install npm and try again.
    exit /b 1
)

echo Installing dependencies...
npm install

echo Building frontend for production...
npm run build

echo Starting backend server...
start "Backend Server" cmd /k "cd server && node app.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npm run preview"

echo.
echo Deployment completed!
echo.
echo Frontend: http://localhost:4173 (Vite preview)
echo Backend API: http://localhost:3002/api
echo Health Check: http://localhost:3002/api/health
echo.
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
taskkill /f /im node.exe >nul 2>&1
echo Servers stopped.