@echo off
echo ==========================================
echo   CodeReviewer - Quick Rebuild Script
echo ==========================================
echo.

:: Step 1: Build JAR locally
echo [1/3] Building backend JAR locally...
cd /d "%~dp0backend"
call mvn clean package -DskipTests -B -q
if %ERRORLEVEL% neq 0 (
    echo ERROR: Maven build failed!
    pause
    exit /b 1
)
echo     Done. JAR built successfully.
echo.

:: Step 2: Build Docker images (backend uses pre-built JAR, very fast)
echo [2/3] Building Docker images...
cd /d "%~dp0"
docker-compose build --no-cache backend
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed! Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo     Done.
echo.

:: Step 3: Start all containers
echo [3/3] Starting all containers...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not start containers.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   ALL DONE!
echo   - Wait ~25 seconds for backend to start
echo   - Then open: http://localhost
echo ==========================================
pause
