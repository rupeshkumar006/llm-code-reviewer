@echo off
echo Starting LLM Code Reviewer Locally (Without Docker)...

echo.
echo Loading .env file...
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    set "%%A=%%B"
)

echo.
echo 1. Starting Backend...
start cmd /k "cd backend && title Backend && mvn spring-boot:run"

echo.
echo 2. Starting Frontend...
start cmd /k "cd frontend && title Frontend && npm install && npm run dev"

echo.
echo =======================================================
echo.
echo 1. Ensure you have started MySQL in XAMPP!
echo 2. Ensure you have Redis running (e.g. Memurai) on port 6379!
echo 3. The frontend will be available at http://localhost:5173
echo.
echo You can close this window now. The backend and frontend 
echo are running in separate terminal windows.
echo =======================================================
pause
