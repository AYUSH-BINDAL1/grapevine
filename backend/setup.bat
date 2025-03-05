@echo off
:: simple script for running the application with all dependencies
:: note: this script is for Windows systems only
::       if you are using macOS or Linux, please run setup.sh instead

:: INSTRUCTIONS:
::   1. Run the script to start everything:
::      setup.bat
::   2. To stop all services:
::      setup.bat stop

echo Starting Docker setup for Grapevine application...

IF "%1"=="stop" (
    echo Stopping Docker containers...
    docker compose down
    exit /b 0
)

echo Starting Docker containers...
docker compose up -d --build

echo Waiting for Spring Boot application to start...
:WAIT_LOOP
timeout /t 5 /nobreak > NUL
curl -s http://localhost:8080/users/register > NUL
IF %ERRORLEVEL% NEQ 0 (
    echo Still waiting for application...
    goto WAIT_LOOP
)

echo Spring Boot application is running!

echo Registering test users...
REM This is a simplified version - Windows batch has limited JSON handling capabilities
curl -s --location --request POST "http://localhost:8080/users/register" --header "Content-Type: application/json" --data-raw "{\"userEmail\":\"user1@purdue.edu\",\"password\":\"pw1\",\"name\":\"Test UserOne\",\"birthday\":\"2000-01-01\"}"
curl -s --location --request POST "http://localhost:8080/users/register" --header "Content-Type: application/json" --data-raw "{\"userEmail\":\"user2@purdue.edu\",\"password\":\"pw2\",\"name\":\"Test UserTwo\",\"birthday\":\"2000-01-01\"}"

echo.
echo Setup complete! The application is running in Docker containers.
echo Access the application at http://localhost:8080
echo Access Mailpit at http://localhost:8025
echo To stop all containers, run: setup.bat stop