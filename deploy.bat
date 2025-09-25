@echo off
setlocal enabledelayedexpansion

echo Starting JesusLetter deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo docker-compose is not installed. Please install docker-compose and try again.
    exit /b 1
)

echo Using existing .env file for deployment...

REM Stop existing containers
echo Stopping existing containers...
docker-compose down --remove-orphans

REM Build and start containers
echo Building and starting containers...
docker-compose up --build -d

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    echo Deployment failed. Check logs with: docker-compose logs
    exit /b 1
) else (
    echo Deployment successful!
    echo.
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:3001/api
    echo Health Check: http://localhost:3001/api/health
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
)